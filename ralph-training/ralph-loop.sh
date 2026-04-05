#!/bin/bash
# Run the sprite training ralph loop — one exercise per iteration
# Usage: ./ralph-loop.sh [max_iterations]
# Default: 10 iterations (matches the 10 exercises in the PRD)

MAX_ITERATIONS=${1:-10}
SCRIPT_DIR="$(dirname "$0")"

echo "=== RALPH SPRITE TRAINING LOOP ==="
echo "Max iterations: $MAX_ITERATIONS"
echo "Progress: ralph-training/progress.txt"
echo "PRD: ralph-training/PRD.md"
echo ""

for i in $(seq 1 $MAX_ITERATIONS); do
  echo "--- Iteration $i of $MAX_ITERATIONS ---"

  # Check if all exercises are done
  REMAINING=$(grep -c '^\- \[ \]' "$SCRIPT_DIR/PRD.md" 2>/dev/null || echo "0")
  if [ "$REMAINING" = "0" ]; then
    echo "All exercises complete!"
    break
  fi
  echo "Exercises remaining: $REMAINING"

  # Run one iteration
  OUTPUT=$("$SCRIPT_DIR/ralph-once.sh" 2>&1)
  echo "$OUTPUT" | tail -20

  # Check for completion signal
  if echo "$OUTPUT" | grep -q '<promise>COMPLETE</promise>'; then
    echo "Iteration $i completed successfully."
  else
    echo "WARNING: Iteration $i did not signal completion."
  fi

  echo ""
done

echo "=== RALPH TRAINING COMPLETE ==="
echo "Check ralph-training/progress.txt for accumulated lessons."
