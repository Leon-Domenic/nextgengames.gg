// Board Brawl Event & Action Cards Definition (Space Credits Economy)
// High-energy tactical cards inspired by modern board battlers & Business Tour

export const CARD_RARITY = {
  COMMON: {
    name: 'Common',
    color: '#94a3b8',
    bg: 'rgba(148, 163, 184, 0.15)',
    border: '#cbd5e1',
    description: 'Standard utility, liquidity boost, or minor tactical effect.',
  },
  RARE: {
    name: 'Rare',
    color: '#38bdf8',
    bg: 'rgba(56, 189, 248, 0.15)',
    border: '#38bdf8',
    description: 'Valuable tactical advantage, mobility jump, or cash infusion.',
  },
  EPIC: {
    name: 'Epic',
    color: '#c084fc',
    bg: 'rgba(192, 132, 252, 0.15)',
    border: '#c084fc',
    description: 'High-impact board control, heist, or strategic swing card.',
  },
  LEGENDARY: {
    name: 'Legendary',
    color: '#fbbf24',
    bg: 'rgba(251, 191, 36, 0.2)',
    border: '#f59e0b',
    description: 'Game-changing blessing, landmark grant, or premier protection.',
  },
  DISASTER: {
    name: 'Disaster',
    color: '#ef4444',
    bg: 'rgba(239, 68, 68, 0.2)',
    border: '#ef4444',
    description: 'Severe cosmic hazard, fine, tariff spike, or building sabotage.',
  },
};

// ==========================================
// 1. EVENT CARDS (Drawn automatically on Chance/Event tiles)
// ==========================================
export const EVENT_CARDS = [
  {
    id: 'bull_market',
    title: 'Bull Market Mania',
    rarity: 'EPIC',
    category: 'GLOBAL',
    icon: '📈',
    badge: 'ECONOMIC BOOM',
    description: 'Wall Street rallies! The global galactic treasury grants a stimulus of 250,000 Space Credits to EVERY player.',
    summary: '+250,000 Space Credits to All Players',
    sound: 'cash',
  },
  {
    id: 'bear_market',
    title: 'Black Swan Crash',
    rarity: 'DISASTER',
    category: 'GLOBAL',
    icon: '📉',
    badge: 'MARKET SHOCK',
    description: 'Cosmic liquidity squeeze! The wealthiest player pays 250,000 Space Credits luxury tax; all others pay 75,000 Space Credits.',
    summary: 'Tax on Wealthiest (250,000 CR)',
    sound: 'cash',
  },
  {
    id: 'typhoon_strike',
    title: 'Coastal Typhoon',
    rarity: 'DISASTER',
    category: 'DISASTER',
    icon: '🌪️',
    badge: 'DESTRUCTION',
    description: 'Category 5 solar hurricane strikes the highest-tier city on the board! It loses 1 house tier (owner gets 100,000 Space Credits insurance).',
    summary: 'Downgrades 1 High-Tier City',
    sound: 'taunt',
  },
  {
    id: 'guardian_angel',
    title: 'Guardian Angel',
    rarity: 'LEGENDARY',
    category: 'BLESSING',
    icon: '🛡️',
    badge: 'DIVINE SHIELD',
    description: 'A heavenly blessing envelops you! Blocks the next property toll you owe (100% shielded).',
    summary: 'Blocks Next Property Toll',
    sound: 'doubles',
  },
  {
    id: 'warp_speed',
    title: 'Suborbital Rocket',
    rarity: 'EPIC',
    category: 'MOBILITY',
    icon: '🚀',
    badge: 'WARP JUMP',
    description: 'Private spacecraft launch! Advance directly to Airport (Tile 16) and collect 200,000 Space Credits flight subsidy.',
    summary: 'Teleport to Airport + 200k CR',
    sound: 'move',
  },
  {
    id: 'robin_hood',
    title: 'Robin Hood Heist',
    rarity: 'RARE',
    category: 'WEALTH SWAP',
    icon: '🏹',
    badge: 'WEALTH REDISTRIBUTION',
    description: 'Merry space corsairs strike! Takes 150,000 Space Credits from the richest tycoon and transfers them directly to the poorest player.',
    summary: '150k CR Transfer: Richest ➔ Poorest',
    sound: 'cash',
  },
  {
    id: 'seed_round',
    title: 'Venture Capital Airdrop',
    rarity: 'RARE',
    category: 'FINANCIAL',
    icon: '💎',
    badge: 'SERIES A FUNDING',
    description: 'Deep-space investors fund your venture! Galactic bank pays you 300,000 Space Credits plus +1 random Action Card.',
    summary: '+300,000 Space Credits & +1 Card',
    sound: 'cash',
  },
  {
    id: 'grand_carnival',
    title: 'Grand Carnival',
    rarity: 'EPIC',
    category: 'FESTIVAL',
    icon: '🎪',
    badge: 'TOURIST SURGE',
    description: 'A massive world fair opens in one of your cities! Immediately bestows a 2X Festival multiplier.',
    summary: 'Free 2X Festival on Your City',
    sound: 'doubles',
  },
  {
    id: 'armory_supply',
    title: 'Armory Surplus',
    rarity: 'COMMON',
    category: 'COMBAT',
    icon: '🍅',
    badge: 'SPECIAL CRATE',
    description: 'Crate marked "FRAGILE & RIPE" arrives at your feet. Receive +4 Giant Tomatoes ready for action.',
    summary: '+4 Combat Tomatoes',
    sound: 'splat',
  },
  {
    id: 'cruise_break',
    title: 'Temple Expedition Rescue',
    rarity: 'RARE',
    category: 'RESCUE',
    icon: '🏛️',
    badge: 'EVACUATION',
    description: 'Expedition team rescues anyone trapped inside the Ancient Temple! If you are safe, collect a 150,000 Space Credits stipend.',
    summary: 'Free All Trapped Players or +150,000 CR',
    sound: 'cash',
  },
  {
    id: 'power_outage',
    title: 'Global Blackout',
    rarity: 'EPIC',
    category: 'TACTICAL',
    icon: '⚡',
    badge: 'ZERO TOLL ZONE',
    description: 'Municipal grid failure! All tolls and rent collection across the entire board are disabled for 1 full round.',
    summary: 'All Rents 0 for 1 Round',
    sound: 'taunt',
  },
  {
    id: 'landmark_grant',
    title: 'Architectural Heritage Grant',
    rarity: 'LEGENDARY',
    category: 'DEVELOPMENT',
    icon: '🏛️',
    badge: 'ROYAL DECREE',
    description: 'City council awards you an instant free Landmark construction upgrade on your most advanced property!',
    summary: 'Free Upgrade to Landmark Tier',
    sound: 'doubles',
  },
  {
    id: 'interpol_raid',
    title: 'Offshore Audit',
    rarity: 'DISASTER',
    category: 'ENFORCEMENT',
    icon: '🚨',
    badge: 'INTERPOL WARRANT',
    description: 'Financial regulators seize your offshore assets! Escorted directly to the Lost Island with a 120,000 Space Credits fine.',
    summary: 'Trapped on Lost Island (-120,000 CR)',
    sound: 'taunt',
  },
  {
    id: 'tax_dividend',
    title: 'Municipal Tax Refund',
    rarity: 'COMMON',
    category: 'FINANCIAL',
    icon: '🪐',
    badge: 'TREASURY REBATE',
    description: 'Galactic treasury audit discovers you were overtaxed in Monaco. Receive an immediate 175,000 Space Credits rebate.',
    summary: '+175,000 Space Credits Refund',
    sound: 'cash',
  },
  {
    id: 'championship_invite',
    title: 'VIP Tournament Invitation',
    rarity: 'RARE',
    category: 'MOBILITY',
    icon: '🏟️',
    badge: 'VIP ACCESS',
    description: 'First-class ticket to the World Fair! Advance directly to World Fair (Tile 12) to double city rents.',
    summary: 'Advance to World Fair (Tile 12)',
    sound: 'move',
  },
  {
    id: 'sticky_fingers_event',
    title: 'Pickpocket in the Crowd',
    rarity: 'EPIC',
    category: 'HEIST',
    icon: '🤏',
    badge: 'CARD YOINK',
    description: 'A nimble space pickpocket strikes! Snatches a random Action Card from the rival with the most cards and slips it directly into your hand.',
    summary: 'Yoinks 1 Card from Rival Tycoon',
    sound: 'taunt',
  },
  {
    id: 'nebula_jackpot',
    title: 'Nebula Powerball Jackpot',
    rarity: 'LEGENDARY',
    category: 'JACKPOT',
    icon: '🎰',
    badge: 'LOTTERY WINNER',
    description: 'Lucky space numbers match! Win 50% of the entire Community Pot + 250,000 Space Credits bonus from the Galactic Lottery.',
    summary: '50% Community Pot + 250k CR Bonus',
    sound: 'doubles',
  },
  {
    id: 'ransomware_hack',
    title: 'Cyber Syndicate Ransomware',
    rarity: 'DISASTER',
    category: 'SABOTAGE',
    icon: '👾',
    badge: 'CYBER EXTORTION',
    description: 'Rogue netrunners breach the board leader’s offshore account! The wealthiest player pays 200,000 Space Credits ransom into the Community Pot.',
    summary: 'Richest Pays 200k CR Ransom',
    sound: 'taunt',
  },
  {
    id: 'zero_g_bounce',
    title: 'Zero-G Cosmic Bounce',
    rarity: 'RARE',
    category: 'MOBILITY',
    icon: '🛰️',
    badge: 'GRAVITY DRIFT',
    description: 'Microgravity anomaly propels you forward 4 tiles through space, collecting a 100,000 Space Credits momentum stipend.',
    summary: 'Bounce +4 Tiles Forward & 100k CR',
    sound: 'move',
  },
  {
    id: 'orbital_bounty',
    title: 'Interstellar Bounty Hunt',
    rarity: 'EPIC',
    category: 'BOUNTY',
    icon: '🎯',
    badge: 'HEADHUNTER',
    description: 'Galactic syndicate claims a bounty on the board leader! You collect an immediate 350,000 Space Credits bounty payout.',
    summary: '+350,000 Space Credits Bounty',
    sound: 'cash',
  },
  {
    id: 'supernova_stimulus',
    title: 'Supernova Stimulus Package',
    rarity: 'RARE',
    category: 'STIMULUS',
    icon: '🌟',
    badge: 'ECONOMIC BOOST',
    description: 'Treasury injects fresh liquidity! Collect 220,000 Space Credits.',
    summary: '+220,000 Space Credits',
    sound: 'cash',
  },
  {
    id: 'earthquake',
    title: 'Seismic Quake',
    rarity: 'DISASTER',
    category: 'DISASTER',
    icon: '🌋',
    badge: 'SEISMIC QUAKE',
    description: 'Tectonic shockwaves rock the galaxy! Every built city across the board loses 1 house tier.',
    summary: 'All Built Cities Lose 1 Tier',
    sound: 'taunt',
  },
  {
    id: 'city_shield',
    title: 'Fortress City Shield',
    rarity: 'LEGENDARY',
    category: 'PROTECTION',
    icon: '🏰',
    badge: 'FORTRESS SHIELD',
    description: 'Deploys an impenetrable orbital dome over a chosen city you own! Protects it from buyouts and sabotage for 3 rounds.',
    summary: 'Shields Chosen City (3 Rounds)',
    sound: 'doubles',
  },
  {
    id: 'luxury_fine',
    title: 'Galactic Traffic Fine',
    rarity: 'DISASTER',
    category: 'PENALTY',
    icon: '🚓',
    badge: 'GALACTIC FINE',
    description: 'Orbital patrol clocks your cruiser over the speed limit! Pay an immediate 150,000 Space Credits fine.',
    summary: '-150,000 Space Credits Fine',
    sound: 'taunt',
  },
  {
    id: 'double_rent_curse',
    title: 'Tourist Tariff Spike',
    rarity: 'DISASTER',
    category: 'CURSE',
    icon: '💸',
    badge: 'DOUBLE RENT CURSE',
    description: 'Hyper-inflation hits your travel itinerary! You must pay 2X rent on your next visit to an opponent city.',
    summary: 'Double Rent on Next Visit',
    sound: 'taunt',
  },
  {
    id: 'half_rent_pass',
    title: 'VIP Diplomatic Pass',
    rarity: 'EPIC',
    category: 'BLESSING',
    icon: '🎫',
    badge: '50% RENT DISCOUNT',
    description: 'Diplomatic immunity granted! Pay 50% less rent the next time you land on any opponent property.',
    summary: '50% Off Next Rent',
    sound: 'doubles',
  },
  {
    id: 'pickpocket_steal',
    title: 'Syndicate Heist',
    rarity: 'EPIC',
    category: 'HEIST',
    icon: '🕵️',
    badge: 'SYNDICATE HEIST',
    description: 'Hire a shadow syndicate operative! Choose any rival tycoon and steal 150,000 Space Credits directly from their vault.',
    summary: 'Steal 150K from Chosen Player',
    sound: 'cash',
  },
];

// ==========================================
// 2. PLAYABLE ACTION CARDS (Held in Player Hand)
// ==========================================
export const ACTION_CARDS = [
  {
    id: 'loaded_dice',
    title: 'Loaded Dice',
    rarity: 'EPIC',
    icon: '🎲',
    badge: 'CONTROL',
    targetType: 'number', // 2 through 12
    description: 'Rig the dice! Choose the exact roll (from 2 to 12) for your next move. Perfect for hitting Start, Championships, or dodging danger.',
    actionText: 'SET EXACT ROLL',
    visualTheme: 'from-cyan-500 to-blue-600',
    sound: 'dice',
  },
  {
    id: 'demolition_strike',
    title: 'Demolition Crew',
    rarity: 'EPIC',
    icon: '🌪️',
    badge: 'SABOTAGE',
    targetType: 'tile', // opponent city tile
    description: 'Send a rogue demolition squad to downgrade 1 house tier from an opponent’s city or destroy their 2X Festival bonus!',
    actionText: 'DEMOLISH CITY TIER',
    visualTheme: 'from-rose-500 to-red-600',
    sound: 'taunt',
  },
  {
    id: 'remote_buy',
    title: 'Venture Buyout',
    rarity: 'RARE',
    icon: '🎯',
    badge: 'ACQUISITION',
    targetType: 'tile', // unowned city tile
    description: 'Wire purchase funds instantly! Buy any unowned city on the board from anywhere without having to land on it.',
    actionText: 'REMOTE PURCHASE',
    visualTheme: 'from-emerald-500 to-teal-600',
    sound: 'cash',
  },
  {
    id: 'gravity_magnet',
    title: 'Magnetic Siren',
    rarity: 'EPIC',
    icon: '🧲',
    badge: 'PULL TRAP',
    targetType: 'player', // opponent player
    description: 'Activate high-powered electromagnet! Force an opponent within 6 tiles to teleport directly onto your current tile (paying full rent if yours)!',
    actionText: 'PULL RIVAL HERE',
    visualTheme: 'from-purple-500 to-indigo-600',
    sound: 'move',
  },
  {
    id: 'warp_drive',
    title: 'Quantum Portal',
    rarity: 'EPIC',
    icon: '🚀',
    badge: 'TELEPORT',
    targetType: 'tile', // any corner: 0 (Start), 8 (Ancient Temple), 16 (World Championship), 24 (World Tour)
    description: 'Open a temporal rift! Instantly teleport to START (collecting 200,000 Space Credits salary), Ancient Temple, World Championship, or World Tour.',
    actionText: 'WARP TO CORNER',
    visualTheme: 'from-sky-500 to-blue-600',
    sound: 'move',
  },
  {
    id: 'prison_break',
    title: 'Master Keycard',
    rarity: 'COMMON',
    icon: '🗝️',
    badge: 'FREEDOM',
    targetType: 'self',
    description: 'Unlock the hidden passage! Instantly escape from the Ancient Temple with zero fines and take an immediate bonus roll.',
    actionText: 'ESCAPE TEMPLE',
    visualTheme: 'from-slate-500 to-zinc-600',
    sound: 'move',
  },
  {
    id: 'emergency_credit',
    title: 'Emergency Credit',
    rarity: 'COMMON',
    icon: '🪐',
    badge: 'LIQUIDITY',
    targetType: 'self',
    description: 'Emergency central bank bailout! Wire 300,000 Space Credits directly into your account with zero interest.',
    actionText: 'CLAIM 300,000 CR BAILOUT',
    visualTheme: 'from-emerald-500 to-green-600',
    sound: 'cash',
  },
  {
    id: 'vip_escape_pass',
    title: 'Temple Escape Pass',
    rarity: 'RARE',
    icon: '🎟️',
    badge: 'TEMPLE ESCAPE',
    targetType: 'self',
    description: 'Escape the Ancient Temple immediately for free! Can be traded to opponents or used as loan collateral.',
    actionText: 'REDEEM ESCAPE PASS',
    visualTheme: 'from-amber-500 to-yellow-600',
    sound: 'doubles',
  },
  {
    id: 'card_yoink',
    title: 'Sticky Fingers',
    rarity: 'EPIC',
    icon: '🤏',
    badge: 'CARD YOINK',
    targetType: 'player', // rival player with cards
    description: 'A sneaky cyber-glove snatches victory! Choose a rival tycoon to sneak into their dock and YOINK a random Action Card directly into your hand.',
    actionText: 'YOINK CARD',
    visualTheme: 'from-amber-500 via-orange-500 to-rose-600',
    sound: 'taunt',
  },
];

export function getRandomEventCard() {
  return EVENT_CARDS[Math.floor(Math.random() * EVENT_CARDS.length)];
}

export function getRandomActionCard() {
  return ACTION_CARDS[Math.floor(Math.random() * ACTION_CARDS.length)];
}

export function getActionCard(id) {
  return ACTION_CARDS.find(c => c.id === id);
}

export function getEventCard(id) {
  return EVENT_CARDS.find(c => c.id === id);
}

/**
 * Returns rarity styling and description metadata for a card rarity key.
 * @param {string} rarity - Rarity identifier (COMMON, RARE, EPIC, LEGENDARY, DISASTER)
 * @returns {{name: string, color: string, bg: string, border: string, description: string}}
 */
export function getCardRarity(rarity) {
  return CARD_RARITY[String(rarity || '').toUpperCase()] || CARD_RARITY.COMMON;
}

/**
 * Looks up any Event or Action card by its unique id.
 * @param {string} id - Card id
 * @returns {object|undefined}
 */
export function getAnyCard(id) {
  return getEventCard(id) || getActionCard(id);
}

/**
 * Filters Event Cards by rarity tier.
 * @param {string} rarity - Rarity identifier
 * @returns {Array<object>}
 */
export function getEventCardsByRarity(rarity) {
  const norm = String(rarity || '').toUpperCase();
  return EVENT_CARDS.filter(c => c.rarity === norm);
}

/**
 * Filters Action Cards by rarity tier.
 * @param {string} rarity - Rarity identifier
 * @returns {Array<object>}
 */
export function getActionCardsByRarity(rarity) {
  const norm = String(rarity || '').toUpperCase();
  return ACTION_CARDS.filter(c => c.rarity === norm);
}
