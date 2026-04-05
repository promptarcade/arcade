#!/bin/bash
# Run one iteration of the sprite training ralph loop
# Flow: draw → critic judges → if FAIL, iterate → commit when PASS

cd "$(dirname "$0")/.."
SCRIPT_DIR="ralph-training"
export CLAUDE_CODE_GIT_BASH_PATH="${CLAUDE_CODE_GIT_BASH_PATH:-C:\Utilities\Git\usr\bin\bash.exe}"

claude -p --permission-mode acceptEdits \
  "You are running one iteration of the sprite drawing training ralph loop.
   Read ralph-training/CLAUDE.md for full instructions.
   Find the next unchecked exercise in ralph-training/PRD.md and complete it.

   IMPORTANT: After rendering your sprite, you MUST run the critic for quality assessment:
   bash ralph-training/critic.sh <your-rendered-png-path> '<exercise description>' 2>&1 | tee ralph-training/last-critic.txt

   Read ralph-training/last-critic.txt for the critic's assessment. If the verdict is FAIL:
   - Read the specific feedback
   - Fix the identified issues in your draw script
   - Re-render
   - Run the critic again
   - Repeat until PASS or you've tried 5 times

   Only mark the exercise complete in PRD.md if the critic says PASS.
   If after 5 attempts the critic still says FAIL, mark it as ATTEMPTED (not complete)
   and log what you couldn't fix in progress.txt.

   Append all lessons (yours AND the critic's feedback) to ralph-training/progress.txt.
   Git commit completed work.
   Output <promise>COMPLETE</promise> when done."
