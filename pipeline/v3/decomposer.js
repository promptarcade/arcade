// ============================================================
// Decomposer — the only component that sees the goal
// ============================================================
// Takes a user request. Produces:
//   1. Atomic contracts (opaque fn_ids, test vectors, prompts)
//   2. A wiring map (opaque obj/fn IDs, execution order, events)
//   3. Shape specs (opaque shape IDs, geometric descriptions)
//
// The decomposer holds a PRIVATE mapping (fn_3 = "bounce vertical")
// that never crosses any boundary. All outputs use opaque IDs only.
//
// This module exports a decompose() function that returns the
// contracts and map for a given request. Currently hand-authored
// (the human IS the decomposer). Future: AI-generated.

function decompose(request) {
  // For now, the decomposer is ME — I see "Pong" and produce
  // opaque atomic contracts + wiring map.
  //
  // PRIVATE mapping (never leaves this function):
  //   fn_1 = clamp value to range
  //   fn_2 = set vertical velocity from input
  //   fn_3 = track toward target value
  //   fn_4 = integrate velocity into position
  //   fn_5 = bounce off vertical bounds
  //   fn_6 = detect AABB overlap (returns boolean)
  //   fn_7 = reverse horizontal velocity + push out
  //   fn_8 = detect edge crossing (returns string)
  //
  //   obj_a = left paddle (player)
  //   obj_b = right paddle (AI)
  //   obj_c = ball
  //
  //   shape_1 = vertical rectangle (paddle)
  //   shape_2 = circle (ball)

  const contracts = [
    {
      fn_id: 'fn_1',
      prompt: 'Write a JavaScript function body.\nArguments: val, min, max (all numbers).\nReturn the value clamped to [min, max].\nIf val < min, return min. If val > max, return max. Otherwise return val.',
      argNames: ['val', 'min', 'max'],
      returnType: 'number',
      testVectors: [
        { inputs: [5, 0, 10], expected: 5 },
        { inputs: [-3, 0, 10], expected: 0 },
        { inputs: [15, 0, 10], expected: 10 },
        { inputs: [0, 0, 10], expected: 0 },
        { inputs: [10, 0, 10], expected: 10 },
      ],
    },
    {
      fn_id: 'fn_2',
      prompt: 'Write a JavaScript function body.\nArguments: obj, speed, upHeld, downHeld\n- obj has a "vy" property (number)\n- speed is a number\n- upHeld, downHeld are booleans\nSet obj.vy to 0. If upHeld is true, set obj.vy to -speed. If downHeld is true, set obj.vy to speed.',
      argNames: ['obj', 'speed', 'upHeld', 'downHeld'],
      returnType: 'any',
      testVectors: [
        { inputs: [{ vy: 99 }, 250, false, false], expectMutations: { 'vy': 0 } },
        { inputs: [{ vy: 0 }, 250, true, false], expectMutations: { 'vy': -250 } },
        { inputs: [{ vy: 0 }, 250, false, true], expectMutations: { 'vy': 250 } },
      ],
    },
    {
      fn_id: 'fn_3',
      prompt: 'Write a JavaScript function body.\nArguments: obj, targetVal, speed, deadzone\n- obj has properties: y (number), vy (number)\n- targetVal, speed, deadzone: numbers\nIf obj.y < targetVal - deadzone, set obj.vy = speed.\nIf obj.y > targetVal + deadzone, set obj.vy = -speed.\nOtherwise set obj.vy = 0.',
      argNames: ['obj', 'targetVal', 'speed', 'deadzone'],
      returnType: 'any',
      testVectors: [
        { inputs: [{ y: 50, vy: 0 }, 100, 200, 5], expectMutations: { 'vy': 200 } },
        { inputs: [{ y: 150, vy: 0 }, 100, 200, 5], expectMutations: { 'vy': -200 } },
        { inputs: [{ y: 98, vy: 99 }, 100, 200, 5], expectMutations: { 'vy': 0 } },
      ],
    },
    {
      fn_id: 'fn_4',
      prompt: 'Write a JavaScript function body.\nArguments: obj, dt\n- obj has properties: x, y, vx, vy (all numbers)\n- dt: time step (number)\nAdd vx*dt to x. Add vy*dt to y.',
      argNames: ['obj', 'dt'],
      returnType: 'any',
      testVectors: [
        { inputs: [{ x: 100, y: 200, vx: 50, vy: -30 }, 0.016], expectMutations: { 'x': 100.8, 'y': 199.52 } },
        { inputs: [{ x: 0, y: 0, vx: 0, vy: 0 }, 1.0], expectMutations: { 'x': 0, 'y': 0 } },
      ],
    },
    {
      fn_id: 'fn_5',
      prompt: 'Write a JavaScript function body.\nArguments: obj, minVal, maxVal\n- obj has properties: y (number), vy (number)\nIf obj.y < minVal: set obj.y = minVal, set obj.vy = Math.abs(obj.vy).\nIf obj.y > maxVal: set obj.y = maxVal, set obj.vy = -Math.abs(obj.vy).',
      argNames: ['obj', 'minVal', 'maxVal'],
      returnType: 'any',
      testVectors: [
        { inputs: [{ y: -5, vy: -100 }, 0, 600], expectMutations: { 'y': 0, 'vy': 100 } },
        { inputs: [{ y: 605, vy: 100 }, 0, 600], expectMutations: { 'y': 600, 'vy': -100 } },
        { inputs: [{ y: 300, vy: 50 }, 0, 600], expectMutations: { 'y': 300, 'vy': 50 } },
      ],
    },
    {
      fn_id: 'fn_6',
      prompt: 'Write a JavaScript function body.\nArguments: ax, ay, aw, ah, bx, by, bw, bh (all numbers).\nReturn true if two rectangles (center coords + dimensions) overlap.\nOverlap: Math.abs(ax-bx) < (aw+bw)/2 AND Math.abs(ay-by) < (ah+bh)/2.',
      argNames: ['ax', 'ay', 'aw', 'ah', 'bx', 'by', 'bw', 'bh'],
      returnType: 'boolean',
      testVectors: [
        { inputs: [100, 100, 20, 20, 105, 105, 20, 20], expected: true },
        { inputs: [100, 100, 20, 20, 200, 200, 20, 20], expected: false },
        { inputs: [0, 0, 10, 10, 9, 0, 10, 10], expected: true },
      ],
    },
    {
      fn_id: 'fn_7',
      prompt: 'Write a JavaScript function body.\nArguments: obj, wallPos, pushDir\n- obj has properties: x (number), vx (number)\n- wallPos: number, pushDir: 1 or -1\nReverse obj.vx (multiply by -1). Set obj.x = wallPos + pushDir * 1.',
      argNames: ['obj', 'wallPos', 'pushDir'],
      returnType: 'any',
      testVectors: [
        { inputs: [{ x: 50, vx: 200 }, 55, -1], expectMutations: { 'vx': -200, 'x': 54 } },
        { inputs: [{ x: 550, vx: -200 }, 545, 1], expectMutations: { 'vx': 200, 'x': 546 } },
      ],
    },
    {
      fn_id: 'fn_8',
      prompt: 'Write a JavaScript function body.\nArguments: pos, halfSize, maxPos (all numbers).\nIf pos - halfSize < 0, return "left".\nIf pos + halfSize > maxPos, return "right".\nOtherwise return "".',
      argNames: ['pos', 'halfSize', 'maxPos'],
      returnType: 'string',
      testVectors: [
        { inputs: [-5, 10, 800], expected: 'left' },
        { inputs: [810, 10, 800], expected: 'right' },
        { inputs: [400, 10, 800], expected: '' },
      ],
    },
    {
      fn_id: 'fn_9',
      prompt: 'Write a JavaScript function body.\nArguments: obj, minVal, maxVal\n- obj has properties: x (number), vx (number)\nIf obj.x < minVal: set obj.x = minVal, set obj.vx = Math.abs(obj.vx).\nIf obj.x > maxVal: set obj.x = maxVal, set obj.vx = -Math.abs(obj.vx).',
      argNames: ['obj', 'minVal', 'maxVal'],
      returnType: 'any',
      testVectors: [
        { inputs: [{ x: -5, vx: -100 }, 0, 800], expectMutations: { 'x': 0, 'vx': 100 } },
        { inputs: [{ x: 805, vx: 100 }, 0, 800], expectMutations: { 'x': 800, 'vx': -100 } },
        { inputs: [{ x: 400, vx: 50 }, 0, 800], expectMutations: { 'x': 400, 'vx': 50 } },
      ],
    },
  ];

  const shapes = [
    { shape_id: 'shape_1', desc: 'filled vertical rectangle, filling most of the canvas', w: 12, h: 48, colors: { base: '#0099FF', light: '#66D9FF', dark: '#003D7A', accent: '#00FFCC' } },
    { shape_id: 'shape_2', desc: 'filled vertical rectangle, filling most of the canvas', w: 12, h: 48, colors: { base: '#E63946', light: '#FF8A95', dark: '#A01830', accent: '#FFB347' } },
    { shape_id: 'shape_3', desc: 'filled circle, centered, radius filling most of the canvas', w: 16, h: 16, colors: { base: '#FAFBFC', light: '#FFFFFF', dark: '#C0C8D8', accent: '#FFD700' } },
  ];

  // The wiring map — paint by numbers
  // All IDs are opaque. The recomposer doesn't know what anything IS.
  const map = {
    objects: [
      { id: 'obj_a', shape: 'shape_1', x: '5%', y: '50%', w: 36, h: 144, props: { vx: 0, vy: 0 } },
      { id: 'obj_b', shape: 'shape_2', x: '95%', y: '50%', w: 36, h: 144, props: { vx: 0, vy: 0 } },
      { id: 'obj_c', shape: 'shape_3', x: '50%', y: '50%', w: 48, h: 48, props: { vx: 250, vy: 180 } },
    ],
    input: {
      up: 'ArrowUp',
      down: 'ArrowDown',
    },
    counters: ['counter_a', 'counter_b'],
    loop: [
      // Set obj_a velocity from input
      { call: 'fn_2', args: ['obj_a', '250 * S', 'input.up', 'input.down'] },
      // Track obj_b toward obj_c.y
      { call: 'fn_3', args: ['obj_b', 'obj_c.y', '200 * S', '5'] },
      // Integrate all positions
      { call: 'fn_4', args: ['obj_a', 'dt'] },
      { call: 'fn_4', args: ['obj_b', 'dt'] },
      { call: 'fn_4', args: ['obj_c', 'dt'] },
      // Clamp obj_a and obj_b vertical position
      { call: 'fn_1', target: 'obj_a.y', args: ['obj_a.y', 'obj_a.h*S/2', 'H - obj_a.h*S/2'] },
      { call: 'fn_1', target: 'obj_b.y', args: ['obj_b.y', 'obj_b.h*S/2', 'H - obj_b.h*S/2'] },
      // Bounce obj_c off vertical bounds
      { call: 'fn_5', args: ['obj_c', 'obj_c.h*S/2', 'H - obj_c.h*S/2'] },
      // Bounce obj_c off horizontal bounds
      { call: 'fn_9', args: ['obj_c', 'obj_c.w*S/2', 'W - obj_c.w*S/2'] },
      // Collision: obj_c vs obj_a
      { call: 'fn_6', test: true, args: ['obj_c.x','obj_c.y','obj_c.w*S','obj_c.h*S','obj_a.x','obj_a.y','obj_a.w*S','obj_a.h*S'],
        onTrue: { call: 'fn_7', args: ['obj_c', 'obj_a.x + (obj_a.w*S+obj_c.w*S)/2', '1'] } },
      // Collision: obj_c vs obj_b
      { call: 'fn_6', test: true, args: ['obj_c.x','obj_c.y','obj_c.w*S','obj_c.h*S','obj_b.x','obj_b.y','obj_b.w*S','obj_b.h*S'],
        onTrue: { call: 'fn_7', args: ['obj_c', 'obj_b.x - (obj_b.w*S+obj_c.w*S)/2', '-1'] } },
      // Edge detection on obj_c
      { call: 'fn_8', args: ['obj_c.x', 'obj_c.w*S/2', 'W'], store: 'edge' },
    ],
    events: [
      { when: 'edge === "left"', do: ['counter_b++', 'reset(obj_c)'] },
      { when: 'edge === "right"', do: ['counter_a++', 'reset(obj_c)'] },
    ],
    reset: {
      'obj_c': { x: 'W/2', y: 'H/2', vx: '(Math.random()>0.5?1:-1)*250', vy: '(Math.random()-0.5)*360' },
    },
    display: {
      background: '#111',
      counters: { font: '48*S', y: '60*S', color: '#fff' },
      hint: { text: 'Arrow Up/Down to move', font: '14*S', y: 'H-20*S', color: '#fff' },
      centerLine: { color: '#444', dash: [8, 8], width: 2 },
    },
  };

  return { contracts, shapes, map };
}

module.exports = { decompose };
