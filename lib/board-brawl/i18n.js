// Board Brawl: Cyber Arena - Comprehensive Internationalization (i18n) Engine
// Supported Languages: EN (English), DE (Deutsch), FR (Français), ES (Español), RU (Русский)

import { useState, useEffect, useCallback } from 'react';

export const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇺🇸', label: 'English' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', label: 'Deutsch' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', label: 'Français' },
  { code: 'es', name: 'Español', flag: '🇪🇸', label: 'Español' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', label: 'Русский' },
];

export const DEFAULT_LANGUAGE = 'en';
export const STORAGE_KEY = 'ngg_language';
export const LANGUAGE_EVENT = 'ngg-language-changed';

export const TRANSLATIONS = {
  en: {
    // UI Core
    rollDice: 'Roll Dice',
    rolling: 'Rolling...',
    rollingDice3D: 'ROLLING 3D DICE...',
    roll3dDice: 'ROLL 3D DICE',
    rollForDoubles: 'ROLL FOR DOUBLES',
    awaitingTurn: 'Awaiting turn...',
    resolvingAction: 'Resolving action...',
    doublesExtraRoll: '✨ DOUBLES! EXTRA ROLL! ✨',
    bail: 'Bail',
    payBail: 'Pay Bail',
    payBailEscape: '🌴 PAY 100,000 CR BAIL & ESCAPE',
    pass: 'Pass',
    endTurn: 'End Turn',
    buyCity: 'Buy City',
    buyAndUpgrade: 'BUY & UPGRADE',
    upgradeCity: 'Upgrade City',
    upgradeLevel: 'UPGRADE LEVEL',
    hostileBuyout: 'Hostile Buyout',
    hostileBuyout2x: 'HOSTILE BUYOUT 2X',
    travel: 'Travel',
    cancel: 'Cancel',
    confirm: 'Confirm',
    settings: 'Settings',
    gameSettings: 'Game Settings',
    openSettings: 'Open Game Settings',
    leaveRoom: 'Leave Room',
    leaveToHub: 'LEAVE TO HUB',
    winner: 'Winner',
    wins: 'WINS!',
    bankrupt: 'BANKRUPT',
    waiting: 'Waiting',
    timeLeft: 'left',
    cannotBeBoughtOut: 'CANNOT BE BOUGHT OUT BY RIVALS!',
    rentYield: 'Rent Yield',
    costToBuild: 'Cost to Build',
    ownedBy: 'Owned by {owner}! Paid rent: {rent} Space Credits',
    plot: 'Plot',
    cottage: 'Cottage',
    hotel: 'Hotel',
    landmark: 'Landmark',
    cash: 'Cash',
    assets: 'Assets',
    properties: 'Properties',
    shop: 'Shop',
    chat: 'Chat',
    muteMusic: 'Mute Music',
    playMusic: 'Play Music',

    // Special Tiles
    start: 'START',
    resortIsland: 'Resort Island',
    worldTour: 'World Tour',
    airport: 'Airport',
    worldFair: 'World Fair',
    championships: 'Championships',
    armory: 'Armory',
    chance: 'Chance',
    mystery: 'Mystery',
    cityTax: 'City Tax',
    globalTax: 'Global Tax',
    luxuryTax: 'Luxury Tax',
    incomeTax: 'Income Tax',

    // City Names
    subkowy: 'Subkowy',
    starogardGdanski: 'Starogard Gdański',
    balticSands: 'Baltic Sands',
    costaBrava: 'Costa Brava',
    tropicalCove: 'Tropical Cove',
    paradiseAtoll: 'Paradise Atoll',
    cairo: 'Cairo',
    athens: 'Athens',
    prague: 'Prague',
    vienna: 'Vienna',
    budapest: 'Budapest',
    madrid: 'Madrid',
    seville: 'Seville',
    rome: 'Rome',
    milan: 'Milan',
    venice: 'Venice',
    berlin: 'Berlin',
    munich: 'Munich',
    hamburg: 'Hamburg',
    amsterdam: 'Amsterdam',
    rotterdam: 'Rotterdam',
    brussels: 'Brussels',
    london: 'London',
    manchester: 'Manchester',
    dublin: 'Dublin',
    paris: 'Paris',
    nice: 'Nice',
    lyon: 'Lyon',
    tokyo: 'Tokyo',
    kyoto: 'Kyoto',
    osaka: 'Osaka',
    singapore: 'Singapore',
    dubai: 'Dubai',
    abuDhabi: 'Abu Dhabi',
    monaco: 'Monaco',
    newYork: 'New York',
    lasVegas: 'Las Vegas',
    chicago: 'Chicago',
    seoul: 'Seoul',
    sydney: 'Sydney',

    // Settings
    audio: 'Audio & Jukebox',
    graphics: 'Visuals & 3D',
    gameplay: 'Gameplay',
    language: 'Language',
    languageSelection: 'Language & Region',
    selectLanguage: 'Select Language',
    volume: 'Volume',
    masterVolume: 'Master Volume',
    sfxVolume: 'SFX Volume',
    musicVolume: 'Music Volume',
    quality: 'Quality',
    graphicsQuality: 'Graphics Quality',
    fastDice: 'Quick Roll Mode',
    fastDiceDesc: 'Fast-forward 3D dice physics and reduce bounce duration to 300ms',
    autoPass: 'Auto End Turn',
    autoPassDesc: 'Automatically pass turn when no actions remain',
    mute: 'Mute',
    resetSettings: 'Reset All Settings',
    keybinds: 'Keybinds',
    aboutLoadout: 'About & Loadout',

    // Cards
    bullMarketTitle: 'Bull Market Mania',
    bullMarketDesc: 'Wall Street rallies! The global galactic treasury grants a stimulus of 250,000 Space Credits to EVERY player.',
    bearMarketTitle: 'Black Swan Crash',
    bearMarketDesc: 'Cosmic liquidity squeeze! The wealthiest player pays 250,000 Space Credits luxury tax; all others pay 75,000 Space Credits.',
    typhoonStrikeTitle: 'Coastal Typhoon',
    typhoonStrikeDesc: 'Category 5 solar hurricane strikes the highest-tier city on the board! It loses 1 house tier.',
    guardianAngelTitle: 'Guardian Angel',
    guardianAngelDesc: 'A heavenly blessing envelops you! Adds a 100% Toll Shield Action Card directly to your hand.',
    warpSpeedTitle: 'Suborbital Rocket',
    warpSpeedDesc: 'Private spacecraft launch! Advance directly to Airport (Tile 16) and collect 200,000 Space Credits flight subsidy.',
    robinHoodTitle: 'Robin Hood Heist',
    robinHoodDesc: 'Takes 150,000 Space Credits from the richest tycoon and transfers them directly to the poorest player.',
    seedRoundTitle: 'Venture Capital Airdrop',
    seedRoundDesc: 'Deep-space investors fund your venture! Galactic bank pays you 300,000 Space Credits plus +1 random Action Card.',
    grandCarnivalTitle: 'Grand Carnival',
    grandCarnivalDesc: 'A massive world fair opens in one of your cities! Immediately bestows a 2X Festival multiplier.',
    // P2P Trade & Negotiation
    tradeDesk: 'Trade Desk',
    proposeTrade: 'Propose Trade',
    counterOffer: 'Counter-Offer',
    acceptDeal: 'Accept Deal',
    declineDeal: 'Decline Deal',
    withdrawOffer: 'Withdraw Proposal',
    peerLoan: 'Peer-to-Peer Loan',
    loanInstallment: 'Loan Installment',
  },

  de: {
    // UI Core
    rollDice: 'Würfeln',
    rolling: 'Würfelt...',
    rollingDice3D: '3D-WÜRFEL ROLLEN...',
    roll3dDice: '3D-WÜRFEL WERFEN',
    rollForDoubles: 'FÜR PASCH WÜRFELN',
    awaitingTurn: 'Warte auf Zug...',
    resolvingAction: 'Aktion wird ausgeführt...',
    doublesExtraRoll: '✨ PASCH! NOCHMAL WÜRFELN! ✨',
    bail: 'Kaution',
    payBail: 'Kaution zahlen',
    payBailEscape: '🌴 100.000 CR KAUTION ZAHLEN & FLIEHEN',
    pass: 'Passen',
    endTurn: 'Zug beenden',
    buyCity: 'Stadt kaufen',
    buyAndUpgrade: 'KAUFEN & AUSBAUEN',
    upgradeCity: 'Stadt ausbauen',
    upgradeLevel: 'STUFE ERHÖHEN',
    hostileBuyout: 'Feindliche Übernahme',
    hostileBuyout2x: 'FEINDLICHE ÜBERNAHME 2X',
    travel: 'Reisen',
    cancel: 'Abbrechen',
    confirm: 'Bestätigen',
    settings: 'Einstellungen',
    gameSettings: 'Spieleinstellungen',
    openSettings: 'Einstellungen öffnen',
    leaveRoom: 'Raum verlassen',
    leaveToHub: 'ZURÜCK ZUM HUB',
    winner: 'Gewinner',
    wins: 'GEWINNT!',
    bankrupt: 'BANKROTT',
    waiting: 'Warten',
    timeLeft: 'übrig',
    cannotBeBoughtOut: 'KANN VON RIVALEN NICHT GEKAUFT WERDEN!',
    rentYield: 'Mieteinnahmen',
    costToBuild: 'Baukosten',
    ownedBy: 'Besitzt von {owner}! Miete bezahlt: {rent} Space Credits',
    plot: 'Grundstück',
    cottage: 'Häuschen',
    hotel: 'Hotel',
    landmark: 'Wahrzeichen',
    cash: 'Bargeld',
    assets: 'Vermögen',
    properties: 'Besitz',
    shop: 'Shop',
    chat: 'Chat',
    muteMusic: 'Musik stummschalten',
    playMusic: 'Musik abspielen',

    // Special Tiles
    start: 'START',
    resortIsland: 'Urlaubsinsel',
    worldTour: 'Weltreise',
    airport: 'Flughafen',
    worldFair: 'Weltausstellung',
    championships: 'Meisterschaften',
    armory: 'Waffenkammer',
    chance: 'Ereignis',
    mystery: 'Geheimnis',
    cityTax: 'Stadtabgabe',
    globalTax: 'Globale Steuer',
    luxuryTax: 'Luxussteuer',
    incomeTax: 'Einkommensteuer',

    // City Names
    subkowy: 'Subkowy',
    starogardGdanski: 'Starogard Gdański',
    balticSands: 'Baltic Sands',
    costaBrava: 'Costa Brava',
    tropicalCove: 'Tropical Cove',
    paradiseAtoll: 'Paradise Atoll',
    cairo: 'Kairo',
    athens: 'Athen',
    prague: 'Prag',
    vienna: 'Wien',
    budapest: 'Budapest',
    madrid: 'Madrid',
    seville: 'Sevilla',
    rome: 'Rom',
    milan: 'Mailand',
    venice: 'Venedig',
    berlin: 'Berlin',
    munich: 'München',
    hamburg: 'Hamburg',
    amsterdam: 'Amsterdam',
    rotterdam: 'Rotterdam',
    brussels: 'Brüssel',
    london: 'London',
    manchester: 'Manchester',
    dublin: 'Dublin',
    paris: 'Paris',
    nice: 'Nizza',
    lyon: 'Lyon',
    tokyo: 'Tokio',
    kyoto: 'Kyōto',
    osaka: 'Osaka',
    singapore: 'Singapur',
    dubai: 'Dubai',
    abuDhabi: 'Abu Dhabi',
    monaco: 'Monaco',
    newYork: 'New York',
    lasVegas: 'Las Vegas',
    chicago: 'Chicago',
    seoul: 'Seoul',
    sydney: 'Sydney',

    // Settings
    audio: 'Audio & Jukebox',
    graphics: 'Grafik & 3D',
    gameplay: 'Gameplay',
    language: 'Sprache',
    languageSelection: 'Sprache & Region',
    selectLanguage: 'Sprache wählen',
    volume: 'Lautstärke',
    masterVolume: 'Gesamtlautstärke',
    sfxVolume: 'SFX-Lautstärke',
    musicVolume: 'Musiklautstärke',
    quality: 'Qualität',
    graphicsQuality: 'Grafikqualität',
    fastDice: 'Schnellwurf-Modus',
    fastDiceDesc: 'Beschleunigt 3D-Würfelphysik auf 300ms',
    autoPass: 'Zug autom. beenden',
    autoPassDesc: 'Zug automatisch beenden wenn keine Aktionen verbleiben',
    mute: 'Stummschalten',
    resetSettings: 'Alle Einstellungen zurücksetzen',
    keybinds: 'Tastenbelegung',
    aboutLoadout: 'Über & Ausrüstung',

    // Cards
    bullMarketTitle: 'Bullenmarkt-Manie',
    bullMarketDesc: 'Die Börse boomt! Jeder Spieler erhält eine Finanzspritze von 250.000 Space Credits.',
    bearMarketTitle: 'Schwarzer-Schwan-Crash',
    bearMarketDesc: 'Kosmische Liquiditätskrise! Der reichste Spieler zahlt 250.000 Space Credits Luxussteuer; alle anderen 75.000.',
    typhoonStrikeTitle: 'Küstentaifun',
    typhoonStrikeDesc: 'Ein Solarhurrikan der Kategorie 5 trifft die höchstwertige Stadt! Sie verliert 1 Ausbaustufe.',
    guardianAngelTitle: 'Schutzengel',
    guardianAngelDesc: 'Ein himmlischer Segen umgibt dich! Fügt deiner Hand eine 100% Maut-Schild-Karte hinzu.',
    warpSpeedTitle: 'Suborbitale Rakete',
    warpSpeedDesc: 'Privater Raumschiffstart! Fliege direkt zum Flughafen und kassiere 200.000 Space Credits.',
    robinHoodTitle: 'Robin-Hood-Überfall',
    robinHoodDesc: 'Nimmt 150.000 Space Credits vom reichsten Spieler und übergibt sie dem ärmsten Spieler.',
    seedRoundTitle: 'Risikokapital-Airdrop',
    seedRoundDesc: 'Investoren finanzieren dein Imperium! Bank zahlt 300.000 Space Credits + 1 Aktionskarte.',
    grandCarnivalTitle: 'Großer Karneval',
    grandCarnivalDesc: 'Eine Weltausstellung eröffnet in deiner Stadt! 2X Festival-Multiplikator aktiviert.',
  },

  fr: {
    // UI Core
    rollDice: 'Lancer les dés',
    rolling: 'Lancement...',
    rollingDice3D: 'LANCEMENT DES DÉS 3D...',
    roll3dDice: 'LANCER LES DÉS 3D',
    rollForDoubles: 'LANCER POUR UN DOUBLE',
    awaitingTurn: 'En attente du tour...',
    resolvingAction: 'Action en cours...',
    doublesExtraRoll: '✨ DOUBLE ! RELANCEZ LES DÉS ! ✨',
    bail: 'Caution',
    payBail: 'Payer la caution',
    payBailEscape: '🌴 PAYER 100 000 CR DE CAUTION & S’ÉVADER',
    pass: 'Passer',
    endTurn: 'Fin du tour',
    buyCity: 'Acheter la ville',
    buyAndUpgrade: 'ACHETER & AMÉLIORER',
    upgradeCity: 'Améliorer la ville',
    upgradeLevel: 'AUGMENTER DE NIVEAU',
    hostileBuyout: 'Rachat hostile',
    hostileBuyout2x: 'RACHAT HOSTILE 2X',
    travel: 'Voyager',
    cancel: 'Annuler',
    confirm: 'Confirmer',
    settings: 'Paramètres',
    gameSettings: 'Paramètres du jeu',
    openSettings: 'Ouvrir les paramètres',
    leaveRoom: 'Quitter la salle',
    leaveToHub: 'RETOUR AU HUB',
    winner: 'Vainqueur',
    wins: 'GAGNE !',
    bankrupt: 'FAILLITE',
    waiting: 'En attente',
    timeLeft: 'restant',
    cannotBeBoughtOut: 'NE PEUT PAS ÊTRE RACHETÉ PAR LES RIVAUX !',
    rentYield: 'Loyer généré',
    costToBuild: 'Coût de construction',
    ownedBy: 'Propriété de {owner} ! Loyer versé : {rent} Crédits Spatiaux',
    plot: 'Terrain',
    cottage: 'Maisonnette',
    hotel: 'Hôtel',
    landmark: 'Monument',
    cash: 'Crédits',
    assets: 'Patrimoine',
    properties: 'Propriétés',
    shop: 'Boutique',
    chat: 'Tchat',
    muteMusic: 'Couper la musique',
    playMusic: 'Activer la musique',

    // Special Tiles
    start: 'DÉPART',
    resortIsland: 'Île de villégiature',
    worldTour: 'Tour du monde',
    airport: 'Aéroport',
    worldFair: 'Foire universelle',
    championships: 'Championnats',
    armory: 'Armurerie',
    chance: 'Chance',
    mystery: 'Mystère',
    cityTax: 'Taxe municipale',
    globalTax: 'Taxe mondiale',
    luxuryTax: 'Taxe de luxe',
    incomeTax: 'Impôt sur le revenu',

    // City Names
    subkowy: 'Subkowy',
    starogardGdanski: 'Starogard Gdański',
    balticSands: 'Baltic Sands',
    costaBrava: 'Costa Brava',
    tropicalCove: 'Tropical Cove',
    paradiseAtoll: 'Paradise Atoll',
    cairo: 'Le Caire',
    athens: 'Athènes',
    prague: 'Prague',
    vienna: 'Vienne',
    budapest: 'Budapest',
    madrid: 'Madrid',
    seville: 'Séville',
    rome: 'Rome',
    milan: 'Milan',
    venice: 'Venise',
    berlin: 'Berlin',
    munich: 'Munich',
    hamburg: 'Hambourg',
    amsterdam: 'Amsterdam',
    rotterdam: 'Rotterdam',
    brussels: 'Bruxelles',
    london: 'Londres',
    manchester: 'Manchester',
    dublin: 'Dublin',
    paris: 'Paris',
    nice: 'Nice',
    lyon: 'Lyon',
    tokyo: 'Tokyo',
    kyoto: 'Kyoto',
    osaka: 'Osaka',
    singapore: 'Singapour',
    dubai: 'Dubaï',
    abuDhabi: 'Abou Dabi',
    monaco: 'Monaco',
    newYork: 'New York',
    lasVegas: 'Las Vegas',
    chicago: 'Chicago',
    seoul: 'Séoul',
    sydney: 'Sydney',

    // Settings
    audio: 'Audio & Jukebox',
    graphics: 'Graphismes & 3D',
    gameplay: 'Jouabilité',
    language: 'Langue',
    languageSelection: 'Langue & Région',
    selectLanguage: 'Choisir la langue',
    volume: 'Volume',
    masterVolume: 'Volume général',
    sfxVolume: 'Volume des effets',
    musicVolume: 'Volume de la musique',
    quality: 'Qualité',
    graphicsQuality: 'Qualité graphique',
    fastDice: 'Mode lancer rapide',
    fastDiceDesc: 'Accélère l’animation des dés 3D à 300 ms',
    autoPass: 'Fin de tour auto',
    autoPassDesc: 'Termine automatiquement le tour lorsqu’aucune action ne reste',
    mute: 'Muet',
    resetSettings: 'Réinitialiser tous les paramètres',
    keybinds: 'Raccourcis',
    aboutLoadout: 'À propos & Équipement',

    // Cards
    bullMarketTitle: 'Folie du Marché Haussier',
    bullMarketDesc: 'Rallye boursier ! La trésorerie galactique verse 250 000 Crédits Spatiaux à TOUS les joueurs.',
    bearMarketTitle: 'Krach du Cygne Noir',
    bearMarketDesc: 'Crise de liquidité cosmique ! Le joueur le plus riche paie 250 000 Crédits de taxe de luxe ; les autres 75 000.',
    typhoonStrikeTitle: 'Typhon Côtier',
    typhoonStrikeDesc: 'Un ouragan solaire frappe la ville la plus développée ! Elle perd 1 niveau de bâtiment.',
    guardianAngelTitle: 'Ange Gardien',
    guardianAngelDesc: 'Bénédiction divine ! Ajoute une carte Bouclier de péage 100% à votre main.',
    warpSpeedTitle: 'Fusée Suborbitale',
    warpSpeedDesc: 'Vol privé lancé ! Rendez-vous directement à l’Aéroport et touchez 200 000 Crédits.',
    robinHoodTitle: 'Braquage de Robin des Bois',
    robinHoodDesc: 'Prélève 150 000 Crédits au joueur le plus riche pour les donner au plus démuni.',
    seedRoundTitle: 'Financement Capital-Risque',
    seedRoundDesc: 'Les investisseurs financent votre projet ! Recevez 300 000 Crédits + 1 Carte Action.',
    grandCarnivalTitle: 'Grand Carnaval',
    grandCarnivalDesc: 'Une grande foire ouvre dans une de vos villes ! Multiplicateur de festival 2X activé.',
  },

  es: {
    // UI Core
    rollDice: 'Tirar dados',
    rolling: 'Tirando...',
    rollingDice3D: 'LANZANDO DADOS 3D...',
    roll3dDice: 'LANZAR DADOS 3D',
    rollForDoubles: 'LANZAR PARA DOBLES',
    awaitingTurn: 'Esperando turno...',
    resolvingAction: 'Resolviendo acción...',
    doublesExtraRoll: '✨ ¡DOBLES! ¡TIRADA EXTRA! ✨',
    bail: 'Fianza',
    payBail: 'Pagar fianza',
    payBailEscape: '🌴 PAGAR 100.000 CR DE FIANZA Y ESCAPAR',
    pass: 'Pasar',
    endTurn: 'Terminar turno',
    buyCity: 'Comprar ciudad',
    buyAndUpgrade: 'COMPRAR Y MEJORAR',
    upgradeCity: 'Mejorar ciudad',
    upgradeLevel: 'SUBIR DE NIVEL',
    hostileBuyout: 'Adquisición hostil',
    hostileBuyout2x: 'ADQUISICIÓN HOSTIL 2X',
    travel: 'Viajar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    settings: 'Ajustes',
    gameSettings: 'Ajustes del juego',
    openSettings: 'Abrir ajustes',
    leaveRoom: 'Salir de la sala',
    leaveToHub: 'VOLVER AL HUB',
    winner: 'Ganador',
    wins: '¡GANA!',
    bankrupt: 'BANCARROTA',
    waiting: 'Esperando',
    timeLeft: 'restante',
    cannotBeBoughtOut: '¡NO PUEDE SER COMPRADA POR RIVALES!',
    rentYield: 'Rendimiento de renta',
    costToBuild: 'Coste de construcción',
    ownedBy: '¡Propiedad de {owner}! Renta pagada: {rent} Créditos Espaciales',
    plot: 'Solar',
    cottage: 'Cabaña',
    hotel: 'Hotel',
    landmark: 'Monumento',
    cash: 'Créditos',
    assets: 'Patrimonio',
    properties: 'Propiedades',
    shop: 'Tienda',
    chat: 'Chat',
    muteMusic: 'Silenciar música',
    playMusic: 'Reproducir música',

    // Special Tiles
    start: 'SALIDA',
    resortIsland: 'Isla turística',
    worldTour: 'Gira mundial',
    airport: 'Aeropuerto',
    worldFair: 'Feria mundial',
    championships: 'Campeonatos',
    armory: 'Armería',
    chance: 'Suerte',
    mystery: 'Misterio',
    cityTax: 'Impuesto municipal',
    globalTax: 'Impuesto global',
    luxuryTax: 'Impuesto de lujo',
    incomeTax: 'Impuesto sobre la renta',

    // City Names
    subkowy: 'Subkowy',
    starogardGdanski: 'Starogard Gdański',
    balticSands: 'Costa Báltica',
    costaBrava: 'Costa Brava',
    tropicalCove: 'Cala Tropical',
    paradiseAtoll: 'Atolón Paraíso',
    cairo: 'El Cairo',
    athens: 'Atenas',
    prague: 'Praga',
    vienna: 'Viena',
    budapest: 'Budapest',
    madrid: 'Madrid',
    seville: 'Sevilla',
    rome: 'Roma',
    milan: 'Milán',
    venice: 'Venecia',
    berlin: 'Berlín',
    munich: 'Múnich',
    hamburg: 'Hamburgo',
    amsterdam: 'Ámsterdam',
    rotterdam: 'Róterdam',
    brussels: 'Bruselas',
    london: 'Londres',
    manchester: 'Mánchester',
    dublin: 'Dublín',
    paris: 'París',
    nice: 'Niza',
    lyon: 'Lyon',
    tokyo: 'Tokio',
    kyoto: 'Kioto',
    osaka: 'Osaka',
    singapore: 'Singapur',
    dubai: 'Dubái',
    abuDhabi: 'Abu Dabi',
    monaco: 'Mónaco',
    newYork: 'Nueva York',
    lasVegas: 'Las Vegas',
    chicago: 'Chicago',
    seoul: 'Seúl',
    sydney: 'Sídney',

    // Settings
    audio: 'Audio y Jukebox',
    graphics: 'Gráficos y 3D',
    gameplay: 'Jugabilidad',
    language: 'Idioma',
    languageSelection: 'Idioma y Región',
    selectLanguage: 'Seleccionar idioma',
    volume: 'Volumen',
    masterVolume: 'Volumen general',
    sfxVolume: 'Volumen de efectos',
    musicVolume: 'Volumen de música',
    quality: 'Calidad',
    graphicsQuality: 'Calidad gráfica',
    fastDice: 'Modo tirada rápida',
    fastDiceDesc: 'Acelera la física de dados 3D a 300 ms',
    autoPass: 'Terminar turno auto',
    autoPassDesc: 'Termina el turno automáticamente si no quedan acciones',
    mute: 'Silenciar',
    resetSettings: 'Restablecer todos los ajustes',
    keybinds: 'Controles',
    aboutLoadout: 'Acerca de y Equipo',

    // Cards
    bullMarketTitle: 'Manía del Mercado Alcista',
    bullMarketDesc: '¡Euforia bursátil! La tesorería galáctica concede 250.000 Créditos Espaciales a TODOS los jugadores.',
    bearMarketTitle: 'Colapso del Cisne Negro',
    bearMarketDesc: '¡Crisis de liquidez cósmica! El más rico paga 250.000 Créditos de impuesto de lujo; los demás pagan 75.000.',
    typhoonStrikeTitle: 'Tifón Costero',
    typhoonStrikeDesc: '¡Huracán solar de categoría 5 azota la ciudad de mayor nivel! Pierde 1 nivel de edificio.',
    guardianAngelTitle: 'Ángel Guardián',
    guardianAngelDesc: '¡Bendición divina! Añade una carta Escudo de Peaje 100% directamente a tu mano.',
    warpSpeedTitle: 'Cohete Suborbital',
    warpSpeedDesc: '¡Vuelo espacial privado! Avanza directo al Aeropuerto y recibe 200.000 Créditos.',
    robinHoodTitle: 'Golpe de Robin Hood',
    robinHoodDesc: 'Toma 150.000 Créditos del jugador más rico y se los transfiere directamente al más pobre.',
    seedRoundTitle: 'Inyección de Capital',
    seedRoundDesc: '¡Inversores financian tu empresa! Recibe 300.000 Créditos + 1 Carta de Acción.',
    grandCarnivalTitle: 'Gran Carnaval',
    grandCarnivalDesc: '¡Abre una gran feria en tu ciudad! Multiplicador de festival 2X activado.',
  },

  ru: {
    // UI Core
    rollDice: 'Бросить кубики',
    rolling: 'Бросок...',
    rollingDice3D: 'БРОСОК 3D КУБИКОВ...',
    roll3dDice: 'БРОСИТЬ 3D КУБИКИ',
    rollForDoubles: 'БРОСОК НА ДУБЛЬ',
    awaitingTurn: 'Ожидание хода...',
    resolvingAction: 'Выполнение действия...',
    doublesExtraRoll: '✨ ДУБЛЬ! ДОПОЛНИТЕЛЬНЫЙ БРОСОК! ✨',
    bail: 'Залог',
    payBail: 'Заплатить залог',
    payBailEscape: '🌴 ВНЕСТИ 100 000 CR ЗАЛОГА И СБЕЖАТЬ',
    pass: 'Пас',
    endTurn: 'Завершить ход',
    buyCity: 'Купить город',
    buyAndUpgrade: 'КУПИТЬ И УЛУЧШИТЬ',
    upgradeCity: 'Улучшить город',
    upgradeLevel: 'ПОВЫСИТЬ УРОВЕНЬ',
    hostileBuyout: 'Враждебное поглощение',
    hostileBuyout2x: 'ВРАЖДЕБНЫЙ ВЫКУП 2X',
    travel: 'Путешествие',
    cancel: 'Отмена',
    confirm: 'Подтвердить',
    settings: 'Настройки',
    gameSettings: 'Настройки игры',
    openSettings: 'Открыть настройки',
    leaveRoom: 'Покинуть комнату',
    leaveToHub: 'ВЫЙТИ В ХАБ',
    winner: 'Победитель',
    wins: 'ПОБЕЖДАЕТ!',
    bankrupt: 'БАНКРОТ',
    waiting: 'Ожидание',
    timeLeft: 'осталось',
    cannotBeBoughtOut: 'НЕЛЬЗЯ ВЫКУПИТЬ СОПЕРНИКАМ!',
    rentYield: 'Доход от аренды',
    costToBuild: 'Стоимость постройки',
    ownedBy: 'Владелец: {owner}! Оплачена аренда: {rent} Space Credits',
    plot: 'Участок',
    cottage: 'Коттедж',
    hotel: 'Отель',
    landmark: 'Монумент',
    cash: 'Кредиты',
    assets: 'Капитал',
    properties: 'Собственность',
    shop: 'Магазин',
    chat: 'Чат',
    muteMusic: 'Выключить музыку',
    playMusic: 'Включить музыку',

    // Special Tiles
    start: 'СТАРТ',
    resortIsland: 'Курортный остров',
    worldTour: 'Кругосветка',
    airport: 'Аэропорт',
    worldFair: 'Всемирная выставка',
    championships: 'Чемпионат',
    armory: 'Арсенал',
    chance: 'Шанс',
    mystery: 'Сюрприз',
    cityTax: 'Городской налог',
    globalTax: 'Глобальный налог',
    luxuryTax: 'Налог на роскошь',
    incomeTax: 'Подоходный налог',

    // City Names
    subkowy: 'Субковы',
    starogardGdanski: 'Старогард-Гданьский',
    balticSands: 'Балтик Сэндс',
    costaBrava: 'Коста Брава',
    tropicalCove: 'Тропикал Коув',
    paradiseAtoll: 'Парадайз Атолл',
    cairo: 'Каир',
    athens: 'Афины',
    prague: 'Прага',
    vienna: 'Вена',
    budapest: 'Будапешт',
    madrid: 'Мадрид',
    seville: 'Севилья',
    rome: 'Рим',
    milan: 'Милан',
    venice: 'Венеция',
    berlin: 'Берлин',
    munich: 'Мюнхен',
    hamburg: 'Гамбург',
    amsterdam: 'Амстердам',
    rotterdam: 'Роттердам',
    brussels: 'Брюссель',
    london: 'Лондон',
    manchester: 'Манчестер',
    dublin: 'Дублин',
    paris: 'Париж',
    nice: 'Ницца',
    lyon: 'Лион',
    tokyo: 'Токио',
    kyoto: 'Киото',
    osaka: 'Осака',
    singapore: 'Сингапур',
    dubai: 'Дубай',
    abuDhabi: 'Абу-Даби',
    monaco: 'Монако',
    newYork: 'Нью-Йорк',
    lasVegas: 'Лас-Вегас',
    chicago: 'Чикаго',
    seoul: 'Сеул',
    sydney: 'Сидней',

    // Settings
    audio: 'Аудио и музыка',
    graphics: 'Графика и 3D',
    gameplay: 'Геймплей',
    language: 'Язык',
    languageSelection: 'Язык и регион',
    selectLanguage: 'Выбор языка',
    volume: 'Громкость',
    masterVolume: 'Общая громкость',
    sfxVolume: 'Громкость эффектов',
    musicVolume: 'Громкость музыки',
    quality: 'Качество',
    graphicsQuality: 'Качество графики',
    fastDice: 'Быстрый бросок',
    fastDiceDesc: 'Ускоряет анимацию 3D кубиков до 300мс',
    autoPass: 'Авто-пас',
    autoPassDesc: 'Автоматически завершать ход, если нет доступных действий',
    mute: 'Без звука',
    resetSettings: 'Сбросить все настройки',
    keybinds: 'Управление',
    aboutLoadout: 'Об игре и экипировка',

    // Cards
    bullMarketTitle: 'Бурный бычий рынок',
    bullMarketDesc: 'Рынки на взлёте! Галактическое казначейство выплачивает по 250 000 космических кредитов КАЖДОМУ игроку.',
    bearMarketTitle: 'Крах Чёрного лебедя',
    bearMarketDesc: 'Кризис ликвидности! Самый богатый игрок платит налог на роскошь 250 000 кредитов; остальные платят по 75 000.',
    typhoonStrikeTitle: 'Прибрежный тайфун',
    typhoonStrikeDesc: 'Солнечный ураган 5-й категории разрушает самый прокачанный город на поле! Он теряет 1 уровень.',
    guardianAngelTitle: 'Ангел-хранитель',
    guardianAngelDesc: 'Божественное благословение защищает вас! Добавляет в руку карту 100% Щита от аренды.',
    warpSpeedTitle: 'Суборбитальная ракета',
    warpSpeedDesc: 'Запуск частной ракеты! Переместитесь в Аэропорт и получите 200 000 кредитов субсидии.',
    robinHoodTitle: 'Ограбление Робин Гуда',
    robinHoodDesc: 'Забирает 150 000 кредитов у самого богатого магната и передаёт их беднейшему игроку.',
    seedRoundTitle: 'Венчурные инвестиции',
    seedRoundDesc: 'Инвесторы профинансировали ваше предприятие! Получите 300 000 кредитов + 1 Карту Действия.',
    grandCarnivalTitle: 'Грандиозный карнавал',
    grandCarnivalDesc: 'В одном из ваших городов открывается всемирная ярмарка! Удваивает аренду (2X).',
  },
};

// Aliases lookup map for fast multi-format lookup (e.g., 'Cairo', 'START', 'World Fair')
const ALIAS_LOOKUP = {
  // Cities & Resorts
  'Subkowy': 'subkowy',
  'Starogard Gdański': 'starogardGdanski',
  'Starogard Gdanski': 'starogardGdanski',
  'Baltic Sands': 'balticSands',
  'Costa Brava': 'costaBrava',
  'Tropical Cove': 'tropicalCove',
  'Paradise Atoll': 'paradiseAtoll',
  'Cairo': 'cairo',
  'Athens': 'athens',
  'Prague': 'prague',
  'Vienna': 'vienna',
  'Budapest': 'budapest',
  'Madrid': 'madrid',
  'Seville': 'seville',
  'Rome': 'rome',
  'Milan': 'milan',
  'Venice': 'venice',
  'Berlin': 'berlin',
  'Munich': 'munich',
  'Hamburg': 'hamburg',
  'Amsterdam': 'amsterdam',
  'Rotterdam': 'rotterdam',
  'Brussels': 'brussels',
  'London': 'london',
  'Manchester': 'manchester',
  'Dublin': 'dublin',
  'Paris': 'paris',
  'Nice': 'nice',
  'Lyon': 'lyon',
  'Tokyo': 'tokyo',
  'Kyoto': 'kyoto',
  'Osaka': 'osaka',
  'Singapore': 'singapore',
  'Dubai': 'dubai',
  'Abu Dhabi': 'abuDhabi',
  'Monaco': 'monaco',
  'New York': 'newYork',
  'Las Vegas': 'lasVegas',
  'Chicago': 'chicago',
  'Seoul': 'seoul',
  'Sydney': 'sydney',

  // Special tiles
  'START': 'start',
  'Resort Island': 'resortIsland',
  'World Tour': 'worldTour',
  'Airport': 'airport',
  'World Fair': 'worldFair',
  'Championships': 'championships',
  'Armory': 'armory',
  'Chance': 'chance',
  'Mystery': 'mystery',
  'City Tax': 'cityTax',
  'Global Tax': 'globalTax',
  'Luxury Luxury': 'luxuryTax',
  'Luxury Tax': 'luxuryTax',
  'Income Tax': 'incomeTax',

  // Event Cards
  'bull_market': 'bullMarketTitle',
  'bull_market_title': 'bullMarketTitle',
  'bull_market_desc': 'bullMarketDesc',
  'Bull Market Mania': 'bullMarketTitle',
  'bear_market': 'bearMarketTitle',
  'bear_market_title': 'bearMarketTitle',
  'bear_market_desc': 'bearMarketDesc',
  'Black Swan Crash': 'bearMarketTitle',
  'typhoon_strike': 'typhoonStrikeTitle',
  'typhoon_strike_title': 'typhoonStrikeTitle',
  'typhoon_strike_desc': 'typhoonStrikeDesc',
  'Coastal Typhoon': 'typhoonStrikeTitle',
  'guardian_angel': 'guardianAngelTitle',
  'guardian_angel_title': 'guardianAngelTitle',
  'guardian_angel_desc': 'guardianAngelDesc',
  'Guardian Angel': 'guardianAngelTitle',
  'warp_speed': 'warpSpeedTitle',
  'warp_speed_title': 'warpSpeedTitle',
  'warp_speed_desc': 'warpSpeedDesc',
  'Suborbital Rocket': 'warpSpeedTitle',
  'robin_hood': 'robinHoodTitle',
  'robin_hood_title': 'robinHoodTitle',
  'robin_hood_desc': 'robinHoodDesc',
  'Robin Hood Heist': 'robinHoodTitle',
  'seed_round': 'seedRoundTitle',
  'seed_round_title': 'seedRoundTitle',
  'seed_round_desc': 'seedRoundDesc',
  'Venture Capital Airdrop': 'seedRoundTitle',
  'grand_carnival': 'grandCarnivalTitle',
  'grand_carnival_title': 'grandCarnivalTitle',
  'grand_carnival_desc': 'grandCarnivalDesc',
  'Grand Carnival': 'grandCarnivalTitle',
};

// Get current language from localStorage or fallback
export function getLanguage() {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && TRANSLATIONS[saved]) {
      return saved;
    }
  } catch (e) {
    // localStorage might be unavailable or restricted
  }
  return DEFAULT_LANGUAGE;
}

// Set active language, update storage, and notify all reactive listeners
export function setLanguage(langCode) {
  if (!TRANSLATIONS[langCode]) {
    console.warn(`[i18n] Language '${langCode}' not supported, falling back to '${DEFAULT_LANGUAGE}'`);
    langCode = DEFAULT_LANGUAGE;
  }
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, langCode);
      window.dispatchEvent(new CustomEvent(LANGUAGE_EVENT, { detail: { language: langCode } }));
      window.dispatchEvent(new CustomEvent('ngg_settings_changed', {
        detail: { key: STORAGE_KEY, value: langCode }
      }));
    } catch (e) {
      console.warn('[i18n] Failed to persist language to localStorage', e);
    }
  }
  return langCode;
}

// Internal lookup helper
function resolveValue(lang, key) {
  const dict = TRANSLATIONS[lang];
  if (!dict) return null;

  // Direct key lookup
  if (dict[key] !== undefined) return dict[key];

  // Alias lookup (e.g. 'Cairo' -> 'cairo', 'START' -> 'start')
  const aliasKey = ALIAS_LOOKUP[key];
  if (aliasKey && dict[aliasKey] !== undefined) {
    return dict[aliasKey];
  }

  // Nested dot syntax support (e.g. 'ui.rollDice', 'cities.cairo')
  if (typeof key === 'string' && key.includes('.')) {
    const parts = key.split('.');
    let cur = dict;
    for (const part of parts) {
      if (cur && cur[part] !== undefined) {
        cur = cur[part];
      } else {
        cur = null;
        break;
      }
    }
    if (cur !== null && cur !== undefined) return cur;
  }

  // Case-insensitive fallback
  const lowerKey = typeof key === 'string' ? key.toLowerCase() : '';
  if (dict[lowerKey] !== undefined) return dict[lowerKey];

  return null;
}

// Translation function with parameter interpolation {param} or {{param}}
export function t(key, params = {}) {
  const lang = getLanguage();
  let text = resolveValue(lang, key);

  // Fallback to English if missing in chosen language
  if (text === null || text === undefined) {
    text = resolveValue(DEFAULT_LANGUAGE, key);
  }

  // If still missing, return the raw key
  if (text === null || text === undefined) {
    return typeof key === 'string' ? key : String(key);
  }

  // Interpolate parameters: {param} or {{param}}
  if (typeof text === 'string' && params && typeof params === 'object') {
    Object.keys(params).forEach((paramKey) => {
      const val = params[paramKey];
      text = text.replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, 'g'), val);
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), val);
    });
  }

  return text;
}

// React Hook for dynamic, reactive re-rendering across components
export function useTranslation() {
  const [currentLang, setCurrentLang] = useState(() => getLanguage());

  useEffect(() => {
    // Re-sync with actual storage after mount
    setCurrentLang(getLanguage());

    const handleLanguageChange = (e) => {
      const newLang = e?.detail?.language || getLanguage();
      setCurrentLang(newLang);
    };

    const handleStorageEvent = (e) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setCurrentLang(e.newValue);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(LANGUAGE_EVENT, handleLanguageChange);
      window.addEventListener('storage', handleStorageEvent);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(LANGUAGE_EVENT, handleLanguageChange);
        window.removeEventListener('storage', handleStorageEvent);
      }
    };
  }, []);

  const changeLanguage = useCallback((newLang) => {
    setLanguage(newLang);
    setCurrentLang(newLang);
  }, []);

  const translate = useCallback((key, params) => {
    // Force reactive reliance on currentLang
    let text = resolveValue(currentLang, key);
    if (text === null || text === undefined) {
      text = resolveValue(DEFAULT_LANGUAGE, key);
    }
    if (text === null || text === undefined) {
      return typeof key === 'string' ? key : String(key);
    }
    if (typeof text === 'string' && params && typeof params === 'object') {
      Object.keys(params).forEach((paramKey) => {
        const val = params[paramKey];
        text = text.replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, 'g'), val);
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), val);
      });
    }
    return text;
  }, [currentLang]);

  return {
    t: translate,
    language: currentLang,
    currentLanguage: currentLang,
    setLanguage: changeLanguage,
    languages: LANGUAGES,
  };
}

export default {
  LANGUAGES,
  DEFAULT_LANGUAGE,
  TRANSLATIONS,
  getLanguage,
  setLanguage,
  t,
  useTranslation,
};
