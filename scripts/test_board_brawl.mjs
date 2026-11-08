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

// ==========================================
// 14. TEST 10-SECOND LIGHTNING PUBLIC AUCTION
// ==========================================
console.log('\n--- 14. Testing 10-Second Lightning Public Auction ---');
const auctionGame = new BoardBrawlGame('TEST_ROOM_AUCTION', { mode: 'blitz' });
auctionGame.addPlayer(p1);
auctionGame.addPlayer(p2);
auctionGame.addPlayer({ id: 'bot_1', username: 'VoxelBot' }, true);
auctionGame.startGame();

// Prague (Tile 5: Price 140,000 CR)
const pragueTile = TILES[5];
const expectedStartBid = Math.floor(pragueTile.price * 0.5); // 70,000 CR
auctionGame.startAuction(5);

console.log(`✔ Auction started for ${pragueTile.name}: Active = ${auctionGame.auction?.active}, Start Bid = ${auctionGame.auction?.currentBid} CR (Expected: ${expectedStartBid} CR)`);
if (!auctionGame.auction?.active) throw new Error('Auction did not start as active');
if (auctionGame.auction?.currentBid !== expectedStartBid) throw new Error('Auction starting bid was not 50%');

// Test Bid increments
const alicePlayer = auctionGame.players.find(p => p.id === 'u1');
const bobPlayer = auctionGame.players.find(p => p.id === 'u2');
alicePlayer.cash = 1000000;
bobPlayer.cash = 1000000;

// Alice bids 80,000 CR
const bid1Res = auctionGame.placeBid('u1', 80000);
console.log('✔ Alice bid 80,000 CR:', bid1Res, `Highest bidder: ${auctionGame.auction.highestBidderName}`);
if (!bid1Res || auctionGame.auction.currentBid !== 80000 || auctionGame.auction.highestBidderId !== 'u1') {
  throw new Error('Alice bid failed to register');
}

// Low bid rejection (Bob attempts 75,000 CR, should fail)
const lowBidRes = auctionGame.placeBid('u2', 75000);
console.log('✔ Underbid (75k <= 80k) rejected:', !lowBidRes);
if (lowBidRes) throw new Error('Underbid was not rejected');

// Anti-snipe time extension check: Set timeLeft = 2, then Bob bids 90,000 CR
auctionGame.auction.timeLeft = 2;
const bid2Res = auctionGame.placeBid('u2', 90000);
console.log(`✔ Anti-snipe triggered: Time extended to ${auctionGame.auction.timeLeft}s (Expected: 3s)`);
if (!bid2Res || auctionGame.auction.timeLeft !== 3) {
  throw new Error('Anti-snipe timer extension failed');
}

// Winner determination & Property transfer
const bobCashBeforeWin = bobPlayer.cash;
auctionGame.endAuction();
console.log(`✔ Auction concluded! Winner: ${auctionGame.properties[5].ownerId}, Paid: ${bobCashBeforeWin - bobPlayer.cash} CR`);
if (auctionGame.properties[5].ownerId !== 'u2') throw new Error('Property was not transferred to Bob');
if (bobPlayer.cash !== bobCashBeforeWin - 90000) throw new Error('Bob cash was not deducted correctly');
if (auctionGame.properties[5].level !== 1) throw new Error('Property level should be 1');
if (auctionGame.auction !== null) throw new Error('Auction state was not cleared');

// Test passed auction when no bids placed (Vienna, Tile 7: Price 160,000 CR)
auctionGame.startAuction(7);
console.log(`✔ Auction started for ${TILES[7].name} with 0 bids placed`);
auctionGame.endAuction();
console.log(`✔ Unbid property passed. Owner: ${auctionGame.properties[7].ownerId} (Expected: null)`);
if (auctionGame.properties[7].ownerId !== null) throw new Error('Unbid property should remain unowned');

// ==========================================
// 15. TEST CENTRAL TAX JACKPOT POOL (COMMUNITY POT)
// ==========================================
console.log('\n--- 15. Testing Central Tax Jackpot Pool ---');
const potGame = new BoardBrawlGame('TEST_ROOM_POT', { mode: 'blitz' });
potGame.addPlayer(p1);
potGame.addPlayer(p2);
potGame.startGame();

console.log('Initial Community Pot:', potGame.communityJackpot, 'CR (Expected: 100,000 CR)');
if (potGame.communityJackpot !== 100000) throw new Error('Initial pot should be 100,000 CR');

// 1. City Tax (Tile 4) accumulation: 50% of 120,000 CR = 60,000 CR
const potAlice = potGame.players.find(p => p.id === 'u1');
potAlice.cash = 1000000;
potGame.evaluateTile(potAlice, 4, false);
console.log(`✔ City Tax paid. Pot: ${potGame.communityJackpot} CR (Expected: 160,000 CR)`);
if (potGame.communityJackpot !== 160000) throw new Error('City tax 50% was not added to community pot');

// 2. Bail accumulation: 50% of 100,000 CR = 50,000 CR
potAlice.islandTurns = 2;
potGame.payBail('u1');
console.log(`✔ Bail paid. Pot: ${potGame.communityJackpot} CR (Expected: 210,000 CR)`);
if (potGame.communityJackpot !== 210000) throw new Error('Bail 50% was not added to community pot');

// 3. Tomato refill accumulation: +25,000 CR on paid throw
potAlice.freeTomatoes = 0;
potAlice.lastTomatoThrowTime = 0;
potAlice.cash = 500000;
potGame.throwTomato('u1', 'u2');
console.log(`✔ Paid tomato thrown. Pot: ${potGame.communityJackpot} CR (Expected: 235,000 CR)`);
if (potGame.communityJackpot !== 235000) throw new Error('Tomato refill 25,000 CR was not added to community pot');

// 4. Winning the Pot on World Fair (Tile 22) landing
const potBob = potGame.players.find(p => p.id === 'u2');
potBob.cash = 500000;
const expectedPotWin = 235000;
potGame.evaluateTile(potBob, 22, false);
console.log(`✔ Bob landed on World Fair (Tile 22)! Cash: 500,000 -> ${potBob.cash} CR, New Pot: ${potGame.communityJackpot} CR`);
if (potBob.cash !== 500000 + expectedPotWin) throw new Error('Bob did not receive community pot on World Fair landing');
if (potGame.communityJackpot !== 100000) throw new Error('Pot did not reset to 100,000 CR after win');

// 5. Winning the Pot on Snake Eyes (1-1)
potGame.communityJackpot = 180000; // Add simulated taxes
potAlice.cash = 1000000;
potAlice.position = 5; // Start at Tile 5, roll 2 lands on Tile 7 (Vienna - neutral tile)
// Trigger Snake Eyes roll (d1 = 1, d2 = 1)
potGame.activePlayerIndex = 0;
potGame.turnState = 'roll';
potAlice.loadedRoll = 2; // Forces roll 1 + 1 (Snake Eyes)
potGame.rollDice('u1');
console.log(`✔ Alice rolled Snake Eyes [1, 1]! Cash: ${potAlice.cash} CR, Reset Pot: ${potGame.communityJackpot} CR`);
if (potAlice.cash !== 1000000 + 180000) throw new Error('Alice did not receive jackpot on Snake Eyes');
if (potGame.communityJackpot !== 100000) throw new Error('Pot did not reset to 100,000 CR after Snake Eyes win');

// ==========================================
// 16. TEST 3-DOUBLES SPEEDING ARREST
// ==========================================
console.log('\n--- 16. Testing 3-Doubles Speeding Arrest ---');
const speedGame = new BoardBrawlGame('TEST_ROOM_SPEED', { mode: 'blitz' });
speedGame.addPlayer(p1);
speedGame.addPlayer(p2);
speedGame.startGame();

const speedPlayer = speedGame.getCurrentPlayer();
speedPlayer.cash = 2000000;
speedPlayer.position = 0;

// Double 1: roll 4 (2+2)
speedGame.turnState = 'roll';
speedPlayer.loadedRoll = 4;
speedGame.rollDice(speedPlayer.id);
console.log(`✔ Roll 1 Doubles: doublesCount = ${speedGame.doublesCount}, turnState = ${speedGame.turnState}`);
if (speedGame.doublesCount !== 1) throw new Error('First double was not recorded');
if (speedGame.turnState !== 'roll' || speedGame.getCurrentPlayer().id !== speedPlayer.id) {
  throw new Error('Player was not granted re-roll after 1st doubles');
}

// Double 2: roll 4 (2+2) starting from Tile 20 (lands on 24: Armory)
speedPlayer.position = 20;
speedPlayer.loadedRoll = 4;
speedGame.rollDice(speedPlayer.id);
console.log(`✔ Roll 2 Doubles: doublesCount = ${speedGame.doublesCount}, turnState = ${speedGame.turnState}`);
if (speedGame.doublesCount !== 2) throw new Error('Second double was not recorded');
if (speedGame.turnState !== 'roll' || speedGame.getCurrentPlayer().id !== speedPlayer.id) {
  throw new Error('Player was not granted 2nd re-roll after 2nd doubles');
}

// Double 3: roll 4 (2+2) -> 3RD CONSECUTIVE DOUBLES = SPEEDING ARREST!
speedPlayer.loadedRoll = 4;
speedGame.rollDice(speedPlayer.id);
console.log(`✔ Roll 3 Doubles: Position = ${speedPlayer.position} (${TILES[speedPlayer.position].name}), islandTurns = ${speedPlayer.islandTurns}, Active Player = ${speedGame.getCurrentPlayer().name}`);
if (speedPlayer.position !== 8) throw new Error('Speeding arrest did not place player on Resort Island (Tile 8)');
if (speedPlayer.islandTurns !== 3) throw new Error('Speeding arrest did not set islandTurns to 3');
if (speedGame.doublesCount !== 0) throw new Error('doublesCount was not reset after arrest');
if (speedGame.getCurrentPlayer().id === speedPlayer.id) throw new Error('Speeding arrest did not end turn immediately');

// ==========================================
// 17. TEST VIP ESCAPE PASS ACTION CARD & TRADING
// ==========================================
console.log('\n--- 17. Testing VIP Escape Pass Action Card & P2P Trade ---');
const vipGame = new BoardBrawlGame('TEST_ROOM_VIP', { mode: 'blitz' });
vipGame.addPlayer(p1);
vipGame.addPlayer(p2);
vipGame.startGame();

const prisoner = vipGame.players.find(p => p.id === 'u1');
prisoner.position = 8;
prisoner.islandTurns = 3;
const vipPassCard = {
  id: 'vip_escape_pass',
  title: 'Island VIP Pass',
  badge: 'VIP ESCAPE',
  rarity: 'RARE',
  icon: '🎟️',
  targetType: 'self',
};
prisoner.cards = [vipPassCard];

console.log(`✔ Prisoner on Resort Island with ${prisoner.islandTurns} turns remaining and [${prisoner.cards[0].title}] in hand`);

// Verify VIP Pass is recognized as valid in P2P trade offer
import { validateTrade } from '../lib/board-brawl/tradeEngine.js';
const tradeCheck = validateTrade(vipGame, {
  proposerId: 'u1',
  targetId: 'u2',
  offer: {
    proposerCardIds: ['vip_escape_pass'],
    proposerCash: 0,
    targetTileIds: [],
    targetCardIds: [],
    targetCash: 150000,
  },
});
console.log(`✔ VIP Pass Trade Validation: Valid = ${tradeCheck.valid} (Expected: true)`);
if (!tradeCheck.valid) throw new Error(`Trade validation failed: ${tradeCheck.error}`);

// Redeem VIP Pass
const vipRedeemRes = vipGame.playActionCard('u1', 'vip_escape_pass');
console.log(`✔ VIP Pass Redeemed: Success = ${vipRedeemRes}, Island Turns = ${prisoner.islandTurns}, Cards Remaining = ${prisoner.cards.length}`);
if (!vipRedeemRes) throw new Error('VIP Pass redemption failed');
if (prisoner.islandTurns !== 0) throw new Error('VIP Pass did not clear islandTurns to 0');
if (prisoner.cards.some(c => c.id === 'vip_escape_pass')) throw new Error('VIP Pass was not consumed from hand');

console.log('\n⭐⭐ ALL ENGINE VERIFICATION TESTS PASSED FLAWLESSLY! ⭐⭐\n');
process.exit(0);
