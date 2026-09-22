#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

json_file="$script_dir/../src/assets/levels/level-1.json"
output_dir="$script_dir/../src/assets/audio"

mkdir -p "$output_dir"

while IFS= read -r word; do
  echo "Generating audio for: $word"
  say "$word" -o "$output_dir/$word.wav" --file-format=WAVE --data-format=LEI16@44100
done < <(jq -r '.word_list[].word' "$json_file")