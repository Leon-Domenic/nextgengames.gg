// Board Brawl Tile and Rules Definitions

export const TILES = [
  // Bottom side (indices 0 to 7)
  { id: 0, name: 'START', type: 'start', description: 'Collect $200 salary on pass or landing', icon: '🚀' },
  { id: 1, name: 'Cairo', type: 'city', color: '#8d6e63', colorGroup: 'brown', price: 100, housePrice: 50, rent: [20, 60, 150, 300, 500], country: 'Egypt', flag: '🇪🇬' },
  { id: 2, name: 'Chance', type: 'chance', description: 'Draw a tactical Chance card', icon: '❓' },
  { id: 3, name: 'Athens', type: 'city', color: '#8d6e63', colorGroup: 'brown', price: 120, housePrice: 60, rent: [25, 75, 180, 360, 600], country: 'Greece', flag: '🇬🇷' },
  { id: 4, name: 'City Tax', type: 'tax', amount: 120, description: 'Pay municipal development tax ($120)', icon: '💸' },
  { id: 5, name: 'Prague', type: 'city', color: '#38bdf8', colorGroup: 'light_blue', price: 140, housePrice: 70, rent: [30, 90, 220, 440, 700], country: 'Czechia', flag: '🇨🇿' },
  { id: 6, name: 'Mystery', type: 'chance', description: 'Lucky bonus or surprise fee', icon: '🎁' },
  { id: 7, name: 'Vienna', type: 'city', color: '#38bdf8', colorGroup: 'light_blue', price: 160, housePrice: 80, rent: [35, 110, 260, 500, 800], country: 'Austria', flag: '🇦🇹' },

  // Left side (indices 8 to 15)
  { id: 8, name: 'Resort Island', type: 'jail', description: 'Trapped on island for 3 turns (or roll doubles / pay $100)', icon: '🏝️' },
  { id: 9, name: 'Madrid', type: 'city', color: '#ec4899', colorGroup: 'pink', price: 180, housePrice: 90, rent: [40, 125, 300, 600, 950], country: 'Spain', flag: '🇪🇸' },
  { id: 10, name: 'Chance', type: 'chance', description: 'Draw a tactical Chance card', icon: '❓' },
  { id: 11, name: 'Rome', type: 'city', color: '#ec4899', colorGroup: 'pink', price: 200, housePrice: 100, rent: [45, 140, 350, 700, 1100], country: 'Italy', flag: '🇮🇹' },
  { id: 12, name: 'World Fair', type: 'festival', description: 'Host festival on one of your cities to double (2x) rent!', icon: '🎪' },
  { id: 13, name: 'Berlin', type: 'city', color: '#f97316', colorGroup: 'orange', price: 220, housePrice: 110, rent: [50, 160, 400, 800, 1250], country: 'Germany', flag: '🇩🇪' },
  { id: 14, name: 'Mystery', type: 'chance', description: 'Lucky bonus or surprise fee', icon: '🎁' },
  { id: 15, name: 'Amsterdam', type: 'city', color: '#f97316', colorGroup: 'orange', price: 240, housePrice: 120, rent: [55, 180, 450, 900, 1400], country: 'Netherlands', flag: '🇳🇱' },

  // Top side (indices 16 to 23)
  { id: 16, name: 'Airport', type: 'airport', description: 'Pay $100 flight ticket to travel to ANY tile next turn', icon: '✈️' },
  { id: 17, name: 'London', type: 'city', color: '#ef4444', colorGroup: 'red', price: 260, housePrice: 130, rent: [60, 200, 500, 1000, 1600], country: 'UK', flag: '🇬🇧' },
  { id: 18, name: 'Chance', type: 'chance', description: 'Draw a tactical Chance card', icon: '❓' },
  { id: 19, name: 'Paris', type: 'city', color: '#ef4444', colorGroup: 'red', price: 280, housePrice: 140, rent: [70, 225, 550, 1100, 1750], country: 'France', flag: '🇫🇷' },
  { id: 20, name: 'Global Tax', type: 'tax', amount: 180, description: 'Pay wealth rebalance tax ($180)', icon: '🏛️' },
  { id: 21, name: 'Tokyo', type: 'city', color: '#eab308', colorGroup: 'yellow', price: 300, housePrice: 150, rent: [80, 250, 650, 1300, 2000], country: 'Japan', flag: '🇯🇵' },
  { id: 22, name: 'Mystery', type: 'chance', description: 'Lucky bonus or surprise fee', icon: '🎁' },
  { id: 23, name: 'Seoul', type: 'city', color: '#eab308', colorGroup: 'yellow', price: 320, housePrice: 160, rent: [90, 280, 720, 1450, 2200], country: 'South Korea', flag: '🇰🇷' },

  // Right side (indices 24 to 31)
  { id: 24, name: 'Armory', type: 'armory', description: 'Free Tomato Refill! Get +2 bonus tomatoes', icon: '🍅' },
  { id: 25, name: 'Singapore', type: 'city', color: '#10b981', colorGroup: 'green', price: 350, housePrice: 175, rent: [100, 320, 800, 1600, 2500], country: 'Singapore', flag: '🇸🇬' },
  { id: 26, name: 'Chance', type: 'chance', description: 'Draw a tactical Chance card', icon: '❓' },
  { id: 27, name: 'Dubai', type: 'city', color: '#10b981', colorGroup: 'green', price: 400, housePrice: 200, rent: [120, 380, 950, 1900, 3000], country: 'UAE', flag: '🇦🇪' },
  { id: 28, name: 'Luxury Luxury', type: 'tax', amount: 250, description: 'Pay high-roller penthouse maintenance ($250)', icon: '💎' },
  { id: 29, name: 'Sydney', type: 'city', color: '#6366f1', colorGroup: 'dark_blue', price: 450, housePrice: 225, rent: [140, 450, 1100, 2200, 3500], country: 'Australia', flag: '🇦🇺' },
  { id: 30, name: 'Mystery', type: 'chance', description: 'Lucky bonus or surprise fee', icon: '🎁' },
  { id: 31, name: 'New York', type: 'city', color: '#6366f1', colorGroup: 'dark_blue', price: 500, housePrice: 250, rent: [175, 550, 1350, 2700, 4200], country: 'USA', flag: '🇺🇸' },
];

export const PLAYER_COLORS = [
  { id: 'cyan', name: 'Cyan Sky', hex: '#00f0ff', accent: '#0284c7', headerBg: '#0284c7' },
  { id: 'rose', name: 'Neon Rose', hex: '#ec4899', accent: '#be185d', headerBg: '#e11d48' },
  { id: 'emerald', name: 'Cyber Emerald', hex: '#10b981', accent: '#059669', headerBg: '#059669' },
  { id: 'gold', name: 'Vegas Gold', hex: '#f59e0b', accent: '#d97706', headerBg: '#d97706' },
  { id: 'purple', name: 'Electric Violet', hex: '#8b5cf6', accent: '#6d28d9', headerBg: '#7c3aed' },
  { id: 'crimson', name: 'Inferno Crimson', hex: '#ef4444', accent: '#b91c1c', headerBg: '#dc2626' },
];

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

export const SIDE_PROPERTIES = {
  bottom: [1, 3, 5, 7],
  left: [9, 11, 13, 15],
  top: [17, 19, 21, 23],
  right: [25, 27, 29, 31],
};

export const CHANCE_CARDS = [
  { id: 'windfall', title: 'Stock Dividend', text: 'Tech shares surged! Collect $150 from the bank.', action: 'cash', amount: 150 },
  { id: 'discount', title: 'Architect Grant', text: 'City council subsidized development! Collect $100.', action: 'cash', amount: 100 },
  { id: 'bonus_tomatoes', title: 'Rotten Crate', text: 'You found a crate of overripe tomatoes! +2 Free Tomatoes.', action: 'tomatoes', amount: 2 },
  { id: 'tax_audit', title: 'IRS Audit', text: 'Pay $100 in administrative assessment fees.', action: 'cash', amount: -100 },
  { id: 'world_tour', title: 'First Class Pass', text: 'Advance directly to START and collect your $200 salary.', action: 'move', targetTile: 0 },
  { id: 'island_trip', title: 'Storm Detour', text: 'A tempest diverts your yacht directly to Resort Island.', action: 'jail' },
];
