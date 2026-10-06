#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

output_dir="$script_dir/../src/assets/audio"

mkdir -p "$output_dir"

for json_file in "$script_dir"/../src/assets/levels/level-*.json; do
  while IFS= read -r word; do
    output_file="$output_dir/$word.wav"
    if [[ -f "$output_file" ]]; then
      continue
    fi
    echo "Generating audio for: $word"
    say "$word" -o "$output_file" --file-format=WAVE --data-format=LEI16@44100
  done < <(jq -r '.word_list[].word' "$json_file")
done