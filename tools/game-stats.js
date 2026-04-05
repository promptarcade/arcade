#!/usr/bin/env node
// Show unique visitor counts per game from Supabase
// Usage: node tools/game-stats.js

const fs = require('fs');
const https = require('https');

const SUPA_HOST = 'ivhpqkqnfqcgrfrsvszf.supabase.co';
const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2aHBxa3FuZnFjZ3JmcnN2c3pmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MTg1NjYsImV4cCI6MjA4OTM5NDU2Nn0.x3X_0dbhw3Qz7sgQAgpSoSu382ckB2uYxCJGe7_vDCM';

function fetch(path) {
  return new Promise((resolve, reject) => {
    const req = https.get({
      hostname: SUPA_HOST,
      path: path,
      headers: { 'apikey': SUPA_KEY, 'Authorization': 'Bearer ' + SUPA_KEY }
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', reject);
  });
}

async function main() {
  const data = await fetch('/rest/v1/game_visits?select=game,created_at');

  // All existing game directories
  const gamesDirs = fs.readdirSync('games').filter(d => {
    try { return fs.statSync('games/' + d).isDirectory(); } catch(e) { return false; }
  });

  // Count visitors per game
  const counts = {};
  const firstSeen = {};
  data.forEach(r => {
    counts[r.game] = (counts[r.game] || 0) + 1;
    if (!firstSeen[r.game] || r.created_at < firstSeen[r.game]) firstSeen[r.game] = r.created_at;
  });

  // Include games with 0 visitors
  gamesDirs.forEach(g => { if (!counts[g]) counts[g] = 0; });

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const maxName = Math.max(...sorted.map(([g]) => g.length), 4);

  console.log('');
  console.log('=== GAME POPULARITY REPORT ===');
  console.log('');
  console.log('Game'.padEnd(maxName + 2) + 'Visitors'.padStart(10) + '  First Visit');
  console.log('-'.repeat(maxName + 40));
  sorted.forEach(([g, c]) => {
    const first = firstSeen[g] ? new Date(firstSeen[g]).toLocaleDateString() : '-';
    const bar = c > 0 ? ' ' + '\u2588'.repeat(Math.min(c, 30)) : '';
    console.log(g.padEnd(maxName + 2) + c.toString().padStart(10) + '  ' + first.padEnd(14) + bar);
  });
  console.log('-'.repeat(maxName + 40));
  console.log('Total: ' + data.length + ' unique visits across ' + sorted.length + ' games');
  const zero = sorted.filter(([,c]) => c === 0).map(([g]) => g);
  if (zero.length) console.log('No visitors yet: ' + zero.join(', '));
  console.log('');
}

main().catch(e => { console.error(e); process.exit(1); });
