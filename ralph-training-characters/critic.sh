#!/bin/bash
# Critic agent for character sprites
# Usage: ./critic.sh <rendered-png-path> <exercise-description>

SPRITE_PATH="$1"
EXERCISE_DESC="$2"

if [ -z "$SPRITE_PATH" ] || [ -z "$EXERCISE_DESC" ]; then
  echo "Usage: ./critic.sh <rendered-png-path> <exercise-description>"
  exit 1
fi

cd "$(dirname "$0")/.."
export CLAUDE_CODE_GIT_BASH_PATH="${CLAUDE_CODE_GIT_BASH_PATH:-C:\Utilities\Git\usr\bin\bash.exe}"

claude -p --permission-mode acceptEdits \
  "You are a QUALITY CRITIC for character pixel art sprites. You are NOT the artist. Your ONLY job is to judge quality honestly.

You will be shown:
1. Three dragon eye reference images (these represent the RENDERING QUALITY bar)
2. The previous best character output (the bar to EXCEED)
3. A rendered sprite that an AI artist produced
4. A description of what the sprite is supposed to be

Your task:
1. Read all three dragon eye references (for rendering quality standard):
   - 360_F_654888806_uMYd2cIeIpUQ6wQYp6NMCsqAlRgucxQy.jpg (red)
   - 360_F_1722554073_b8yysuYgbMaudi1rcIyzzHmDK1Oq5WUy.jpg (green)
   - 360_F_1215749253_3LjW7zoQi2mcQqg0Rd3riLIYnHqtWzhx.jpg (blue/purple)
2. (The dragon eye references above ARE the quality bar — apply those rendering principles to characters)
3. Read the rendered sprite: ${SPRITE_PATH}
4. Read these for technical context:
   - engine/sprites/qa-knowledge.json
   - ralph-training-characters/progress.txt

QUALITY CHECKLIST:
- FORM: Does each body part read as a 3D form? Arms as cylinders, head as dome, torso as cylinder? Or flat cardboard cutouts?
- TEXTURE: Does the surface have material quality (fabric, skin, hair)? Or smooth/flat fills?
- TONAL RANGE: Does each form have its own highlight-to-shadow range? Full tonal sweep per body part?
- FACE: Do the facial features (eyes, mouth) read clearly? Is the face a bright canvas for features? Are eyes the dominant feature?
- HAIR: Does hair read as a distinct form wrapping around the head? Individual strands/sections visible?
- EDGES: Do dark boundaries and bright ridges define where forms meet?
- COLOUR: Is colour consistent per material? Warm/cool temperature shifts present?
- CONSTRUCTION: Are proportions correct? Is the silhouette recognisable as the intended character?
- QUALITY: Does this demonstrate dragon-eye-level rendering quality applied to a human figure? Each form should have the same care in lighting, texture, and edge definition as a dragon scale.
- CRAFT: Would this character hold up in a published indie game (Stardew Valley, CrossCode)?

IMPORTANT CALIBRATION:
The dragon eye references show rendering QUALITY principles (form, texture, edges, specular). Apply those principles to character art. A character sprite won't look like a dragon eye — but it should demonstrate the same CARE in rendering each form.

Judge against the best PIXEL ART characters at equivalent resolution. The question is: does this character demonstrate dragon-eye-level rendering quality applied to a human figure?

The previous best (lvl5-3) is the FLOOR, not the ceiling. Passing means visibly EXCEEDING it.

SCORING:
- Rate each criterion 1-5 (1=terrible, 3=acceptable, 5=matches published game quality)
- Overall verdict: PASS (all criteria >= 3) or FAIL

BE HARSH. The artist tends to overrate their own work.

ANATOMICAL ACCURACY CHECK (ALL exercises):
- Does this LOOK LIKE the body part it's supposed to be? An arm must read as an arm, not a telescope or stack of boxes.
- Are proportions anatomically plausible? Smooth taper from shoulder to wrist, natural joint positions.
- Do zone boundaries blend into the form, or do they create hard segments that break the organic read?
- For faces: does it read as a face, not a shaded ball?
- For hair: distinguishable from the head?
- For clothes: look like clothes, not painted-on colour or separate blocks?
If the body part is not recognisable as what it's supposed to be, score Construction at 2/5 maximum.

REGRESSION CHECK:
If previous exercise outputs exist in engine/sprites/verify/static-ralph-char-*.png, read them. Quality must not regress.

Exercise: ${EXERCISE_DESC}

Output format:
FORM: X/5 — explanation
TEXTURE: X/5 — explanation
TONAL RANGE: X/5 — explanation
FACE: X/5 — explanation (N/A for body-only exercises)
HAIR: X/5 — explanation (N/A if no hair)
EDGES: X/5 — explanation
COLOUR: X/5 — explanation
CONSTRUCTION: X/5 — explanation
QUALITY: X/5 — explanation (dragon-eye-level rendering applied to character anatomy?)
CRAFT: X/5 — explanation
VERDICT: PASS or FAIL
FEEDBACK: What specifically needs to improve (if FAIL)

<promise>COMPLETE</promise>"
