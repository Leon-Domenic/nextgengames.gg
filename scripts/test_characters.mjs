import { CHARACTERS, CHARACTER_MAP, TOKEN_ICONS } from '../lib/board-brawl/characters.js';

console.log('=== VERIFYING 10 UNIQUE CHARACTERS & PAWN MODELS ===');
console.log(`Total Characters: ${CHARACTERS.length}`);

CHARACTERS.forEach((c, idx) => {
  console.log(`${idx + 1}. [${c.icon}] ${c.name} - "${c.title}" (Color: ${c.color})`);
});

if (CHARACTERS.length < 10) {
  throw new Error(`Expected at least 10 characters, found ${CHARACTERS.length}`);
}

const uniqueIds = new Set(CHARACTERS.map(c => c.id));
if (uniqueIds.size !== CHARACTERS.length) {
  throw new Error('Duplicate character IDs detected');
}

console.log(`\n✔ All ${CHARACTERS.length} unique characters and pawn models verified successfully!\n`);
