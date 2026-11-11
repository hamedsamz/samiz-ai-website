#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 2 || -e "$2" ]]; then
  printf 'Usage: %s INPUT_VIDEO NEW_OUTPUT_DIRECTORY\n' "$0" >&2
  exit 1
fi

mkdir -p -- "$2"
ffmpeg -hide_banner -loglevel error -i "$1" -map 0:v:0 -map '0:a:0?' -sn -dn \
  -map_metadata -1 -map_chapters -1 \
  -vf "scale=w='min(1280,iw)':h='min(720,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2,fps=30,format=yuv420p" \
  -c:v libx264 -preset medium -crf 23 -maxrate 3M -bufsize 3M -g 120 -keyint_min 120 -sc_threshold 0 \
  -c:a aac -b:a 128k -ac 2 -f hls -hls_time 4 -hls_playlist_type vod \
  -hls_flags independent_segments -hls_segment_filename "$2/segment-%05d.ts" "$2/index.m3u8"

for segment in "$2"/segment-*.ts; do
  if [[ ! -f "$segment" || $(wc -c < "$segment") -gt 3145728 ]]; then
    printf 'Incomplete export or segment exceeds 3 MiB. Do not upload.\n' >&2
    exit 1
  fi
done
printf 'Prepared %s. Upload the segment files privately, then upload index.m3u8 last.\n' "$2"
