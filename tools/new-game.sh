#!/bin/bash
# Create a new game from template with full landing page integration
# Usage: bash tools/new-game.sh "Game Title" "Genre" "Description" [--engine]
#
# Without --engine: lightweight standalone (canvas + SFX + score + touch)
# With --engine: includes visual engine (render pipeline, VFX, SpriteForge)
#
# Example: bash tools/new-game.sh "Snake" "Arcade" "Classic snake game"
# Example: bash tools/new-game.sh "Dungeon 2" "Roguelike" "Deeper dungeons" --engine

cd "$(dirname "$0")/.."

TITLE="$1"
GENRE="$2"
DESC="$3"
USE_ENGINE=false
if [ "$4" = "--engine" ]; then USE_ENGINE=true; fi

if [ -z "$TITLE" ] || [ -z "$GENRE" ] || [ -z "$DESC" ]; then
  echo "Usage: new-game.sh \"Title\" \"Genre\" \"Description\" [--engine]"
  echo "  --engine  Include visual engine (lighting, VFX, SpriteForge)"
  exit 1
fi

SLUG=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/ /-/g' | sed 's/[^a-z0-9-]//g')
TITLE_UPPER=$(echo "$TITLE" | tr '[:lower:]' '[:upper:]')
DIR="games/$SLUG"

echo "=== NEW GAME: $TITLE ==="
echo "  Slug: $SLUG"
echo "  Genre: $GENRE"
echo "  Template: $(if $USE_ENGINE; then echo 'engine'; else echo 'standalone'; fi)"
echo ""

# Step 1: Similarity check
echo "[1/5] Checking for similar games..."
bash tools/check-similar.sh "$(echo "$GENRE" | tr '[:upper:]' '[:lower:]')" 2>/dev/null | grep "SIMILAR" > /dev/null
if [ $? -eq 0 ]; then
  bash tools/check-similar.sh "$(echo "$GENRE" | tr '[:upper:]' '[:lower:]')"
  echo ""
  echo "WARNING: Similar game(s) found. Continue? (y/n)"
  read -r CONFIRM
  if [ "$CONFIRM" != "y" ]; then echo "Aborted."; exit 1; fi
fi
echo "  OK: Similarity check passed"

# Step 2: Create directory
if [ -d "$DIR" ]; then
  echo "  FAIL: Directory $DIR already exists"
  exit 1
fi
mkdir -p "$DIR"
echo "  OK: Created $DIR/"

# Step 3: Build game file
echo "[2/5] Building game file..."
if $USE_ENGINE; then
  TEMPLATE="tools/template-engine.html"
  ENGINE="tools/engine.js"
  if [ ! -f "$ENGINE" ]; then echo "  FAIL: Engine not found at $ENGINE"; exit 1; fi
  if [ ! -f "$TEMPLATE" ]; then echo "  FAIL: Template not found at $TEMPLATE"; exit 1; fi
  sed "s/{{TITLE}}/$TITLE/g; s/{{TITLE_UPPER}}/$TITLE_UPPER/g" "$TEMPLATE" | \
    sed "/{{ENGINE}}/{
      r $ENGINE
      d
    }" > "$DIR/index.html"
else
  TEMPLATE="tools/template-standalone.html"
  if [ ! -f "$TEMPLATE" ]; then echo "  FAIL: Template not found at $TEMPLATE"; exit 1; fi
  sed "s/{{TITLE}}/$TITLE/g; s/{{TITLE_UPPER}}/$TITLE_UPPER/g" "$TEMPLATE" > "$DIR/index.html"
fi
echo "  OK: Built $DIR/index.html ($(wc -l < "$DIR/index.html") lines)"

# Step 4: Add to landing page using content-based insertion
echo "[3/5] Adding to landing page..."

CSS_CLASS="card-$SLUG"

# CSS: insert before the closing </style> of the game card styles section
if ! grep -q "$CSS_CLASS" index.html; then
  # Find the line with .card-depths (last custom card style) and insert after it
  node -e "
    const fs = require('fs');
    let html = fs.readFileSync('index.html', 'utf8');
    const cssRule = '  .$CSS_CLASS .card-preview { background: linear-gradient(135deg, #1a1a2a, #0a1a1a); }\n  .$CSS_CLASS .card-preview::before { background: radial-gradient(circle at 50% 50%, #2a2a3a 0%, transparent 60%); }\n';
    // Insert before the first non-card-style line after card styles
    const anchor = '.card-depths .card-preview::before';
    const idx = html.indexOf(anchor);
    if (idx > 0) {
      const lineEnd = html.indexOf('\n', idx) + 1;
      html = html.slice(0, lineEnd) + '\n' + cssRule.replace(/\\\$CSS_CLASS/g, '$CSS_CLASS') + html.slice(lineEnd);
      fs.writeFileSync('index.html', html);
      console.log('  OK: Added CSS');
    } else { console.log('  WARN: CSS anchor not found'); }
  "
fi

# Game card: insert before the closing </div> of the action/strategy games-grid
CARD="  <a href=\"$DIR/index.html\" class=\"game-card $CSS_CLASS\"><div class=\"card-preview\"><span class=\"card-icon\">🎮</span></div><div class=\"card-body\"><h2>$TITLE</h2><div class=\"genre\">$GENRE</div><p>$DESC</p><div class=\"tags\"><span class=\"tag\">$GENRE</span><span class=\"tag tag-mobile\">Mobile Ready</span></div><div class=\"play-btn\">PLAY NOW</div></div></a>"

if ! grep -q "games/$SLUG" index.html; then
  node -e "
    const fs = require('fs');
    let html = fs.readFileSync('index.html', 'utf8');
    // Find the games-grid div that contains action/strategy games (has bastion-guard or depths)
    const marker = 'games/depths/';
    const markerIdx = html.indexOf(marker);
    if (markerIdx > 0) {
      // Find the next </div> that closes this games-grid section
      const gridClose = html.indexOf('</div>', markerIdx);
      if (gridClose > 0) {
        const card = \`$CARD\`;
        html = html.slice(0, gridClose) + '\n' + card + '\n' + html.slice(gridClose);
        fs.writeFileSync('index.html', html);
        console.log('  OK: Added game card');
      }
    } else { console.log('  WARN: Card anchor not found'); }
  "
fi

# Leaderboard dropdown: insert after depths option
if ! grep -q "value=\"$SLUG\"" index.html; then
  node -e "
    const fs = require('fs');
    let html = fs.readFileSync('index.html', 'utf8');
    const anchor = '<option value=\"depths\">Depths</option>';
    const idx = html.indexOf(anchor);
    if (idx > 0) {
      const lineEnd = html.indexOf('\n', idx) + 1;
      html = html.slice(0, lineEnd) + '        <option value=\"$SLUG\">$TITLE</option>\n' + html.slice(lineEnd);
      fs.writeFileSync('index.html', html);
      console.log('  OK: Added to leaderboard');
    }
  "
fi

# GAME_NAMES object: insert after depths entry
if ! grep -q "'$SLUG'" index.html; then
  node -e "
    const fs = require('fs');
    let html = fs.readFileSync('index.html', 'utf8');
    const anchor = \"'depths': 'Depths',\";
    const idx = html.indexOf(anchor);
    if (idx > 0) {
      const lineEnd = html.indexOf('\n', idx) + 1;
      html = html.slice(0, lineEnd) + \"  '$SLUG': '$TITLE',\n\" + html.slice(lineEnd);
      fs.writeFileSync('index.html', html);
      console.log('  OK: Added to GAME_NAMES');
    }
  "
fi

# Suggestion/bug report game dropdown: insert before closing </select>
if ! grep -q "value=\"$SLUG\".*sg-game" index.html && ! grep -q "\"$SLUG\">$TITLE</option>" index.html; then
  node -e "
    const fs = require('fs');
    let html = fs.readFileSync('index.html', 'utf8');
    // Find the sg-game select's closing </select>
    const sgGame = html.indexOf('id=\"sg-game\"');
    if (sgGame > 0) {
      const closeSelect = html.indexOf('</select>', sgGame);
      if (closeSelect > 0) {
        html = html.slice(0, closeSelect) + '        <option value=\"$SLUG\">$TITLE</option>\n      ' + html.slice(closeSelect);
        fs.writeFileSync('index.html', html);
        console.log('  OK: Added to suggestions dropdown');
      }
    }
  "
fi

# Step 5: Verify
echo "[4/5] Running verification..."
node tools/test-game.js "$DIR/index.html"

echo ""
echo "[5/5] Done!"
echo "  Created: $DIR/index.html"
echo "  Template: $(if $USE_ENGINE; then echo 'engine (with visual pipeline)'; else echo 'standalone (lightweight)'; fi)"
echo "  Landing page: updated (CSS, card, leaderboard, GAME_NAMES)"
echo ""
echo "  Next: edit $DIR/index.html — search for 'YOUR GAME CODE HERE'"
echo "  Test: node tools/test-game.js $DIR/index.html"
echo "  Push: git add $DIR index.html && git commit && git push"
