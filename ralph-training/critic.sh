#!/bin/bash
# Critic agent — judges sprite quality against dragon eye references
# Usage: ./critic.sh <rendered-png-path> <exercise-description>
# Returns: PASS or FAIL with specific feedback
# Uses a separate Claude session so it has no bias toward its own work

SPRITE_PATH="$1"
EXERCISE_DESC="$2"

if [ -z "$SPRITE_PATH" ] || [ -z "$EXERCISE_DESC" ]; then
  echo "Usage: ./critic.sh <rendered-png-path> <exercise-description>"
  exit 1
fi

cd "$(dirname "$0")/.."
export CLAUDE_CODE_GIT_BASH_PATH="${CLAUDE_CODE_GIT_BASH_PATH:-C:\Utilities\Git\usr\bin\bash.exe}"

claude -p --permission-mode acceptEdits \
  "You are a QUALITY CRITIC for pixel art sprites. You are NOT the artist. Your ONLY job is to judge quality honestly.

You will be shown:
1. Three dragon eye reference images (these represent the QUALITY BAR)
2. A rendered sprite that an AI artist produced
3. A description of what the sprite is supposed to be

Your task:
1. Read all three dragon eye references:
   - 360_F_654888806_uMYd2cIeIpUQ6wQYp6NMCsqAlRgucxQy.jpg (red)
   - 360_F_1722554073_b8yysuYgbMaudi1rcIyzzHmDK1Oq5WUy.jpg (green)
   - 360_F_1215749253_3LjW7zoQi2mcQqg0Rd3riLIYnHqtWzhx.jpg (blue/purple)
2. Read the rendered sprite: ${SPRITE_PATH}
3. Judge the sprite against this checklist:

QUALITY CHECKLIST:
- TEXTURE: Does every surface have texture, or are there smooth banded gradients? (Dragon eyes have texture on every scale)
- TONAL RANGE: Does each form have its own highlight-to-shadow range? (Each dragon scale has its own catchlight)
- EDGES: Do dark crevices and bright ridges define the forms? (Dragon scales are defined by their edges)
- SPECULAR: Are highlights tiny and high-contrast? (Dragon eyes have pinpoint speculars)
- COVERAGE: Is every pixel a rendered surface, or is there empty space / background showing through?
- COLOUR: Is the colour consistent? (Red dragon reads RED throughout, green reads GREEN)
- CONSTRUCTION: Is the shape correct and recognisable? Are proportions right? No disjointed parts?
- CRAFT: Would this sprite hold up next to a published indie game asset?

SCORING:
- Rate each criterion 1-5 (1=terrible, 3=acceptable, 5=matches reference quality)
- Overall verdict: PASS (all criteria >= 3) or FAIL (any criterion < 3)

ALSO READ these for technical context:
- engine/sprites/qa-knowledge.json (known quality principles — does the sprite follow them?)
- ralph-training/progress.txt (lessons from previous iterations — are past mistakes repeated?)

IMPORTANT CALIBRATION:
The dragon eye references show the QUALITY ASPIRATIONS — what good rendering looks like in terms of form, texture, edges, and light. But do NOT compare pixel count or tonal smoothness directly. The sprite being judged is PIXEL ART rendered with a 16-tone indexed palette at low resolution. Judge it against the best PIXEL ART at equivalent resolution — games like Hyper Light Drifter, Owlboy, Stardew Valley, CrossCode. The question is: does this sprite demonstrate the same PRINCIPLES (form, texture, edge definition, specular placement) as the references, executed within the constraints of pixel art? A 128x128 sprite will never have continuous-tone gradients — that's not a failure, that's the medium.

BE HARSH about whether the principles are applied well. But be FAIR about what's achievable in 16-tone indexed pixel art.
If the sprite violates any principle from qa-knowledge.json, that's an automatic point deduction.

REFERENCE ACCURACY CHECK:
For composite exercises (6+), compare the sprite against the dragon eye reference images for STRUCTURAL CORRECTNESS:
- Does the iris fill the eye socket opening? (In references, the eyeball fills the socket completely — no dark gaps)
- Is the iris a DIFFERENT colour/temperature from the surrounding scales? (In references, the iris is always a contrasting warm colour against cooler scales)
- Is the pupil clearly visible as a vertical slit?
- Does the upper lid overlap the top of the eye?
If any of these structural elements are wrong, score Construction at 2/5 maximum. If the iris colour doesn't contrast with the scales, score Colour at 2/5 maximum.

REGRESSION CHECK:
If previous exercise outputs exist in engine/sprites/verify/static-ralph-ex*.png, read them. Any technique that scored well in a previous exercise must NOT regress in later ones. Specifically:
- Scale density/coverage from exercise 2-3 must be maintained — no bare background showing between scales
- Tonal range achieved in exercises 2-3 must be maintained
- Edge pairs and specular quality must not drop below previous levels
If a regression is detected, score that criterion at 2/5 maximum regardless of other factors.

Exercise: ${EXERCISE_DESC}

Output format:
TEXTURE: X/5 — explanation
TONAL RANGE: X/5 — explanation
EDGES: X/5 — explanation
SPECULAR: X/5 — explanation
COVERAGE: X/5 — explanation
COLOUR: X/5 — explanation
CONSTRUCTION: X/5 — explanation
CRAFT: X/5 — explanation
VERDICT: PASS or FAIL
FEEDBACK: What specifically needs to improve (if FAIL)

<promise>COMPLETE</promise>"
