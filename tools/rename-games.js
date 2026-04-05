#!/usr/bin/env node
// Rename copyrighted game titles
const fs = require('fs');

const renames = [
  { dir: 'asteroids', oldName: 'Asteroids', newName: 'Space Rocks', oldId: 'asteroids', newId: 'space-rocks' },
  { dir: 'bomberman', oldName: 'Bomberman', newName: 'Blast Zone', oldId: 'bomberman', newId: 'blast-zone' },
  { dir: 'elevator-action', oldName: 'Elevator Action', newName: 'Spy Descent', oldId: 'elevator-action', newId: 'spy-descent' },
  { dir: 'frogger', oldName: 'Frogger', newName: 'Road Hopper', oldId: 'frogger', newId: 'road-hopper' },
  { dir: 'missile-command', oldName: 'Missile Command', newName: 'Missile Defense', oldId: 'missile-command', newId: 'missile-defense' },
  { dir: 'pac-attack', oldName: 'Pac Attack', newName: 'Chomp Chase', oldId: 'pac-attack', newId: 'chomp-chase' },
  { dir: 'pong', oldName: 'Pong', newName: 'Paddle Duel', oldId: 'pong', newId: 'paddle-duel' },
  { dir: 'space-invaders', oldName: 'Space Invaders', newName: 'Star Guard', oldId: 'space-invaders', newId: 'star-guard' },
];

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

for (const r of renames) {
  const gamePath = 'games/' + r.dir + '/index.html';
  if (!fs.existsSync(gamePath)) { console.log('SKIP: ' + gamePath); continue; }
  let html = fs.readFileSync(gamePath, 'utf8');

  // Title tag: replace any title containing the old name
  html = html.replace(
    new RegExp('<title>[^<]*' + escapeRegex(r.oldName) + '[^<]*</title>'),
    '<title>' + r.newName + '</title>'
  );

  // In-game rendered text: 'Old Name' and "Old Name" and OLD NAME
  html = html.replace(new RegExp("'" + escapeRegex(r.oldName) + "'", 'g'), "'" + r.newName + "'");
  html = html.replace(new RegExp('"' + escapeRegex(r.oldName) + '"', 'g'), '"' + r.newName + '"');
  html = html.replace(new RegExp("'" + escapeRegex(r.oldName.toUpperCase()) + "'", 'g'), "'" + r.newName.toUpperCase() + "'");

  // Score submission: game: 'old-id'
  html = html.replace(new RegExp("game:\\s*'" + escapeRegex(r.oldId) + "'", 'g'), "game: '" + r.newId + "'");
  html = html.replace(new RegExp("game:'" + escapeRegex(r.oldId) + "'", 'g'), "game:'" + r.newId + "'");

  // Visitor counter: G='old-id'
  html = html.replace(new RegExp("G='" + escapeRegex(r.oldId) + "'", 'g'), "G='" + r.newId + "'");

  // localStorage keys containing old id
  html = html.replace(new RegExp("'" + escapeRegex(r.oldId) + "_", 'g'), "'" + r.newId + "_");
  html = html.replace(new RegExp("'" + escapeRegex(r.oldId) + "-", 'g'), "'" + r.newId + "-");

  fs.writeFileSync(gamePath, html);
  console.log('OK: ' + r.dir + ' -> ' + r.newName);
}

// Fix Mech Brawl subtitle
const mechPath = 'games/mech-brawl/index.html';
if (fs.existsSync(mechPath)) {
  let mech = fs.readFileSync(mechPath, 'utf8');
  mech = mech.replace(/Rock Em Sock Em Robots/g, '');
  mech = mech.replace(/Mech Brawl\s*-\s*(?=<|'|"|\n)/g, 'Mech Brawl');
  mech = mech.replace(/<title>Mech Brawl\s*-\s*<\/title>/g, '<title>Mech Brawl</title>');
  // Clean up title if it has trailing dash/space
  mech = mech.replace(/<title>Mech Brawl\s*-?\s*<\/title>/g, '<title>Mech Brawl</title>');
  fs.writeFileSync(mechPath, mech);
  console.log('OK: mech-brawl -> removed "Rock Em Sock Em Robots" subtitle');
}

// Update landing page
const indexPath = 'index.html';
let idx = fs.readFileSync(indexPath, 'utf8');
for (const r of renames) {
  idx = idx.replace(new RegExp('>' + escapeRegex(r.oldName) + '<', 'g'), '>' + r.newName + '<');
}
idx = idx.replace(/Rock Em Sock Em Robots/g, '');
idx = idx.replace(/>Mech Brawl\s*-\s*</g, '>Mech Brawl<');
// Update leaderboard dropdown values and GAME_NAMES
for (const r of renames) {
  idx = idx.replace(new RegExp('value="' + escapeRegex(r.oldId) + '"', 'g'), 'value="' + r.newId + '"');
  idx = idx.replace(new RegExp("'" + escapeRegex(r.oldId) + "'\\s*:", 'g'), "'" + r.newId + "':");
  idx = idx.replace(new RegExp("'" + escapeRegex(r.oldName) + "'", 'g'), "'" + r.newName + "'");
}
fs.writeFileSync(indexPath, idx);
console.log('OK: landing page updated');

console.log('\nDone.');
