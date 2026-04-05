#!/bin/bash
# Pre-push game verification — run before pushing any game HTML file
# Usage: bash tools/verify-game.sh games/castle-run/index.html

FILE="$1"
if [ -z "$FILE" ]; then echo "Usage: verify-game.sh <html-file>"; exit 1; fi
if [ ! -f "$FILE" ]; then echo "File not found: $FILE"; exit 1; fi

ERRORS=0

echo "=== VERIFYING: $FILE ==="

# 1. Check file ends properly
LAST3=$(tail -3 "$FILE" | tr -d '[:space:]')
if [[ "$LAST3" != *"</script></body></html>"* ]]; then
  echo "FAIL: File doesn't end with </script></body></html>"
  ERRORS=$((ERRORS+1))
else
  echo "OK: File ending"
fi

# 2. Check brace balance
OPEN=$(grep -o '{' "$FILE" | wc -l)
CLOSE=$(grep -o '}' "$FILE" | wc -l)
DIFF=$((OPEN-CLOSE))
if [ "$DIFF" -ne 0 ]; then
  echo "FAIL: Brace mismatch — { count: $OPEN, } count: $CLOSE, diff: $DIFF"
  ERRORS=$((ERRORS+1))
else
  echo "OK: Braces balanced ($OPEN pairs)"
fi

# 3. Check paren balance
OPEN=$(grep -o '(' "$FILE" | wc -l)
CLOSE=$(grep -o ')' "$FILE" | wc -l)
DIFF=$((OPEN-CLOSE))
if [ "$DIFF" -ne 0 ]; then
  echo "WARN: Paren mismatch — ( count: $OPEN, ) count: $CLOSE, diff: $DIFF"
fi

# 4. Check for script tag count
SCRIPTS=$(grep -c '<script>' "$FILE")
ENDSCRIPTS=$(grep -c '</script>' "$FILE")
if [ "$SCRIPTS" -ne "$ENDSCRIPTS" ]; then
  echo "FAIL: Script tag mismatch — <script>: $SCRIPTS, </script>: $ENDSCRIPTS"
  ERRORS=$((ERRORS+1))
else
  echo "OK: Script tags ($SCRIPTS pair(s))"
fi

# 5. Check for submitScore function
if grep -q "submitScore" "$FILE"; then
  echo "OK: Score submission present"
else
  echo "WARN: No submitScore function found"
fi

# 6. Check for touch controls
if grep -q "touchstart" "$FILE"; then
  echo "OK: Touch controls present"
else
  echo "WARN: No touch controls found"
fi

# 7. Line count
LINES=$(wc -l < "$FILE")
echo "INFO: $LINES lines"

echo ""
if [ "$ERRORS" -gt 0 ]; then
  echo "=== $ERRORS ERROR(S) FOUND — DO NOT PUSH ==="
  exit 1
else
  echo "=== ALL CHECKS PASSED ==="
  exit 0
fi
