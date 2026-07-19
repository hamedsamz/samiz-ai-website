#!/usr/bin/env bash
set -euo pipefail

args=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --host)
      args+=(--hostname "$2")
      shift 2
      ;;
    --strictPort)
      shift
      ;;
    *)
      args+=("$1")
      shift
      ;;
  esac
done

exec next dev "${args[@]}"
