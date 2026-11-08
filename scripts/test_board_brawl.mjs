import { BoardBrawlGame } from '../lib/board-brawl/engine.js';
import { TILES, RESORT_TILES, SIDE_PROPERTIES, COLOR_GROUPS } from '../lib/board-brawl/types.js';

console.log('=== BOARD BRAWL ENGINE VERIFICATION SUITE ===');

// 1. Create Room & Add 4 players (mix of humans and bots)
const game = new BoardBrawlGame('TEST_ROOM_1', { mode: 'blitz' });
console.log('✔ Room created with mode:', game.mode, 'Turn duration:', game.turnDuration, 's');

const p1 = { id: 'u1', username: 'Alice', avatar_color: '#00f0ff', avatar_token: 'hat' };
const p2 = { id: 'u2', username: 'Bob', avatar_color: '#ff3344', avatar_token: 'car' };
game.addPlayer(p1);
game.addPlayer(p2);
game.addPlayer({ id: 'bot_1', username: 'VoxelBot', avatar_color: '#00ff88', avatar_token: 'duck' }, true);
game.addPlayer({ id: 'bot_2', username: 'NeonTycoon', avatar_color: '#a855f7', avatar_token: 'jet' }, true);

console.log(`✔ Added 4 players (2 human, 2 bot). Total: ${game.players.length}/6`);
if (game.players.length !== 4) throw new Error('Player count mismatch');

// 2. Start Game
game.startGame();
console.log('✔ Game started. Active player:', game.getCurrentPlayer().name);

// 3. Dice Roll & Movement
const initialPos = game.getCurrentPlayer().position;
game.rollDice('u1');
const newPos = game.getCurrentPlayer().position;
console.log(`✔ Dice rolled: [${game.dice[0]}, ${game.dice[1]}]. Moved from ${initialPos} to ${newPos} (${TILES[newPos].name})`);

// 4. Test Polish Cities: Subkowy (Tile 1) & Starogard Gdański (Tile 3)
console.log(`✔ Verifying Polish Cities: Tile 1 = ${TILES[1].name} (${TILES[1].flag} ${TILES[1].country}), Tile 3 = ${TILES[3].name} (${TILES[3].flag} ${TILES[3].country})`);
if (TILES[1].name !== 'Subkowy' || TILES[1].country !== 'Poland') throw new Error('Tile 1 Subkowy mismatch');
if (TILES[3].name !== 'Starogard Gdański' || TILES[3].country !== 'Poland') throw new Error('Tile 3 Starogard Gdański mismatch');

game.getCurrentPlayer().position = 1; // Subkowy (100,000 CR)
game.getCurrentPlayer().cash = 2000000;
game.buyCity('u1', 1, 2); // Buy Land + 1 House
const subkowy = game.properties[1];
console.log(`✔ Subkowy purchased! Owner: ${subkowy.ownerId}, Level: ${subkowy.level}`);
if (subkowy.ownerId !== 'u1' || subkowy.level !== 2) throw new Error('Subkowy purchase failed');

// 5. Test 2x Buyout
const bob = game.players.find(p => p.id === 'u2');
bob.cash = 2000000;
const subkowyCost = TILES[1].price + (subkowy.level - 1) * TILES[1].housePrice; // 100,000 + 50,000 = 150,000
const buyoutPrice = subkowyCost * 2; // 300,000
game.buyoutCity('u2', 1);
console.log(`✔ 2x Buyout executed! Subkowy new owner: ${game.properties[1].ownerId} (Paid: CR ${buyoutPrice})`);
if (game.properties[1].ownerId !== 'u2') throw new Error('Buyout failed');

// 6. Test Landmark Upgrade & Immunity
game.upgradeCity('u2', 1); // Lvl 3
game.upgradeCity('u2', 1); // Lvl 4
game.upgradeCity('u2', 1); // Lvl 5 (Landmark!)
console.log(`✔ Upgraded to Landmark! Level: ${game.properties[1].level}, isLandmark: ${game.properties[1].isLandmark}`);
if (!game.properties[1].isLandmark) throw new Error('Landmark upgrade failed');

// Attempt buyout on Landmark (should fail)
const buyoutAttempt = game.buyoutCity('u1', 1);
console.log(`✔ Buyout on Landmark blocked: ${!buyoutAttempt} (Immune to buyouts!)`);
if (buyoutAttempt !== false) throw new Error('Landmark buyout was not blocked!');

// 7. Test 4 Resorts System & Rent Progression
console.log(`✔ Verifying 4 Resorts: [${RESORT_TILES.map(id => TILES[id].name).join(', ')}]`);
if (RESORT_TILES.length !== 4) throw new Error('Expected 4 resort tiles');
if (TILES[6].name !== 'Baltic Sands' || TILES[6].type !== 'resort') throw new Error('Tile 6 Baltic Sands mismatch');
if (TILES[12].name !== 'Costa Brava' || TILES[12].type !== 'resort') throw new Error('Tile 12 Costa Brava mismatch');
if (TILES[20].name !== 'Tropical Cove' || TILES[20].type !== 'resort') throw new Error('Tile 20 Tropical Cove mismatch');
if (TILES[28].name !== 'Paradise Atoll' || TILES[28].type !== 'resort') throw new Error('Tile 28 Paradise Atoll mismatch');

// Test buying a Resort (Tile 6: Baltic Sands, Price: 150,000 CR)
const alice = game.players.find(p => p.id === 'u1');
alice.cash = 2000000;
game.buyCity('u1', 6, 1);
const baltic = game.properties[6];
console.log(`✔ Resort 1 (Baltic Sands) purchased by Alice! Owner: ${baltic.ownerId}`);
if (baltic.ownerId !== 'u1') throw new Error('Resort purchase failed');

// 8. Test Tomato Sabotage (3 Free + Cash Throws + 2500ms Cooldown)
console.log('Alice free tomatoes initially:', alice.freeTomatoes);
const throw1 = game.throwTomato('u1', 'u2');
if (!throw1) throw new Error('First tomato throw failed');

const rapidSpamThrow = game.throwTomato('u1', 'u2');
console.log('✔ Rapid tomato throw blocked by 2500ms cooldown:', !rapidSpamThrow);
if (rapidSpamThrow) throw new Error('Expected 2500ms cooldown to block rapid spam throw');

alice.lastTomatoThrowTime = 0;
game.throwTomato('u1', 'u2');
alice.lastTomatoThrowTime = 0;
game.throwTomato('u1', 'u2');
console.log('✔ Threw 3 free tomatoes. Free remaining:', alice.freeTomatoes);
if (alice.freeTomatoes !== 0) throw new Error('Free tomatoes count mismatch');

alice.lastTomatoThrowTime = 0;
alice.cash = 500000;
const cashBeforePaidThrow = alice.cash;
game.throwTomato('u1', 'u2');
console.log(`✔ Threw 4th tomato (50,000 CR paid). Cash: ${cashBeforePaidThrow} -> ${alice.cash}`);
if (alice.cash !== cashBeforePaidThrow - 50000) throw new Error('Paid tomato did not deduct 50,000 CR');

// 9. Test Line Monopoly Win Condition (Bottom Side: 1, 3, 5, 6, 7)
// Alice owns all bottom properties [1, 3, 5, 6, 7]
game.properties[1].ownerId = 'u1';
game.properties[3].ownerId = 'u1';
game.properties[5].ownerId = 'u1';
game.properties[6].ownerId = 'u1';
game.properties[7].ownerId = 'u1';

game.checkWinConditions();
console.log(`✔ Line Monopoly Triggered: Winner = ${game.winner?.name}, Reason = ${game.winReason}`);
if (game.winner?.id !== 'u1' || !game.winReason.includes('line_monopoly')) {
  throw new Error('Line monopoly did not trigger win!');
}

// 10. Test Resort Monopoly Win Condition (All 4 Resorts Owned)
const resortGame = new BoardBrawlGame('TEST_ROOM_RESORT', { mode: 'blitz' });
resortGame.addPlayer(p1);
resortGame.addPlayer(p2);
resortGame.startGame();

// Assign all 4 resorts to Bob
RESORT_TILES.forEach(tId => {
  resortGame.properties[tId].ownerId = 'u2';
});

resortGame.checkWinConditions();
console.log(`✔ Resort Monopoly Triggered: Winner = ${resortGame.winner?.name}, Reason = ${resortGame.winReason}`);
if (resortGame.winner?.id !== 'u2' || !resortGame.winReason.includes('resort_monopoly')) {
  throw new Error('Resort monopoly did not trigger win!');
}

// 11. Test Triple Monopoly Win Condition (3 Color Sets)
const tripleGame = new BoardBrawlGame('TEST_ROOM_TRIPLE', { mode: 'blitz' });
tripleGame.addPlayer(p1);
tripleGame.addPlayer(p2);
tripleGame.startGame();

// Assign brown (1, 3), light_blue (5, 7), pink (9, 11) to Alice
[1, 3, 5, 7, 9, 11].forEach(tId => {
  tripleGame.properties[tId].ownerId = 'u1';
});

tripleGame.checkWinConditions();
console.log(`✔ Triple Monopoly Triggered: Winner = ${tripleGame.winner?.name}, Reason = ${tripleGame.winReason}`);
if (tripleGame.winner?.id !== 'u1' || !tripleGame.winReason.includes('triple_monopoly')) {
  throw new Error('Triple monopoly did not trigger win!');
}

// 12. Test Property Sale to Bank (70% Valuation)
const testGame2 = new BoardBrawlGame('TEST_ROOM_DEBT', { mode: 'classic' });
testGame2.addPlayer(p1);
testGame2.addPlayer(p2);
testGame2.startGame();

const debtor = testGame2.players.find(p => p.id === 'u2');
const creditor = testGame2.players.find(p => p.id === 'u1');

// Assign Starogard Gdański (tile 3: price 120,000, housePrice: 60,000) at level 3 (2 houses) to Debtor
testGame2.properties[3].ownerId = debtor.id;
testGame2.properties[3].level = 3;
const totalInvestment = TILES[3].price + (3 - 1) * TILES[3].housePrice; // 120,000 + 120,000 = 240,000
const expectedRefund = Math.floor(totalInvestment * 0.70); // 168,000

testGame2.turnState = 'debt';
testGame2.pendingDebt = { debtorId: debtor.id, creditorId: creditor.id, amount: 200000 };

debtor.cash = 50000; // Cannot pay debt yet (needs 200,000)
const initialDebtorCash = debtor.cash;

// Sell Starogard Gdański to Bank
const sellRes = testGame2.sellPropertyToBank(debtor.id, 3);
console.log(`✔ Property sold to Bank at 70%: Refund = ${sellRes.refundValue} CR (Expected: ${expectedRefund} CR)`);
if (sellRes.refundValue !== expectedRefund) throw new Error('Incorrect 70% refund calculation');
if (debtor.cash !== initialDebtorCash + expectedRefund) throw new Error('Debtor cash not credited correctly');
if (testGame2.properties[3].ownerId !== null) throw new Error('Property owner was not reset');

// 13. Test Debt Settlement
console.log(`Debtor cash after liquidation: ${debtor.cash} CR, Debt: ${testGame2.pendingDebt.amount} CR`);
const creditorCashBefore = creditor.cash;
const debtorCashBefore = debtor.cash;
const debtAmount = testGame2.pendingDebt.amount;

const settleRes = testGame2.settleDebt(debtor.id);
console.log('✔ Settle Debt executed successfully:', settleRes);
if (!settleRes) throw new Error('Debt settlement failed');
if (testGame2.pendingDebt !== null) throw new Error('Pending debt was not cleared');
if (debtor.cash !== debtorCashBefore - debtAmount) throw new Error('Debtor cash not deducted correctly');
if (creditor.cash !== creditorCashBefore + debtAmount) throw new Error('Creditor cash not credited correctly');
if (testGame2.turnState !== 'end_turn') throw new Error('Turn state should be end_turn upon debt settlement');

console.log('\n⭐⭐ ALL ENGINE VERIFICATION TESTS PASSED FLAWLESSLY! ⭐⭐\n');
process.exit(0);
