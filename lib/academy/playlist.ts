export const PLAYLIST = "index.m3u8";
export const MAX_PLAYLIST_BYTES = 128 * 1024;
export const MAX_SEGMENT_BYTES = 3 * 1024 * 1024;

export function isSegment(name: string) {
  return /^segment-[0-9]{5}\.ts$/.test(name);
}

export function playlistSegments(playlist: string) {
  const lines = playlist.trimEnd().split(/\r?\n/);
  if (lines[0] !== "#EXTM3U" || lines.at(-1) !== "#EXT-X-ENDLIST") return null;

  const segments: string[] = [];
  let expectsSegment = false;
  for (const line of lines.slice(1, -1)) {
    if (expectsSegment) {
      if (!isSegment(line) || line !== `segment-${String(segments.length).padStart(5, "0")}.ts`) return null;
      segments.push(line);
      expectsSegment = false;
    } else if (/^#EXTINF:\d+(?:\.\d+)?,$/.test(line)) {
      expectsSegment = true;
    } else if (!/^#EXT-X-(?:(?:VERSION|TARGETDURATION|MEDIA-SEQUENCE):\d+|PLAYLIST-TYPE:VOD|INDEPENDENT-SEGMENTS)$/.test(line)) {
      return null;
    }
  }
  return !expectsSegment && segments.length ? segments : null;
}
