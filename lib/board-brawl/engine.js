import { TILES, COLOR_GROUPS, SIDE_PROPERTIES, RESORT_TILES, CHANCE_CARDS, getMonopolyTitle, getDistrictName } from './types.js';
import { EVENT_CARDS, ACTION_CARDS, getRandomEventCard, getRandomActionCard, getActionCard, getEventCard } from './cards.js';
import { executeTrade, validateTrade, processLoanRepayments, handleBankruptcyLoans, evaluateBotTrade } from './tradeEngine.js';

/**
 * Robust teammate check for team / 2v2 modes.
 * Checks id, teamId, team, partnerId, and slot parity.
 */
export function isTeammate(p1, p2, allPlayers = [], mode = '') {
  if (!p1 || !p2) return false;
  if (p1.id === p2.id) return true;
  if (p1.teamId && p2.teamId && p1.teamId === p2.teamId) return true;
  if (p1.team && p2.team && p1.team === p2.team) return true;
  if (p1.partnerId && (p1.partnerId === p2.id || p2.partnerId === p1.id)) return true;

  const isTeamMode = mode === '2v2' || mode === '3v3' || mode === 'teams';
  const playersList = Array.isArray(allPlayers) ? allPlayers : [];

  if (isTeamMode || ((mode === '2v2' || mode === '3v3' || mode === 'teams' || p1.teamId || p1.team || p1.partnerId) && (playersList.length === 4 || playersList.length === 6))) {
    const idx1 = playersList.findIndex(p => p && p.id === p1.id);
    const idx2 = playersList.findIndex(p => p && p.id === p2.id);
    if (idx1 !== -1 && idx2 !== -1) {
      return (idx1 % 2) === (idx2 % 2);
    }
    if (typeof p1.slotIndex === 'number' && typeof p2.slotIndex === 'number') {
      return (p1.slotIndex % 2) === (p2.slotIndex % 2);
    }
  }

  if (typeof p1.slotIndex === 'number' && typeof p2.slotIndex === 'number' && isTeamMode) {
    return (p1.slotIndex % 2) === (p2.slotIndex % 2);
  }

  return false;
}

export class BoardBrawlGame {
  constructor(roomId, options = {}) {
    this.roomId = roomId;
    this.mode = options.mode || 'blitz'; // 'blitz', 'normal', '3v3', '2v2', 'teams', etc.
    this.turnDuration = this.mode === 'normal' ? 35 : 25;
    this.matchDuration = this.mode === 'normal' ? 3600 : (this.mode === '3v3' ? 1800 : 1200); // 60 mins, 30 mins, or 20 mins in seconds
    this.matchTimeRemaining = this.matchDuration;
    this.matchStartTime = null;
    this.matchTimerInterval = null;
    this.status = 'waiting'; // 'waiting', 'playing', 'finished'
    
    this.players = []; // [{ id, name, isBot, avatarColor, avatarToken, diceSkin, cash, netWorth, position, isBankrupt, islandTurns, freeTomatoes, tomatoesThrown, tomatoesHit, missedTurns, cards, shieldActive, rentSurgeTurns, disadvantaged, loadedRoll }]
    this.properties = {}; // tileId -> { ownerId, level, isLandmark, festival, mortgaged }
    
    this.activePlayerIndex = 0;
    this.turnState = 'roll'; // 'roll', 'action', 'debt', 'flight_select', 'festival_select'
    this.turnTimerRemaining = this.turnDuration;
    this.turnTimerInterval = null;
    
    this.doublesCount = 0;
    this.rolledDoublesThisTurn = false;
    this.dice = [1, 1];
    this.lastDiceResult = null;
    this.pendingDebt = null; // { debtorId, creditorId, amount, remainingSec }
    this.flightPendingPlayerId = null;

    // Tactical Card & Event Engine State
    this.activeEventCard = null; // { card, drawerId, drawerName, timestamp }
    this.startingSpin = null; // { chosenPlayerIndex, chosenPlayerId, chosenPlayerName, startTime, durationMs }
    this.blackoutRounds = 0; // If > 0, municipal rent is 0
    this.lastActionCardPlayed = null; // { playerId, playerName, card, targetPayload, timestamp }

    // Active P2P Trade & Loan State
    this.activeTrade = null; // { id, proposerId, targetId, offer, createdAt, expiresAt, status }
    this.loans = []; // active loans: [{ id, borrowerId, creditorId, principal, interestRate, totalRepayment, roundsRemaining, perRoundPayment, collateralTileId, active }]
    this.tradeTimeout = null;

    this.winner = null;
    this.winReason = null; // 'line_monopoly', 'triple_monopoly', 'bankruptcy', 'blitz_timeout'
    this.lobbyReturnInterval = null;
    this.lobbyReturnRemaining = 0;
    this.chat = [];

    // Central Tax Jackpot Pool (Community Pot)
    this.communityJackpot = 100000;

    // 10-Second Lightning Public Auction State
    this.auction = null; // { tileId, currentBid, highestBidderId, highestBidderName, timeLeft, active }
    this.auctionTimer = null;
    this.lastPaymentEvent = null;

    this.callbacks = {
      onStateChange: () => {},
      onTomatoHit: () => {},
      onDiceRoll: () => {},
      onChatMessage: () => {},
      onWin: () => {},
      onActionCardPlayed: () => {},
      onCardYoink: () => {},
      onTradeUpdate: () => {},
      onTradeCompleted: () => {},
      onTradeDeclined: () => {},
      onAuctionStart: () => {},
      onAuctionUpdate: () => {},
      onAuctionEnd: () => {},
      onJackpotWin: () => {},
      onSpeedingArrest: () => {},
      onPayment: () => {},
    };

    // Initialize all city and resort properties
    TILES.forEach(tile => {
      if (tile.type === 'city' || tile.type === 'resort') {
        this.properties[tile.id] = {
          ownerId: null,
          level: 1, // 1: base property / resort, 2: 1-house, 3: 2-houses, 4: 3-houses, 5: landmark
          isLandmark: false,
          festival: false,
          mortgaged: false,
        };
      }
    });
  }

  setCallbacks(cbs) {
    this.callbacks = { ...this.callbacks, ...cbs };
  }

  emitPaymentEvent(payment) {
    this.lastPaymentEvent = {
      ...payment,
      id: `pay_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
    };
    try {
      this.callbacks.onPayment?.(this.lastPaymentEvent);
    } catch (e) {}
  }

  setGameMode(mode) {
    if (this.status !== 'waiting') return false;
    this.mode = mode === 'normal' ? 'normal' : (mode === '3v3' ? '3v3' : 'blitz');
    this.matchDuration = this.mode === 'normal' ? 3600 : (this.mode === '3v3' ? 1800 : 1200);
    this.matchTimeRemaining = this.matchDuration;
    this.turnDuration = this.mode === 'normal' ? 35 : 25;
    const startingCash = 2000000;
    this.players.forEach(p => {
      p.cash = startingCash;
      p.netWorth = startingCash;
    });
    const modeName = this.mode === 'normal' ? '🏆 NORMAL (60 Mins)' : (this.mode === '3v3' ? '👥 3v3 TEAMS (30 Mins)' : '⚡ BLITZ (20 Mins)');
    this.addChatMessage({
      sender: 'System',
      text: `⚙️ Game mode set to ${modeName}!`,
      isSystem: true,
    });
    this.emitChange();
    return true;
  }

  addPlayer(user, isBot = false) {
    // Reconnecting player check
    const existing = this.players.find(p => p.id === user.id);
    if (existing) {
      if (!isBot && existing.isBot) {
        existing.isBot = false;
        existing.name = user.username || user.name || existing.name;
        this.addChatMessage({ sender: 'System', text: `🎮 ${existing.name} reconnected and resumed control!`, isSystem: true });
        this.emitChange();
      }
      return true;
    }

    if (this.players.length >= 6 || this.status !== 'waiting') return false;

    const startingCash = 2000000;
    const player = {
      id: user.id,
      name: user.username || user.name || `Player_${this.players.length + 1}`,
      isBot,
      avatarColor: user.avatar_color || user.avatarColor || '#00f0ff',
      avatarToken: user.avatar_token || user.avatarToken || 'hat',
      diceSkin: user.dice_skin || user.diceSkin || 'classic_red',
      boardBackground: user.board_background || user.boardBackground || 'classic_stadium',
      cash: startingCash,
      netWorth: startingCash,
      position: 0,
      isBankrupt: false,
      islandTurns: 0,
      freeTomatoes: 3,
      tomatoesThrown: 0,
      tomatoesHit: 0,
      missedTurns: 0,
      isReady: isBot ? true : false,
      // Action Cards & Status Perks
      cards: [],
      shieldActive: false,
      rentSurgeTurns: 0,
      disadvantaged: false,
      loadedRoll: null,
      laps: 0,
      orbits: 0,
    };

    this.players.push(player);
    this.emitChange();
    return true;
  }

  updatePlayerCharacter(userId, token, color) {
    const player = this.players.find(p => p.id === userId);
    if (!player) return false;
    if (token) player.avatarToken = token;
    if (color) player.avatarColor = color;
    this.emitChange();
    return true;
  }

  updatePlayerDiceSkin(userId, skinId) {
    const player = this.players.find(p => p.id === userId);
    if (!player) return false;
    player.diceSkin = skinId;
    this.emitChange();
    return true;
  }

  updatePlayerBoardBackground(userId, bgId) {
    const player = this.players.find(p => p.id === userId);
    if (!player) return false;
    player.boardBackground = bgId;
    this.emitChange();
    return true;
  }

  removePlayer(userId) {
    if (this.status === 'waiting') {
      this.players = this.players.filter(p => p.id !== userId);
      this.emitChange();
    } else {
      // If game in progress, convert player to an active bot so match isn't disrupted
      const player = this.players.find(p => p.id === userId);
      if (player && !player.isBankrupt) {
        player.isBot = true;
        this.emitChange();
        if (this.getCurrentPlayer()?.id === userId) {
          this.triggerBotTurn();
        }
      }
    }
  }

  startGame() {
    if (this.players.length < 2 || this.status !== 'waiting') return false;
    this.status = 'playing';
    
    // Random starting player selection from connected players
    const startingIndex = Math.floor(Math.random() * this.players.length);
    this.activePlayerIndex = startingIndex;
    this.turnState = 'roll';
    
    // Deal 1 tactical starter Action Card to each player
    this.players.forEach(p => {
      p.cards = [getRandomActionCard()];
    });

    // Start match countdown timer (20m Blitz or 60m Normal)
    this.matchDuration = this.mode === 'normal' ? 3600 : 1200;
    this.matchStartTime = Date.now();
    this.matchTimeRemaining = this.matchDuration;
    this.startMatchTimer();

    // Trigger turn order determination spin animation
    this.startingSpin = {
      chosenPlayerIndex: startingIndex,
      chosenPlayerId: this.players[startingIndex]?.id,
      chosenPlayerName: this.players[startingIndex]?.name,
      startTime: Date.now(),
      durationMs: 3800,
    };

    this.startTurnTimer();
    this.emitChange();

    // Auto-clear startingSpin after animation completes
    setTimeout(() => {
      if (this.startingSpin) {
        this.startingSpin = null;
        this.emitChange();
      }
    }, 4400);

    if (this.getCurrentPlayer()?.isBot) {
      setTimeout(() => this.triggerBotTurn(), 4400 + 1200);
    }
    return true;
  }

  getCurrentPlayer() {
    return this.players[this.activePlayerIndex] || null;
  }

  startMatchTimer() {
    this.stopMatchTimer();
    this.matchStartTime = Date.now();
    this.matchExpiresAt = Date.now() + (this.matchDuration * 1000);
    this.matchTimerInterval = setInterval(() => {
      if (this.status !== 'playing') {
        this.stopMatchTimer();
        return;
      }
      const elapsedSec = Math.floor((Date.now() - (this.matchStartTime || Date.now())) / 1000);
      this.matchTimeRemaining = Math.max(0, this.matchDuration - elapsedSec);

      if (this.matchTimeRemaining <= 0) {
        this.matchTimeRemaining = 0;
        this.stopMatchTimer();
        this.handleMatchTimeout();
      }
    }, 1000);
  }

  stopMatchTimer() {
    if (this.matchTimerInterval) {
      clearInterval(this.matchTimerInterval);
      this.matchTimerInterval = null;
    }
  }

  handleMatchTimeout() {
    if (this.status === 'finished') return;
    this.stopTurnTimer();
    this.stopMatchTimer();
    this.updateNetWorths();

    const activePlayers = this.players.filter(p => !p.isBankrupt);
    const candidates = activePlayers.length > 0 ? activePlayers : this.players;

    // Highest total value (netWorth = cash + property values)
    candidates.sort((a, b) => {
      const diff = (b.netWorth || 0) - (a.netWorth || 0);
      if (diff !== 0) return diff;
      return (b.cash || 0) - (a.cash || 0);
    });

    const winner = candidates[0];
    const modeLabel = this.mode === 'normal' ? 'Normal (60 Mins)' : 'Blitz (20 Mins)';
    const reason = `Time Limit Expired (${modeLabel}) - Highest Total Assets`;

    this.addChatMessage({
      sender: 'System',
      text: `⏳ TIME EXPIRED (${this.mode === 'normal' ? '60' : '20'}m)! Calculating highest asset valuation...`,
      isSystem: true,
    });
    this.addChatMessage({
      sender: 'System',
      text: `🏆 Champion: ${winner?.name} with total asset valuation of ${(winner?.netWorth || 0).toLocaleString()} CR!`,
      isSystem: true,
    });

    this.declareWinner(winner, reason);
  }

  startTurnTimer() {
    this.stopTurnTimer();
    this.turnStartTime = Date.now();
    this.turnExpiresAt = Date.now() + (this.turnDuration * 1000);
    this.turnTimerRemaining = this.turnDuration;

    this.turnTimerInterval = setInterval(() => {
      if (this.matchStartTime && this.status === 'playing') {
        const elapsedSec = Math.floor((Date.now() - this.matchStartTime) / 1000);
        this.matchTimeRemaining = Math.max(0, this.matchDuration - elapsedSec);
        if (this.matchTimeRemaining <= 0) {
          this.matchTimeRemaining = 0;
          this.handleMatchTimeout();
          return;
        }
      }

      const turnElapsedSec = Math.floor((Date.now() - (this.turnStartTime || Date.now())) / 1000);
      this.turnTimerRemaining = Math.max(0, this.turnDuration - turnElapsedSec);
      if (this.turnTimerRemaining <= 0) {
        this.handleTurnTimeout();
      } else {
        this.emitChange();
      }
    }, 1000);
  }

  stopTurnTimer() {
    if (this.turnTimerInterval) {
      clearInterval(this.turnTimerInterval);
      this.turnTimerInterval = null;
    }
  }

  handleTurnTimeout() {
    const current = this.getCurrentPlayer();
    if (!current) return;

    // Safety: If an active event card was somehow left open when turn times out, dismiss it cleanly
    if (this.activeEventCard) {
      if (this.eventCardDismissTimeout) {
        clearTimeout(this.eventCardDismissTimeout);
        this.eventCardDismissTimeout = null;
      }
      this.activeEventCard = null;
    }

    if (current.isBankrupt) {
      this.endTurn(current.id);
      return;
    }

    // AI Bots auto-act when timer expires
    if (current.isBot) {
      if (this.turnState === 'roll') {
        const rolled = this.rollDice(current.id);
        if (!rolled) {
          this.endTurn(current.id);
        }
      } else if (this.turnState === 'action') {
        this.completeTurnAction(current.id);
      } else if (this.turnState === 'start_tile_select') {
        this.completeTurnAction(current.id);
        return;
      } else if (this.turnState === 'festival_select') {
        let owned = Object.keys(this.properties).filter(id => this.properties[id]?.ownerId === current.id);
        if (owned.length === 0) {
          // Consider teammate properties if bot has none
          owned = Object.keys(this.properties).filter(id => {
            const prop = this.properties[id];
            if (!prop?.ownerId) return false;
            const owner = this.players.find(p => p.id === prop.ownerId);
            return isTeammate(current, owner, this.players, this.mode);
          });
        }
        if (owned.length > 0) {
          owned.sort((a, b) => (this.properties[b]?.level || 1) - (this.properties[a]?.level || 1));
          const ok = this.setFestival(current.id, parseInt(owned[0]));
          if (!ok) this.completeTurnAction(current.id);
          return;
        }
        this.completeTurnAction(current.id);
      } else if (this.turnState === 'flight_select') {
        this.flightPendingPlayerId = null;
        this.completeTurnAction(current.id);
        return;
      } else if (this.turnState === 'debt') {
        const owned = Object.keys(this.properties).filter(id => this.properties[id].ownerId === current.id);
        while (current.cash < (this.pendingDebt?.amount || 0) && owned.length > 0) {
          const tileId = parseInt(owned.pop());
          this.sellPropertyToBank(current.id, tileId);
        }
        if (current.cash >= (this.pendingDebt?.amount || 0)) {
          this.settleDebt(current.id);
        } else {
          this.declareBankruptcy(current.id, this.pendingDebt?.creditorId);
        }
      } else {
        this.completeTurnAction(current.id);
      }
      return;
    }

    // HUMAN PLAYERS: NEVER auto-roll their dice without their input!
    if (this.turnState === 'roll') {
      this.addChatMessage({
        sender: 'Timer',
        text: `⏳ ${current.name} ran out of time to roll! Turn skipped.`,
        isSystem: true
      });
      this.endTurn(current.id);
    } else if (this.turnState === 'action') {
      this.addChatMessage({
        sender: 'Timer',
        text: `⏳ ${current.name} ran out of time to act! Decision auto-passed.`,
        isSystem: true
      });
      this.completeTurnAction(current.id);
    } else if (this.turnState === 'start_tile_select') {
      this.addChatMessage({
        sender: 'Timer',
        text: `⏳ ${current.name} ran out of time on START Launchpad! Decision auto-passed.`,
        isSystem: true
      });
      this.completeTurnAction(current.id);
    } else if (this.turnState === 'festival_select') {
      this.completeTurnAction(current.id);
    } else if (this.turnState === 'flight_select') {
      this.flightPendingPlayerId = null;
      this.addChatMessage({
        sender: 'Timer',
        text: `⏳ ${current.name} ran out of time to select a flight destination! Flight skipped.`,
        isSystem: true
      });
      this.completeTurnAction(current.id);
    } else if (this.turnState === 'debt') {
      const owned = Object.keys(this.properties).filter(id => this.properties[id].ownerId === current.id);
      while (current.cash < (this.pendingDebt?.amount || 0) && owned.length > 0) {
        const tileId = parseInt(owned.pop());
        this.sellPropertyToBank(current.id, tileId);
      }
      if (current.cash >= (this.pendingDebt?.amount || 0)) {
        this.settleDebt(current.id);
      } else {
        this.declareBankruptcy(current.id, this.pendingDebt?.creditorId);
      }
    } else {
      this.completeTurnAction(current.id);
    }
  }

  rollDice(playerId) {
    if (this.startingSpin) return false;
    const current = this.getCurrentPlayer();
    if (!current || this.turnState !== 'roll' || current.isBankrupt) {
      return false;
    }

    // Verify player identity with robust tolerance for single-human rooms
    if (current.id !== playerId) {
      const nonBots = this.players.filter(p => !p.isBot && !p.isBankrupt);
      const isAuthorizedHuman = !current.isBot && (
        (nonBots.length === 1 && nonBots[0].id === current.id) ||
        this.players.some(p => p.id === playerId && !p.isBot)
      );
      if (!isAuthorizedHuman) {
        return false;
      }
    }

    // Immediately stop turn timer so timeout cannot fire mid-roll or while moving!
    this.stopTurnTimer();

    // Roll with Loaded Dice or Disadvantage check
    let d1, d2;
    if (current.loadedRoll) {
      const targetVal = Math.min(12, Math.max(2, current.loadedRoll));
      d1 = Math.min(6, Math.max(1, Math.floor(targetVal / 2)));
      d2 = targetVal - d1;
      current.loadedRoll = null;
      this.addChatMessage({ sender: 'LoadedDice', text: `🎲 ${current.name} executed a rigged roll of ${targetVal} (${d1}+${d2})!`, isSystem: true });
    } else if (current.disadvantaged) {
      d1 = Math.floor(Math.random() * 6) + 1;
      d2 = 0;
      current.disadvantaged = false;
      this.addChatMessage({ sender: 'TomatoBlitz', text: `🍅 BLINDED! ${current.name} rolled with disadvantage (1 die: ${d1})!`, isSystem: true });
    } else {
      d1 = Math.floor(Math.random() * 6) + 1;
      d2 = Math.floor(Math.random() * 6) + 1;
    }

    const isDoubles = d1 === d2 && d2 > 0;
    const isSnakeEyes = d1 === 1 && d2 === 1;
    this.dice = [d1, d2];
    this.rolledDoublesThisTurn = isDoubles;
    this.lastDiceResult = {
      id: `${playerId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      d1,
      d2,
      isDoubles,
      sum: d1 + d2,
      playerId,
    };

    if (isSnakeEyes) {
      this.awardCommunityJackpot(current, 'Snake Eyes (1-1)');
    }

    this.callbacks.onDiceRoll({
      playerId,
      playerName: current.name,
      d1,
      d2,
      isDoubles,
      sum: d1 + d2
    });

    if (current.islandTurns > 0) {
      if (isDoubles) {
        current.islandTurns = 0;
        this.doublesCount = 0;
        this.rolledDoublesThisTurn = false; // Escaping jail consumes doubles re-roll
        this.addChatMessage({ sender: 'System', text: `🎲 ${current.name} rolled DOUBLES (${d1}+${d2}) and escaped Resort Island!`, isSystem: true });
      } else {
        current.islandTurns -= 1;
        if (current.islandTurns === 0) {
          current.cash = Math.max(0, current.cash - 100000);
          this.communityJackpot = (this.communityJackpot || 100000) + 50000;
          this.addChatMessage({ sender: 'System', text: `🌴 ${current.name} paid 100,000 Space Credits bail to leave Prison! (+50,000 CR to Community Pot)`, isSystem: true });
        } else {
          this.addChatMessage({ sender: 'System', text: `🔒 ${current.name} remains locked in Prison (${current.islandTurns} turns left).`, isSystem: true });
          this.endTurn(playerId);
          return true;
        }
      }
    }

    // Doubles streak check (3 in a row = sent to Resort Island)
    if (isDoubles && current.islandTurns === 0) {
      this.doublesCount = (this.doublesCount || 0) + 1;
      if (this.doublesCount >= 3) {
        current.position = 8; // Resort Island (Tile 8)
        current.islandTurns = 3;
        this.doublesCount = 0;
        this.rolledDoublesThisTurn = false;
        this.addChatMessage({ sender: 'System', text: `🚨 SPEEDING! ${current.name} rolled doubles 3 times in a row! Sent off the board to Prison!`, isSystem: true });
        this.callbacks.onSpeedingArrest?.({ playerId: current.id, playerName: current.name });
        this.endTurn(playerId);
        return true;
      }
    } else {
      this.doublesCount = 0;
    }

    // Move player
    const oldPos = current.position;
    const newPos = (oldPos + d1 + d2) % TILES.length;

    // Passed START bonus
    if (newPos < oldPos && newPos !== 0) {
      current.laps = (current.laps || 0) + 1;
      current.orbits = current.laps;
      current.cash += 200000;
      this.emitPaymentEvent({
        payerId: null,
        receiverId: current.id,
        amount: 200000,
        type: 'salary',
      });
      this.addChatMessage({ sender: 'System', text: `✈️ ${current.name} passed START and collected 200,000 Space Credits World Tour salary!`, isSystem: true });
      processLoanRepayments(this, current, 200000);
    }

    current.position = newPos;
    this.evaluateTile(current, newPos, isDoubles);
    return true;
  }

  awardCommunityJackpot(player, triggerName = 'Jackpot') {
    if (!player || player.isBankrupt) return;
    const wonAmount = this.communityJackpot || 100000;
    player.cash += wonAmount;
    this.addChatMessage({
      sender: 'System',
      text: `💰 JACKPOT! ${player.name} won the Community Pot of ${wonAmount.toLocaleString()} Space Credits!`,
      isSystem: true,
    });
    this.callbacks.onJackpotWin?.({ playerId: player.id, playerName: player.name, amount: wonAmount, trigger: triggerName });
    this.communityJackpot = 100000;
  }

  evaluateTile(player, tileId, isDoubles) {
    const tile = TILES[tileId];
    this.updateNetWorths();

    if (tile.type === 'start') {
      player.laps = (player.laps || 0) + 1;
      player.orbits = player.laps;
      player.cash += 200000;
      this.emitPaymentEvent({
        payerId: null,
        receiverId: player.id,
        amount: 200000,
        type: 'salary',
      });
      this.addChatMessage({ sender: 'System', text: `🏁 ${player.name} landed on START and collected 200,000 Space Credits bonus!`, isSystem: true });
      processLoanRepayments(this, player, 200000);

      // Trigger START Launchpad Privilege Action Selection
      this.turnState = 'start_tile_select';
      this.startTurnTimer();
      this.addChatMessage({
        sender: 'Launchpad',
        text: `🚀 [START PRIVILEGE] ${player.name} landed directly on START! Choose an action: One More Roll, Remote Upgrade, Planetary Shield, or Pass!`,
        isSystem: true,
      });
      this.emitChange();
      if (player.isBot && this.status === 'playing') {
        setTimeout(() => this.triggerBotTurn(), 1000);
      }
    } else if (tile.type === 'tax') {
      const taxAmount = tile.amount || 120000;
      player.cash = Math.max(0, player.cash - taxAmount);
      const taxContrib = Math.floor(taxAmount * 0.5);
      this.communityJackpot = (this.communityJackpot || 100000) + taxContrib;
      this.emitPaymentEvent({
        payerId: player.id,
        receiverId: null,
        amount: taxAmount,
        type: 'tax',
        tileId: tile.id,
      });
      this.addChatMessage({ sender: 'System', text: `💸 ${player.name} paid ${taxAmount.toLocaleString()} Space Credits in ${tile.name}! (+${taxContrib.toLocaleString()} CR to Community Pot)`, isSystem: true });
      this.finishMove(player, isDoubles);
    } else if (tile.type === 'armory') {
      player.freeTomatoes += 2;
      if (!player.cards) player.cards = [];
      if (player.cards.length < 3) {
        const lootCard = getRandomActionCard();
        player.cards.push(lootCard);
        this.addChatMessage({ sender: 'Armory', text: `🍅 ${player.name} raided the Armory: +2 Tomatoes & drew [${lootCard.title}] Action Card!`, isSystem: true });
      } else {
        this.addChatMessage({ sender: 'Armory', text: `🍅 ${player.name} raided the Armory and obtained +2 Free Tomatoes!`, isSystem: true });
      }
      this.finishMove(player, isDoubles);
    } else if (tile.type === 'jail' || tile.type === 'go_to_jail') {
      player.position = 8;
      player.islandTurns = 3;
      this.addChatMessage({ sender: 'LostIsland', text: `🏝️ STRANDED! ${player.name} got shipwrecked on Lost Island for 3 turns!`, isSystem: true });
      this.finishMove(player, false);
    } else if (tile.type === 'casino') {
      this.addChatMessage({ sender: 'Casino', text: `🎰 ${player.name} relaxed at the High-Roller Casino Lounge!`, isSystem: true });
      this.finishMove(player, isDoubles);
    } else if (tile.type === 'airport' || tile.type === 'world_tour') {
      const flightCost = 50000;
      // Only neutral city or resort tiles and own owned tiles are eligible
      const eligibleTiles = TILES.filter(t => {
        if (t.type !== 'city' && t.type !== 'resort') return false;
        const prop = this.properties[t.id];
        return !prop?.ownerId || prop?.ownerId === player.id;
      });

      if (player.cash >= flightCost && eligibleTiles.length > 0) {
        this.turnState = 'flight_select';
        this.flightPendingPlayerId = player.id;
        this.startTurnTimer();
        this.addChatMessage({
          sender: 'WorldTour',
          text: `✈️ ${player.name} arrived at World Tour! Select any neutral or owned city to travel to (Ticket: 50,000 CR).`,
          isSystem: true
        });
        this.emitChange();

        if (player.isBot) {
          setTimeout(() => this.triggerBotTurn(), 1000);
        }
      } else {
        if (player.cash < flightCost) {
          this.addChatMessage({
            sender: 'WorldTour',
            text: `✈️ ${player.name} couldn't afford the 50,000 CR World Tour flight ticket.`,
            isSystem: true
          });
        }
        this.finishMove(player, isDoubles);
      }
    } else if (tile.type === 'championship' || tile.type === 'festival' || tileId === 22) {
      if (tileId === 22 || tile.type === 'festival') {
        this.awardCommunityJackpot(player, 'World Fair (Tile 22)');
      }
      // World Championship / Festival selection field: double rent of one owned city (2x Rent Host)
      const ownedCities = Object.keys(this.properties).filter(id => {
        const prop = this.properties[id];
        if (!prop?.ownerId) return false;
        if (prop.ownerId === player.id) return true;
        const owner = this.players.find(p => p.id === prop.ownerId);
        return isTeammate(player, owner, this.players, this.mode);
      });
      if (ownedCities.length > 0) {
        this.turnState = 'festival_select';
        this.startTurnTimer();
        this.addChatMessage({
          sender: 'Championship',
          text: `🏆 WORLD CHAMPIONSHIP! ${player.name} landed on Championship! Select a city to host the Championship and double its rent (2x Rent Host)!`,
          isSystem: true
        });
      } else {
        this.addChatMessage({
          sender: 'Championship',
          text: `🏆 ${player.name} landed on Championship, but owns no properties yet to host!`,
          isSystem: true
        });
        this.finishMove(player, isDoubles);
      }
      this.emitChange();
    } else if (tile.type === 'chance') {
      const card = getRandomEventCard();
      this.applyEventCard(player, card, isDoubles);
    } else if (tile.type === 'resort') {
      const prop = this.properties[tileId];
      if (!prop.ownerId) {
        // Unowned: prompt purchase
        if (player.cash >= tile.price) {
          this.turnState = 'action';
          this.startTurnTimer();
        } else {
          this.finishMove(player, isDoubles);
        }
        this.emitChange();
      } else if (prop.ownerId === player.id) {
        // Own resort: pass / no action
        this.finishMove(player, isDoubles);
      } else {
        // Opponent's resort: calculate rent
        const owner = this.players.find(p => p.id === prop.ownerId);

        // Count how many resorts owner owns in RESORT_TILES: k in [1..4]
        const ownedResortsCount = RESORT_TILES.filter(tId => this.properties[tId]?.ownerId === owner?.id).length;
        const k = Math.max(1, ownedResortsCount);
        let rent = tile.baseRent * Math.pow(2, k - 1);

        // If festival active on resort, 2x rent
        if (prop.festival) rent *= 2;

        // Check Global Blackout
        if (this.blackoutRounds > 0) {
          this.addChatMessage({ sender: 'Blackout', text: `⚡ GLOBAL BLACKOUT! Rent at ${tile.name} is 0 Space Credits!`, isSystem: true });
          this.finishMove(player, isDoubles);
          return;
        }

        // Check Toll Shield
        if (player.shieldActive) {
          player.shieldActive = false;
          this.addChatMessage({ sender: 'Shield', text: `🛡️ TOLL SHIELD ACTIVATED! ${player.name} blocked 100% of rent (${rent.toLocaleString()} Space Credits) at ${tile.name}!`, isSystem: true });
          this.finishMove(player, isDoubles);
          return;
        }

        // Check owner rent surge
        if (owner?.rentSurgeTurns > 0) {
          rent *= 2;
        }

        if (player.cash >= rent) {
          player.cash -= rent;
          if (owner) owner.cash += rent;
          this.emitPaymentEvent({
            payerId: player.id,
            receiverId: owner?.id || null,
            amount: rent,
            type: 'resort_rent',
            tileId,
          });
          this.addChatMessage({
            sender: 'System',
            text: `🏖️ ${player.name} paid ${rent.toLocaleString()} Space Credits resort rent (${k} resort${k > 1 ? 's' : ''} owned) to ${owner?.name || 'Bank'} at ${tile.name}!`,
            isSystem: true
          });

          // Can buyout if player has 2x cash
          const buyoutCost = tile.price * 2;
          if (player.cash >= buyoutCost) {
            this.turnState = 'action';
            this.startTurnTimer();
          } else {
            this.finishMove(player, isDoubles);
          }
        } else {
          // Debt liquidation state
          this.turnState = 'debt';
          this.startTurnTimer();
          this.pendingDebt = { debtorId: player.id, creditorId: owner?.id, amount: rent };
          this.addChatMessage({
            sender: 'System',
            text: `⚠️ ${player.name} owes ${rent.toLocaleString()} Space Credits to ${owner?.name || 'Bank'} and must liquidate properties or face bankruptcy!`,
            isSystem: true
          });
        }
        this.emitChange();
      }
    } else if (tile.type === 'city') {
      const prop = this.properties[tileId];
      if (!prop.ownerId) {
        // Unowned: prompt purchase
        this.turnState = 'action';
        this.startTurnTimer();
        this.emitChange();
      } else if (prop.ownerId === player.id) {
        // Own city: can upgrade if not landmark
        if (!prop.isLandmark && player.cash >= tile.housePrice) {
          this.turnState = 'action';
          this.startTurnTimer();
        } else {
          this.finishMove(player, isDoubles);
        }
        this.emitChange();
      } else {
        // Opponent's city: calculate rent
        const owner = this.players.find(p => p.id === prop.ownerId);
        let rent = tile.rent[Math.min(prop.level - 1, 4)] || tile.rent[0];
        if (prop.level >= 6) rent = Math.round(rent * 1.5);

        // Check color monopoly (2x rent)
        let monopolyBonus = false;
        const groupTiles = COLOR_GROUPS[tile.colorGroup];
        const hasFullGroup = groupTiles && groupTiles.length > 0 && groupTiles.every(tId => this.properties[tId]?.ownerId === owner.id);
        if (hasFullGroup) {
          rent *= 2;
          monopolyBonus = true;
        }

        // Check festival (2x rent)
        if (prop.festival) rent *= 2;

        // Check Global Blackout
        if (this.blackoutRounds > 0) {
          this.addChatMessage({ sender: 'Blackout', text: `⚡ GLOBAL BLACKOUT! Rent in ${tile.name} is $0!`, isSystem: true });
          this.finishMove(player, isDoubles);
          return;
        }

        // Check Toll Shield
        if (player.shieldActive) {
          player.shieldActive = false;
          this.addChatMessage({ sender: 'Shield', text: `🛡️ TOLL SHIELD ACTIVATED! ${player.name} blocked 100% of rent (${rent.toLocaleString()} Space Credits) in ${tile.name}!`, isSystem: true });
          this.finishMove(player, isDoubles);
          return;
        }

        // Check owner rent surge
        if (owner.rentSurgeTurns > 0) {
          rent *= 2;
        }

        if (player.cash >= rent) {
          player.cash -= rent;
          owner.cash += rent;
          this.emitPaymentEvent({
            payerId: player.id,
            receiverId: owner.id,
            amount: rent,
            type: 'rent',
            tileId,
          });
          const monopolyTag = monopolyBonus ? ` [2X ${getMonopolyTitle(tile.colorGroup).toUpperCase()}!]` : '';
          this.addChatMessage({ sender: 'System', text: `🏨 ${player.name} paid ${rent.toLocaleString()} Space Credits rent to ${owner.name} in ${tile.name}${monopolyTag}!`, isSystem: true });

          // Can buyout if not Landmark and has 2x cash
          const buyoutCost = (tile.price + (prop.level - 1) * tile.housePrice) * 2;
          if (!prop.isLandmark && player.cash >= buyoutCost) {
            this.turnState = 'action';
            this.startTurnTimer();
          } else {
            this.finishMove(player, isDoubles);
          }
        } else {
          // Debt liquidation state
          this.turnState = 'debt';
          this.startTurnTimer();
          this.pendingDebt = { debtorId: player.id, creditorId: owner.id, amount: rent };
          this.addChatMessage({ sender: 'System', text: `⚠️ ${player.name} owes ${rent.toLocaleString()} Space Credits to ${owner.name} and must liquidate properties or face bankruptcy!`, isSystem: true });
        }
        this.emitChange();
      }
    }
  }

  applyEventCard(player, card, isDoubles) {
    this.activeEventCard = {
      card,
      drawerId: player.id,
      drawerName: player.name,
      isDoubles: Boolean(isDoubles),
      timestamp: Date.now(),
    };
    this.addChatMessage({
      sender: 'Event',
      text: `🃏 [${card.badge}] ${player.name} drew "${card.title}"! ${card.description}`,
      isSystem: true
    });

    switch (card.id) {
      case 'bull_market':
        this.players.forEach(p => {
          if (!p.isBankrupt) p.cash += 250000;
        });
        break;

      case 'bear_market': {
        const sorted = [...this.players].filter(p => !p.isBankrupt).sort((a, b) => b.cash - a.cash);
        if (sorted[0]) sorted[0].cash = Math.max(0, sorted[0].cash - 250000);
        sorted.slice(1).forEach(p => { p.cash = Math.max(0, p.cash - 75000); });
        break;
      }

      case 'typhoon_strike': {
        let bestTileId = null;
        let highestLvl = 0;
        Object.keys(this.properties).forEach(tId => {
          const prop = this.properties[tId];
          if (prop.ownerId && prop.level > highestLvl) {
            highestLvl = prop.level;
            bestTileId = tId;
          }
        });
        if (bestTileId && highestLvl > 1) {
          const targetProp = this.properties[bestTileId];
          const owner = this.players.find(p => p.id === targetProp.ownerId);
          targetProp.level = Math.max(1, targetProp.level - 1);
          targetProp.isLandmark = false;
          targetProp.festival = false;
          if (owner) owner.cash += 100000;
          this.addChatMessage({ sender: 'Typhoon', text: `🌪️ Typhoon struck ${TILES[bestTileId].name}! City was downgraded to Tier ${targetProp.level}. Insurance compensation paid 100,000 Space Credits!`, isSystem: true });
        } else {
          this.addChatMessage({ sender: 'Typhoon', text: `🌪️ Coastal Typhoon passed harmlessly over open waters without damaging any buildings.`, isSystem: true });
        }
        break;
      }

      case 'guardian_angel': {
        if (!player.cards) player.cards = [];
        if (player.cards.length < 3) {
          const shieldCard = ACTION_CARDS.find(c => c.id === 'toll_shield');
          if (shieldCard) player.cards.push(shieldCard);
          this.addChatMessage({ sender: 'Angel', text: `🛡️ Guardian Angel placed a Toll Shield into ${player.name}'s hand!`, isSystem: true });
        } else {
          player.shieldActive = true;
          this.addChatMessage({ sender: 'Angel', text: `🛡️ Hand full! Guardian Angel activated Toll Shield directly on ${player.name}!`, isSystem: true });
        }
        break;
      }

      case 'warp_speed':
        player.position = 16; // Airport (Tile 16)
        player.cash += 200000;
        this.addChatMessage({ sender: 'Warp', text: `🚀 Suborbital Rocket launched ${player.name} directly to Airport (+200,000 Space Credits)!`, isSystem: true });
        break;

      case 'robin_hood': {
        const nonBankrupt = this.players.filter(p => !p.isBankrupt);
        if (nonBankrupt.length >= 2) {
          const richest = [...nonBankrupt].sort((a, b) => b.cash - a.cash)[0];
          const poorest = [...nonBankrupt].sort((a, b) => a.cash - b.cash)[0];
          if (richest && poorest && richest.id !== poorest.id) {
            const transfer = Math.min(150000, richest.cash);
            richest.cash -= transfer;
            poorest.cash += transfer;
            this.addChatMessage({ sender: 'RobinHood', text: `🏹 Robbed ${transfer.toLocaleString()} Space Credits from ${richest.name} and transferred to ${poorest.name}!`, isSystem: true });
          }
        }
        break;
      }

      case 'seed_round':
        player.cash += 300000;
        if (!player.cards) player.cards = [];
        if (player.cards.length < 3) {
          const newCard = getRandomActionCard();
          player.cards.push(newCard);
          this.addChatMessage({ sender: 'SeedRound', text: `💎 Seed Round granted ${player.name} +300,000 CR and [${newCard.title}] Action Card!`, isSystem: true });
        } else {
          player.cash += 150000;
          this.addChatMessage({ sender: 'SeedRound', text: `💎 Seed Round granted ${player.name} +450,000 Space Credits (Hand full bonus)!`, isSystem: true });
        }
        break;

      case 'grand_carnival': {
        const owned = Object.keys(this.properties).filter(id => this.properties[id].ownerId === player.id);
        if (owned.length > 0) {
          const targetId = owned[Math.floor(Math.random() * owned.length)];
          this.properties[targetId].festival = true;
          this.addChatMessage({ sender: 'Carnival', text: `🎪 Carnival opened in ${TILES[targetId].name}! 2X Rent active!`, isSystem: true });
        } else {
          player.cash += 200000;
          this.addChatMessage({ sender: 'Carnival', text: `🎪 No cities owned yet! ${player.name} received 200,000 Space Credits Carnival sponsorship instead!`, isSystem: true });
        }
        break;
      }

      case 'armory_supply':
        player.freeTomatoes = (player.freeTomatoes || 0) + 4;
        this.addChatMessage({ sender: 'Armory', text: `🍅 Crate of 4 Combat Tomatoes delivered to ${player.name}!`, isSystem: true });
        break;

      case 'cruise_break': {
        const trapped = this.players.filter(p => p.islandTurns > 0);
        if (trapped.length > 0) {
          trapped.forEach(p => { p.islandTurns = 0; });
          this.addChatMessage({ sender: 'Rescue', text: `🛳️ Cruise ship rescued all players from Resort Island!`, isSystem: true });
        } else {
          player.cash += 150000;
          this.addChatMessage({ sender: 'Rescue', text: `🛳️ No one trapped! ${player.name} collected 150,000 Space Credits luxury cruise dividend!`, isSystem: true });
        }
        break;
      }

      case 'power_outage':
        this.blackoutRounds = 1;
        this.addChatMessage({ sender: 'Blackout', text: `⚡ GLOBAL BLACKOUT! Power outage disables municipal rent across the entire board for 1 round!`, isSystem: true });
        break;

      case 'landmark_grant': {
        const owned = Object.keys(this.properties).filter(id => this.properties[id].ownerId === player.id && !this.properties[id].isLandmark);
        if (owned.length > 0) {
          owned.sort((a, b) => this.properties[b].level - this.properties[a].level);
          const topId = owned[0];
          this.properties[topId].level = 5;
          this.properties[topId].isLandmark = true;
          this.addChatMessage({ sender: 'Grant', text: `🏛️ Heritage Grant upgraded ${TILES[topId].name} directly into a Landmark!`, isSystem: true });
        } else {
          player.cash += 250000;
          this.addChatMessage({ sender: 'Grant', text: `🏛️ Heritage Development Grant paid ${player.name} 250,000 Space Credits cash!`, isSystem: true });
        }
        break;
      }

      case 'interpol_raid':
        player.position = 8; // Resort Island (Tile 8)
        player.islandTurns = 3;
        player.cash = Math.max(0, player.cash - 100000);
        this.addChatMessage({ sender: 'Interpol', text: `🚨 Offshore Audit fined ${player.name} 100,000 Space Credits and escorted them off the board to Prison!`, isSystem: true });
        break;

      case 'tax_dividend':
        player.cash += 175000;
        this.addChatMessage({ sender: 'TaxDividend', text: `🪐 Galactic Treasury refund paid 175,000 Space Credits to ${player.name}!`, isSystem: true });
        break;

      case 'championship_invite':
        player.position = 12; // World Fair (Tile 12)
        this.addChatMessage({ sender: 'Invite', text: `🏟️ VIP Invitation granted! ${player.name} advanced to World Fair (Tile 12)!`, isSystem: true });
        break;

      case 'sticky_fingers_event': {
        const rivals = this.players.filter(p => p.id !== player.id && !p.isBankrupt && p.cards?.length > 0);
        if (rivals.length > 0) {
          rivals.sort((a, b) => b.cards.length - a.cards.length);
          const victim = rivals[0];
          const stolenIndex = Math.floor(Math.random() * victim.cards.length);
          const [stolenCard] = victim.cards.splice(stolenIndex, 1);
          if (!player.cards) player.cards = [];
          player.cards.push(stolenCard);

          this.addChatMessage({
            sender: 'Heist',
            text: `🤏 [PICKPOCKET] ${player.name} yoinked [${stolenCard.title}] from ${victim.name}!`,
            isSystem: true
          });

          this.callbacks.onCardYoink({
            thiefId: player.id,
            thiefName: player.name,
            victimId: victim.id,
            victimName: victim.name,
            stolenCard,
            timestamp: Date.now(),
          });
        } else {
          const bonusCard = getRandomActionCard();
          if (!player.cards) player.cards = [];
          player.cards.push(bonusCard);
          this.addChatMessage({
            sender: 'Heist',
            text: `🤏 No rivals had cards! Pickpocket gifted ${player.name} a fresh [${bonusCard.title}] instead!`,
            isSystem: true
          });
        }
        break;
      }

      case 'nebula_jackpot': {
        const halfPot = Math.max(150000, Math.floor((this.communityJackpot || 100000) * 0.5));
        this.communityJackpot = Math.max(50000, (this.communityJackpot || 100000) - halfPot);
        const totalWon = halfPot + 250000;
        player.cash += totalWon;
        this.emitPaymentEvent({ payerId: null, receiverId: player.id, amount: totalWon, type: 'salary' });
        this.addChatMessage({
          sender: 'Lottery',
          text: `🎰 NEBULA POWERBALL! ${player.name} won ${totalWon.toLocaleString()} Space Credits (50% Pot + Bonus)!`,
          isSystem: true
        });
        break;
      }

      case 'ransomware_hack': {
        const sorted = [...this.players].filter(p => !p.isBankrupt).sort((a, b) => b.cash - a.cash);
        const richest = sorted[0];
        if (richest) {
          const ransom = Math.min(200000, richest.cash);
          richest.cash -= ransom;
          this.communityJackpot = (this.communityJackpot || 100000) + ransom;
          this.emitPaymentEvent({ payerId: richest.id, receiverId: null, amount: ransom, type: 'tax' });
          this.addChatMessage({
            sender: 'Cyber',
            text: `👾 [RANSOMWARE] Hackers extorted ${ransom.toLocaleString()} Space Credits from ${richest.name} into the Community Pot!`,
            isSystem: true
          });
        }
        break;
      }

      case 'zero_g_bounce': {
        const newPos = (player.position + 4) % TILES.length;
        if (newPos < player.position) {
          player.cash += 200000;
          this.emitPaymentEvent({ payerId: null, receiverId: player.id, amount: 200000, type: 'salary' });
        }
        player.position = newPos;
        player.cash += 100000;
        this.addChatMessage({
          sender: 'ZeroG',
          text: `🛰️ [ZERO-G BOUNCE] ${player.name} bounced forward 4 tiles to ${TILES[newPos].name} (+100k CR)!`,
          isSystem: true
        });
        break;
      }

      case 'orbital_bounty': {
        const bounty = 350000;
        player.cash += bounty;
        this.emitPaymentEvent({ payerId: null, receiverId: player.id, amount: bounty, type: 'salary' });
        this.addChatMessage({
          sender: 'Bounty',
          text: `🎯 [INTERSTELLAR BOUNTY] ${player.name} collected ${bounty.toLocaleString()} Space Credits headhunter reward!`,
          isSystem: true
        });
        break;
      }

      case 'supernova_stimulus': {
        const grant = 200000;
        this.players.forEach(p => {
          if (!p.isBankrupt && (p.cash < 2000000 || p.netWorth < 2000000)) {
            p.cash += grant;
            this.emitPaymentEvent({ payerId: null, receiverId: p.id, amount: grant, type: 'salary' });
          }
        });
        this.addChatMessage({
          sender: 'Stimulus',
          text: `🌟 [SUPERNOVA STIMULUS] Galactic relief bill paid ${grant.toLocaleString()} Space Credits to underdog tycoons!`,
          isSystem: true
        });
        break;
      }

      default:
        player.cash += 150000;
        break;
    }

    this.updateNetWorths();
    this.emitChange();

    // Auto-dismiss event card popup (ensures players get at least 7-8s to read lore and effect)
    if (this.eventCardDismissTimeout) clearTimeout(this.eventCardDismissTimeout);
    const autoDismissDelay = 10000;
    this.eventCardDismissTimeout = setTimeout(() => {
      if (this.activeEventCard && this.activeEventCard.card.id === card.id) {
        this.activeEventCard = null;
        this.finishMove(player, isDoubles);
      }
    }, autoDismissDelay);
  }

  dismissEventCard(playerId) {
    if (!this.activeEventCard) return;
    if (this.eventCardDismissTimeout) {
      clearTimeout(this.eventCardDismissTimeout);
      this.eventCardDismissTimeout = null;
    }
    const isBotDrawer = this.players.find(p => p.id === this.activeEventCard.drawerId)?.isBot;
    if (this.activeEventCard.drawerId === playerId || !playerId || isBotDrawer) {
      const current = this.getCurrentPlayer();
      const isDoubles = Boolean(this.activeEventCard.isDoubles);
      this.activeEventCard = null;
      if (current) {
        this.finishMove(current, isDoubles);
      }
      this.emitChange();
    }
  }

  playActionCard(playerId, cardId, targetPayload = {}) {
    const player = this.players.find(p => p.id === playerId);
    if (!player || player.isBankrupt || !player.cards) return false;

    // Action cards can ONLY be played on the player's own turn
    const current = this.getCurrentPlayer();
    if (!current || current.id !== playerId) {
      return false;
    }

    const cardIndex = player.cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) return false;

    const card = player.cards[cardIndex];
    let success = false;

    switch (cardId) {
      case 'toll_shield':
        player.shieldActive = true;
        this.addChatMessage({ sender: 'Card', text: `🛡️ ${player.name} deployed [TOLL SHIELD]! Next rent landing is 100% blocked ($0).`, isSystem: true });
        success = true;
        break;

      case 'loaded_dice': {
        const val = Math.min(12, Math.max(2, parseInt(targetPayload.value) || 7));
        player.loadedRoll = val;
        this.addChatMessage({ sender: 'Card', text: `🎲 ${player.name} activated [LOADED DICE] set to ${val}!`, isSystem: true });
        success = true;
        break;
      }

      case 'demolition_strike': {
        const tileId = targetPayload.tileId;
        const prop = this.properties[tileId];
        const tile = TILES[tileId];
        if (prop && prop.ownerId && prop.ownerId !== playerId && tile?.type === 'city') {
          const owner = this.players.find(p => p.id === prop.ownerId);
          if (prop.festival) {
            prop.festival = false;
            this.addChatMessage({ sender: 'Card', text: `🌪️ [DEMOLITION] destroyed ${owner?.name}'s Festival in ${tile.name}!`, isSystem: true });
          } else {
            prop.level = Math.max(1, prop.level - 1);
            prop.isLandmark = false;
            this.addChatMessage({ sender: 'Card', text: `🌪️ [DEMOLITION] reduced ${owner?.name}'s ${tile.name} to Tier ${prop.level}!`, isSystem: true });
          }
          success = true;
        }
        break;
      }

      case 'remote_buy': {
        const tileId = targetPayload.tileId;
        const prop = this.properties[tileId];
        const tile = TILES[tileId];
        if (prop && !prop.ownerId && tile?.type === 'city' && player.cash >= tile.price) {
          player.cash -= tile.price;
          prop.ownerId = player.id;
          prop.level = 1;
          this.addChatMessage({ sender: 'Card', text: `🎯 [VENTURE BUYOUT] ${player.name} remotely acquired ${tile.name} for ${tile.price} Space Credits!`, isSystem: true });
          success = true;
        }
        break;
      }

      case 'golden_toll':
        player.rentSurgeTurns = 2;
        this.addChatMessage({ sender: 'Card', text: `💰 [GOLD RUSH SURGE] Rent on all ${player.name}'s properties doubled (2X) for the next 2 turns!`, isSystem: true });
        success = true;
        break;

      case 'gravity_magnet': {
        const targetPlayer = this.players.find(p => p.id === targetPayload.targetPlayerId);
        if (targetPlayer && targetPlayer.id !== playerId && !targetPlayer.isBankrupt) {
          targetPlayer.lastMovementType = 'magnetic_pull';
          targetPlayer.position = player.position;
          this.addChatMessage({ sender: 'Card', text: `🧲 [MAGNETIC SIREN] ${player.name} magnetically pulled ${targetPlayer.name} directly onto their tile!`, isSystem: true });

          // Direct municipal / resort rent transfer if pulled onto an opponent's owned property
          const tileId = player.position;
          const prop = this.properties[tileId];
          const tile = TILES[tileId];

          if (prop?.ownerId && prop.ownerId !== targetPlayer.id) {
            const owner = this.players.find(p => p.id === prop.ownerId);
            let rent = 0;
            let rentType = 'rent';

            if (tile?.type === 'resort') {
              rentType = 'resort_rent';
              const RESORT_IDS = [6, 12, 20, 28];
              const k = RESORT_IDS.filter(id => this.properties[id]?.ownerId === owner?.id).length;
              rent = (tile.baseRent || 50000) * Math.pow(2, Math.max(0, k - 1));
              if (prop.festival) rent *= 2;
              if (owner?.rentSurgeTurns > 0) rent *= 2;
            } else if (tile?.type === 'city') {
              rentType = 'rent';
              rent = tile.rent ? (tile.rent[Math.min(prop.level - 1, 4)] || tile.rent[0]) : (tile.baseRent || 50000);
              if (prop.level >= 6) rent = Math.round(rent * 1.5);
              const groupTiles = COLOR_GROUPS[tile.colorGroup] || [];
              const hasFullGroup = groupTiles.length > 0 && groupTiles.every(tId => this.properties[tId]?.ownerId === owner?.id);
              if (hasFullGroup) rent *= 2;
              if (prop.festival) rent *= 2;
              if (this.blackoutRounds > 0) rent = 0;
              if (owner?.rentSurgeTurns > 0) rent *= 2;
            }

            if (this.blackoutRounds > 0 && tile?.type === 'city') {
              this.addChatMessage({ sender: 'Blackout', text: `⚡ GLOBAL BLACKOUT! Rent in ${tile.name} is $0!`, isSystem: true });
            } else if (targetPlayer.shieldActive && rent > 0) {
              targetPlayer.shieldActive = false;
              this.addChatMessage({ sender: 'Shield', text: `🛡️ TOLL SHIELD ACTIVATED! ${targetPlayer.name} blocked 100% of rent (${rent.toLocaleString()} Space Credits) in ${tile.name}!`, isSystem: true });
            } else if (rent > 0) {
              const paymentAmount = Math.min(rent, targetPlayer.cash);
              targetPlayer.cash -= paymentAmount;
              if (owner) owner.cash += paymentAmount;

              this.emitPaymentEvent({
                id: `pay_magnet_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                payerId: targetPlayer.id,
                receiverId: owner?.id || null,
                amount: paymentAmount,
                type: rentType,
                tileId,
              });

              this.addChatMessage({
                sender: 'System',
                text: `🏠 ${targetPlayer.name} paid ${paymentAmount.toLocaleString()} Space Credits rent to ${owner?.name || 'Bank'} at ${tile.name}!`,
                isSystem: true
              });
            }
          }
          this.updateNetWorths();
          success = true;
        }
        break;
      }

      case 'mega_tomato': {
        const targetPlayer = this.players.find(p => p.id === targetPayload.targetPlayerId);
        if (targetPlayer && targetPlayer.id !== playerId) {
          targetPlayer.disadvantaged = true;
          this.addChatMessage({ sender: 'Card', text: `🍅 [TOMATO BLITZ] ${player.name} bombarded ${targetPlayer.name}! Disadvantaged on next turn (1 die only).`, isSystem: true });
          this.callbacks.onTomatoHit({ fromId: playerId, targetId: targetPlayer.id, amount: 3 });
          success = true;
        }
        break;
      }

      case 'warp_drive': {
        const cornerTile = [0, 8, 16, 24].includes(targetPayload.tileId) ? targetPayload.tileId : 0;
        player.position = cornerTile;
        if (cornerTile === 0) player.cash += 250000;
        if (cornerTile === 8) player.islandTurns = 3;
        this.addChatMessage({ sender: 'Card', text: `🚀 [QUANTUM PORTAL] ${player.name} warped across dimensions to ${TILES[cornerTile].name}!`, isSystem: true });
        success = true;
        break;
      }

      case 'prison_break':
        if (player.islandTurns > 0) {
          player.islandTurns = 0;
          this.addChatMessage({ sender: 'Card', text: `🗝️ [MASTER KEYCARD] ${player.name} unlocked the resort gates and walked free!`, isSystem: true });
          success = true;
        }
        break;

      case 'vip_escape_pass':
        if (player.islandTurns > 0) {
          player.islandTurns = 0;
          this.addChatMessage({ sender: 'Card', text: `🎟️ ${player.name} redeemed an Island VIP Pass to leave Prison immediately!`, isSystem: true });
          success = true;
        } else {
          this.addChatMessage({ sender: 'Card', text: `⚠️ ${player.name} tried to redeem Island VIP Pass, but is not on Resort Island!`, isSystem: true });
          return false;
        }
        break;

      case 'card_yoink': {
        const targetPlayer = this.players.find(p => p.id === targetPayload.targetPlayerId);
        if (targetPlayer && targetPlayer.id !== playerId && !targetPlayer.isBankrupt && targetPlayer.cards?.length > 0) {
          const stolenIndex = Math.floor(Math.random() * targetPlayer.cards.length);
          const [stolenCard] = targetPlayer.cards.splice(stolenIndex, 1);
          if (!player.cards) player.cards = [];
          player.cards.push(stolenCard);

          this.addChatMessage({
            sender: 'Card',
            text: `🤏 [STICKY FINGERS] ${player.name} snatched [${stolenCard.title}] right out of ${targetPlayer.name}'s hand!`,
            isSystem: true
          });

          this.callbacks.onCardYoink({
            thiefId: playerId,
            thiefName: player.name,
            victimId: targetPlayer.id,
            victimName: targetPlayer.name,
            stolenCard,
            timestamp: Date.now(),
          });
          success = true;
        } else {
          this.addChatMessage({
            sender: 'Card',
            text: `⚠️ ${player.name} attempted to yoink a card, but the target had no cards to steal!`,
            isSystem: true
          });
          return false;
        }
        break;
      }

      case 'emergency_credit':
        player.cash += 300000;
        this.addChatMessage({ sender: 'Card', text: `🪐 [EMERGENCY CREDIT] ${player.name} claimed 300,000 Space Credits emergency central bank funding!`, isSystem: true });
        success = true;
        break;
    }

    if (success) {
      player.cards.splice(cardIndex, 1);
      this.lastActionCardPlayed = {
        playerId,
        playerName: player.name,
        card,
        targetPayload,
        timestamp: Date.now(),
      };
      this.callbacks.onActionCardPlayed(this.lastActionCardPlayed);
      this.updateNetWorths();
      this.emitChange();
      return true;
    }
    return false;
  }

  finishMove(player, isDoubles) {
    const tile = TILES[player.position];
    const prop = this.properties[player.position];

    const canBuy = !prop?.ownerId && player.cash >= tile?.price;
    const canUpgrade = tile?.type === 'city' && prop?.ownerId === player.id && !prop?.isLandmark && player.cash >= tile?.housePrice;
    const buyoutCost = tile?.type === 'resort'
      ? ((tile?.price || 0) * 2)
      : (((tile?.price || 0) + ((prop?.level || 1) - 1) * (tile?.housePrice || 0)) * 2);
    const canBuyout = prop?.ownerId && prop?.ownerId !== player.id && !prop?.isLandmark && player.cash >= buyoutCost;
    const isActionable = (tile?.type === 'city' || tile?.type === 'resort') && (canBuy || canUpgrade || canBuyout);

    if (isActionable) {
      this.turnState = 'action';
      this.startTurnTimer();
      this.emitChange();
      if (player.isBot && this.status === 'playing') {
        setTimeout(() => this.triggerBotTurn(), 800);
      }
    } else {
      // Non-actionable tile:
      // If landing on an unowned property that the player cannot afford to buy:
      if ((tile?.type === 'city' || tile?.type === 'resort') && !prop?.ownerId) {
        this.startAuction(player.position);
      } else {
        this.completeTurnAction(player.id);
      }
    }
  }

  completeTurnAction(playerId) {
    const current = this.getCurrentPlayer();

    // Check if player passed/declined on an unowned property during 'action' state
    if (current && this.turnState === 'action') {
      const tileId = current.position;
      const tile = TILES[tileId];
      const prop = this.properties[tileId];
      if ((tile?.type === 'city' || tile?.type === 'resort') && !prop?.ownerId) {
        this.startAuction(tileId);
        return;
      }
    }

    if (this.rolledDoublesThisTurn && this.doublesCount > 0 && this.doublesCount < 3 && current?.islandTurns === 0) {
      this.rolledDoublesThisTurn = false;
      this.turnState = 'roll';
      this.startTurnTimer();
      this.addChatMessage({ sender: 'System', text: `✨ DOUBLES! ${current.name} rolls again!`, isSystem: true });
      this.emitChange();
      if (current?.isBot && this.status === 'playing') {
        setTimeout(() => this.triggerBotTurn(), 2000);
      }
    } else {
      // Deliberate pacing pause between turns so players can see the action results before switching
      setTimeout(() => {
        if (this.status === 'playing') {
          this.endTurn(playerId);
        }
      }, 1400);
    }
  }

  startAuction(tileId) {
    const tile = TILES[tileId];
    const prop = this.properties[tileId];
    if (!tile || !prop || prop.ownerId) {
      this.completeTurnAction(this.getCurrentPlayer()?.id);
      return false;
    }

    this.stopTurnTimer();
    this.turnState = 'auction';
    const startBid = Math.floor(tile.price * 0.5);
    this.auction = {
      tileId,
      currentBid: startBid,
      highestBidderId: null,
      highestBidderName: null,
      timeLeft: 10,
      expiresAt: Date.now() + 10000,
      active: true,
    };

    this.addChatMessage({
      sender: 'Auction',
      text: `⚡ LIGHTNING AUCTION! ${tile.name} is on the block! Starting bid: ${startBid.toLocaleString()} Space Credits! 10s on the clock!`,
      isSystem: true,
    });
    this.callbacks.onAuctionStart?.(this.auction);
    this.emitChange();

    if (this.auctionTimer) {
      clearInterval(this.auctionTimer);
      this.auctionTimer = null;
    }

    this.auctionTimer = setInterval(() => {
      if (!this.auction || !this.auction.active) {
        if (this.auctionTimer) clearInterval(this.auctionTimer);
        this.auctionTimer = null;
        return;
      }

      this.auction.timeLeft -= 1;

      // Bot AI bidding: Bots bid if currentBid < tile.price * 0.85 and bot cash > 400k
      this.checkBotAuctionBids();

      this.emitChange();

      if (this.auction.timeLeft <= 0) {
        if (this.auctionTimer) clearInterval(this.auctionTimer);
        this.auctionTimer = null;
        this.endAuction();
      }
    }, 1000);

    return true;
  }

  placeBid(playerId, amount) {
    if (!this.auction || !this.auction.active) return false;
    const player = this.players.find(p => p.id === playerId);
    if (!player || player.isBankrupt) return false;

    // Minimum required: if highestBidder already placed a bid, must strictly exceed currentBid.
    // If opening bid, must be >= currentBid (50% starting price).
    const isOpeningBid = !this.auction.highestBidderId;
    if (isOpeningBid ? amount < this.auction.currentBid : amount <= this.auction.currentBid) {
      return false;
    }
    if (player.cash < amount) return false;

    this.auction.currentBid = amount;
    this.auction.highestBidderId = playerId;
    this.auction.highestBidderName = player.name;

    // Anti-snipe: If timeLeft < 3, reset timeLeft = 3
    if (this.auction.timeLeft < 3) {
      this.auction.timeLeft = 3;
      this.addChatMessage({
        sender: 'Auction',
        text: `⏱️ ANTI-SNIPE! ${player.name} bid ${amount.toLocaleString()} CR! Clock extended to 3s!`,
        isSystem: true,
      });
    } else {
      this.addChatMessage({
        sender: 'Auction',
        text: `🔨 ${player.name} raised the bid to ${amount.toLocaleString()} Space Credits!`,
        isSystem: true,
      });
    }

    this.callbacks.onAuctionUpdate?.(this.auction);
    this.emitChange();
    return true;
  }

  checkBotAuctionBids() {
    if (!this.auction || !this.auction.active) return;
    const tile = TILES[this.auction.tileId];
    if (!tile) return;

    const maxBotBid = Math.floor(tile.price * 0.85);
    if (this.auction.currentBid >= maxBotBid) return;

    // Bots bid if currentBid < tile.price * 0.85 and bot cash > 400k
    const eligibleBots = this.players.filter(p =>
      p.isBot && !p.isBankrupt && p.cash > 400000 && p.id !== this.auction.highestBidderId
    );
    if (eligibleBots.length === 0) return;

    const bot = eligibleBots[Math.floor(Math.random() * eligibleBots.length)];
    const bidStep = 10000;
    const newBid = Math.min(this.auction.currentBid + bidStep, maxBotBid);
    if (newBid > this.auction.currentBid && bot.cash >= newBid) {
      this.placeBid(bot.id, newBid);
    }
  }

  endAuction() {
    if (!this.auction) return;
    if (this.auctionTimer) {
      clearInterval(this.auctionTimer);
      this.auctionTimer = null;
    }

    const { tileId, currentBid, highestBidderId } = this.auction;
    const tile = TILES[tileId];
    const prop = this.properties[tileId];
    const winner = highestBidderId ? this.players.find(p => p.id === highestBidderId) : null;

    if (winner && winner.cash >= currentBid) {
      winner.cash -= currentBid;
      prop.ownerId = winner.id;
      prop.level = 1;
      prop.isLandmark = false;
      this.addChatMessage({
        sender: 'Auction',
        text: `🔨 SOLD! ${winner.name} won the auction for ${tile.name} for ${currentBid.toLocaleString()} CR!`,
        isSystem: true,
      });
      this.checkWinConditions();
    } else {
      this.addChatMessage({
        sender: 'Auction',
        text: `🔨 Passed! No bids placed for ${tile.name}.`,
        isSystem: true,
      });
    }

    const completedAuction = { ...this.auction, active: false };
    this.auction = null;
    this.turnState = 'roll';
    this.callbacks.onAuctionEnd?.(completedAuction);

    const current = this.getCurrentPlayer();
    if (this.rolledDoublesThisTurn && this.doublesCount > 0 && this.doublesCount < 3 && current?.islandTurns === 0) {
      this.rolledDoublesThisTurn = false;
      this.turnState = 'roll';
      this.startTurnTimer();
      this.addChatMessage({ sender: 'System', text: `✨ DOUBLES! ${current.name} rolls again!`, isSystem: true });
      this.emitChange();
      if (current?.isBot && this.status === 'playing') {
        setTimeout(() => this.triggerBotTurn(), 1000);
      }
    } else {
      this.endTurn(current?.id);
    }
  }

  buyCity(playerId, tileId, level = 1) {
    const player = this.players.find(p => p.id === playerId);
    const tile = TILES[tileId];
    const prop = this.properties[tileId];

    if (!player || !tile || (tile.type !== 'city' && tile.type !== 'resort') || prop.ownerId) return false;

    // Enforce Orbit and Hotel progression constraints:
    // On orbit 1 (laps < 1), maximum allowed initial build level is 3 (2 Houses).
    // On orbit 2+ (laps >= 1), maximum allowed initial build level is 4 (3 Houses).
    // Hotel (level 5) cannot be built on initial purchase - must build 3 houses first!
    if (tile.type === 'city') {
      const maxInitialLevel = (player.laps || 0) >= 1 ? 4 : 3;
      if (level > maxInitialLevel) {
        level = maxInitialLevel;
      }
      if (level < 1) level = 1;
    }

    // Calculate total cost for land + initial houses (resort has flat price)
    const cost = tile.type === 'resort' ? tile.price : (tile.price + (level - 1) * tile.housePrice);
    if (player.cash < cost) return false;

    player.cash -= cost;
    prop.ownerId = player.id;
    prop.level = tile.type === 'resort' ? 1 : level;
    prop.isLandmark = tile.type === 'resort' ? false : level >= 6;

    const levelDescriptions = {
      1: 'Plot',
      2: '1 House (Cottage)',
      3: '2 Houses (Duplex)',
      4: '3 Houses (Townhouses)',
    };

    this.addChatMessage({
      sender: 'System',
      text: tile.type === 'resort'
        ? `🏖️ ${player.name} acquired Resort ${tile.name} for ${cost.toLocaleString()} Space Credits!`
        : `🏗️ ${player.name} acquired ${tile.name} (${levelDescriptions[level] || `Lvl ${level}`}) for ${cost.toLocaleString()} Space Credits!`,
      isSystem: true
    });

    if (tile.type === 'city' && tile.colorGroup && COLOR_GROUPS[tile.colorGroup]) {
      const gTiles = COLOR_GROUPS[tile.colorGroup];
      const isCompleteMonopoly = gTiles.length > 0 && gTiles.every(tId => this.properties[tId]?.ownerId === player.id);
      if (isCompleteMonopoly) {
        this.addChatMessage({
          sender: 'System',
          text: `👑 MONOPOLY ACHIEVED! ${player.name} established the ${getMonopolyTitle(tile.colorGroup).toUpperCase()} (${tile.country || getDistrictName(tile.colorGroup)})! All rents in this district are now DOUBLED (2X)!`,
          isSystem: true
        });
      }
    }
    this.checkWinConditions();
    this.completeTurnAction(playerId);
    return true;
  }

  buyoutCity(playerId, tileId) {
    const buyer = this.players.find(p => p.id === playerId);
    const tile = TILES[tileId];
    const prop = this.properties[tileId];

    if (!buyer || !tile || !prop.ownerId || prop.isLandmark) return false;

    const currentOwner = this.players.find(p => p.id === prop.ownerId);
    const totalVal = tile.type === 'resort' ? tile.price : (tile.price + (prop.level - 1) * (tile.housePrice || 0));
    const buyoutCost = totalVal * 2;

    if (buyer.cash < buyoutCost) return false;

    buyer.cash -= buyoutCost;
    if (currentOwner) currentOwner.cash += buyoutCost;
    prop.ownerId = buyer.id;
    prop.festival = false; // Reset festival on takeover

    this.addChatMessage({
      sender: 'System',
      text: `⚡ BUYOUT! ${buyer.name} snatched ${tile.name} from ${currentOwner?.name || 'Owner'} for ${buyoutCost.toLocaleString()} Space Credits!`,
      isSystem: true
    });

    if (tile.type === 'city' && tile.colorGroup && COLOR_GROUPS[tile.colorGroup]) {
      const gTiles = COLOR_GROUPS[tile.colorGroup];
      const isCompleteMonopoly = gTiles.length > 0 && gTiles.every(tId => this.properties[tId]?.ownerId === buyer.id);
      if (isCompleteMonopoly) {
        this.addChatMessage({
          sender: 'System',
          text: `👑 MONOPOLY ACHIEVED! ${buyer.name} completed the ${getMonopolyTitle(tile.colorGroup).toUpperCase()} (${tile.country || getDistrictName(tile.colorGroup)}) via buyout! All rents are now DOUBLED (2X)!`,
          isSystem: true
        });
      }
    }

    this.checkWinConditions();
    this.completeTurnAction(playerId);
    return true;
  }

  upgradeCity(playerId, tileId, targetLevel = null) {
    const player = this.players.find(p => p.id === playerId);
    const tile = TILES[tileId];
    const prop = this.properties[tileId];

    if (!player || !tile || prop.ownerId !== playerId || prop.isLandmark) return false;

    // Determine target level
    let nextLevel = targetLevel ? Math.min(6, Math.max(prop.level + 1, targetLevel)) : (prop.level + 1);

    // Orbit 1 constraint: cannot build 3 houses (level 4) if laps < 1
    if (nextLevel >= 4 && (player.laps || 0) < 1) {
      return false; // locked until orbit 2
    }

    // Hotel constraint: hotel (level 5) can ONLY be built after 3 houses (level 4) have been built!
    if (nextLevel === 5 && prop.level < 4) {
      return false; // must have 3 houses first
    }

    // Landmark constraint: landmark (level 6) can ONLY be built after hotel (level 5)
    if (nextLevel === 6 && prop.level < 5) {
      return false; // must have hotel first
    }

    const levelDiff = nextLevel - prop.level;
    if (levelDiff <= 0) return false;
    const upgradeCost = levelDiff * tile.housePrice;
    if (player.cash < upgradeCost) return false;

    player.cash -= upgradeCost;
    prop.level = nextLevel;

    if (prop.level >= 6) {
      prop.level = 6;
      prop.isLandmark = true;
      this.addChatMessage({ sender: 'System', text: `👑 LANDMARK ERECTED! ${player.name} built a Landmark in ${tile.name}! (Immune to Buyouts)`, isSystem: true });
    } else if (prop.level === 5) {
      this.addChatMessage({ sender: 'System', text: `🏨 GRAND HOTEL BUILT! ${player.name} erected a Luxury Hotel in ${tile.name}!`, isSystem: true });
    } else {
      const levelDescriptions = { 2: '1 House (Cottage)', 3: '2 Houses (Duplex)', 4: '3 Houses (Townhouses)' };
      this.addChatMessage({ sender: 'System', text: `🏡 ${player.name} upgraded ${tile.name} to ${levelDescriptions[prop.level] || `Level ${prop.level}`}!`, isSystem: true });
    }

    this.checkWinConditions();
    this.completeTurnAction(playerId);
    return true;
  }

  takeStartExtraRoll(playerId) {
    const current = this.getCurrentPlayer();
    if (!current || current.id !== playerId || this.turnState !== 'start_tile_select') return false;

    this.turnState = 'roll';
    this.startTurnTimer();
    this.addChatMessage({
      sender: 'Launchpad',
      text: `🎲 [START PRIVILEGE] ${current.name} activated ONE MORE ROLL! Roll the dice!`,
      isSystem: true,
    });
    this.emitChange();
    if (current.isBot && this.status === 'playing') {
      setTimeout(() => this.triggerBotTurn(), 1000);
    }
    return true;
  }

  upgradePropertyFromStart(playerId, tileId) {
    const current = this.getCurrentPlayer();
    if (!current || current.id !== playerId || this.turnState !== 'start_tile_select') return false;

    const tile = TILES[tileId];
    const prop = this.properties[tileId];
    if (!tile || !prop || tile.type !== 'city' || prop.isLandmark || prop.level >= 6) return false;

    // Check ownership or team ownership
    const isOwner = prop.ownerId === current.id;
    const isTeam = isTeammate(current, this.players.find(p => p.id === prop.ownerId), this.players, this.mode);
    if (!isOwner && !isTeam) return false;

    const nextLevel = prop.level + 1;
    // Orbit 1 constraint: cannot build 3 houses (level 4) if laps < 1
    if (nextLevel >= 4 && (current.laps || 0) < 1) return false;
    // Hotel constraint: hotel (level 5) requires level 4
    if (nextLevel === 5 && prop.level < 4) return false;
    // Landmark constraint: landmark (level 6) requires level 5
    if (nextLevel === 6 && prop.level < 5) return false;

    const upgradeCost = tile.housePrice;
    if (current.cash < upgradeCost) return false;

    current.cash -= upgradeCost;
    prop.level = nextLevel;

    if (prop.level >= 6) {
      prop.level = 6;
      prop.isLandmark = true;
      this.addChatMessage({
        sender: 'Launchpad',
        text: `👑 [START PRIVILEGE] ${current.name} remotely erected a LANDMARK in ${tile.name} for ${upgradeCost.toLocaleString()} CR! (Immune to Buyouts)`,
        isSystem: true,
      });
    } else if (prop.level === 5) {
      this.addChatMessage({
        sender: 'Launchpad',
        text: `🏨 [START PRIVILEGE] ${current.name} remotely upgraded ${tile.name} to a Luxury Hotel for ${upgradeCost.toLocaleString()} CR!`,
        isSystem: true,
      });
    } else {
      const levelDescriptions = { 2: '1 House (Cottage)', 3: '2 Houses (Duplex)', 4: '3 Houses (Townhouses)' };
      this.addChatMessage({
        sender: 'Launchpad',
        text: `🏗️ [START PRIVILEGE] ${current.name} remotely upgraded ${tile.name} to ${levelDescriptions[prop.level] || `Level ${prop.level}`} for ${upgradeCost.toLocaleString()} CR!`,
        isSystem: true,
      });
    }

    this.checkWinConditions();
    this.completeTurnAction(playerId);
    return true;
  }

  buyStartShield(playerId) {
    const current = this.getCurrentPlayer();
    if (!current || current.id !== playerId || this.turnState !== 'start_tile_select') return false;
    const cost = 100000;
    if (current.cash < cost) return false;

    current.cash -= cost;
    current.shieldActive = true;
    this.addChatMessage({
      sender: 'Launchpad',
      text: `🛡️ [START PRIVILEGE] ${current.name} purchased a Planetary Defense Shield for ${cost.toLocaleString()} CR!`,
      isSystem: true,
    });

    this.completeTurnAction(playerId);
    return true;
  }

  passStartAction(playerId) {
    const current = this.getCurrentPlayer();
    if (!current || current.id !== playerId || this.turnState !== 'start_tile_select') return false;

    this.addChatMessage({
      sender: 'Launchpad',
      text: `⏭️ ${current.name} banked their 200,000 CR salary and concluded their Launchpad turn.`,
      isSystem: true,
    });

    this.completeTurnAction(playerId);
    return true;
  }

  setFestival(playerId, tileId) {
    const player = this.players.find(p => p.id === playerId);
    const prop = this.properties[tileId];
    if (!player || !prop || !prop.ownerId) return false;

    const owner = this.players.find(p => p.id === prop.ownerId);
    const canHost = prop.ownerId === playerId || isTeammate(player, owner, this.players, this.mode);
    if (!canHost) return false;

    // Reset old festival on properties owned by the player or their teammate if a new one is set
    Object.values(this.properties).forEach(p => {
      if (!p || !p.ownerId) return;
      if (p.ownerId === playerId) {
        p.festival = false;
      } else {
        const pOwner = this.players.find(pl => pl.id === p.ownerId);
        if (isTeammate(player, pOwner, this.players, this.mode)) {
          p.festival = false;
        }
      }
    });

    prop.festival = true;
    const tile = TILES[tileId];
    const isTeammateCity = prop.ownerId !== playerId;
    const teamMsg = isTeammateCity && owner ? ` on teammate ${owner.name}'s property` : '';
    this.addChatMessage({ sender: 'System', text: `🎪 WORLD FAIR! ${player.name} is hosting the festival in ${tile?.name || `Tile ${tileId}`}${teamMsg}! (Rent Doubled 2x)`, isSystem: true });
    this.completeTurnAction(playerId);
    return true;
  }

  selectFlightDestination(playerId, targetTileId) {
    if (this.status !== 'playing' || this.turnState !== 'flight_select') return false;
    const current = this.getCurrentPlayer();
    if (!current || current.id !== playerId || current.isBankrupt) return false;

    const flightCost = 50000;
    if (current.cash < flightCost) {
      this.flightPendingPlayerId = null;
      this.completeTurnAction(playerId);
      return false;
    }

    const targetTile = TILES[targetTileId];
    if (!targetTile || (targetTile.type !== 'city' && targetTile.type !== 'resort')) return false;

    // Must be neutral (unowned) city/resort OR owned by player (no chance, taxes, or opponent cities)
    const prop = this.properties[targetTileId];
    const isEligible = !prop?.ownerId || prop?.ownerId === current.id;
    if (!isEligible) return false;

    // Deduct flight ticket cost
    current.cash -= flightCost;
    this.emitPaymentEvent({
      payerId: current.id,
      receiverId: null,
      amount: flightCost,
      type: 'flight_ticket',
    });

    const fromTile = current.position || 0;
    // Check if player crossed START (Tile 0) traveling forward around the board
    const crossesStart = targetTileId < fromTile || targetTileId === 0;
    if (crossesStart) {
      const salary = 200000;
      current.cash += salary;
      this.emitPaymentEvent({
        payerId: null,
        receiverId: current.id,
        amount: salary,
        type: 'salary',
      });
      this.addChatMessage({
        sender: 'Salary',
        text: `🚀 ${current.name} completed a planetary orbit during World Tour: +200,000 Space Credits salary!`,
        isSystem: true
      });
      processLoanRepayments(this, current, salary);
    }

    // Move player position to selected destination (triggers normal walking hop animation in 3D scene)
    current.position = targetTileId;
    this.flightPendingPlayerId = null;
    this.updateNetWorths();

    this.addChatMessage({
      sender: 'WorldTour',
      text: `✈️ ${current.name} traveled on World Tour flight directly to ${targetTile.name}!`,
      isSystem: true
    });

    // Arrival handling at the destination field
    // 1. Unowned city: prompt purchase
    if (!prop?.ownerId) {
      this.turnState = 'action';
      this.startTurnTimer();
      this.emitChange();

      if (current.isBot) {
        setTimeout(() => this.triggerBotTurn(), 800);
      }
      return true;
    }

    // 2. Own city: check if upgradeable
    if (prop.ownerId === current.id) {
      const canUpgrade = prop.level < 5 && current.cash >= targetTile.housePrice;
      if (canUpgrade) {
        this.turnState = 'action';
        this.startTurnTimer();
        this.emitChange();

        if (current.isBot) {
          setTimeout(() => this.triggerBotTurn(), 800);
        }
        return true;
      }
    }

    // If already landmark or cannot upgrade, finish turn
    this.completeTurnAction(current.id);
    return true;
  }

  skipFlight(playerId) {
    if (this.status !== 'playing' || this.turnState !== 'flight_select') return false;
    const current = this.getCurrentPlayer();
    if (!current || current.id !== playerId) return false;

    this.flightPendingPlayerId = null;
    this.addChatMessage({
      sender: 'WorldTour',
      text: `✈️ ${current.name} skipped World Tour flight and will roll normally.`,
      isSystem: true
    });
    this.turnState = 'roll';
    this.startTurnTimer();
    this.emitChange();
    if (current.isBot && this.status === 'playing') {
      setTimeout(() => this.triggerBotTurn(), 800);
    }
    return true;
  }

  payBail(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player || player.islandTurns === 0 || player.cash < 100000) return false;
    player.cash -= 100000;
    player.islandTurns = 0;
    this.communityJackpot = (this.communityJackpot || 100000) + 50000;
    this.emitPaymentEvent({
      payerId: player.id,
      receiverId: null,
      amount: 100000,
      type: 'bail',
    });
    this.addChatMessage({ sender: 'System', text: `🌴 ${player.name} paid 100,000 Space Credits bail to leave Prison immediately! (+50,000 CR to Community Pot)`, isSystem: true });
    this.emitChange();
    return true;
  }

  throwTomato(fromPlayerId, targetPlayerId) {
    const thrower = this.players.find(p => p.id === fromPlayerId);
    const target = this.players.find(p => p.id === targetPlayerId);

    if (!thrower || !target || thrower.isBankrupt || target.isBankrupt || fromPlayerId === targetPlayerId) {
      return false;
    }

    // Cooldown check: strict 2500ms debounce per thrower to prevent multiple tomato spam
    const now = Date.now();
    if (thrower.lastTomatoThrowTime && now - thrower.lastTomatoThrowTime < 2500) {
      return false;
    }
    thrower.lastTomatoThrowTime = now;

    if (thrower.freeTomatoes > 0) {
      thrower.freeTomatoes -= 1;
    } else {
      const tomatoCost = 50000;
      if (thrower.cash < tomatoCost) return false;
      thrower.cash -= tomatoCost;
      this.communityJackpot = (this.communityJackpot || 100000) + 25000;
    }

    thrower.tomatoesThrown += 1;
    target.tomatoesHit += 1;

    const eventId = 'tomato_' + now + '_' + Math.random().toString(36).substring(2, 9);

    this.callbacks.onTomatoHit({
      id: eventId,
      timestamp: now,
      fromPlayerId,
      fromPlayerName: thrower.name,
      targetPlayerId,
      targetPlayerName: target.name,
      intensity: 'heavy',
      durationMs: 3500,
    });

    this.addChatMessage({
      sender: 'Splat',
      text: `🍅 SPLAT! ${thrower.name} hurled a juicy rotten tomato right into ${target.name}'s screen!`,
      isSystem: true
    });

    this.emitChange();
    return true;
  }

  endTurn(playerId) {
    if (this.status !== 'playing') return;

    const current = this.getCurrentPlayer();
    if (current && current.id === playerId) {
      current.missedTurns = 0;
      if (current.rentSurgeTurns > 0) {
        current.rentSurgeTurns -= 1;
      }
    }

    this.stopTurnTimer();
    this.doublesCount = 0;
    this.rolledDoublesThisTurn = false;

    // Find next active player
    let nextIndex = (this.activePlayerIndex + 1) % this.players.length;
    let attempts = 0;
    while (this.players[nextIndex].isBankrupt && attempts < this.players.length) {
      nextIndex = (nextIndex + 1) % this.players.length;
      attempts += 1;
    }

    // Full round check for municipal blackout
    if (nextIndex === 0 && this.blackoutRounds > 0) {
      this.blackoutRounds -= 1;
      if (this.blackoutRounds === 0) {
        this.addChatMessage({ sender: 'System', text: `💡 Municipal power restored! Normal rent collection has resumed.`, isSystem: true });
      }
    }

    this.activePlayerIndex = nextIndex;
    const nextPlayer = this.getCurrentPlayer();
    if (nextPlayer && nextPlayer.position === 16 && nextPlayer.cash >= 50000 && !nextPlayer.isBankrupt && nextPlayer.islandTurns === 0) {
      this.turnState = 'flight_select';
      this.flightPendingPlayerId = nextPlayer.id;
      this.addChatMessage({
        sender: 'WorldTour',
        text: `✈️ It's ${nextPlayer.name}'s turn at World Tour! Select any neutral or owned city to fly to (Ticket: 50,000 CR), or Skip to roll.`,
        isSystem: true
      });
    } else {
      this.turnState = 'roll';
    }
    this.startTurnTimer();
    this.emitChange();

    if (this.getCurrentPlayer()?.isBot && this.status === 'playing') {
      setTimeout(() => this.triggerBotTurn(), 2800);
    }
  }

  sellPropertyToBank(playerId, tileId) {
    const player = this.players.find(p => p.id === playerId);
    const tile = TILES[tileId];
    const prop = this.properties[tileId];

    if (!player || !tile || !prop) return false;
    if (prop.ownerId !== playerId) return false;

    // Validate that turnState is 'debt' or player is current player
    const isCurrentPlayer = this.getCurrentPlayer()?.id === playerId;
    if (this.turnState !== 'debt' && !isCurrentPlayer) return false;

    const basePrice = tile.price || 0;
    const housePrice = tile.housePrice || Math.floor(basePrice * 0.5);
    const upgradeInvestment = prop.level > 1 ? (prop.level - 1) * housePrice : 0;
    const totalInvestment = basePrice + upgradeInvestment;
    const refundValue = Math.floor(totalInvestment * 0.70);

    player.cash += refundValue;
    prop.ownerId = null;
    prop.level = 0;
    prop.isLandmark = false;
    prop.festival = false;
    prop.mortgaged = false;

    this.addChatMessage({
      sender: 'Bank',
      text: `🏦 ${player.name} sold ${tile.name} to the Bank for ${refundValue.toLocaleString()} Space Credits (70% value)!`,
      isSystem: true
    });

    this.checkWinConditions();
    this.emitChange();
    return { success: true, refundValue };
  }

  settleDebt(playerId) {
    if (this.turnState !== 'debt') return false;
    if (!this.pendingDebt || this.pendingDebt.debtorId !== playerId) return false;
    const player = this.players.find(p => p.id === playerId);
    if (!player) return false;

    const amount = this.pendingDebt.amount || 0;
    if (player.cash < amount) return false;

    player.cash -= amount;
    const creditorId = this.pendingDebt.creditorId;
    if (creditorId) {
      const creditor = this.players.find(p => p.id === creditorId);
      if (creditor) {
        creditor.cash += amount;
      }
    }

    this.emitPaymentEvent({
      payerId: player.id,
      receiverId: creditorId || null,
      amount,
      type: 'debt_settle',
    });

    this.pendingDebt = null;
    this.turnState = 'end_turn';
    this.addChatMessage({
      sender: 'System',
      text: `✅ ${player.name} fully settled their debt of ${amount.toLocaleString()} Space Credits!`,
      isSystem: true
    });
    this.emitChange();

    if (player.isBot) {
      this.completeTurnAction(playerId);
    } else {
      setTimeout(() => {
        if (this.turnState === 'end_turn') {
          this.completeTurnAction(playerId);
        }
      }, 1000);
    }

    return true;
  }

  declareBankruptcy(debtorId, creditorId) {
    const debtor = this.players.find(p => p.id === debtorId);
    if (!debtor) return;

    // Settle active loan collateral first
    handleBankruptcyLoans(this, debtorId);

    debtor.isBankrupt = true;
    debtor.cash = 0;

    // Transfer properties to creditor or bank
    Object.keys(this.properties).forEach(tileId => {
      const prop = this.properties[tileId];
      if (prop.ownerId === debtorId) {
        prop.ownerId = creditorId || null;
        prop.festival = false;
        if (!creditorId) {
          prop.level = 0;
          prop.isLandmark = false;
        }
      }
    });

    this.addChatMessage({ sender: 'System', text: `💀 BANKRUPT! ${debtor.name} was eliminated from the board!`, isSystem: true });
    this.checkWinConditions();
    this.endTurn(debtorId);
  }

  checkWinConditions() {
    const activePlayers = this.players.filter(p => !p.isBankrupt);
    if (activePlayers.length === 1 && this.players.length > 1) {
      this.declareWinner(activePlayers[0], 'bankruptcy');
      return;
    }

    // Check Resort Monopoly, Line Monopoly, and Triple Monopoly for each player
    for (const player of activePlayers) {
      // 1. Resort Monopoly (owns all 4 resorts)
      const ownsAllResorts = RESORT_TILES.every(tId => this.properties[tId]?.ownerId === player.id);
      if (ownsAllResorts) {
        this.declareWinner(player, 'resort_monopoly (All 4 Resorts Owned)');
        return;
      }

      // 2. Line Monopoly (owns all properties on any 1 side)
      for (const [side, tileIds] of Object.entries(SIDE_PROPERTIES)) {
        const ownsLine = tileIds.every(tId => this.properties[tId]?.ownerId === player.id);
        if (ownsLine) {
          this.declareWinner(player, `line_monopoly (${side.toUpperCase()} Side)`);
          return;
        }
      }

      // 3. Triple Monopoly (owns 3 complete color sets)
      let completedSets = 0;
      for (const [group, tileIds] of Object.entries(COLOR_GROUPS)) {
        const ownsGroup = tileIds.every(tId => this.properties[tId]?.ownerId === player.id);
        if (ownsGroup) completedSets += 1;
      }
      if (completedSets >= 3) {
        this.declareWinner(player, 'triple_monopoly (3 Color Sets)');
        return;
      }
    }
  }

  declareWinner(winner, reason) {
    this.status = 'finished';
    this.winner = winner;
    this.winReason = reason;
    this.stopTurnTimer();
    this.stopMatchTimer();
    this.updateNetWorths();

    // Ranked players for final standings / scoreboard:
    // 1st: winner, then active players by netWorth desc, then bankrupt players
    const rankedPlayers = [...this.players].sort((a, b) => {
      if (a.id === winner?.id) return -1;
      if (b.id === winner?.id) return 1;
      if (a.isBankrupt && !b.isBankrupt) return 1;
      if (!a.isBankrupt && b.isBankrupt) return -1;
      return (b.netWorth || 0) - (a.netWorth || 0);
    });

    this.callbacks.onWin({
      winner,
      reason,
      players: rankedPlayers,
      mode: this.mode,
      matchDuration: this.matchDuration,
      hallOfFame: {
        tomatoTerrorist: [...this.players].sort((a, b) => (b.tomatoesThrown || 0) - (a.tomatoesThrown || 0))[0],
        juiceSponge: [...this.players].sort((a, b) => (b.tomatoesHit || 0) - (a.tomatoesHit || 0))[0],
      }
    });

    this.emitChange();

    // Automatically return all players in room to lobby after 20 seconds latest
    this.startLobbyReturnTimer(20);
  }

  returnToLobby() {
    this.stopLobbyReturnTimer();
    this.stopTurnTimer();
    this.stopMatchTimer();

    this.status = 'waiting';
    this.startingSpin = null;
    this.turnState = 'roll';
    this.activePlayerIndex = 0;
    this.winner = null;
    this.winReason = null;
    this.properties = {};

    // Re-initialize all city and resort properties
    TILES.forEach(tile => {
      if (tile.type === 'city' || tile.type === 'resort') {
        this.properties[tile.id] = {
          ownerId: null,
          level: 1,
          isLandmark: false,
          festival: false,
          mortgaged: false,
        };
      }
    });

    this.pendingAction = null;
    this.pendingDebt = null;
    this.flightPendingPlayerId = null;
    this.eventCardPendingPlayerId = null;
    this.activeEventCard = null;
    this.lastActionCardPlayed = null;
    this.blackoutRounds = 0;
    this.lastDiceResult = null;
    this.dice = [1, 1];
    this.doublesCount = 0;
    this.rolledDoublesThisTurn = false;
    this.matchStartTime = null;
    this.matchDuration = this.mode === 'normal' ? 3600 : 1200;
    this.matchTimeRemaining = this.matchDuration;
    this.turnTimerRemaining = this.turnDuration;

    // Reset active trades and active loans
    if (this.tradeTimeout) clearTimeout(this.tradeTimeout);
    this.activeTrade = null;
    this.loans = [];

    // Reset player gameplay stats for the fresh match while preserving their profile / slots
    this.players.forEach(p => {
      p.cash = 2000000;
      p.position = 0;
      p.inJail = false;
      p.jailTurns = 0;
      p.isBankrupt = false;
      p.cards = [];
      p.freeTomatoes = 3;
      p.netWorth = 2000000;
      p.propertiesCount = 0;
      p.landmarksCount = 0;
      p.tomatoesThrown = 0;
      p.tomatoesHit = 0;
      p.missedTurns = 0;
      p.shieldActive = false;
      p.rentSurgeTurns = 0;
      p.disadvantaged = false;
      p.loadedRoll = null;
    });

    this.addChatMessage({
      sender: 'System',
      text: 'Returned to Room Lobby. Ready for the next match!',
      isSystem: true,
    });

    this.emitChange();
  }

  startLobbyReturnTimer(seconds = 20) {
    this.stopLobbyReturnTimer();
    this.lobbyReturnRemaining = seconds;
    this.lobbyReturnInterval = setInterval(() => {
      if (this.status !== 'finished') {
        this.stopLobbyReturnTimer();
        return;
      }
      this.lobbyReturnRemaining = Math.max(0, (this.lobbyReturnRemaining || 1) - 1);
      if (this.lobbyReturnRemaining <= 0) {
        this.stopLobbyReturnTimer();
        this.returnToLobby();
      }
    }, 1000);
  }

  stopLobbyReturnTimer() {
    if (this.lobbyReturnInterval) {
      clearInterval(this.lobbyReturnInterval);
      this.lobbyReturnInterval = null;
    }
    this.lobbyReturnRemaining = 0;
  }

  updateNetWorths() {
    this.players.forEach(p => {
      let propValue = 0;
      let propCount = 0;
      let landmarkCount = 0;
      Object.keys(this.properties).forEach(tId => {
        const prop = this.properties[tId];
        if (prop && prop.ownerId === p.id) {
          propCount += 1;
          if (prop.isLandmark) landmarkCount += 1;
          const tile = TILES[tId];
          if (tile) {
            propValue += (tile.price || 0) + Math.max(0, ((prop.level || 1) - 1)) * (tile.housePrice || 0);
          }
        }
      });
      p.propertyValue = propValue;
      p.propertiesCount = propCount;
      p.landmarksCount = landmarkCount;
      p.netWorth = (p.cash || 0) + propValue;
    });
  }

  addChatMessage(msg) {
    const entry = { id: Date.now() + Math.random(), time: Date.now(), ...msg };
    this.chat.push(entry);
    if (this.chat.length > 50) this.chat.shift();
    this.callbacks.onChatMessage(entry);
  }

  emitChange() {
    this.updateNetWorths();
    this.callbacks.onStateChange(this.getPublicState());
  }

  getPublicState() {
    return {
      roomId: this.roomId,
      mode: this.mode,
      matchDuration: this.matchDuration,
      matchTimeRemaining: this.matchTimeRemaining,
      matchStartTime: this.matchStartTime,
      turnDuration: this.turnDuration,
      turnStartTime: this.turnStartTime,
      turnExpiresAt: this.turnExpiresAt,
      matchStartTime: this.matchStartTime,
      matchExpiresAt: this.matchExpiresAt || (this.matchStartTime ? this.matchStartTime + (this.matchDuration * 1000) : null),
      status: this.status,
      activePlayerIndex: this.activePlayerIndex,
      turnState: this.turnState,
      turnTimerRemaining: this.turnTimerRemaining,
      players: this.players,
      properties: this.properties,
      dice: this.dice,
      lastDiceResult: this.lastDiceResult,
      doublesCount: this.doublesCount,
      pendingDebt: this.pendingDebt,
      flightPendingPlayerId: this.flightPendingPlayerId,
      winner: this.winner,
      winReason: this.winReason,
      lobbyReturnRemaining: this.lobbyReturnRemaining || 0,
      chat: this.chat,
      // Tactical Cards State
      startingSpin: this.startingSpin,
      activeEventCard: this.activeEventCard,
      blackoutRounds: this.blackoutRounds,
      lastActionCardPlayed: this.lastActionCardPlayed,
      // P2P Trade & Loan State
      activeTrade: this.activeTrade,
      loans: (this.loans || []).filter(l => l.active),
      // Central Tax Jackpot & Auction State
      communityJackpot: this.communityJackpot || 100000,
      auction: this.auction,
      lastPaymentEvent: this.lastPaymentEvent,
    };
  }

  executeBotAction(current) {
    if (!current || !current.isBot || this.status !== 'playing') return;

    if (this.turnState === 'festival_select') {
      let owned = Object.keys(this.properties).filter(id => this.properties[id]?.ownerId === current.id);
      if (owned.length === 0) {
        // Consider teammate properties if bot has none
        owned = Object.keys(this.properties).filter(id => {
          const prop = this.properties[id];
          if (!prop?.ownerId) return false;
          const owner = this.players.find(p => p.id === prop.ownerId);
          return isTeammate(current, owner, this.players, this.mode);
        });
      }
      if (owned.length > 0) {
        owned.sort((a, b) => (this.properties[b]?.level || 1) - (this.properties[a]?.level || 1));
        const ok = this.setFestival(current.id, parseInt(owned[0]));
        if (!ok) this.completeTurnAction(current.id);
        return;
      }
      this.completeTurnAction(current.id);
      return;
    }

    if (this.turnState !== 'action') return;
    const tile = TILES[current.position];
    const prop = this.properties[current.position];

    if (tile?.type === 'city' || tile?.type === 'resort') {
      if (!prop.ownerId) {
        const cost = tile.type === 'resort' ? tile.price : (tile.price + tile.housePrice);
        if (current.cash >= cost) {
          this.buyCity(current.id, current.position, tile.type === 'resort' ? 1 : 2);
          return;
        }
      } else if (tile.type === 'city' && prop.ownerId === current.id && !prop.isLandmark && current.cash >= tile.housePrice * 2) {
        // Upgrade
        this.upgradeCity(current.id, current.position);
        return;
      } else if (prop.ownerId && prop.ownerId !== current.id && !prop.isLandmark) {
        // Buyout check if wealthy
        const totalVal = tile.type === 'resort' ? tile.price : (tile.price + (prop.level - 1) * (tile.housePrice || 0));
        const buyoutCost = totalVal * 2;
        if (current.cash >= buyoutCost + 400000) {
          this.buyoutCity(current.id, current.position);
          return;
        }
      }
    }

    // Tactical demolition check by Bot
    if (current.cards && current.cards.length > 0) {
      const demo = current.cards.find(c => c.id === 'demolition_strike');
      if (demo) {
        const targets = Object.keys(this.properties).filter(id => {
          const p = this.properties[id];
          return p.ownerId && p.ownerId !== current.id && (p.level >= 2 || p.festival);
        });
        if (targets.length > 0) {
          this.playActionCard(current.id, demo.id, { tileId: parseInt(targets[0]) });
        }
      }
    }

    this.completeTurnAction(current.id);
  }

  triggerBotTurn() {
    const current = this.getCurrentPlayer();
    if (!current || !current.isBot || this.status !== 'playing') return;

    // Tactical Bot Card Play before rolling
    if (this.turnState === 'roll' && current.cards && current.cards.length > 0) {
      if (current.islandTurns > 0) {
        const keycard = current.cards.find(c => c.id === 'prison_break' || c.id === 'vip_escape_pass');
        if (keycard) {
          this.playActionCard(current.id, keycard.id);
        }
      }
      if (current.cash < 400000) {
        const credit = current.cards.find(c => c.id === 'emergency_credit');
        if (credit) {
          this.playActionCard(current.id, credit.id);
        }
      }
      if (!current.shieldActive && Math.random() < 0.4) {
        const shield = current.cards.find(c => c.id === 'toll_shield');
        if (shield) {
          this.playActionCard(current.id, shield.id);
        }
      }
      const yoinkCard = current.cards.find(c => c.id === 'card_yoink');
      if (yoinkCard) {
        const rivalsWithCards = this.players.filter(p => p.id !== current.id && !p.isBankrupt && p.cards?.length > 0);
        if (rivalsWithCards.length > 0) {
          rivalsWithCards.sort((a, b) => b.cards.length - a.cards.length);
          this.playActionCard(current.id, yoinkCard.id, { targetPlayerId: rivalsWithCards[0].id });
        }
      }
      const surge = current.cards.find(c => c.id === 'golden_toll');
      const owned = Object.keys(this.properties).filter(id => this.properties[id].ownerId === current.id).length;
      if (surge && owned >= 2 && current.rentSurgeTurns === 0) {
        this.playActionCard(current.id, surge.id);
      }
    }

    if (this.turnState === 'roll') {
      this.rollDice(current.id);
      if (this.turnState === 'action' || this.turnState === 'festival_select' || this.turnState === 'flight_select' || this.turnState === 'start_tile_select') {
        const diceSum = (this.dice[0] || 1) + (this.dice[1] || 1);
        const hopDelayMs = Math.max(2200, diceSum * 220 + 800);
        setTimeout(() => this.triggerBotTurn(), hopDelayMs);
      }
    } else if (this.turnState === 'flight_select') {
      const eligibleTiles = TILES.filter(t => {
        if (t.type !== 'city') return false;
        const prop = this.properties[t.id];
        return !prop?.ownerId || prop?.ownerId === current.id;
      });

      if (eligibleTiles.length > 0 && current.cash >= 50000) {
        let target = null;
        for (const t of eligibleTiles) {
          const prop = this.properties[t.id];
          if (!prop?.ownerId && t.colorGroup) {
            const groupTileIds = COLOR_GROUPS[t.colorGroup] || [];
            const otherIds = groupTileIds.filter(id => id !== t.id);
            if (otherIds.some(id => this.properties[id]?.ownerId === current.id)) {
              target = t;
              break;
            }
          }
        }
        if (!target) {
          const unowned = eligibleTiles.filter(t => !this.properties[t.id]?.ownerId);
          if (unowned.length > 0) {
            unowned.sort((a, b) => (b.price || 0) - (a.price || 0));
            target = unowned[0];
          } else {
            target = eligibleTiles[0];
          }
        }
        if (target) {
          this.selectFlightDestination(current.id, target.id);
          return;
        }
      }
      this.skipFlight(current.id);
      return;
    } else if (this.turnState === 'action') {
      // 1200ms thinking time so players see what property the bot landed on before it acts
      setTimeout(() => {
        if (this.turnState !== 'action' || this.getCurrentPlayer()?.id !== current.id) return;
        this.executeBotAction(current);
      }, 1200);
      return;    } else if (this.turnState === 'start_tile_select') {
      const upgradable = Object.keys(this.properties).filter(id => {
        const prop = this.properties[id];
        const tile = TILES[id];
        if (!prop?.ownerId || prop.isLandmark || prop.level >= 6 || tile?.type !== 'city') return false;
        const isMine = prop.ownerId === current.id;
        const isTeam = isTeammate(current, this.players.find(p => p.id === prop.ownerId), this.players, this.mode);
        if (!isMine && !isTeam) return false;
        if (prop.level + 1 >= 4 && (current.laps || 0) < 1) return false;
        return current.cash >= (tile.housePrice || 100000);
      });

      if (upgradable.length > 0 && current.cash >= 350000) {
        upgradable.sort((a, b) => (this.properties[b]?.level || 1) - (this.properties[a]?.level || 1));
        this.upgradePropertyFromStart(current.id, parseInt(upgradable[0]));
        return;
      }

      if (Math.random() < 0.85 || (!current.shieldActive && current.cash < 100000)) {
        this.takeStartExtraRoll(current.id);
      } else if (!current.shieldActive && current.cash >= 250000) {
        this.buyStartShield(current.id);
      } else {
        this.passStartAction(current.id);
      }
      return;
    } else if (this.turnState === 'festival_select') {
      let owned = Object.keys(this.properties).filter(id => this.properties[id]?.ownerId === current.id);
      if (owned.length === 0) {
        // Consider teammate properties if bot has none
        owned = Object.keys(this.properties).filter(id => {
          const prop = this.properties[id];
          if (!prop?.ownerId) return false;
          const owner = this.players.find(p => p.id === prop.ownerId);
          return isTeammate(current, owner, this.players, this.mode);
        });
      }
      if (owned.length > 0) {
        owned.sort((a, b) => (this.properties[b]?.level || 1) - (this.properties[a]?.level || 1));
        this.setFestival(current.id, parseInt(owned[0]));
        return;
      }
      this.endTurn(current.id);
    } else if (this.turnState === 'debt') {
      const owned = Object.keys(this.properties).filter(id => this.properties[id].ownerId === current.id);
      while (current.cash < (this.pendingDebt?.amount || 0) && owned.length > 0) {
        const tileId = parseInt(owned.pop());
        this.sellPropertyToBank(current.id, tileId);
      }
      if (current.cash >= (this.pendingDebt?.amount || 0)) {
        this.settleDebt(current.id);
      } else {
        this.declareBankruptcy(current.id, this.pendingDebt?.creditorId);
      }
    } else {
      this.endTurn(current.id);
    }
  }

  // ==========================================
  // P2P TRADE & NEGOTIATION METHODS
  // ==========================================
  proposeTrade(proposerId, targetId, offer) {
    if (this.status !== 'playing') {
      return { success: false, error: 'Trades can only be proposed during an active match' };
    }

    const trade = {
      id: `trade_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      proposerId,
      targetId,
      offer,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30000,
      status: 'pending',
    };

    const check = validateTrade(this, trade);
    if (!check.valid) {
      return { success: false, error: check.error };
    }

    if (this.tradeTimeout) clearTimeout(this.tradeTimeout);
    this.activeTrade = trade;

    this.tradeTimeout = setTimeout(() => {
      if (this.activeTrade && this.activeTrade.id === trade.id && (this.activeTrade.status === 'pending' || this.activeTrade.status === 'countered')) {
        const expiredId = this.activeTrade.id;
        this.activeTrade = null;
        this.callbacks.onTradeDeclined({ tradeId: expiredId, reason: 'timeout' });
        this.emitChange();
      }
    }, 30000);

    const proposer = this.players.find(p => p.id === proposerId);
    const target = this.players.find(p => p.id === targetId);

    this.addChatMessage({
      sender: 'TradeDesk',
      text: `🤝 ${proposer?.name || 'Player'} sent a trade deal to ${target?.name || 'Rival'}! (30s to respond)`,
      isSystem: true,
    });

    this.callbacks.onTradeUpdate(this.activeTrade);
    this.emitChange();

    // If target is bot, trigger bot evaluation
    if (target?.isBot) {
      setTimeout(() => {
        if (!this.activeTrade || this.activeTrade.id !== trade.id) return;
        const evalResult = evaluateBotTrade(this, target, this.activeTrade);
        if (evalResult.decision === 'accept') {
          this.respondToTrade(target.id, trade.id, 'accept');
        } else if (evalResult.decision === 'counter' && evalResult.counterOffer) {
          this.counterTrade(target.id, trade.id, evalResult.counterOffer);
        } else {
          this.respondToTrade(target.id, trade.id, 'decline');
        }
      }, 1500);
    }

    return { success: true, trade };
  }

  counterTrade(playerId, tradeId, updatedOffer) {
    if (!this.activeTrade || String(this.activeTrade.id) !== String(tradeId)) {
      return { success: false, error: 'Trade offer not found or expired' };
    }

    if (String(this.activeTrade.proposerId) !== String(playerId) && String(this.activeTrade.targetId) !== String(playerId)) {
      return { success: false, error: 'Not authorized for this trade' };
    }

    const newProposerId = playerId;
    const newTargetId = String(this.activeTrade.proposerId) === String(playerId) ? this.activeTrade.targetId : this.activeTrade.proposerId;

    const updatedTrade = {
      ...this.activeTrade,
      proposerId: newProposerId,
      targetId: newTargetId,
      offer: updatedOffer,
      status: 'countered',
      expiresAt: Date.now() + 30000,
    };

    const check = validateTrade(this, updatedTrade);
    if (!check.valid) {
      return { success: false, error: check.error };
    }

    this.activeTrade = updatedTrade;
    if (this.tradeTimeout) clearTimeout(this.tradeTimeout);

    this.tradeTimeout = setTimeout(() => {
      if (this.activeTrade && this.activeTrade.id === tradeId && (this.activeTrade.status === 'pending' || this.activeTrade.status === 'countered')) {
        const expiredId = this.activeTrade.id;
        this.activeTrade = null;
        this.callbacks.onTradeDeclined({ tradeId: expiredId, reason: 'timeout' });
        this.emitChange();
      }
    }, 30000);

    const proposer = this.players.find(p => p.id === newProposerId);
    const target = this.players.find(p => p.id === newTargetId);

    this.addChatMessage({
      sender: 'TradeDesk',
      text: `🔄 ${proposer?.name || 'Player'} sent a COUNTER-OFFER to ${target?.name || 'Rival'}!`,
      isSystem: true,
    });

    this.callbacks.onTradeUpdate(this.activeTrade);
    this.emitChange();

    // If new target is bot, trigger bot evaluation
    if (target?.isBot) {
      setTimeout(() => {
        if (!this.activeTrade || this.activeTrade.id !== tradeId) return;
        const evalResult = evaluateBotTrade(this, target, this.activeTrade);
        if (evalResult.decision === 'accept') {
          this.respondToTrade(target.id, tradeId, 'accept');
        } else if (evalResult.decision === 'counter' && evalResult.counterOffer) {
          this.counterTrade(target.id, tradeId, evalResult.counterOffer);
        } else {
          this.respondToTrade(target.id, tradeId, 'decline');
        }
      }, 1500);
    }

    return { success: true, trade: this.activeTrade };
  }

  respondToTrade(playerId, tradeId, response) {
    if (!this.activeTrade || String(this.activeTrade.id) !== String(tradeId)) {
      return { success: false, error: 'Trade offer not found or expired' };
    }

    if (String(this.activeTrade.targetId) !== String(playerId) && String(this.activeTrade.proposerId) !== String(playerId)) {
      return { success: false, error: 'Unauthorized trade response' };
    }

    if (response === 'accept') {
      const result = executeTrade(this, this.activeTrade);
      if (!result.success) {
        return result;
      }

      if (this.tradeTimeout) clearTimeout(this.tradeTimeout);
      const finishedTrade = { ...this.activeTrade, status: 'accepted' };
      this.activeTrade = null;

      this.callbacks.onTradeCompleted({
        tradeId,
        proposerId: finishedTrade.proposerId,
        targetId: finishedTrade.targetId,
        offer: finishedTrade.offer,
        summary: result.summary,
        registeredLoan: result.registeredLoan,
        timestamp: Date.now(),
      });

      this.emitChange();
      return result;
    } else {
      // Decline
      if (this.tradeTimeout) clearTimeout(this.tradeTimeout);
      const declinedTrade = { ...this.activeTrade };
      const decliner = this.players.find(p => p.id === playerId);
      this.activeTrade = null;

      this.addChatMessage({
        sender: 'TradeDesk',
        text: `❌ ${decliner?.name || 'Player'} declined the trade deal.`,
        isSystem: true,
      });

      this.callbacks.onTradeDeclined({
        tradeId: declinedTrade.id,
        reason: 'declined',
        playerId,
        proposerId: declinedTrade.proposerId,
        targetId: declinedTrade.targetId,
        timestamp: Date.now(),
      });
      this.emitChange();
      return { success: true };
    }
  }

  cancelTrade(playerId, tradeId) {
    if (!this.activeTrade || String(this.activeTrade.id) !== String(tradeId)) return false;
    if (String(this.activeTrade.proposerId) !== String(playerId) && String(this.activeTrade.targetId) !== String(playerId)) return false;

    if (this.tradeTimeout) clearTimeout(this.tradeTimeout);
    const cancelledTrade = { ...this.activeTrade };
    this.activeTrade = null;

    this.callbacks.onTradeDeclined({
      tradeId: cancelledTrade.id,
      reason: 'cancelled',
      playerId,
      proposerId: cancelledTrade.proposerId,
      targetId: cancelledTrade.targetId,
      timestamp: Date.now(),
    });
    this.emitChange();
    return true;
  }
}
