claude --resume "blind-pipeline-poc"
# Blind Cell Architecture — First Successful Proof

Date: 2026-03-24
Result: SUCCESS — 3 blind cells produced a working interactive canvas application
Time: 55.5 seconds
Cost: $0.0472
Human intervention in output: None

## What Was Proven

Three independent AI workers ("cells"), each with no knowledge of the final product or each other, produced artifacts that — when combined by dumb code — created a functional interactive application: an orange circle that moves with arrow keys on a dark canvas.

No cell knew it was building a game, an app, or anything specific. Each cell performed a generic capability task and either succeeded or failed.

## The Three Cells

### Cell 1: Color
- **Input:** "warm sunset orange" (a color mood — could be for a poster, website, painting, anything)
- **Output:** `{"base":"#FF8C42","light":"#FFCB99","dark":"#D96E3D","accent":"#FF5252"}`
- **System prompt:** "You are a color palette generator. Output only valid JSON with hex color values."
- **Validation:** Are all 4 values valid 6-digit hex? YES → SUCCESS
- **Could the cell infer the final product?** No. Color palettes are domain-agnostic.

### Cell 2: Shape
- **Input:** "Draw a 20x20 filled circle" + 4 hex colors from Cell 1
- **Output:** PixelCanvas draw code (~15 lines of fillCircle/setPixel calls)
- **System prompt:** "You are a pixel renderer. Draw the described shape. Output only JSON."
- **Validation:** Does the code parse? Does it render to ≥10% pixel coverage with ≥2 colors? YES → SUCCESS
- **Could the cell infer the final product?** No. "Draw a circle with these colors" could be an icon, a logo, a data point, anything.

### Cell 3: Motion
- **Input:** "Modify an object's x,y position based on arrow key input state"
- **Output:** JS code (~12 lines of if-statements and Math.max/min clamping)
- **System prompt:** "You are a code generator. Output only valid JSON with plain JavaScript code."
- **Validation:** Does the code parse as valid JavaScript? YES → SUCCESS
- **Could the cell infer the final product?** No. Moving an object with keyboard input could be a simulation, a tool, a data explorer, anything.

## Assembly (Zero AI)

The assembler is a Node.js script — no AI, no decisions. It:
1. Reads the SpriteForge pixel engine from disk
2. Wraps Cell 2's draw code in a PixelCanvas IIFE that renders to a canvas element
3. Wraps Cell 3's motion code in a function called once per frame
4. Writes keyboard event listeners that populate an inputState object
5. Creates a requestAnimationFrame loop that clears the canvas, calls the motion function, and draws the shape
6. Outputs a single HTML file

The assembler makes no creative decisions. It performs string interpolation into a fixed template.

## Blindness Verification

Given only what a cell received, could it determine the final product?

- **Cell 1** received: "warm sunset orange" → Could be for a website, poster, data visualization, clothing brand, interior design tool. **Cannot determine final product.**
- **Cell 2** received: "draw a 20x20 circle with these colors" → Could be an icon, logo, data point marker, avatar, loading spinner element. **Cannot determine final product.**
- **Cell 3** received: "modify x/y position based on arrow key state" → Could be game movement, accessible navigation, map panning, simulation control, diagram editing. **Narrows the field to "interactive positioning" but cannot identify the specific product.**

No cell received enough information to predict that the other cells exist, what they produce, or what the combined output would be.

## Binary Contract

Each cell has exactly two outcomes:
- **SUCCESS:** Output passes validation → artifact used
- **FAIL:** Output fails validation → retry (max 3) or pipeline halts

There is no "partial success." No cell's output is modified, enhanced, or corrected after generation. The validator is a binary gate: pass or reject.

## What This Proves

1. **Blind workers can produce a functional interactive product** without any worker knowing what the product is
2. **Capability isolation works** — no cell can skip steps or access the final output
3. **Binary validation is sufficient** for atomic tasks — the cells either produce valid artifacts or they don't
4. **The quality emerges from combination**, not from any individual cell's understanding
5. **Speed and cost are practical** — 55 seconds and $0.05 for the simplest case

## What This Does NOT Prove (Yet)

- That the architecture scales to complex products (many cells, many behaviors)
- That quality is sufficient for production use
- That the decomposer (which DOES see the request) can reliably produce abstract specs
- That this approach is faster or better than a single AI building the whole thing

## The Code

### test-cell.js (entry point)

```javascript
// Shown in full below — this is the complete test harness
```

### Cell prompt texts (exactly as sent to the AI)

**Cell 1 prompt:**
```
Generate a 4-color palette for: "warm sunset orange". Output base, light, dark, accent as hex.
```

**Cell 1 system prompt:**
```
You are a color generator. Output only JSON with hex color values.
```

**Cell 2 prompt:**
```
Draw a 20x20 filled circle on a PixelCanvas.
Colors: base="#FF8C42", light="#FFCB99", dark="#D96E3D", accent="#FF5252"
API: pc.fillCircle(cx, cy, r, idx), pc.fillRect(x,y,w,h,idx), pc.setPixel(x,y,idx)
Color index: pal.groups.base.startIdx + (0=dark,1=mid,2=light,3=brightest)
Canvas: 20x20, origin top-left.
Fill the circle centered at (10,10) with radius 8-9. Use shading: lighter top-left, darker bottom-right.
Output drawBody: the drawing code as a string.
```

**Cell 2 system prompt:**
```
You are a pixel renderer. Draw the described shape. Output only JSON.
```

**Cell 3 prompt:**
```
Write a JavaScript function body that modifies an object's position based on input state.

Arguments available: obj, dt, W, H, S, inputState
- obj has properties: x (number), y (number)
- dt: seconds elapsed (number)
- W: canvas width, H: canvas height
- S: scale factor (multiply speeds by this)
- inputState has property keys: an object where key names are strings mapped to true/false (e.g. inputState.keys.ArrowRight === true means right is held)

Rules:
- If ArrowRight key held: obj.x += 300 * S * dt
- If ArrowLeft key held: obj.x -= 300 * S * dt
- If ArrowUp key held: obj.y -= 300 * S * dt
- If ArrowDown key held: obj.y += 300 * S * dt
- Clamp: obj.x = Math.max(0, Math.min(W, obj.x))
- Clamp: obj.y = Math.max(0, Math.min(H, obj.y))

Output the function body only. No function declaration. No TypeScript. Plain JavaScript.
```

**Cell 3 system prompt:**
```
You are a code generator. Output only valid JSON with plain JavaScript code. No TypeScript type annotations.
```

### Validators

**Cell 1 validation:**
```javascript
Object.values(colors).every(c => /^#[0-9A-Fa-f]{6}$/.test(c))
```

**Cell 2 validation:**
```javascript
canvasCheck.validateSprite(drawBody, '', 20, 20, colors)
// Checks: code executes without error, ≥10% pixel coverage, ≥2 distinct colors
```

**Cell 3 validation:**
```javascript
jsSyntax.validate(finalMotionCode, { wrapInFunction: true })
// Checks: balanced braces/parens, no import/export/require/fetch/eval, parseable by Function constructor
```

## Reproduction

```bash
node pipeline/v2/test-cell.js
# Output: pipeline/v2/output/cell-test/index.html
# Open in browser, press arrow keys
```
