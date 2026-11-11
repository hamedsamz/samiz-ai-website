import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { AwsClient } from "aws4fetch";
import { isSegment, MAX_PLAYLIST_BYTES, MAX_SEGMENT_BYTES, PLAYLIST, playlistSegments } from "../lib/academy/playlist.ts";

const [lesson, directory] = process.argv.slice(2);
const account = process.env.ACADEMY_R2_ACCOUNT_ID ?? "";
const bucket = process.env.ACADEMY_R2_BUCKET ?? "";
const accessKeyId = process.env.ACADEMY_R2_UPLOAD_ACCESS_KEY_ID;
const secretAccessKey = process.env.ACADEMY_R2_UPLOAD_SECRET_ACCESS_KEY;
if (!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/.test(lesson ?? "") || !directory ||
    !/^[a-f0-9]{32}$/.test(account) || !/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/.test(bucket) ||
    !accessKeyId || !secretAccessKey) {
  throw new Error("Provide a lesson ID, prepared folder and a bucket-scoped R2 upload credential.");
}

const manifest = await readFile(join(directory, PLAYLIST));
const segments = manifest.byteLength <= MAX_PLAYLIST_BYTES && playlistSegments(manifest.toString("utf8"));
if (!segments) throw new Error("The prepared playlist is invalid.");

for (const file of segments) {
  const info = await stat(join(directory, file));
  if (!isSegment(file) || !info.isFile() || info.size < 1 || info.size > MAX_SEGMENT_BYTES) {
    throw new Error(`Invalid segment ${file}.`);
  }
}

const base = `https://${account}.r2.cloudflarestorage.com/${bucket}/lessons/${lesson}/`;
const r2 = new AwsClient({ accessKeyId, secretAccessKey, region: "auto", service: "s3" });

for (const file of [...segments, PLAYLIST]) {
  const response = await r2.fetch(base + file, {
    method: "PUT",
    redirect: "error",
    headers: { "Content-Type": file === PLAYLIST ? "application/vnd.apple.mpegurl" : "video/mp2t" },
    body: file === PLAYLIST ? manifest : await readFile(join(directory, file)),
    signal: AbortSignal.timeout(20000),
  });
  await response.body?.cancel();
  if (!response.ok) throw new Error(`Upload failed for ${file} (${response.status}). Retry while the lesson is unpublished.`);
}
console.log("Upload complete. Check and publish the lesson in the academy admin panel.");
