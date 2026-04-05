#!/bin/bash
# Build Remnants — auto-discover and concatenate source files
# File load order:
#   1. src/*.html and src/*.js (sorted, excluding 99-footer)
#   2. src/biomes/*.js (self-registering)
#   3. src/skills/*.js (self-registering)
#   4. src/states/*.js (self-registering)
#   5. src/systems/*.js (self-registering, future)
#   6. src/99-footer.html (always last)
cd "$(dirname "$0")"

FILES=""
# Core files in sort order, excluding footer
for f in $(ls src/[0-9]*.html src/[0-9]*.js 2>/dev/null | sort); do
  case "$f" in *99-footer*) continue;; esac
  FILES="$FILES $f"
done
# Content directories — systems first, then biomes (surface + underground), then skills, then states
for dir in systems biomes underground-biomes skills states; do
  if [ -d "src/$dir" ]; then
    for f in $(ls src/$dir/*.js 2>/dev/null | sort); do
      FILES="$FILES $f"
    done
  fi
done
# Footer always last
FILES="$FILES src/99-footer.html"

cat $FILES > index.html
echo "Built index.html ($(wc -l < index.html) lines, $(echo $FILES | wc -w) files)"
