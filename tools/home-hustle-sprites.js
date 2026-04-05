// Home Hustle sprite verification
// Run: node tools/home-hustle-sprites.js
const lab = require('./sprite-lab-core');
const SF = lab.SpriteForge;

console.log('=== HOME HUSTLE SPRITES ===\n');

// Parent
console.log('Parent (tall, flowing):');
lab.renderSheet(SF.character({
  style: 'tall', body: { hair: 'flowing' },
  colors: { skin: '#ffcc99', hair: '#664422', shirt: '#4488cc', pants: '#334466', shoes: '#443322', eyes: '#4488ff' },
  animations: { idle: { frames: 4, speed: 0.25 }, walk: { frames: 6, speed: 0.1 } },
}), 'hh-parent.png');

// Boys
[
  { hair: 'short',  hairCol: '#553311', shirt: '#4488cc', pants: '#445566', name: 'boy-short' },
  { hair: 'spiky',  hairCol: '#332211', shirt: '#44bb66', pants: '#556644', name: 'boy-spiky' },
  { hair: 'mohawk', hairCol: '#884422', shirt: '#ee6644', pants: '#554433', name: 'boy-mohawk' },
].forEach(look => {
  console.log('Kid ' + look.name + ':');
  lab.renderSheet(SF.character({
    style: 'chibi', body: { hair: look.hair },
    colors: { skin: '#ffd5a0', hair: look.hairCol, shirt: look.shirt, pants: look.pants, shoes: '#443322', eyes: '#4488cc' },
    animations: { idle: { frames: 4, speed: 0.3 }, walk: { frames: 6, speed: 0.1 } },
  }), 'hh-' + look.name + '.png');
});

// Girls
[
  { hair: 'long',     hairCol: '#aa6633', shirt: '#dd55aa', pants: '#665577', name: 'girl-long' },
  { hair: 'ponytail', hairCol: '#664422', shirt: '#ee8844', pants: '#556655', name: 'girl-ponytail' },
  { hair: 'bob',      hairCol: '#886644', shirt: '#cc66cc', pants: '#554466', name: 'girl-bob' },
].forEach(look => {
  console.log('Kid ' + look.name + ':');
  lab.renderSheet(SF.character({
    style: 'chibi', body: { hair: look.hair },
    colors: { skin: '#ffd5a0', hair: look.hairCol, shirt: look.shirt, pants: look.pants, shoes: '#443322', eyes: '#4488cc' },
    animations: { idle: { frames: 4, speed: 0.3 }, walk: { frames: 6, speed: 0.1 } },
  }), 'hh-' + look.name + '.png');
});

console.log('\nDone.');
