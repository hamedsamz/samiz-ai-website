import "server-only";
import { AwsClient } from "aws4fetch";
import { isSegment, MAX_PLAYLIST_BYTES, MAX_SEGMENT_BYTES, PLAYLIST, playlistSegments } from "./playlist";

function storage() {
  const account = process.env.ACADEMY_R2_ACCOUNT_ID ?? "";
  const bucket = process.env.ACADEMY_R2_BUCKET ?? "";
  const accessKeyId = process.env.ACADEMY_R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.ACADEMY_R2_SECRET_ACCESS_KEY;
  if (!/^[a-f0-9]{32}$/.test(account) || !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket) ||
      !accessKeyId || !secretAccessKey) return null;
  return {
    base: `https://${account}.r2.cloudflarestorage.com/${bucket}/`,
    client: new AwsClient({ accessKeyId, secretAccessKey, service: "s3", region: "auto", retries: 0 }),
  };
}

async function privateObject(lesson: string, asset: string, method: "GET" | "HEAD" = "GET") {
  const r2 = storage();
  if (!r2) return null;
  const response = await r2.client.fetch(`${r2.base}lessons/${lesson}/${asset}`, {
    method, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(12000),
  });
  const size = Number(response.headers.get("content-length"));
  const max = asset === PLAYLIST ? MAX_PLAYLIST_BYTES : MAX_SEGMENT_BYTES;
  if (!response.ok || !Number.isInteger(size) || size < 1 || size > max) {
    await response.body?.cancel();
    return null;
  }
  return { response, size };
}

export async function readLessonAsset(lesson: string, asset: string) {
  if (asset !== PLAYLIST && !isSegment(asset)) return null;
  const object = await privateObject(lesson, asset);
  if (!object) return null;
  const bytes = await object.response.arrayBuffer();
  if (bytes.byteLength !== object.size) return null;
  if (asset === PLAYLIST && !playlistSegments(new TextDecoder().decode(bytes))) return null;
  return bytes;
}

export async function lessonFilesReady(lesson: string) {
  const bytes = await readLessonAsset(lesson, PLAYLIST);
  if (!bytes) return false;
  const segments = playlistSegments(new TextDecoder().decode(bytes));
  if (!segments) return false;
  // The uploader writes the playlist last after validating all segment sizes.
  const boundarySegments = new Set([segments[0], segments.at(-1)!]);
  return (await Promise.all([...boundarySegments].map(segment => privateObject(lesson, segment, "HEAD")))).every(Boolean);
}
