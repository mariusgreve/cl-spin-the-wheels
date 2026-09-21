#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

json_file="$script_dir/../src/assets/levels/level-1.json"
output_dir="$script_dir/../src/assets/audio"

mkdir -p "$output_dir"

while IFS= read -r word; do
  echo "Generating audio for: $word"
  
  temp_aiff="$(mktemp -t speech.XXXXXX.aiff)"
  trap 'rm -f "$temp_aiff"' EXIT
  
  say "$word" -o "$temp_aiff"
  afconvert -f WAVE -d LEI16@44100 "$temp_aiff" "$output_dir/$word.wav"

  rm -f "$temp_aiff"
  trap - EXIT
done < <(jq -r '.word_list[].word' "$json_file")