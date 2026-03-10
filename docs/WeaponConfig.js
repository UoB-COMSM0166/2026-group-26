
const WEAPON_TYPES = {
  PISTOL: 'pistol',
  SHOTGUN: 'shotgun',
  RIFLE: 'rifle',
  LASER: 'laser',
  MOLOTOV: 'molotov',
  DONGFENG: 'dongfeng',
  LOITERING: 'loitering',
  ATOMIC: 'atomic'
};

const WEAPON_CONFIG = {
  [WEAPON_TYPES.PISTOL]: {
    name: 'Pistol',
    type: 'basic', // Equipped in shop
    damage: 1,
    speed: 10,
    cooldown: 200, // ms
    ammoCost: 1,
    color: [255, 255, 0],
    lifespan: 60,
    spread: 0,
    count: 1,
    description: "Standard issue sidearm. Reliable."
  },
  [WEAPON_TYPES.SHOTGUN]: {
    name: 'Shotgun',
    type: 'basic',
    damage: 1, // Per pellet
    speed: 12,
    cooldown: 800,
    ammoCost: 1, // User requested 1 ammo count per shot despite multiple pellets
    color: [255, 100, 0],
    lifespan: 40,
    spread: 0.15, // Angle spread
    count: 5, // Number of pellets
    description: "Fires a spread of pellets. devastating at close range."
  },
  [WEAPON_TYPES.RIFLE]: {
    name: 'Assault Rifle',
    type: 'basic',
    damage: 1,
    speed: 15,
    cooldown: 100, // Fast fire rate (burst handled in logic)
    ammoCost: 1, // Per burst? Or per shot? Let's say per burst for consistency with user request
    color: [255, 200, 0],
    lifespan: 70,
    spread: 0.05,
    count: 3, // Burst count
    burstDelay: 5, // Frames between burst shots
    description: "Fires a burst of bullets with high precision."
  },
  [WEAPON_TYPES.LASER]: {
    name: 'Laser Gun',
    type: 'basic',
    damage: 2, // Higher damage?
    speed: 25,
    cooldown: 1000,
    ammoCost: 1,
    color: [0, 255, 255],
    lifespan: 60,
    penetrates: true,
    description: "Fires a high-energy beam that penetrates enemies."
  },
  [WEAPON_TYPES.MOLOTOV]: {
    name: 'Molotov',
    type: 'basic',
    damage: 0.1, // Continuous damage per frame
    speed: 8, // Throw speed
    cooldown: 1500,
    ammoCost: 1,
    color: [255, 50, 0],
    lifespan: 120, // Time before explosion if not hit? Or travel time?
    isThrown: true,
    areaDuration: 300, // Frames fire stays on ground
    areaRadius: 80,
    description: "Thrown explosive that creates a patch of fire."
  },
  // Special Weapons (Drops)
  [WEAPON_TYPES.DONGFENG]: {
    name: 'Dongfeng Missile',
    type: 'special',
    damage: 50,
    cooldown: 0,
    ammoCost: 1, // Uses the item itself
    description: "Strategic missile strike. Select target on map.",
    dropWeight: 50,
    dropRateText: "Medium"
  },
  [WEAPON_TYPES.LOITERING]: {
    name: 'Loitering Munition',
    type: 'special',
    damage: 20,
    cooldown: 0,
    ammoCost: 1,
    speed: 5, // Initial speed
    maxSpeed: 20,
    turnSpeed: 0.1,
    description: "Remote controlled drone missile.",
    dropWeight: 30,
    dropRateText: "Low"
  },
  [WEAPON_TYPES.ATOMIC]: {
    name: 'Atomic Bomb',
    type: 'special',
    damage: 9999,
    cooldown: 0,
    ammoCost: 1,
    description: "Total annihilation.",
    dropWeight: 5,
    dropRateText: "Very Rare"
  }
};
