import { TILES, COLOR_GROUPS, SIDE_PROPERTIES, CHANCE_CARDS } from './types.js';

export class BoardBrawlGame {
  constructor(roomId, options = {}) {
    this.roomId = roomId;
    this.mode = options.mode || 'blitz'; // 'blitz' (20m, 15s timer) or 'normal' (30s timer)
    this.turnDuration = this.mode === 'blitz' ? 15 : 30;
    this.status = 'waiting'; // 'waiting', 'playing', 'finished'
    
    this.players = []; // [{ id, name, isBot, avatarColor, avatarToken, cash, netWorth, position, isBankrupt, islandTurns, freeTomatoes, tomatoesThrown, tomatoesHit, missedTurns }]
    this.properties = {}; // tileId -> { ownerId, level, isLandmark, festival, mortgaged }
    
    this.activePlayerIndex = 0;
    this.turnState = 'roll'; // 'roll', 'action', 'debt', 'flight_select', 'festival_select'
    this.turnTimerRemaining = this.turnDuration;
    this.turnTimerInterval = null;
    
    this.doublesCount = 0;
    this.dice = [1, 1];
    this.lastDiceResult = null;
    this.pendingDebt = null; // { debtorId, creditorId, amount, remainingSec }
    this.flightPendingPlayerId = null;

    this.winner = null;
    this.winReason = null; // 'line_monopoly', 'triple_monopoly', 'bankruptcy', 'blitz_timeout'
    this.chat = [];
    this.callbacks = {
      onStateChange: () => {},
      onTomatoHit: () => {},
      onDiceRoll: () => {},
      onChatMessage: () => {},
      onWin: () => {},
    };

    // Initialize all city properties
    TILES.forEach(tile => {
      if (tile.type === 'city') {
        this.properties[tile.id] = {
          ownerId: null,
          level: 0, // 0: unowned, 1: land, 2: 1-house, 3: 2-houses, 4: 3-houses, 5: landmark
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

  addPlayer(user, isBot = false) {
    if (this.players.length >= 6 || this.status !== 'waiting') return false;
    if (this.players.some(p => p.id === user.id)) return false;

    const startingCash = this.mode === 'blitz' ? 2200 : 1500;
    const player = {
      id: user.id,
      name: user.username || user.name || `Player_${this.players.length + 1}`,
      isBot,
      avatarColor: user.avatar_color || user.avatarColor || '#00f0ff',
      avatarToken: user.avatar_token || user.avatarToken || 'hat',
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
    };

    this.players.push(player);
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
    this.activePlayerIndex = 0;
    this.turnState = 'roll';
    this.startTurnTimer();
    this.emitChange();

    if (this.getCurrentPlayer().isBot) {
      setTimeout(() => this.triggerBotTurn(), 1000);
    }
    return true;
  }

  getCurrentPlayer() {
    return this.players[this.activePlayerIndex] || null;
  }

  startTurnTimer() {
    this.stopTurnTimer();
    this.turnTimerRemaining = this.turnDuration;

    this.turnTimerInterval = setInterval(() => {
      this.turnTimerRemaining -= 1;
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

    current.missedTurns = (current.missedTurns || 0) + 1;
    // Auto-bot takeover on 2 consecutive missed turns
    if (!current.isBot && current.missedTurns >= 2) {
      current.isBot = true;
      this.addChatMessage({
        sender: 'System',
        text: `⚠️ ${current.name} was inactive for 2 turns. AI Bot has taken control of this seat!`,
        isSystem: true
      });
    }

    if (this.turnState === 'roll') {
      this.rollDice(current.id);
    } else if (this.turnState === 'action') {
      this.endTurn(current.id);
    } else if (this.turnState === 'debt') {
      this.declareBankruptcy(current.id, this.pendingDebt?.creditorId);
    } else {
      this.endTurn(current.id);
    }
  }

  rollDice(playerId) {
    const current = this.getCurrentPlayer();
    if (!current || current.id !== playerId || this.turnState !== 'roll' || current.isBankrupt) {
      return false;
    }

    // Handle Island escape
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    const isDoubles = d1 === d2;
    this.dice = [d1, d2];
    this.lastDiceResult = { d1, d2, isDoubles, sum: d1 + d2 };

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
        this.addChatMessage({ sender: 'System', text: `🎲 ${current.name} rolled DOUBLES (${d1}+${d2}) and escaped Resort Island!`, isSystem: true });
      } else {
        current.islandTurns -= 1;
        if (current.islandTurns === 0) {
          current.cash = Math.max(0, current.cash - 100);
          this.addChatMessage({ sender: 'System', text: `🌴 ${current.name} paid $100 bail to leave Resort Island!`, isSystem: true });
        } else {
          this.addChatMessage({ sender: 'System', text: `🔒 ${current.name} remains trapped on Resort Island (${current.islandTurns} turns left).`, isSystem: true });
          this.endTurn(playerId);
          return true;
        }
      }
    }

    // Doubles check
    if (isDoubles) {
      this.doublesCount += 1;
      if (this.doublesCount >= 3) {
        current.position = 12; // Resort Island
        current.islandTurns = 3;
        this.doublesCount = 0;
        this.addChatMessage({ sender: 'System', text: `🚨 3 DOUBLES IN A ROW! ${current.name} was arrested and sent to Resort Island!`, isSystem: true });
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
      current.cash += 200;
      this.addChatMessage({ sender: 'System', text: `✈️ ${current.name} passed START and collected $200 World Tour salary!`, isSystem: true });
    }

    current.position = newPos;
    this.evaluateTile(current, newPos, isDoubles);
    return true;
  }

  evaluateTile(player, tileId, isDoubles) {
    const tile = TILES[tileId];
    this.updateNetWorths();

    if (tile.type === 'start') {
      player.cash += 200;
      this.finishMove(player, isDoubles);
    } else if (tile.type === 'tax') {
      player.cash = Math.max(0, player.cash - tile.amount);
      this.addChatMessage({ sender: 'System', text: `💸 ${player.name} paid $${tile.amount} in ${tile.name}!`, isSystem: true });
      this.finishMove(player, isDoubles);
    } else if (tile.type === 'armory') {
      player.freeTomatoes += 2;
      this.addChatMessage({ sender: 'System', text: `🍅 ${player.name} raided the Armory and obtained +2 Free Tomatoes!`, isSystem: true });
      this.finishMove(player, isDoubles);
    } else if (tile.type === 'jail') {
      this.finishMove(player, isDoubles);
    } else if (tile.type === 'go_to_jail') {
      player.position = 12;
      player.islandTurns = 3;
      this.addChatMessage({ sender: 'Interpol', text: `🚨 BUSTED! ${player.name} was raided and extradited to VIP Resort Quarantine!`, isSystem: true });
      this.finishMove(player, false);
    } else if (tile.type === 'casino') {
      this.addChatMessage({ sender: 'Casino', text: `🎰 ${player.name} relaxed at the High-Roller Casino Lounge!`, isSystem: true });
      this.finishMove(player, isDoubles);
    } else if (tile.type === 'airport') {
      // Option to fly to any tile next turn for $100
      this.turnState = 'action';
      this.emitChange();
    } else if (tile.type === 'festival') {
      // Option to double rent of one owned city
      const ownedCities = Object.keys(this.properties).filter(id => this.properties[id].ownerId === player.id);
      if (ownedCities.length > 0) {
        this.turnState = 'festival_select';
      } else {
        this.finishMove(player, isDoubles);
      }
      this.emitChange();
    } else if (tile.type === 'chance') {
      const card = CHANCE_CARDS[Math.floor(Math.random() * CHANCE_CARDS.length)];
      this.applyChanceCard(player, card, isDoubles);
    } else if (tile.type === 'city') {
      const prop = this.properties[tileId];
      if (!prop.ownerId) {
        // Unowned: prompt purchase
        this.turnState = 'action';
        this.emitChange();
      } else if (prop.ownerId === player.id) {
        // Own city: can upgrade if not landmark
        this.turnState = 'action';
        this.emitChange();
      } else {
        // Opponent's city: calculate rent
        const owner = this.players.find(p => p.id === prop.ownerId);
        let rent = tile.rent[Math.min(prop.level - 1, 4)] || tile.rent[0];

        // Check color monopoly (2x rent)
        const groupTiles = COLOR_GROUPS[tile.colorGroup];
        const hasFullGroup = groupTiles.every(tId => this.properties[tId].ownerId === owner.id);
        if (hasFullGroup) rent *= 2;

        // Check festival (2x rent)
        if (prop.festival) rent *= 2;

        if (player.cash >= rent) {
          player.cash -= rent;
          owner.cash += rent;
          this.addChatMessage({ sender: 'System', text: `🏨 ${player.name} paid $${rent} rent to ${owner.name} in ${tile.name}!`, isSystem: true });

          // Can buyout if not Landmark and has 2x cash
          const buyoutCost = (tile.price + (prop.level - 1) * tile.housePrice) * 2;
          if (!prop.isLandmark && player.cash >= buyoutCost) {
            this.turnState = 'action';
          } else {
            this.finishMove(player, isDoubles);
          }
        } else {
          // Debt liquidation state
          this.turnState = 'debt';
          this.pendingDebt = { debtorId: player.id, creditorId: owner.id, amount: rent };
          this.addChatMessage({ sender: 'System', text: `⚠️ ${player.name} owes $${rent} to ${owner.name} and must liquidate properties or face bankruptcy!`, isSystem: true });
        }
        this.emitChange();
      }
    }
  }

  applyChanceCard(player, card, isDoubles) {
    this.addChatMessage({ sender: 'Chance', text: `🃏 ${player.name} drew: [${card.title}] - ${card.text}`, isSystem: true });
    if (card.action === 'cash') {
      player.cash = Math.max(0, player.cash + card.amount);
    } else if (card.action === 'tomatoes') {
      player.freeTomatoes += card.amount;
    } else if (card.action === 'move') {
      player.position = card.targetTile;
      player.cash += 200;
    } else if (card.action === 'jail') {
      player.position = 12;
      player.islandTurns = 3;
    }
    this.finishMove(player, isDoubles);
  }

  finishMove(player, isDoubles) {
    if (isDoubles && this.doublesCount > 0 && player.islandTurns === 0) {
      this.turnState = 'roll';
      this.startTurnTimer();
      this.addChatMessage({ sender: 'System', text: `✨ DOUBLES! ${player.name} rolls again!`, isSystem: true });
    } else {
      this.turnState = 'action';
    }
    this.emitChange();
  }

  buyCity(playerId, tileId, level = 1) {
    const player = this.players.find(p => p.id === playerId);
    const tile = TILES[tileId];
    const prop = this.properties[tileId];

    if (!player || !tile || tile.type !== 'city' || prop.ownerId) return false;

    // Calculate total cost for land + initial houses
    const cost = tile.price + (level - 1) * tile.housePrice;
    if (player.cash < cost) return false;

    player.cash -= cost;
    prop.ownerId = player.id;
    prop.level = level;
    prop.isLandmark = level === 5;

    this.addChatMessage({ sender: 'System', text: `🏗️ ${player.name} acquired ${tile.name} (Lvl ${level}) for $${cost}!`, isSystem: true });
    this.checkWinConditions();
    this.endTurn(playerId);
    return true;
  }

  buyoutCity(playerId, tileId) {
    const buyer = this.players.find(p => p.id === playerId);
    const tile = TILES[tileId];
    const prop = this.properties[tileId];

    if (!buyer || !tile || !prop.ownerId || prop.isLandmark) return false;

    const currentOwner = this.players.find(p => p.id === prop.ownerId);
    const totalVal = tile.price + (prop.level - 1) * tile.housePrice;
    const buyoutCost = totalVal * 2;

    if (buyer.cash < buyoutCost) return false;

    buyer.cash -= buyoutCost;
    currentOwner.cash += buyoutCost;
    prop.ownerId = buyer.id;
    prop.festival = false; // Reset festival on takeover

    this.addChatMessage({
      sender: 'System',
      text: `⚡ BUYOUT! ${buyer.name} snatched ${tile.name} from ${currentOwner.name} for $${buyoutCost}!`,
      isSystem: true
    });

    this.checkWinConditions();
    this.endTurn(playerId);
    return true;
  }

  upgradeCity(playerId, tileId) {
    const player = this.players.find(p => p.id === playerId);
    const tile = TILES[tileId];
    const prop = this.properties[tileId];

    if (!player || !tile || prop.ownerId !== playerId || prop.isLandmark) return false;

    const upgradeCost = tile.housePrice;
    if (player.cash < upgradeCost) return false;

    player.cash -= upgradeCost;
    prop.level += 1;
    if (prop.level >= 5) {
      prop.level = 5;
      prop.isLandmark = true;
      this.addChatMessage({ sender: 'System', text: `👑 LANDMARK ERECTED! ${player.name} built a Landmark in ${tile.name}! (Immune to Buyouts)`, isSystem: true });
    } else {
      this.addChatMessage({ sender: 'System', text: `🏡 ${player.name} upgraded ${tile.name} to Level ${prop.level}!`, isSystem: true });
    }

    this.checkWinConditions();
    this.endTurn(playerId);
    return true;
  }

  setFestival(playerId, tileId) {
    const player = this.players.find(p => p.id === playerId);
    const prop = this.properties[tileId];
    if (!player || !prop || prop.ownerId !== playerId) return false;

    // Reset old festival
    Object.values(this.properties).forEach(p => {
      if (p.ownerId === playerId) p.festival = false;
    });

    prop.festival = true;
    const tile = TILES[tileId];
    this.addChatMessage({ sender: 'System', text: `🎪 WORLD FAIR! ${player.name} is hosting the festival in ${tile.name}! (Rent Doubled 2x)`, isSystem: true });
    this.endTurn(playerId);
    return true;
  }

  throwTomato(fromPlayerId, targetPlayerId) {
    const thrower = this.players.find(p => p.id === fromPlayerId);
    const target = this.players.find(p => p.id === targetPlayerId);

    if (!thrower || !target || thrower.isBankrupt || target.isBankrupt || fromPlayerId === targetPlayerId) {
      return false;
    }

    if (thrower.freeTomatoes > 0) {
      thrower.freeTomatoes -= 1;
    } else {
      const tomatoCost = 100;
      if (thrower.cash < tomatoCost) return false;
      thrower.cash -= tomatoCost;
    }

    thrower.tomatoesThrown += 1;
    target.tomatoesHit += 1;

    this.callbacks.onTomatoHit({
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
    const current = this.getCurrentPlayer();
    if (current && current.id === playerId) {
      current.missedTurns = 0;
    }

    this.stopTurnTimer();
    this.doublesCount = 0;

    // Find next active player
    let nextIndex = (this.activePlayerIndex + 1) % this.players.length;
    let attempts = 0;
    while (this.players[nextIndex].isBankrupt && attempts < this.players.length) {
      nextIndex = (nextIndex + 1) % this.players.length;
      attempts += 1;
    }

    this.activePlayerIndex = nextIndex;
    this.turnState = 'roll';
    this.startTurnTimer();
    this.emitChange();

    if (this.getCurrentPlayer()?.isBot && this.status === 'playing') {
      setTimeout(() => this.triggerBotTurn(), 1200);
    }
  }

  declareBankruptcy(debtorId, creditorId) {
    const debtor = this.players.find(p => p.id === debtorId);
    if (!debtor) return;

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

    // Check Line Monopoly and Triple Monopoly for each player
    for (const player of activePlayers) {
      // 1. Line Monopoly (owns all properties on any 1 side)
      for (const [side, tileIds] of Object.entries(SIDE_PROPERTIES)) {
        const ownsLine = tileIds.every(tId => this.properties[tId]?.ownerId === player.id);
        if (ownsLine) {
          this.declareWinner(player, `line_monopoly (${side.toUpperCase()} Side)`);
          return;
        }
      }

      // 2. Triple Monopoly (owns 3 complete color sets)
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

    this.callbacks.onWin({
      winner,
      reason,
      players: this.players,
      hallOfFame: {
        tomatoTerrorist: [...this.players].sort((a, b) => b.tomatoesThrown - a.tomatoesThrown)[0],
        juiceSponge: [...this.players].sort((a, b) => b.tomatoesHit - a.tomatoesHit)[0],
      }
    });

    this.emitChange();
  }

  updateNetWorths() {
    this.players.forEach(p => {
      let propValue = 0;
      Object.keys(this.properties).forEach(tId => {
        const prop = this.properties[tId];
        if (prop.ownerId === p.id) {
          const tile = TILES[tId];
          propValue += tile.price + (prop.level - 1) * tile.housePrice;
        }
      });
      p.netWorth = p.cash + propValue;
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
      winner: this.winner,
      winReason: this.winReason,
      chat: this.chat,
    };
  }

  triggerBotTurn() {
    const current = this.getCurrentPlayer();
    if (!current || !current.isBot || this.status !== 'playing') return;

    if (this.turnState === 'roll') {
      this.rollDice(current.id);
    } else if (this.turnState === 'action') {
      const tile = TILES[current.position];
      const prop = this.properties[current.position];

      if (tile?.type === 'city') {
        if (!prop.ownerId && current.cash >= tile.price + tile.housePrice) {
          // Bot buys land + 1 house
          this.buyCity(current.id, current.position, 2);
          return;
        } else if (prop.ownerId === current.id && !prop.isLandmark && current.cash >= tile.housePrice * 2) {
          // Upgrade
          this.upgradeCity(current.id, current.position);
          return;
        } else if (prop.ownerId && prop.ownerId !== current.id && !prop.isLandmark) {
          // Buyout check if wealthy
          const buyoutCost = (tile.price + (prop.level - 1) * tile.housePrice) * 2;
          if (current.cash >= buyoutCost + 400) {
            this.buyoutCity(current.id, current.position);
            return;
          }
        }
      }

      // Random bot tomato throw at the richest human player!
      if (Math.random() < 0.35 && (current.freeTomatoes > 0 || current.cash > 800)) {
        const humanTargets = this.players.filter(p => !p.isBot && !p.isBankrupt);
        if (humanTargets.length > 0) {
          const victim = humanTargets.sort((a, b) => b.netWorth - a.netWorth)[0];
          this.throwTomato(current.id, victim.id);
        }
      }

      this.endTurn(current.id);
    } else if (this.turnState === 'debt') {
      this.declareBankruptcy(current.id, this.pendingDebt?.creditorId);
    } else {
      this.endTurn(current.id);
    }
  }
}
