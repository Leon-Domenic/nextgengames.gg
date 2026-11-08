// Board Brawl P2P Trade, Negotiation & Loan Engine
// Real-time bilateral asset swaps, multi-party debt obligations & autonomous bot evaluation

import { TILES, COLOR_GROUPS } from './types.js';

/**
 * Validates a proposed trade or counter-offer before execution.
 * @param {object} game - BoardBrawlGame instance
 * @param {object} trade - { proposerId, targetId, offer }
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateTrade(game, trade) {
  if (!game || !trade) {
    return { valid: false, error: 'Invalid trade structure' };
  }

  const { proposerId, targetId, offer } = trade;
  if (!proposerId || !targetId || proposerId === targetId) {
    return { valid: false, error: 'Invalid trade parties' };
  }

  const proposer = game.players.find(p => p.id === proposerId);
  const target = game.players.find(p => p.id === targetId);

  if (!proposer || !target) {
    return { valid: false, error: 'One or both players not found' };
  }

  if (proposer.isBankrupt || target.isBankrupt) {
    return { valid: false, error: 'Bankrupt players cannot trade' };
  }

  const {
    proposerTileIds = [],
    proposerCardIds = [],
    proposerCash = 0,
    targetTileIds = [],
    targetCardIds = [],
    targetCash = 0,
    loan = null,
  } = offer || {};

  // 1. Property ownership check
  for (const tid of proposerTileIds) {
    const prop = game.properties[tid];
    if (!prop || prop.ownerId !== proposerId) {
      return { valid: false, error: `Proposer does not own tile #${tid}` };
    }
  }

  for (const tid of targetTileIds) {
    const prop = game.properties[tid];
    if (!prop || prop.ownerId !== targetId) {
      return { valid: false, error: `Target does not own tile #${tid}` };
    }
  }

  // 2. Action Card ownership & Hand limit checks
  const proposerCards = proposer.cards || [];
  const targetCards = target.cards || [];

  for (const cid of proposerCardIds) {
    if (!proposerCards.some(c => c.id === cid)) {
      return { valid: false, error: `Proposer does not hold action card ${cid}` };
    }
  }

  for (const cid of targetCardIds) {
    if (!targetCards.some(c => c.id === cid)) {
      return { valid: false, error: `Target does not hold action card ${cid}` };
    }
  }

  const proposerNewCardCount = proposerCards.length - proposerCardIds.length + targetCardIds.length;
  const targetNewCardCount = targetCards.length - targetCardIds.length + proposerCardIds.length;

  if (proposerNewCardCount > 3) {
    return { valid: false, error: `Proposer would exceed max 3 hand action cards limit (${proposerNewCardCount})` };
  }
  if (targetNewCardCount > 3) {
    return { valid: false, error: `Target would exceed max 3 hand action cards limit (${targetNewCardCount})` };
  }

  // 3. Cash Liquidity Check
  let proposerRequiredCash = Math.max(0, proposerCash);
  let targetRequiredCash = Math.max(0, targetCash);

  // 4. Loan Validation
  if (loan && loan.principal > 0) {
    const creditorId = loan.creditorId;
    const borrowerId = loan.borrowerId;

    if (!creditorId || !borrowerId || creditorId === borrowerId) {
      return { valid: false, error: 'Invalid loan creditor/borrower' };
    }

    if (creditorId === proposerId) {
      proposerRequiredCash += loan.principal;
    } else if (creditorId === targetId) {
      targetRequiredCash += loan.principal;
    } else {
      return { valid: false, error: 'Loan creditor must be one of the trade parties' };
    }

    if (loan.collateralTileId != null) {
      const colProp = game.properties[loan.collateralTileId];
      if (!colProp || colProp.ownerId !== borrowerId) {
        return { valid: false, error: 'Borrower does not own the pledged collateral property' };
      }
    }

    if (!loan.roundsRemaining || loan.roundsRemaining <= 0) {
      return { valid: false, error: 'Loan term must be at least 1 round' };
    }
  }

  if (proposer.cash < proposerRequiredCash) {
    return { valid: false, error: `Proposer has insufficient cash (${proposer.cash.toLocaleString()} < ${proposerRequiredCash.toLocaleString()} CR)` };
  }

  if (target.cash < targetRequiredCash) {
    return { valid: false, error: `Target has insufficient cash (${target.cash.toLocaleString()} < ${targetRequiredCash.toLocaleString()} CR)` };
  }

  // Must trade at least something
  const hasItems = proposerTileIds.length > 0 ||
                   proposerCardIds.length > 0 ||
                   proposerCash > 0 ||
                   targetTileIds.length > 0 ||
                   targetCardIds.length > 0 ||
                   targetCash > 0 ||
                   (loan && loan.principal > 0);

  if (!hasItems) {
    return { valid: false, error: 'Trade basket cannot be completely empty' };
  }

  return { valid: true };
}

/**
 * Executes a validated trade atomically across properties, action cards, cash, and active loans.
 * @param {object} game - BoardBrawlGame instance
 * @param {object} trade - { proposerId, targetId, offer }
 * @returns {{ success: boolean, summary?: string, error?: string }}
 */
export function executeTrade(game, trade) {
  const check = validateTrade(game, trade);
  if (!check.valid) {
    return { success: false, error: check.error };
  }

  const { proposerId, targetId, offer } = trade;
  const proposer = game.players.find(p => p.id === proposerId);
  const target = game.players.find(p => p.id === targetId);

  const {
    proposerTileIds = [],
    proposerCardIds = [],
    proposerCash = 0,
    targetTileIds = [],
    targetCardIds = [],
    targetCash = 0,
    loan = null,
  } = offer;

  // 1. Transfer Properties
  proposerTileIds.forEach(tid => {
    if (game.properties[tid]) {
      game.properties[tid].ownerId = target.id;
      game.properties[tid].festival = false; // Reset festival boost on transfer
    }
  });

  targetTileIds.forEach(tid => {
    if (game.properties[tid]) {
      game.properties[tid].ownerId = proposer.id;
      game.properties[tid].festival = false; // Reset festival boost on transfer
    }
  });

  // 2. Transfer Hand Action Cards
  if (proposerCardIds.length > 0) {
    const movedToTarget = [];
    proposer.cards = (proposer.cards || []).filter(c => {
      if (proposerCardIds.includes(c.id) && movedToTarget.length < proposerCardIds.length) {
        movedToTarget.push(c);
        return false;
      }
      return true;
    });
    target.cards = (target.cards || []).concat(movedToTarget);
  }

  if (targetCardIds.length > 0) {
    const movedToProposer = [];
    target.cards = (target.cards || []).filter(c => {
      if (targetCardIds.includes(c.id) && movedToProposer.length < targetCardIds.length) {
        movedToProposer.push(c);
        return false;
      }
      return true;
    });
    proposer.cards = (proposer.cards || []).concat(movedToProposer);
  }

  // 3. Transfer Lump-sum Cash
  if (proposerCash > 0) {
    proposer.cash -= proposerCash;
    target.cash += proposerCash;
  }
  if (targetCash > 0) {
    target.cash -= targetCash;
    proposer.cash += targetCash;
  }

  // 4. Peer-to-Peer Loan Registration & Principal Disbursal
  let registeredLoan = null;
  if (loan && loan.principal > 0) {
    const creditor = game.players.find(p => p.id === loan.creditorId);
    const borrower = game.players.find(p => p.id === loan.borrowerId);

    if (creditor && borrower) {
      // Disburse principal immediately
      creditor.cash -= loan.principal;
      borrower.cash += loan.principal;

      const interestRate = loan.interestRate || 0;
      const totalRepay = Math.round(loan.principal * (1 + interestRate));
      const rounds = loan.roundsRemaining || 2;
      const perRound = Math.round(totalRepay / rounds);

      registeredLoan = {
        id: `loan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        creditorId: creditor.id,
        creditorName: creditor.name,
        borrowerId: borrower.id,
        borrowerName: borrower.name,
        principal: loan.principal,
        interestRate,
        totalRepayment: totalRepay,
        roundsRemaining: rounds,
        perRoundPayment: perRound,
        collateralTileId: loan.collateralTileId ?? null,
        active: true,
        createdAt: Date.now(),
      };

      if (!game.loans) game.loans = [];
      game.loans.push(registeredLoan);

      game.addChatMessage({
        sender: 'TradeBank',
        text: `📜 LOAN APPROVED: ${creditor.name} lent ${loan.principal.toLocaleString()} CR to ${borrower.name} at ${(interestRate * 100).toFixed(0)}% interest (${perRound.toLocaleString()} CR/salary for ${rounds} rounds)!`,
        isSystem: true,
      });
    }
  }

  // 5. Update Net Worths and check for monopolies
  game.updateNetWorths();

  // Create summary string
  const summary = formatTradeSummary(trade, game.players);
  game.addChatMessage({
    sender: 'TradeDesk',
    text: `🤝 DEAL COMPLETED! ${summary}`,
    isSystem: true,
  });

  return { success: true, summary, registeredLoan };
}

/**
 * Automatically garnishes loan installment payments when a debtor passes START or collects salary.
 * If the debtor defaults, transfers pledged collateral property to creditor.
 * @param {object} game - BoardBrawlGame instance
 * @param {object} player - Debtor player object
 * @param {number} salaryAmount - Salary collected (usually 200,000 CR)
 */
export function processLoanRepayments(game, player, salaryAmount = 200000) {
  if (!game || !player || !game.loans) return;

  const activeLoans = game.loans.filter(l => l.borrowerId === player.id && l.active && l.roundsRemaining > 0);
  if (activeLoans.length === 0) return;

  for (const loan of activeLoans) {
    const creditor = game.players.find(p => p.id === loan.creditorId);
    const installment = loan.perRoundPayment;

    if (!creditor || creditor.isBankrupt) {
      // Creditor is no longer in game, cancel loan
      loan.active = false;
      continue;
    }

    if (player.cash >= installment) {
      // Normal successful installment payment
      player.cash -= installment;
      creditor.cash += installment;
      loan.roundsRemaining -= 1;

      game.addChatMessage({
        sender: 'LoanDesk',
        text: `🏦 LOAN REPAID: ${player.name} paid ${installment.toLocaleString()} CR installment to ${creditor.name} (${loan.roundsRemaining} rounds left)!`,
        isSystem: true,
      });

      if (loan.roundsRemaining <= 0) {
        loan.active = false;
        game.addChatMessage({
          sender: 'LoanDesk',
          text: `🎉 DEBT CLEARED: ${player.name} has fully paid off their loan from ${creditor.name}!`,
          isSystem: true,
        });
      }
    } else {
      // DEFAULT: Debtor cannot afford installment
      game.addChatMessage({
        sender: 'DefaultNotice',
        text: `🚨 LOAN DEFAULT: ${player.name} could not pay ${installment.toLocaleString()} CR installment to ${creditor.name}!`,
        isSystem: true,
      });

      // Transfer pledged collateral property if borrower still owns it
      if (loan.collateralTileId != null) {
        const colProp = game.properties[loan.collateralTileId];
        const tileName = TILES[loan.collateralTileId]?.name || `Tile #${loan.collateralTileId}`;

        if (colProp && colProp.ownerId === player.id) {
          colProp.ownerId = creditor.id;
          colProp.festival = false;

          game.addChatMessage({
            sender: 'DefaultNotice',
            text: `⚖️ FORECLOSURE: Pledged collateral [${tileName}] has been seized by ${creditor.name}!`,
            isSystem: true,
          });
        }
      }

      // Garnish any remaining cash from debtor
      if (player.cash > 0) {
        const remainingCash = player.cash;
        player.cash = 0;
        creditor.cash += remainingCash;
        game.addChatMessage({
          sender: 'LoanDesk',
          text: `💸 Garnished remaining ${remainingCash.toLocaleString()} CR from ${player.name} to ${creditor.name}.`,
          isSystem: true,
        });
      }

      // Close defaulted loan
      loan.active = false;
      loan.defaulted = true;
    }
  }

  game.updateNetWorths();
}

/**
 * Handles bankruptcy foreclosure of collateral loans.
 * @param {object} game - BoardBrawlGame instance
 * @param {string} bankruptPlayerId - ID of bankrupt debtor
 */
export function handleBankruptcyLoans(game, bankruptPlayerId) {
  if (!game || !game.loans) return;

  const loans = game.loans.filter(l => l.borrowerId === bankruptPlayerId && l.active);
  for (const loan of loans) {
    const creditor = game.players.find(p => p.id === loan.creditorId);
    if (creditor && loan.collateralTileId != null) {
      const colProp = game.properties[loan.collateralTileId];
      if (colProp && colProp.ownerId === bankruptPlayerId) {
        colProp.ownerId = creditor.id;
        colProp.festival = false;
        game.addChatMessage({
          sender: 'BankruptcyCourt',
          text: `⚖️ ${creditor.name} foreclosed on collateral [${TILES[loan.collateralTileId]?.name}] from bankrupt debtor ${loan.borrowerName}!`,
          isSystem: true,
        });
      }
    }
    loan.active = false;
    loan.defaulted = true;
  }
}

/**
 * Autonomous Bot Negotiation AI
 * Evaluates a proposed trade using net utility score (property synergy + card tactical value + cash need).
 * Decides whether to accept, counter with a cash adjustment, or decline.
 * @param {object} game - BoardBrawlGame instance
 * @param {object} botPlayer - Bot player evaluating the offer
 * @param {object} trade - { id, proposerId, targetId, offer }
 * @returns {{ decision: 'accept' | 'counter' | 'decline', counterOffer?: object, reason?: string }}
 */
export function evaluateBotTrade(game, botPlayer, trade) {
  if (!game || !botPlayer || !trade) {
    return { decision: 'decline', reason: 'Invalid parameters' };
  }

  const isBotTarget = trade.targetId === botPlayer.id;
  const rivalId = isBotTarget ? trade.proposerId : trade.targetId;
  const rival = game.players.find(p => p.id === rivalId);

  if (!rival) {
    return { decision: 'decline', reason: 'Opponent not found' };
  }

  const {
    proposerTileIds = [],
    proposerCardIds = [],
    proposerCash = 0,
    targetTileIds = [],
    targetCardIds = [],
    targetCash = 0,
    loan = null,
  } = trade.offer || {};

  // What the bot gains vs what the bot gives away
  const gainedTileIds = isBotTarget ? proposerTileIds : targetTileIds;
  const gainedCardIds = isBotTarget ? proposerCardIds : targetCardIds;
  const gainedCash = isBotTarget ? proposerCash : targetCash;

  const lostTileIds = isBotTarget ? targetTileIds : proposerTileIds;
  const lostCardIds = isBotTarget ? targetCardIds : proposerCardIds;
  const lostCash = isBotTarget ? targetCash : proposerCash;

  // Bot Cash need factor: cash-poor bots value cash much higher
  const botCash = botPlayer.cash || 0;
  let cashMultiplier = 1.0;
  if (botCash < 300000) {
    cashMultiplier = 1.45; // Desperate for cash
  } else if (botCash < 600000) {
    cashMultiplier = 1.2;
  } else if (botCash > 2000000) {
    cashMultiplier = 0.85; // Cash rich, values properties much more
  }

  // 1. Calculate Utility of Gained Assets
  let gainedUtility = gainedCash * cashMultiplier;

  // Evaluate Gained Properties
  for (const tid of gainedTileIds) {
    const tile = TILES[tid];
    if (!tile) continue;
    const prop = game.properties[tid] || {};
    const baseValue = tile.price + (prop.level > 1 ? (prop.level - 1) * (tile.housePrice || 50000) : 0);

    // Synergy: does this give the bot a monopoly?
    const colorTiles = COLOR_GROUPS[tile.colorGroup] || [];
    const ownedInGroup = colorTiles.filter(t => game.properties[t]?.ownerId === botPlayer.id);

    let synergyFactor = 1.15;
    if (ownedInGroup.length === colorTiles.length - 1) {
      // Completes bot's monopoly!
      synergyFactor = 2.4;
    } else if (ownedInGroup.length > 0) {
      synergyFactor = 1.5;
    }

    gainedUtility += baseValue * synergyFactor;
  }

  // Evaluate Gained Action Cards
  const CARD_VALUES = {
    toll_shield: 250000,
    loaded_dice: 150000,
    demolition_strike: 200000,
    warp_rocket: 180000,
    hostile_takeover: 350000,
    emergency_credit: 120000,
    tax_audit: 140000,
    rent_surge: 175000,
    prison_break: 100000,
    vip_escape_pass: 180000,
  };

  for (const cid of gainedCardIds) {
    gainedUtility += (CARD_VALUES[cid] || 100000) * 1.1;
  }

  // 2. Calculate Utility of Lost Assets
  let lostUtility = lostCash * (cashMultiplier >= 1.2 ? 1.5 : 1.0);

  // Evaluate Lost Properties
  for (const tid of lostTileIds) {
    const tile = TILES[tid];
    if (!tile) continue;
    const prop = game.properties[tid] || {};
    const baseValue = tile.price + (prop.level > 1 ? (prop.level - 1) * (tile.housePrice || 50000) : 0);

    // Check if bot is breaking its own monopoly
    const colorTiles = COLOR_GROUPS[tile.colorGroup] || [];
    const botOwnedInGroup = colorTiles.filter(t => game.properties[t]?.ownerId === botPlayer.id);
    const rivalOwnedInGroup = colorTiles.filter(t => game.properties[t]?.ownerId === rival.id);

    let penaltyFactor = 1.1;
    if (botOwnedInGroup.length === colorTiles.length) {
      // Bot is giving away a monopoly property: huge penalty!
      penaltyFactor = 3.2;
    } else if (rivalOwnedInGroup.length === colorTiles.length - 1) {
      // Giving this to rival will complete RIVAL'S monopoly: block!
      penaltyFactor = 2.5;
    }

    lostUtility += baseValue * penaltyFactor;
  }

  // Evaluate Lost Action Cards
  for (const cid of lostCardIds) {
    lostUtility += (CARD_VALUES[cid] || 100000) * 1.2;
  }

  // Handle Loan evaluation if proposed
  if (loan && loan.principal > 0) {
    if (loan.borrowerId === botPlayer.id) {
      // Bot is borrowing: wants cash if cash-strapped
      const interestPenalty = loan.totalRepayment - loan.principal;
      if (botCash < 300000) {
        gainedUtility += loan.principal * 1.3;
        lostUtility += interestPenalty * 0.8;
      } else {
        // Doesn't need high-interest loan
        lostUtility += loan.totalRepayment * 1.1;
      }
    } else if (loan.creditorId === botPlayer.id) {
      // Bot is lending: only lends if rich and interest >= 10%
      if (botCash > 1000000 && (loan.interestRate || 0) >= 0.1) {
        gainedUtility += (loan.totalRepayment - loan.principal) * 1.5;
      } else {
        lostUtility += loan.principal * 1.5;
      }
    }
  }

  const netDeltaUtility = gainedUtility - lostUtility;

  // Bot Decision Logic:
  // Accept if net utility is positive
  if (netDeltaUtility >= 0) {
    return {
      decision: 'accept',
      reason: 'Favorable utility valuation',
    };
  }

  // Counter if trade is reasonably close (-150,000 <= delta < 0)
  if (netDeltaUtility >= -150000) {
    const cashAdjustment = Math.ceil(Math.abs(netDeltaUtility) / 25000) * 25000;
    const rivalMaxCash = rival.cash || 0;

    const counterOffer = JSON.parse(JSON.stringify(trade.offer));

    if (isBotTarget) {
      // Bot was requested to give more than it gets: ask proposer for more cash
      const newRequestedCash = (counterOffer.proposerCash || 0) + cashAdjustment;
      if (newRequestedCash <= rivalMaxCash) {
        counterOffer.proposerCash = newRequestedCash;
        return {
          decision: 'counter',
          counterOffer,
          reason: `Requires ${cashAdjustment.toLocaleString()} CR sweetener to equalize trade value`,
        };
      }
    } else {
      // Bot was proposing: decrease cash bot gives or request more cash from target
      const newTargetCash = (counterOffer.targetCash || 0) + cashAdjustment;
      if (newTargetCash <= rivalMaxCash) {
        counterOffer.targetCash = newTargetCash;
        return {
          decision: 'counter',
          counterOffer,
          reason: `Balanced counter-offer with +${cashAdjustment.toLocaleString()} CR`,
        };
      }
    }
  }

  // Otherwise decline
  return {
    decision: 'decline',
    reason: 'Valuation disparity too large to negotiate',
  };
}

/**
 * Formats a clean human-readable summary of a trade deal.
 */
export function formatTradeSummary(trade, players = []) {
  const { proposerId, targetId, offer } = trade;
  const proposer = players.find(p => p.id === proposerId);
  const target = players.find(p => p.id === targetId);

  const pName = proposer?.name || 'Proposer';
  const tName = target?.name || 'Target';

  const pGives = [];
  if (offer.proposerTileIds?.length) {
    pGives.push(offer.proposerTileIds.map(tid => TILES[tid]?.name || `#${tid}`).join(', '));
  }
  if (offer.proposerCardIds?.length) {
    pGives.push(`${offer.proposerCardIds.length} Card(s)`);
  }
  if (offer.proposerCash > 0) {
    pGives.push(`${offer.proposerCash.toLocaleString()} CR`);
  }

  const tGives = [];
  if (offer.targetTileIds?.length) {
    tGives.push(offer.targetTileIds.map(tid => TILES[tid]?.name || `#${tid}`).join(', '));
  }
  if (offer.targetCardIds?.length) {
    tGives.push(`${offer.targetCardIds.length} Card(s)`);
  }
  if (offer.targetCash > 0) {
    tGives.push(`${offer.targetCash.toLocaleString()} CR`);
  }

  if (offer.loan && offer.loan.principal > 0) {
    const borrowerName = offer.loan.borrowerId === proposerId ? pName : tName;
    pGives.push(`Loan: ${offer.loan.principal.toLocaleString()} CR to ${borrowerName}`);
  }

  const pSummary = pGives.length > 0 ? pGives.join(' + ') : 'Nothing';
  const tSummary = tGives.length > 0 ? tGives.join(' + ') : 'Nothing';

  return `${pName} gives [${pSummary}] ➔ ${tName} gives [${tSummary}]`;
}
