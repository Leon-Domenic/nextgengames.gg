// Board Brawl Tile and Rules Definitions (Space Credits Economy)

export const TILES = [
  // Bottom side (indices 0 to 7)
  { id: 0, name: 'START', type: 'start', description: 'Collect 200,000 Space Credits salary on pass or landing. Landing directly activates Launchpad Privileges (One More Roll, Remote Upgrade, Planetary Shield)!', icon: '🚀' },
  { id: 1, name: 'Cairo', type: 'city', color: '#8d6e63', colorGroup: 'brown', price: 100000, housePrice: 50000, rent: [20000, 60000, 150000, 300000, 500000], country: 'Egypt', flag: '🇪🇬' },
  { id: 2, name: 'Chance', type: 'chance', description: 'Draw a tactical Chance card', icon: '❓' },
  { id: 3, name: 'Giza', type: 'city', color: '#8d6e63', colorGroup: 'brown', price: 120000, housePrice: 60000, rent: [25000, 75000, 180000, 360000, 600000], country: 'Egypt', flag: '🇪🇬' },
  { id: 4, name: 'City Tax', type: 'tax', amount: 120000, description: 'Pay municipal development tax (120,000 CR)', icon: '💸' },
  { id: 5, name: 'Prague', type: 'city', color: '#38bdf8', colorGroup: 'light_blue', price: 140000, housePrice: 70000, rent: [30000, 90000, 220000, 440000, 700000], country: 'Czechia', flag: '🇨🇿' },
  { id: 6, name: 'Cyprus', type: 'resort', color: '#06b6d4', price: 150000, baseRent: 35000, country: 'Cyprus', flag: '🇨🇾', description: 'Line 0 Mediterranean Resort. Rent doubles per resort owned!' },
  { id: 7, name: 'Vienna', type: 'city', color: '#38bdf8', colorGroup: 'light_blue', price: 160000, housePrice: 80000, rent: [35000, 110000, 260000, 500000, 800000], country: 'Austria', flag: '🇦🇹' },

  // Left side (indices 8 to 15)
  { id: 8, name: 'Lost Island', type: 'jail', description: 'Lost Island ancient jungle ruins. Stranded for 3 turns (or roll doubles / pay 100,000 CR to escape)', icon: '🏝️' },
  { id: 9, name: 'Madrid', type: 'city', color: '#ec4899', colorGroup: 'pink', price: 180000, housePrice: 90000, rent: [40000, 125000, 300000, 600000, 950000], country: 'Spain', flag: '🇪🇸' },
  { id: 10, name: 'Chance', type: 'chance', description: 'Draw a tactical Chance card', icon: '❓' },
  { id: 11, name: 'Rome', type: 'city', color: '#ec4899', colorGroup: 'pink', price: 200000, housePrice: 100000, rent: [45000, 140000, 350000, 700000, 1100000], country: 'Italy', flag: '🇮🇹' },
  { id: 12, name: 'Ibiza', type: 'resort', color: '#06b6d4', price: 200000, baseRent: 50000, country: 'Spain', flag: '🇪🇸', description: 'Line 1 Balearic Island Resort. Rent doubles per resort owned!' },
  { id: 13, name: 'Berlin', type: 'city', color: '#f97316', colorGroup: 'orange', price: 220000, housePrice: 110000, rent: [50000, 160000, 400000, 800000, 1250000], country: 'Germany', flag: '🇩🇪' },
  { id: 14, name: 'Mystery', type: 'chance', description: 'Lucky bonus or surprise fee', icon: '🎁' },
  { id: 15, name: 'Amsterdam', type: 'city', color: '#f97316', colorGroup: 'orange', price: 240000, housePrice: 120000, rent: [55000, 180000, 450000, 900000, 1400000], country: 'Netherlands', flag: '🇳🇱' },

  // Top side (indices 16 to 23)
  { id: 16, name: 'World Championship', type: 'championship', description: 'Host the World Championship on one of your cities to double its rent yield (2X Rent Host)!', icon: '🏆' },
  { id: 17, name: 'London', type: 'city', color: '#ef4444', colorGroup: 'red', price: 260000, housePrice: 130000, rent: [60000, 200000, 500000, 1000000, 1600000], country: 'UK', flag: '🇬🇧' },
  { id: 18, name: 'Chance', type: 'chance', description: 'Draw a tactical Chance card', icon: '❓' },
  { id: 19, name: 'Paris', type: 'city', color: '#ef4444', colorGroup: 'red', price: 280000, housePrice: 140000, rent: [70000, 225000, 550000, 1100000, 1750000], country: 'France', flag: '🇫🇷' },
  { id: 20, name: 'Dubai', type: 'resort', color: '#06b6d4', price: 250000, baseRent: 65000, country: 'UAE', flag: '🇦🇪', description: 'Line 2 Luxury Desert Resort. Rent doubles per resort owned!' },
  { id: 21, name: 'Tokyo', type: 'city', color: '#eab308', colorGroup: 'yellow', price: 300000, housePrice: 150000, rent: [80000, 250000, 650000, 1300000, 2000000], country: 'Japan', flag: '🇯🇵' },
  { id: 22, name: 'World Fair', type: 'festival', description: 'Host festival on one of your cities to double (2x) rent!', icon: '🎪' },
  { id: 23, name: 'Seoul', type: 'city', color: '#eab308', colorGroup: 'yellow', price: 320000, housePrice: 160000, rent: [90000, 280000, 720000, 1450000, 2200000], country: 'South Korea', flag: '🇰🇷' },

  // Right side (indices 24 to 31)
  { id: 24, name: 'World Tour', type: 'world_tour', description: 'Pay 50,000 CR flight ticket to travel to ANY neutral or owned city!', icon: '✈️' },
  { id: 25, name: 'Singapore', type: 'city', color: '#10b981', colorGroup: 'green', price: 350000, housePrice: 175000, rent: [100000, 320000, 800000, 1600000, 2500000], country: 'Singapore', flag: '🇸🇬' },
  { id: 26, name: 'Chance', type: 'chance', description: 'Draw a tactical Chance card', icon: '❓' },
  { id: 27, name: 'Abu Dhabi', type: 'city', color: '#10b981', colorGroup: 'green', price: 400000, housePrice: 200000, rent: [120000, 380000, 950000, 1900000, 3000000], country: 'UAE', flag: '🇦🇪' },
  { id: 28, name: 'Maldives', type: 'resort', color: '#06b6d4', price: 300000, baseRent: 80000, country: 'Maldives', flag: '🇲🇻', description: 'Line 3 Tropical Atoll Resort. Rent doubles per resort owned!' },
  { id: 29, name: 'Sydney', type: 'city', color: '#6366f1', colorGroup: 'dark_blue', price: 450000, housePrice: 225000, rent: [140000, 450000, 1100000, 2200000, 3500000], country: 'Australia', flag: '🇦🇺' },
  { id: 30, name: 'Mystery', type: 'chance', description: 'Lucky bonus or surprise fee', icon: '🎁' },
  { id: 31, name: 'New York', type: 'city', color: '#6366f1', colorGroup: 'dark_blue', price: 500000, housePrice: 250000, rent: [175000, 550000, 1350000, 2700000, 4200000], country: 'USA', flag: '🇺🇸' },
];

export const RESORT_TILES = [6, 12, 20, 28];

// ==========================================
// 3v3 HIERARCHICAL COLOR SYSTEM WITH SUBCOLORS
// 6 Distinct Color Families x 3 Coordinated Shades (Primary + 2 Subcolors = 18 Shades)
// ==========================================
export const PLAYER_COLOR_FAMILIES = [
  {
    id: 'cyan',
    name: 'Cyan / Azure Team',
    baseHex: '#00f0ff',
    headerBg: '#0284c7',
    subcolors: [
      { id: 'cyan_primary', name: 'Electric Cyan', hex: '#00f0ff', accent: '#0284c7', headerBg: '#0284c7', shadeRole: 'Primary' },
      { id: 'cyan_sub1', name: 'Sky Azure', hex: '#38bdf8', accent: '#0369a1', headerBg: '#0369a1', shadeRole: 'Subcolor 1' },
      { id: 'cyan_sub2', name: 'Deep Cobalt', hex: '#0284c7', accent: '#075985', headerBg: '#075985', shadeRole: 'Subcolor 2' },
    ],
  },
  {
    id: 'crimson',
    name: 'Crimson / Ruby Team',
    baseHex: '#ef4444',
    headerBg: '#dc2626',
    subcolors: [
      { id: 'crimson_primary', name: 'Inferno Crimson', hex: '#ef4444', accent: '#b91c1c', headerBg: '#dc2626', shadeRole: 'Primary' },
      { id: 'crimson_sub1', name: 'Coral Flame', hex: '#f87171', accent: '#dc2626', headerBg: '#ef4444', shadeRole: 'Subcolor 1' },
      { id: 'crimson_sub2', name: 'Dark Ruby', hex: '#991b1b', accent: '#7f1d1d', headerBg: '#991b1b', shadeRole: 'Subcolor 2' },
    ],
  },
  {
    id: 'emerald',
    name: 'Emerald / Mint Team',
    baseHex: '#10b981',
    headerBg: '#059669',
    subcolors: [
      { id: 'emerald_primary', name: 'Cyber Emerald', hex: '#10b981', accent: '#059669', headerBg: '#059669', shadeRole: 'Primary' },
      { id: 'emerald_sub1', name: 'Mint Neon', hex: '#34d399', accent: '#059669', headerBg: '#10b981', shadeRole: 'Subcolor 1' },
      { id: 'emerald_sub2', name: 'Deep Forest', hex: '#065f46', accent: '#064e3b', headerBg: '#065f46', shadeRole: 'Subcolor 2' },
    ],
  },
  {
    id: 'gold',
    name: 'Gold / Amber Team',
    baseHex: '#f59e0b',
    headerBg: '#d97706',
    subcolors: [
      { id: 'gold_primary', name: 'Vegas Gold', hex: '#f59e0b', accent: '#d97706', headerBg: '#d97706', shadeRole: 'Primary' },
      { id: 'gold_sub1', name: 'Sunburst Amber', hex: '#fbbf24', accent: '#d97706', headerBg: '#f59e0b', shadeRole: 'Subcolor 1' },
      { id: 'gold_sub2', name: 'Burnished Bronze', hex: '#b45309', accent: '#78350f', headerBg: '#b45309', shadeRole: 'Subcolor 2' },
    ],
  },
  {
    id: 'purple',
    name: 'Purple / Lavender Team',
    baseHex: '#8b5cf6',
    headerBg: '#7c3aed',
    subcolors: [
      { id: 'purple_primary', name: 'Electric Violet', hex: '#8b5cf6', accent: '#6d28d9', headerBg: '#7c3aed', shadeRole: 'Primary' },
      { id: 'purple_sub1', name: 'Bright Lavender', hex: '#a78bfa', accent: '#7c3aed', headerBg: '#8b5cf6', shadeRole: 'Subcolor 1' },
      { id: 'purple_sub2', name: 'Midnight Royal', hex: '#5b21b6', accent: '#4c1d95', headerBg: '#5b21b6', shadeRole: 'Subcolor 2' },
    ],
  },
  {
    id: 'orange',
    name: 'Orange / Magma Team',
    baseHex: '#f97316',
    headerBg: '#ea580c',
    subcolors: [
      { id: 'orange_primary', name: 'Blazing Orange', hex: '#f97316', accent: '#ea580c', headerBg: '#ea580c', shadeRole: 'Primary' },
      { id: 'orange_sub1', name: 'Solar Amber', hex: '#fb923c', accent: '#f97316', headerBg: '#fb923c', shadeRole: 'Subcolor 1' },
      { id: 'orange_sub2', name: 'Dark Magma', hex: '#c2410c', accent: '#9a3412', headerBg: '#c2410c', shadeRole: 'Subcolor 2' },
    ],
  },
];

// Flat export containing all 18 subcolors with family references
export const ALL_PLAYER_SUBCOLORS = PLAYER_COLOR_FAMILIES.flatMap((f) =>
  f.subcolors.map(s => ({ ...s, familyId: f.id, familyName: f.name }))
);

// Primary base colors for legacy 100% backward compatibility
export const PLAYER_COLORS = PLAYER_COLOR_FAMILIES.map((f) => ({
  id: f.id,
  name: f.name,
  hex: f.subcolors[0].hex,
  accent: f.subcolors[0].accent,
  headerBg: f.subcolors[0].headerBg,
  familyId: f.id,
  familyName: f.name,
  subcolors: f.subcolors.map(s => ({ ...s, familyId: f.id, familyName: f.name })),
}));

/**
 * Resolves any hex code or color id to its full color metadata object
 */
export function resolvePlayerColor(hexOrId) {
  if (!hexOrId) {
    const f0 = PLAYER_COLOR_FAMILIES[0];
    return { ...f0.subcolors[0], familyId: f0.id, familyName: f0.name };
  }
  const q = String(hexOrId).toLowerCase();

  // Legacy Rose/Pink alias redirection to Orange
  if (q === 'rose' || q === '#ec4899' || q === '#f472b6' || q === '#9d174d') {
    const orangeFam = PLAYER_COLOR_FAMILIES.find(f => f.id === 'orange');
    if (orangeFam) return { ...orangeFam.subcolors[0], familyId: 'orange', familyName: orangeFam.name };
  }

  for (const family of PLAYER_COLOR_FAMILIES) {
    if (family.id.toLowerCase() === q) {
      return { ...family.subcolors[0], familyId: family.id, familyName: family.name };
    }
    for (const sub of family.subcolors) {
      if (sub.id.toLowerCase() === q || sub.hex.toLowerCase() === q) {
        return { ...sub, familyId: family.id, familyName: family.name };
      }
    }
  }
  return { id: 'custom', name: 'Custom Color', hex: hexOrId, accent: hexOrId, headerBg: hexOrId, shadeRole: 'Custom', familyId: 'custom' };
}

/**
 * Helper to get a team's subcolor by player index (0 = primary, 1 = subcolor 1, 2 = subcolor 2)
 */
export function getTeamSubcolor(familyId = 'cyan', playerIndexInTeam = 0) {
  const family = PLAYER_COLOR_FAMILIES.find((f) => f.id === familyId) || PLAYER_COLOR_FAMILIES[0];
  const idx = Math.max(0, Math.min(family.subcolors.length - 1, playerIndexInTeam % family.subcolors.length));
  return { ...family.subcolors[idx], familyId: family.id, familyName: family.name };
}

export const COLOR_GROUPS = {
  brown: [1, 3],
  light_blue: [5, 7],
  pink: [9, 11],
  orange: [13, 15],
  red: [17, 19],
  yellow: [21, 23],
  green: [25, 27],
  dark_blue: [29, 31],
};

// District Metadata & Thematic Representations
export const COLOR_GROUP_INFO = {
  brown: {
    id: 'brown',
    name: 'Egypt',
    fullName: 'Egypt (Desert Sandstone)',
    monopolyTitle: 'Egypt Monopoly',
    theme: 'Ancient Egyptian Sandstone & Pyramids',
    color: '#8d6e63',
    accentColor: '#fbbf24',
    icon: '🇪🇬',
  },
  light_blue: {
    id: 'light_blue',
    name: 'Central Europe',
    fullName: 'Czechia & Austria',
    monopolyTitle: 'Central Europe Monopoly',
    theme: 'Danube Slate & Baroque Grandeur',
    color: '#38bdf8',
    accentColor: '#0284c7',
    icon: '🏰',
  },
  pink: {
    id: 'pink',
    name: 'Southern Europe',
    fullName: 'Spain & Italy',
    monopolyTitle: 'Southern Europe Monopoly',
    theme: 'Mediterranean Terracotta & Marble',
    color: '#ec4899',
    accentColor: '#db2777',
    icon: '🏟️',
  },
  orange: {
    id: 'orange',
    name: 'Western Europe',
    fullName: 'Germany & Netherlands',
    monopolyTitle: 'Western Europe Monopoly',
    theme: 'North Sea Brick & Canals',
    color: '#f97316',
    accentColor: '#ea580c',
    icon: '🌷',
  },
  red: {
    id: 'red',
    name: 'Crown Capital',
    fullName: 'UK & France',
    monopolyTitle: 'Crown Capital Monopoly',
    theme: 'Regal Cobblestone & Landmarks',
    color: '#ef4444',
    accentColor: '#dc2626',
    icon: '🗼',
  },
  yellow: {
    id: 'yellow',
    name: 'East Asia',
    fullName: 'Japan & South Korea',
    monopolyTitle: 'East Asia Monopoly',
    theme: 'Neon High-Tech & Shinto Pagodas',
    color: '#eab308',
    accentColor: '#ca8a04',
    icon: '⛩️',
  },
  green: {
    id: 'green',
    name: 'Global Financial',
    fullName: 'Singapore & UAE',
    monopolyTitle: 'Global Financial Monopoly',
    theme: 'Futuristic Emerald Glass & Oasis',
    color: '#10b981',
    accentColor: '#059669',
    icon: '🦁',
  },
  dark_blue: {
    id: 'dark_blue',
    name: 'Metropolitan Elite',
    fullName: 'Australia & USA',
    monopolyTitle: 'Metropolitan Elite Monopoly',
    theme: 'Manhattan & Harbour Penthouse',
    color: '#6366f1',
    accentColor: '#4f46e5',
    icon: '🗽',
  },
};

export function getDistrictName(colorGroup) {
  return COLOR_GROUP_INFO[colorGroup]?.name || colorGroup || 'District';
}

export function getMonopolyTitle(colorGroup) {
  return COLOR_GROUP_INFO[colorGroup]?.monopolyTitle || `${colorGroup} Monopoly`;
}

export const SIDE_PROPERTIES = {
  bottom: [1, 3, 5, 6, 7],
  left: [9, 11, 12, 13, 15],
  top: [17, 19, 20, 21, 23],
  right: [25, 27, 28, 29, 31],
};

export const CHANCE_CARDS = [
  { id: 'windfall', title: 'Stock Dividend', text: 'Tech shares surged! Collect 150,000 Space Credits from the bank.', action: 'cash', amount: 150000 },
  { id: 'discount', title: 'Architect Grant', text: 'City council subsidized development! Collect 100,000 Space Credits.', action: 'cash', amount: 100000 },
  { id: 'bonus_tomatoes', title: 'Rotten Crate', text: 'You found a crate of overripe tomatoes! +2 Free Tomatoes.', action: 'tomatoes', amount: 2 },
  { id: 'tax_audit', title: 'IRS Audit', text: 'Pay 100,000 Space Credits in administrative assessment fees.', action: 'cash', amount: -100000 },
  { id: 'world_tour', title: 'First Class Pass', text: 'Advance directly to START and collect your 200,000 Space Credits salary.', action: 'move', targetTile: 0 },
  { id: 'island_trip', title: 'Arrest Warrant', text: 'You are caught by galactic police! Go directly to Prison.', action: 'jail' },
];

/**
 * Formats player currency using M for millions and K/k for thousands,
 * stripping redundant trailing .000 or .0 (e.g. 2M, 1.5M, 120k, 50k, 0).
 * @param {number|string} amount - Monetary amount in Space Credits
 * @param {boolean} uppercase - Whether to use 'K' instead of 'k' (default false)
 * @returns {string} Formatted compact string e.g. '120k', '2M'
 */
export function formatCash(amount, uppercase = false) {
  const num = Number(amount) || 0;
  const abs = Math.abs(num);
  const sign = num < 0 ? '-' : '';
  const kSuffix = uppercase ? 'K' : 'k';

  if (abs >= 1000000) {
    const m = abs / 1000000;
    const formatted = parseFloat(m.toFixed(2));
    return `${sign}${formatted}M`;
  }
  if (abs >= 1000) {
    const k = abs / 1000;
    const formatted = parseFloat(k.toFixed(1));
    return `${sign}${formatted}${kSuffix}`;
  }
  return `${sign}${abs}`;
}

export function formatFullCash(amount) {
  return Number(amount || 0).toLocaleString();
}
