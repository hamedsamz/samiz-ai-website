import assert from "node:assert/strict";
import test from "node:test";
import { isSegment, playlistSegments } from "../lib/academy/playlist.ts";

const playlist = (...lines) => ["#EXTM3U", "#EXT-X-VERSION:6", "#EXT-X-PLAYLIST-TYPE:VOD",
  ...lines, "#EXT-X-ENDLIST", ""].join("\n");

test("accepts sequential relative media from the academy encoder", () => {
  assert.deepEqual(playlistSegments(playlist("#EXTINF:4.000000,", "segment-00000.ts",
    "#EXTINF:1.000000,", "segment-00001.ts")), ["segment-00000.ts", "segment-00001.ts"]);
});

test("rejects externally loaded resources and noncanonical media", () => {
  for (const name of ["https://example.test/s.ts", "//example.test/s.ts", "../segment-00000.ts",
    "segment-00000.ts?credential", "segment-00001.ts"]) {
    assert.equal(playlistSegments(playlist("#EXTINF:4,", name)), null);
  }
  assert.equal(playlistSegments(playlist('#EXT-X-KEY:METHOD=AES-128,URI="https://example.test/key"',
    "#EXTINF:4,", "segment-00000.ts")), null);
  assert.equal(playlistSegments(playlist("#EXTINF:4,")), null);
  assert.equal(isSegment("segment-00000.ts\n"), false);
});
