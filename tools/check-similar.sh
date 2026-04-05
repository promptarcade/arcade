#!/bin/bash
# Check for similar existing games before building a new one
# Usage: bash tools/check-similar.sh "tower defense"
cd "$(dirname "$0")/.."
QUERY=$(echo "$1" | tr '[:upper:]' '[:lower:]')

echo "=== EXISTING GAMES IN ARCADE ==="
echo ""

# Use node for reliable HTML parsing
node -e "
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const query = '$QUERY';
const cardRegex = /href=\"games\/([^\"]+)\"[^>]*>.*?<h2>([^<]+)<\/h2>.*?<div class=\"genre\">([^<]+)<\/div>.*?<p>([^<]+)<\/p>/g;
let m, found = 0;
while ((m = cardRegex.exec(html)) !== null) {
  const path = m[1], title = m[2], genre = m[3], desc = m[4];
  const game = path.replace(/\/.*/, '');
  const lower = (title + ' ' + genre + ' ' + desc).toLowerCase();
  const similar = query && lower.includes(query);
  if (similar) found++;
  console.log('  ' + game.padEnd(22) + '[' + genre + ']');
  console.log('    ' + title + ': ' + desc.slice(0, 80));
  if (similar) console.log('    >>> SIMILAR <<<');
  console.log('');
}
if (query) {
  console.log('=== Searched for: \"' + query + '\" ===');
  if (found > 0) console.log('Found ' + found + ' similar game(s). Improve existing or differentiate clearly.');
  else console.log('No similar games found. Clear to build.');
}
"