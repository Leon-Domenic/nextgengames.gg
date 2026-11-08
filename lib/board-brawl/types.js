// Board Brawl Expanded 48-Tile System (Legally Distinct, 12 Tiles Per Side)

export const TILES = [
  // === BOTTOM SIDE (0 to 11) ===
  { id: 0, name: 'START', type: 'start', description: 'Collect $250 venture salary on pass or landing', icon: '🚀' },
  { id: 1, name: 'Cairo', type: 'city', color: '#8d6e63', colorGroup: 'brown', price: 60, housePrice: 50, rent: [15, 45, 120, 240, 450], country: 'Egypt', flag: '🇪🇬' },
  { id: 2, name: 'Alexandria', type: 'city', color: '#8d6e63', colorGroup: 'brown', price: 60, housePrice: 50, rent: [15, 45, 120, 240, 450], country: 'Egypt', flag: '🇪🇬' },
  { id: 3, name: 'Giza', type: 'city', color: '#8d6e63', colorGroup: 'brown', price: 80, housePrice: 50, rent: [20, 60, 160, 320, 550], country: 'Egypt', flag: '🇪🇬' },
  { id: 4, name: 'Chance', type: 'chance', description: 'Draw a tactical Chance card', icon: '❓' },
  { id: 5, name: 'City Tax', type: 'tax', amount: 100, description: 'Pay municipal development tax ($100)', icon: '💸' },
  { id: 6, name: 'Athens', type: 'city', color: '#06b6d4', colorGroup: 'cyan', price: 100, housePrice: 60, rent: [25, 75, 180, 360, 600], country: 'Greece', flag: '🇬🇷' },
  { id: 7, name: 'Santorini', type: 'city', color: '#06b6d4', colorGroup: 'cyan', price: 100, housePrice: 60, rent: [25, 75, 180, 360, 600], country: 'Greece', flag: '🇬🇷' },
  { id: 8, name: 'Mykonos', type: 'city', color: '#06b6d4', colorGroup: 'cyan', price: 120, housePrice: 60, rent: [30, 90, 220, 440, 700], country: 'Greece', flag: '🇬🇷' },
  { id: 9, name: 'Armory', type: 'armory', description: 'Free Tomato Refill! Get +2 bonus tomatoes', icon: '🍅' },
  { id: 10, name: 'Prague', type: 'city', color: '#f43f5e', colorGroup: 'rose', price: 140, housePrice: 70, rent: [35, 105, 260, 520, 800], country: 'Czechia', flag: '🇨🇿' },
  { id: 11, name: 'Vienna', type: 'city', color: '#f43f5e', colorGroup: 'rose', price: 160, housePrice: 70, rent: [40, 120, 300, 600, 900], country: 'Austria', flag: '🇦🇹' },

  // === LEFT SIDE (12 to 23) ===
  { id: 12, name: 'VIP Resort', type: 'jail', description: 'Quarantined in VIP suite for 3 turns (or roll doubles / pay $100)', icon: '🏝️' },
  { id: 13, name: 'Budapest', type: 'city', color: '#f43f5e', colorGroup: 'rose', price: 160, housePrice: 70, rent: [40, 120, 300, 600, 900], country: 'Hungary', flag: '🇭🇺' },
  { id: 14, name: 'Chance', type: 'chance', description: 'Draw a tactical Chance card', icon: '❓' },
  { id: 15, name: 'Madrid', type: 'city', color: '#ea580c', colorGroup: 'orange', price: 180, housePrice: 90, rent: [45, 135, 340, 680, 1000], country: 'Spain', flag: '🇪🇸' },
  { id: 16, name: 'Barcelona', type: 'city', color: '#ea580c', colorGroup: 'orange', price: 180, housePrice: 90, rent: [45, 135, 340, 680, 1000], country: 'Spain', flag: '🇪🇸' },
  { id: 17, name: 'Valencia', type: 'city', color: '#ea580c', colorGroup: 'orange', price: 200, housePrice: 90, rent: [50, 150, 380, 760, 1100], country: 'Spain', flag: '🇪🇸' },
  { id: 18, name: 'World Fair', type: 'festival', description: 'Host festival on one of your cities to double (2x) rent!', icon: '🎪' },
  { id: 19, name: 'Rome', type: 'city', color: '#f97316', colorGroup: 'coral', price: 220, housePrice: 110, rent: [55, 165, 420, 840, 1200], country: 'Italy', flag: '🇮🇹' },
  { id: 20, name: 'Milan', type: 'city', color: '#f97316', colorGroup: 'coral', price: 220, housePrice: 110, rent: [55, 165, 420, 840, 1200], country: 'Italy', flag: '🇮🇹' },
  { id: 21, name: 'Florence', type: 'city', color: '#f97316', colorGroup: 'coral', price: 240, housePrice: 110, rent: [60, 180, 460, 920, 1300], country: 'Italy', flag: '🇮🇹' },
  { id: 22, name: 'Crypto Tax', type: 'tax', amount: 150, description: 'Pay blockchain network gas fee ($150)', icon: '⚡' },
  { id: 23, name: 'Berlin', type: 'city', color: '#ef4444', colorGroup: 'red', price: 260, housePrice: 130, rent: [65, 200, 500, 1000, 1400], country: 'Germany', flag: '🇩🇪' },

  // === TOP SIDE (24 to 35) ===
  { id: 24, name: 'Casino Lounge', type: 'casino', description: 'High-Roller Lounge: Free break & collected tax jackpot', icon: '🎰' },
  { id: 25, name: 'Munich', type: 'city', color: '#ef4444', colorGroup: 'red', price: 260, housePrice: 130, rent: [65, 200, 500, 1000, 1400], country: 'Germany', flag: '🇩🇪' },
  { id: 26, name: 'Frankfurt', type: 'city', color: '#ef4444', colorGroup: 'red', price: 280, housePrice: 130, rent: [70, 220, 550, 1100, 1500], country: 'Germany', flag: '🇩🇪' },
  { id: 27, name: 'Chance', type: 'chance', description: 'Draw a tactical Chance card', icon: '❓' },
  { id: 28, name: 'Amsterdam', type: 'city', color: '#d97706', colorGroup: 'amber', price: 300, housePrice: 150, rent: [75, 240, 600, 1200, 1600], country: 'Netherlands', flag: '🇳🇱' },
  { id: 29, name: 'Brussels', type: 'city', color: '#d97706', colorGroup: 'amber', price: 300, housePrice: 150, rent: [75, 240, 600, 1200, 1600], country: 'Belgium', flag: '🇧🇪' },
  { id: 30, name: 'Antwerp', type: 'city', color: '#d97706', colorGroup: 'amber', price: 320, housePrice: 150, rent: [80, 260, 650, 1300, 1750], country: 'Belgium', flag: '🇧🇪' },
  { id: 31, name: 'Airport', type: 'airport', description: 'Pay $100 ticket to fly to ANY tile on your next turn', icon: '✈️' },
  { id: 32, name: 'London', type: 'city', color: '#eab308', colorGroup: 'yellow', price: 340, housePrice: 170, rent: [85, 280, 700, 1400, 1900], country: 'UK', flag: '🇬🇧' },
  { id: 33, name: 'Edinburgh', type: 'city', color: '#eab308', colorGroup: 'yellow', price: 340, housePrice: 170, rent: [85, 280, 700, 1400, 1900], country: 'UK', flag: '🇬🇧' },
  { id: 34, name: 'Dublin', type: 'city', color: '#eab308', colorGroup: 'yellow', price: 360, housePrice: 170, rent: [90, 300, 750, 1500, 2000], country: 'Ireland', flag: '🇮🇪' },
  { id: 35, name: 'Luxury Tax', type: 'tax', amount: 200, description: 'Pay luxury asset tax ($200)', icon: '💎' },

  // === RIGHT SIDE (36 to 47) ===
  { id: 36, name: 'Interpol Raid', type: 'go_to_jail', description: 'Busted! Sent immediately to VIP Resort quarantine', icon: '🚨' },
  { id: 37, name: 'Paris', type: 'city', color: '#059669', colorGroup: 'emerald', price: 380, housePrice: 190, rent: [95, 320, 800, 1600, 2100], country: 'France', flag: '🇫🇷' },
  { id: 38, name: 'Nice', type: 'city', color: '#059669', colorGroup: 'emerald', price: 380, housePrice: 190, rent: [95, 320, 800, 1600, 2100], country: 'France', flag: '🇫🇷' },
  { id: 39, name: 'Lyon', type: 'city', color: '#059669', colorGroup: 'emerald', price: 400, housePrice: 190, rent: [100, 340, 850, 1700, 2250], country: 'France', flag: '🇫🇷' },
  { id: 40, name: 'Chance', type: 'chance', description: 'Draw a tactical Chance card', icon: '❓' },
  { id: 41, name: 'Tokyo', type: 'city', color: '#16a34a', colorGroup: 'green', price: 420, housePrice: 210, rent: [110, 370, 920, 1850, 2400], country: 'Japan', flag: '🇯🇵' },
  { id: 42, name: 'Kyoto', type: 'city', color: '#16a34a', colorGroup: 'green', price: 420, housePrice: 210, rent: [110, 370, 920, 1850, 2400], country: 'Japan', flag: '🇯🇵' },
  { id: 43, name: 'Osaka', type: 'city', color: '#16a34a', colorGroup: 'green', price: 450, housePrice: 210, rent: [120, 400, 1000, 2000, 2600], country: 'Japan', flag: '🇯🇵' },
  { id: 44, name: 'Armory', type: 'armory', description: 'Free Tomato Refill! Get +2 bonus tomatoes', icon: '🍅' },
  { id: 45, name: 'Singapore', type: 'city', color: '#2563eb', colorGroup: 'blue', price: 480, housePrice: 240, rent: [135, 450, 1150, 2300, 3000], country: 'Singapore', flag: '🇸🇬' },
  { id: 46, name: 'Dubai', type: 'city', color: '#2563eb', colorGroup: 'blue', price: 520, housePrice: 260, rent: [150, 500, 1250, 2500, 3300], country: 'UAE', flag: '🇦🇪' },
  { id: 47, name: 'Monaco', type: 'city', color: '#7c3aed', colorGroup: 'purple', price: 600, housePrice: 300, rent: [180, 600, 1500, 3000, 4000], country: 'Monaco', flag: '🇲🇨' },
];

export const COLOR_GROUPS = {
  brown: [1, 2, 3],
  cyan: [6, 7, 8],
  rose: [10, 11, 13],
  orange: [15, 16, 17],
  coral: [19, 20, 21],
  red: [23, 25, 26],
  amber: [28, 29, 30],
  yellow: [32, 33, 34],
  emerald: [37, 38, 39],
  green: [41, 42, 43],
  blue: [45, 46],
  purple: [47],
};

export const CHANCE_CARDS = [
  { id: 1, title: 'Angel Investor Dividend', desc: 'A portfolio company achieved IPO! Collect $150.', amount: 150, type: 'cash' },
  { id: 2, title: 'Tax Audit Penalty', desc: 'IRS detected undeclared off-shore assets. Pay $120.', amount: -120, type: 'cash' },
  { id: 3, title: 'Tomato Smuggler', desc: 'You received a black-market crate of 3 Rotten Tomatoes!', type: 'tomatoes', count: 3 },
  { id: 4, title: 'Private Jet Express', desc: 'Board the corporate Gulfstream directly to START and collect $250!', type: 'teleport', target: 0 },
  { id: 5, title: 'Hostile Takeover', desc: 'City Council approved eminent domain. Rent across your empire increased +20% for 2 rounds.', type: 'rent_buff' },
  { id: 6, title: 'Crypto Bull Run', desc: 'Bitcoin hit all-time highs! Collect $200 from treasury.', amount: 200, type: 'cash' },
];
export const SIDE_PROPERTIES = {
  bottom: [1, 2, 3, 6, 7, 8, 10, 11],
  left: [13, 15, 16, 17, 19, 20, 21, 23],
  top: [25, 26, 28, 29, 30, 32, 33, 34],
  right: [37, 38, 39, 41, 42, 43, 45, 46, 47],
};