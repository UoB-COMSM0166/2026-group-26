let player;
let enemies = [];
let powerups = [];
let particles = [];
let buildings = [];
let projectiles = [];
let gameState = 'BOOT_LOADING'; // BOOT_LOADING, MENU, MENU_SHOP, PLAY, PAUSED, GAMEOVER, WIN, SHOP, AUTH
let shopBuilding = null; // Store which building opened the shop
let lastShotTime = 0; // For weapon cooldown
let startTime;
let survivalTime = 60; // 60 seconds to win
let lastEnemySpawnTime = 0;
let lastPowerUpSpawnTime = 0;
let specialDropFailCount = 0;
let shakeAmount = 0;
let pauseStartTime = 0;
let totalPausedTime = 0;
let hospitalImg;
let armoryImg;
let gameCoverImg;
let gameCoverVideo;
let startBtnImg;
let exitBtnImg;
let shopBtnImg;
let shopBoardImg;
let victoryImg;
let defeatImg;
let victoryVideo;
let defeatVideo;
let settingIconImg;
let helpIconImg;
let bulletIconImg;
let controlKeyImgs = {};
let lastCoverRect = null;
let shopUI;
let authUI;
let tutorialSystem;
let deferredMenuVisualsRequested = false;
let deferredMenuVisualsTimer = null;
let shopSupportAssetsRequested = false;
let gameplayAssetsRequested = false;
let endingVideosRequested = false;
let bootLoadingStartedAt = 0;
let startGateMessage = '';
let startGateMessageColor = [255, 80, 80];
let startGateMessageUntil = 0;
let startGatePending = false;
let difficultyStartPending = false;
let menuAccountOpen = false;
let menuAccountIconRect = null;
let menuAccountPopupRect = null;
let menuAccountPrimaryButtonRect = null;
let menuAccountSecondaryButtonRect = null;
let helpTab = 'BASICS'; // BASICS, VEHICLES, WEAPONS
const BUILDING_INTERACTION_CONFIG = {
  armory: {
    title: 'ARMORY',
    itemLabel: 'Ammo Pack',
    price: 8,
    amount: 5,
    accent: [255, 160, 80],
    description: 'Purchase extra bullets for your current vehicle.'
  },
  hospital: {
    title: 'HOSPITAL',
    itemLabel: 'Medical Aid',
    price: 12,
    amount: 1,
    accent: [100, 220, 140],
    description: 'Restore one heart using your saved coins.'
  }
};
let buildingInteractionUI = {
  closeRect: null,
  actionRect: null,
  inputOffsetX: 0,
  inputOffsetY: 0
};

// Game Settings
let difficulty = 'NORMAL'; // EASY, NORMAL, HARD
let currentLevel = 1;
let isPaused = false;
let boundaryWarningAlpha = 0;

// Layout Constants
let gameWidth;
let gameHeight;
let statusHeight = 130;
let gameViewX = 0;
let gameViewY = 0;

// Map & Camera
let mapWidth = 3200;
let mapHeight = 2400;
let camX = 0;
let camY = 0;
let mapGraphics;

// City Layout
let cityCols = 12;
let cityRows = 9;
let cityStartX = 100;
let cityStartY = 100;
let cityGapX;
let cityGapY;

// Asset Images
let images = {};
let obstacles = []; // Store obstacles like rocks/trees

// TileMap System
let tileMap = []; // 2D array of tiles
let tileSize = 100; // Size of each tile (pixels)
let mapCols, mapRows;
let roadCenters = [];
let mapTextureRefreshDone = false;
const BOOT_LOADING_MIN_MS = 1600;
const BOOT_LOADING_MAX_MS = 30000;

const CITY_BUILDING_FILES = [
  { file: 'Anna_house.png', label: 'Residence', folder: 'residential' },
  { file: 'Ben_house.png', label: 'Residence', folder: 'residential' },
  { file: 'David_house.png', label: 'Residence', folder: 'residential' },
  { file: 'Emma_house.png', label: 'Residence', folder: 'residential' },
  { file: 'Grace_house.png', label: 'Residence', folder: 'residential' },
  { file: 'Jack_house.png', label: 'Residence', folder: 'residential' },
  { file: 'Leo_house.png', label: 'Residence', folder: 'residential' },
  { file: 'Lily_house.png', label: 'Residence', folder: 'residential' },
  { file: 'Lucy_house.png', label: 'Residence', folder: 'residential' },
  { file: 'Mike_house.png', label: 'Residence', folder: 'residential' },
  { file: 'Sarah_house.png', label: 'Residence', folder: 'residential' },
  { file: 'Tom_house.png', label: 'Residence', folder: 'residential' },
  { file: 'cafe.webp', label: 'Cafe', folder: '' },
  { file: 'garden.webp', label: 'Garden', folder: '' },
  { file: 'school.webp', label: 'School', folder: '' },
  { file: 'supermarket.webp', label: 'Supermarket', folder: '' }
];

function preloadAssets() {
  // Keep boot-time requests minimal: only map base textures are required to render
  // the initial world buffer. UI, shop, gameplay props, and ending videos load later.
  images.grass = loadImage('icon/terrain/grass_1.png');
  images.grassAlt1 = loadImage('icon/terrain/Grass.png');
  images.asphalt = loadImage('icon/terrain/asphalt.png');
  images.pavement = loadImage('icon/terrain/pavement_tile_1.png');
  images.pavementAlt = loadImage('icon/terrain/pavement.png');
  
  images.sand = loadImage('icon/terrain/sand.png'); 
  
  // Road Tiles (Autotiling)
  images.roadV = loadImage('icon/roads/road_1.png'); 
  images.roadH = loadImage('icon/roads/road_2.png');
  images.roadVAlt = loadImage('icon/roads/road_crosswalk_1.png');
  images.roadHAlt = loadImage('icon/roads/road_crosswalk_2.png');
  images.cross = loadImage('icon/roads/road_cross.png');
  
  // Turns
  images.turnD = loadImage('icon/roads/road_turn_d.png');
  images.turnL = loadImage('icon/roads/road_turn_l.png');
  images.turnR = loadImage('icon/roads/road_turn_r.png');
  images.turnU = loadImage('icon/roads/road_turn_up.png');
  
  // T-Junctions
  images.tCross1 = loadImage('icon/roads/road_t_cross_1.png');
  images.tCross2 = loadImage('icon/roads/road_t_cross_2.png');
  images.tCross3 = loadImage('icon/roads/road_t_cross_3.png');
  images.tCross4 = loadImage('icon/roads/road_t_cross_4.png');

  images.grassVariants = [images.grass, images.grassAlt1];
  images.pavementVariants = [images.pavement, images.pavementAlt, images.asphalt];
  images.roadVVariants = [images.roadV, images.roadV, images.roadVAlt];
  images.roadHVariants = [images.roadH, images.roadH, images.roadHAlt];
}

function isDataSaverEnabled() {
  return !!(navigator.connection && navigator.connection.saveData);
}

function createMutedVideoAsset(path, preloadMode = 'metadata') {
  let video = createVideo(path);
  video.volume(0);
  video.elt.muted = true;
  video.elt.playsInline = true;
  video.elt.preload = preloadMode;
  video.hide();
  video.elt.load();
  return video;
}

function ensureCoverMedia() {
  if (!gameCoverVideo) {
    gameCoverVideo = createMutedVideoAsset('icon/videos/game_cover_video.mp4', 'auto');
  }
}

function loadDeferredMenuVisualAssets() {
  if (deferredMenuVisualsRequested) return;
  deferredMenuVisualsRequested = true;
  startBtnImg = loadImage('icon/ui/start.webp');
  exitBtnImg = loadImage('icon/ui/exit.webp');
  shopBtnImg = loadImage('icon/ui/store_mainpage.webp');
  settingIconImg = loadImage('icon/ui/setting.webp');
  helpIconImg = loadImage('icon/ui/help.webp');
}


function loadShopSupportAssets() {
  if (shopSupportAssetsRequested) return;
  shopSupportAssetsRequested = true;
  shopBoardImg = loadImage('icon/ui/shop_board.webp');
  bulletIconImg = loadImage('icon/ui/bullet.webp');
  controlKeyImgs = {
    W: loadImage('icon/controls/keyboard_W.png'),
    A: loadImage('icon/controls/keyboard_A.png'),
    S: loadImage('icon/controls/keyboard_S.png'),
    D: loadImage('icon/controls/keyboard_D.png'),
    X: loadImage('icon/controls/keyboard_X.png'),
    UP: loadImage('icon/controls/keyboard_up.png'),
    DOWN: loadImage('icon/controls/keyboard_down.png'),
    LEFT: loadImage('icon/controls/keyboard_left.png'),
    RIGHT: loadImage('icon/controls/keyboard_right.png')
  };
  images.weaponShop = {
    [WEAPON_TYPES.PISTOL]: loadImage('icon/weapons/pistol.webp'),
    [WEAPON_TYPES.SHOTGUN]: loadImage('icon/weapons/short_gun.webp'),
    [WEAPON_TYPES.RIFLE]: loadImage('icon/weapons/assault_rifle.webp'),
    [WEAPON_TYPES.LASER]: loadImage('icon/weapons/laser_gun.webp'),
    [WEAPON_TYPES.MOLOTOV]: loadImage('icon/weapons/molotov.webp'),
    [WEAPON_TYPES.DONGFENG]: loadImage('icon/weapons/DF.webp'),
    [WEAPON_TYPES.LOITERING]: loadImage('icon/weapons/drone.webp'),
    [WEAPON_TYPES.ATOMIC]: loadImage('icon/weapons/nuke.webp')
  };
}

function loadGameplayAssets() {
  if (gameplayAssetsRequested) return;
  gameplayAssetsRequested = true;
  loadShopSupportAssets();
  hospitalImg = loadImage('icon/buildings/hospital.webp');
  armoryImg = loadImage('icon/buildings/arms.webp');
  images.tree1 = loadImage('icon/nature/trees/tree_1.png');
  images.tree2 = loadImage('icon/nature/trees/tree_2.png');
  images.tree3 = loadImage('icon/nature/trees/tree_3.png');
  images.tree4 = loadImage('icon/nature/trees/tree_4.png');
  images.tree5 = loadImage('icon/nature/trees/tree_5.png');
  images.pine1 = loadImage('icon/nature/trees/Pine.png');
  images.pine2 = loadImage('icon/nature/trees/Pine_2.png');
  images.rock1 = loadImage('icon/nature/rocks/stone_1.png');
  images.rock2 = loadImage('icon/nature/rocks/stone_2.png');
  images.rock3 = loadImage('icon/nature/rocks/stone_3.png');
  images.rock4 = loadImage('icon/nature/rocks/stone_4.png');
  images.rock5 = loadImage('icon/nature/rocks/stone_5.png');
  images.rock6 = loadImage('icon/nature/rocks/stone_6.png');
  images.bush1 = loadImage('icon/nature/bushes/bush_1.png');
  images.bush2 = loadImage('icon/nature/bushes/bush_2.png');
  images.bush3 = loadImage('icon/nature/bushes/bush_3.png');
  images.bush4 = loadImage('icon/nature/bushes/bush_4.png');
  images.bush5 = loadImage('icon/nature/bushes/bush_5.png');
  images.bush6 = loadImage('icon/nature/bushes/bush_6.png');
  images.bush7 = loadImage('icon/nature/bushes/bush_7.png');
  images.bush8 = loadImage('icon/nature/bushes/bush_8.png');
  images.police = loadImage('icon/buildings/police_dept.webp');
  images.cityBuildings = [];
  for (let f of CITY_BUILDING_FILES) {
    let basePath = 'icon/buildings/';
    let relativePath = f.folder ? (f.folder + '/' + f.file) : f.file;
    images.cityBuildings.push({ img: loadImage(basePath + relativePath), label: f.label });
  }
  images.trees = [images.tree1, images.tree2, images.tree3, images.tree4, images.tree5, images.pine1, images.pine2];
  images.rocks = [images.rock1, images.rock2, images.rock3, images.rock4, images.rock5, images.rock6];
  images.bushes = [images.bush1, images.bush2, images.bush3, images.bush4, images.bush5, images.bush6, images.bush7, images.bush8];
}

function loadEndingVideos() {
  if (endingVideosRequested) return;
  endingVideosRequested = true;
  defeatVideo = createMutedVideoAsset('icon/videos/defeat.mp4', 'metadata');
  victoryVideo = createMutedVideoAsset('icon/videos/victory.mp4', 'metadata');
}

function isMapTextureReady(img) {
  return !!(img && img.width > 1 && img.height > 1);
}

function areMapBaseTexturesReady() {
  return (
    isMapTextureReady(images.grass) &&
    isMapTextureReady(images.pavement) &&
    isMapTextureReady(images.sand) &&
    isMapTextureReady(images.roadV) &&
    isMapTextureReady(images.roadH) &&
    isMapTextureReady(images.cross)
  );
}

function areMenuVisualAssetsReady() {
  return (
    isMapTextureReady(startBtnImg) &&
    isMapTextureReady(exitBtnImg) &&
    isMapTextureReady(shopBtnImg)
  );
}

function isCoverVideoReadyForMenu() {
  if (!gameCoverVideo || !gameCoverVideo.elt) return false;
  let el = gameCoverVideo.elt;
  if (el.videoWidth <= 0 || el.readyState < 3) return false;
  if (!ensureVideoPlayable(gameCoverVideo)) return false;
  return !el.paused && !el.seeking && el.currentTime > 0.05;
}

function isBootLoadingComplete() {
  let elapsed = millis() - bootLoadingStartedAt;
  if (elapsed < BOOT_LOADING_MIN_MS) return false;
  if (!areMapBaseTexturesReady() || !areMenuVisualAssetsReady()) return false;
  if (isCoverVideoReadyForMenu()) return true;
  return false;
}

// Global Offset for Iso Map centering
let mapOffsetX, mapOffsetY;

function setup() {
  preloadAssets();
  mapTextureRefreshDone = false;
  gameWidth = windowWidth;
  gameHeight = windowHeight - statusHeight;
  
  createCanvas(gameWidth, gameHeight + statusHeight);
  bootLoadingStartedAt = millis();
  textAlign(CENTER, CENTER);
  rectMode(CENTER);
  imageMode(CENTER);
  
  // Calculate Map Grid Dimensions
  mapCols = floor(mapWidth / tileSize);
  mapRows = floor(mapHeight / tileSize);
  
  // Center the map in the render area
  mapOffsetX = mapWidth / 2;
  mapOffsetY = mapHeight / 4; // Start drawing from upper part

  shopUI = new ShopUI();
  authUI = new AuthUI();
  tutorialSystem = new TutorialSystem();
  ensurePlayerProfile();
  if (authUI.isLoggedIn()) {
      refreshUserProgress();
  }
  ensureCoverMedia();
  loadDeferredMenuVisualAssets();
  updateGameplayViewport();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  updateGameplayViewport();
  
  // Re-create map graphics if necessary or just let it scale
  // Ideally, if map size is constant, we don't need to recreate.
  // But if the canvas resize affects how we want to see things, we might.
  // For now, mapGraphics is independent of screen size, so we are good.
}

function updateGameplayViewport() {
  let coverSource = gameCoverVideo && gameCoverVideo.elt && gameCoverVideo.elt.videoWidth > 0 ? gameCoverVideo : gameCoverImg;
  let rect = getCoverRect(windowWidth, windowHeight - statusHeight, coverSource, true);
  gameViewX = rect.x;
  gameViewY = rect.y;
  gameWidth = rect.w;
  gameHeight = rect.h;
}

function projectIso(x, y) {
  // Convert World (Ortho) pixels to Grid units
  let gridX = x / tileSize;
  let gridY = y / tileSize;
  
  // Iso Projection (Standard 2:1)
  let isoX = (gridX - gridY) * (tileSize / 2);
  let isoY = (gridX + gridY) * (tileSize / 4); 
  
  return createVector(isoX + mapOffsetX, isoY + mapOffsetY);
}

function projectIsoVector(x, y) {
    // Project a vector (direction/velocity) without translation
    // Useful for converting heading or velocity to screen space
    let gridX = x; // Assume input is already in relative units or normalized
    let gridY = y;
    // Actually, if input is unit vector in World, we want unit vector in Screen (Iso)?
    // Or just the direction.
    // The projection scales X by 0.5 and Y by 0.25 (relative to tile size).
    // Let's use the same transformation matrix logic.
    // x_screen = (x_world - y_world) * (tileSize/2) / tileSize = (x-y)/2 * TILE_SCALE?
    // No, let's just use the same formula but ignore offsets.
    
    // We need to know the ratio.
    // In projectIso: isoX = (x/tileSize - y/tileSize) * tileSize/2 = (x - y)/2
    // isoY = (x/tileSize + y/tileSize) * tileSize/4 = (x + y)/4
    
    let isoX = (x - y) * 0.5;
    let isoY = (x + y) * 0.25;
    return createVector(isoX, isoY);
}



function resetGame(keepProgress = false) {
  let oldPlayer = player;

  if (typeof clearSpecialWeaponEffects === 'function') {
      clearSpecialWeaponEffects();
  }
  
  player = new Player(mapWidth / 2, mapHeight / 2); // Start in middle of large map
  
  if (keepProgress && oldPlayer) {
      player.coins = oldPlayer.coins;
      player.bonusMaxHp = oldPlayer.bonusMaxHp;
      player.bonusMaxAmmo = oldPlayer.bonusMaxAmmo;
      player.bonusTopSpeed = oldPlayer.bonusTopSpeed || 0;
      player.bonusAcceleration = oldPlayer.bonusAcceleration || 0;
      player.currentWeapon = oldPlayer.currentWeapon;
      player.ownedWeapons = Array.isArray(oldPlayer.ownedWeapons) ? [...oldPlayer.ownedWeapons] : [WEAPON_TYPES.PISTOL];
      player.ownedCars = Array.isArray(oldPlayer.ownedCars) ? [...oldPlayer.ownedCars] : ['starter'];
      player.unlockedSpecialWeapons = Array.isArray(oldPlayer.unlockedSpecialWeapons) ? [...oldPlayer.unlockedSpecialWeapons] : [];
      player.shieldDurationLevel = oldPlayer.shieldDurationLevel || 0;
      player.applyCarType(oldPlayer.carType);
      player.hp = player.maxHp;
      player.ammo = player.maxAmmo;
      player.hasShield = false;
      player.currentSpecialWeapon = null;
      player.specialWeaponCount = 0;
  }

  enemies = [];
  powerups = [];
  particles = [];
  buildings = [];
  projectiles = [];
  obstacles = [];
  startTime = millis();
  lastEnemySpawnTime = millis();
  lastPowerUpSpawnTime = millis();
  shakeAmount = 0;
  pauseStartTime = 0;
  totalPausedTime = 0;
  boundaryWarningAlpha = 0;
  specialDropFailCount = 0;
  
  // Difficulty Adjustments
  if (difficulty === 'EASY') {
      survivalTime = 60;
      currentLevel = 1;
  } else if (difficulty === 'NORMAL') {
      survivalTime = 90;
      currentLevel = 2;
  } else if (difficulty === 'HARD') {
      survivalTime = 120;
      currentLevel = 3;
      // Difficulty Modifiers
      player.maxSpeed *= 0.9;
      // Enemy speed is handled in Enemy class or spawn
  }
  
  if (tutorialSystem) {
      tutorialSystem.triggerLevelIntro(difficulty);
  }
  
  if (!tileMap || tileMap.length === 0) {
      generateTileMap();
      createMapGraphics();
  } else if (!mapGraphics) {
      createMapGraphics();
  }
  
  // Level Generation (Vary based on currentLevel if desired)
  // For now, just regenerate the city
  generateCity();
  
  // Initial enemy
  let spawn = getPoliceSpawnPoint();
  if (spawn) {
      enemies.push(new Enemy(spawn.x, spawn.y));
  }
}

class Obstacle {
  constructor(x, y, type) {
    this.pos = createVector(x, y);
    this.type = type; // 'tree', 'rock', 'bush'
    this.w = 60;
    this.h = 60;
    
    if (type === 'tree') {
      this.img = random(images.trees);
      this.w = 80;
      this.h = 80;
      this.isSolid = true;
    } else if (type === 'rock') {
      this.img = random(images.rocks);
      this.w = 50;
      this.h = 50;
      this.isSolid = true;
    } else {
      this.img = random(images.bushes);
      this.w = 40;
      this.h = 40;
      this.isSolid = false; // Bushes can be driven through?
    }
  }
  
  display() {
    if (this.img) {
      // Use Isometric Projection
      let isoPos = projectIso(this.pos.x, this.pos.y);
      image(this.img, isoPos.x, isoPos.y, this.w, this.h);
    }
  }
  
  checkCollision(vehicle) {
    if (!this.isSolid) return false;
    
    // Circle vs Circle collision for simplicity
    let d = p5.Vector.dist(this.pos, vehicle.pos);
    if (d < (this.w/2 + vehicle.r)) {
        // Resolve collision
        let pushVec = p5.Vector.sub(vehicle.pos, this.pos);
        pushVec.normalize();
        pushVec.mult(0.5); // Push out force
        vehicle.pos.add(pushVec);
        vehicle.vel.mult(0.5); // Slow down significantly on impact
        return true;
    }
    return false;
  }
}

function generateTileMap() {
  tileMap = [];
  roadCenters = [];
  
  // 1. Initialize with Grass/Sand
  for (let y = 0; y < mapRows; y++) {
    let row = [];
    for (let x = 0; x < mapCols; x++) {
      // Edges are sand?
      if (x < 2 || x >= mapCols - 2 || y < 2 || y >= mapRows - 2) {
          row.push({ type: 'sand', x: x, y: y });
      } else {
          row.push({ type: 'grass', x: x, y: y });
      }
    }
    tileMap.push(row);
  }
  
  // 2. Create Connected Road Network
  // Define "Blocks" of buildings separated by roads
  let blockW = 4; // Tiles
  let blockH = 4; // Tiles
  
  for (let y = 2; y < mapRows - 2; y++) {
      for (let x = 2; x < mapCols - 2; x++) {
          // Create a grid of roads
          let isRoadX = (x - 2) % (blockW + 1) === 0;
          let isRoadY = (y - 2) % (blockH + 1) === 0;
          
          if (isRoadX || isRoadY) {
              tileMap[y][x].type = 'road';
              roadCenters.push({
                  x: x * tileSize + tileSize / 2,
                  y: y * tileSize + tileSize / 2
              });
          } else {
              // Inside a block -> Pavement or Grass
              // Use noise or random block assignment to mix them naturally
              // e.g. some blocks are parks (grass), others are city (pavement)
              
              // Determine block coordinate
              let bx = floor((x - 2) / (blockW + 1));
              let by = floor((y - 2) / (blockH + 1));
              
              // Use block coordinates to decide type
              // Simple checkerboard or random
              randomSeed(bx * 1000 + by); // Deterministic based on block
              if (random() < 0.4) {
                  tileMap[y][x].type = 'grass';
              } else {
                  tileMap[y][x].type = 'pavement';
              }
          }
      }
  }
  
  // 4. Autotiling Logic (Assign specific road images)
  for (let y = 0; y < mapRows; y++) {
      for (let x = 0; x < mapCols; x++) {
          if (tileMap[y][x].type === 'road') {
              tileMap[y][x].img = getRoadImage(x, y);
          } else if (tileMap[y][x].type === 'sand') {
              tileMap[y][x].img = images.sand;
          } else if (tileMap[y][x].type === 'pavement') {
              tileMap[y][x].img = pickVariant(images.pavementVariants, x, y);
          } else {
              tileMap[y][x].img = pickVariant(images.grassVariants, x, y);
          }
      }
  }
}

function getRandomRoadCenter() {
  if (!roadCenters || roadCenters.length === 0) return null;
  return roadCenters[floor(random(roadCenters.length))];
}

function pickVariant(list, x, y) {
  if (!list || list.length === 0) return null;
  let idx = abs((x * 73856093 + y * 19349663) % list.length);
  return list[idx];
}

function getRoadImage(x, y) {
    // Check neighbors
    let n = (y > 0 && tileMap[y-1][x].type === 'road') ? 1 : 0;
    let s = (y < mapRows-1 && tileMap[y+1][x].type === 'road') ? 1 : 0;
    let w = (x > 0 && tileMap[y][x-1].type === 'road') ? 1 : 0;
    let e = (x < mapCols-1 && tileMap[y][x+1].type === 'road') ? 1 : 0;
    
    let sum = n + s + w + e;
    
    if (sum === 4) return images.cross;
    
    if (sum === 3) {
        if (!n) return images.tCross4;
        if (!e) return images.tCross3;
        if (!s) return images.tCross1;
        if (!w) return images.tCross2;
    }
    
    if (sum === 2) {
        if (n && s) return pickVariant(images.roadVVariants, x, y);
        if (w && e) return pickVariant(images.roadHVariants, x, y);
        
        // Corners
        if (s && e) return images.turnU;
        if (s && w) return images.turnR;
        if (n && e) return images.turnL;
        if (n && w) return images.turnD;
        
        // Fallback
        return pickVariant(images.roadVVariants, x, y);
    }
    
    if (sum === 1) {
        // Dead ends
        if (n || s) return pickVariant(images.roadVVariants, x, y);
        return pickVariant(images.roadHVariants, x, y);
    }
    
    return pickVariant(images.roadHVariants, x, y);
}

function createMapGraphics() {
  // Use standard renderer (P2D) instead of WEBGL for simpler 2D composition
  if (mapGraphics) mapGraphics.remove(); // Clear old buffer if exists
  mapGraphics = createGraphics(mapWidth, mapHeight); 
  mapGraphics.imageMode(CENTER);
  
  // Draw tiles
  for (let y = 0; y < mapRows; y++) {
      for (let x = 0; x < mapCols; x++) {
          let tile = tileMap[y][x];
          
          // Calculate Isometric Position for the tile
          // We use the same projection logic as the game entities
          let isoPos = projectIso(x * tileSize, y * tileSize);
          
          if (isMapTextureReady(tile.img)) {
              // Ensure we draw the image at its intended size, scaled to the tile width
              // This preserves aspect ratio and prevents "shrinking" if the source image is larger/smaller
              // For isometric tiles, we usually want width = tileSize (100)
              
              let drawW = tileSize;
              let drawH = tileSize; // Default to square if aspect ratio fails
              
              if (tile.img.width > 0) {
                  // Maintain aspect ratio based on width
                  drawH = (tile.img.height / tile.img.width) * tileSize;
              }
              
              // Draw centered at isoPos
              // imageMode is CENTER, so (x, y) is center
              mapGraphics.image(tile.img, isoPos.x, isoPos.y, drawW, drawH);
          } else {
              // Fallback for missing images (debug)
              mapGraphics.noStroke();
              if (tile.type === 'grass') mapGraphics.fill(34, 139, 34);
              else if (tile.type === 'sand') mapGraphics.fill(194, 178, 128);
              else if (tile.type === 'pavement') mapGraphics.fill(100);
              else mapGraphics.fill(50);
              
              // Draw a diamond shape for fallback
              mapGraphics.beginShape();
              mapGraphics.vertex(isoPos.x, isoPos.y - tileSize/4); // Top
              mapGraphics.vertex(isoPos.x + tileSize/2, isoPos.y); // Right
              mapGraphics.vertex(isoPos.x, isoPos.y + tileSize/4); // Bottom
              mapGraphics.vertex(isoPos.x - tileSize/2, isoPos.y); // Left
              mapGraphics.endShape(CLOSE);
          }
      }
  }
}

// Helper to draw entities in Iso view
function drawIsoImage(img, x, y, w, h) {
    let pos = projectIso(x, y);
    image(img, pos.x, pos.y, w, h);
}

function isSafeGrassTile(x, y) {
    if (x < 1 || y < 1 || x >= mapCols - 1 || y >= mapRows - 1) return false;
    if (tileMap[y][x].type !== 'grass') return false;
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (tileMap[y + dy][x + dx].type !== 'grass') return false;
        }
    }
    return true;
}

function isSafePavementTile(x, y) {
    if (x < 1 || y < 1 || x >= mapCols - 1 || y >= mapRows - 1) return false;
    if (tileMap[y][x].type !== 'pavement') return false;
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (tileMap[y + dy][x + dx].type !== 'pavement') return false;
        }
    }
    return true;
}

function isSafeBuildingTile(x, y) {
    if (x < 2 || y < 2 || x >= mapCols - 2 || y >= mapRows - 2) return false;
    let baseType = tileMap[y][x].type;
    if (baseType !== 'grass' && baseType !== 'pavement') return false;
    // Relaxed check: Only check immediate neighbors (Radius 1)
    // Because blocks are 4x4, a radius 2 check (5x5) fails for all tiles.
    for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
            if (tileMap[y + dy][x + dx].type !== baseType) return false;
        }
    }
    return true;
}

function generateCity() {
  obstacles = []; // Clear obstacles
  buildings = []; // Clear buildings
  
  let bWidth = 90;
  let bHeight = 70;

  let potentialBuildingSpots = [];
  let potentialObstacleSpots = [];

  // Iterate through TileMap to place entities
  // We need to be stricter about placement.
  // Instead of just checking one tile, we should check if the building/obstacle fits.
  
  for (let y = 0; y < mapRows; y++) {
      for (let x = 0; x < mapCols; x++) {
          let tile = tileMap[y][x];
          let px = x * tileSize + tileSize/2;
          let py = y * tileSize + tileSize/2;
          
          // Safe Zone check (center of map)
          if (dist(px, py, mapWidth/2, mapHeight/2) < 300) continue;
          
          // STRICT CHECK: Ensure we are not on a road or near a road for obstacles that might clip
          // For buildings (large), we need to check neighbors too?
          // Buildings are 100x80, so they fit within a 100x100 tile mostly.
          // But visually in iso, they might stick out.
          
          if (tile.type === 'pavement') {
              if (random() < 0.35 && isSafeBuildingTile(x, y)) { 
                  potentialBuildingSpots.push({x: x, y: y, px: px, py: py, type: 'pavement'});
              } else if (random() < 0.12 && isSafePavementTile(x, y)) {
                  potentialObstacleSpots.push({px: px, py: py, type: 'rock'});
              }
          } else if (tile.type === 'grass') {
              if (random() < 0.18 && isSafeBuildingTile(x, y)) {
                   potentialBuildingSpots.push({x: x, y: y, px: px, py: py, type: 'grass'});
              } else if (random() < 0.35 && isSafeGrassTile(x, y)) {
                  let type = random(['tree', 'bush']);
                  potentialObstacleSpots.push({px: px, py: py, type: type});
              }
          }
      }
  }

  shuffle(potentialBuildingSpots, true);
  
  let placedBuildings = [];
  let buildingImages = [];
  if (images.cityBuildings && images.cityBuildings.length > 0) {
      buildingImages = images.cityBuildings.slice();
      shuffle(buildingImages, true);
  }
  
  for (let spot of potentialBuildingSpots) {
      // Check if this spot overlaps with any existing building
      // Buildings are on grid (x,y).
      let occupied = false;
      for (let b of placedBuildings) {
          if (dist(spot.x, spot.y, b.gridX, b.gridY) < 1.5) { // Don't place too close
              occupied = true;
              break;
          }
      }
      
      if (!occupied) {
          // Check neighbors to ensure we don't block roads or overlap weirdly
          // Ensure we are not placing ON a road (already checked by tile.type)
          
          // Place Building
          let bType = 'normal';
          let bAsset = null;
          if (buildingImages.length > 0) {
              bAsset = buildingImages.pop();
          } else if (images.cityBuildings && images.cityBuildings.length > 0) {
              bAsset = random(images.cityBuildings);
          }
          let b = new Building(
              spot.px,
              spot.py,
              bWidth,
              bHeight,
              bType,
              bAsset ? bAsset.img : null,
              bAsset ? bAsset.label : null
          );
          b.gridX = spot.x;
          b.gridY = spot.y;
          placedBuildings.push(b);
          buildings.push(b);
      }
  }
  
  if (buildings.length > 0) {
      let specialIndices = [];
      for(let i=0; i<buildings.length; i++) specialIndices.push(i);
      shuffle(specialIndices, true);
      
      if (specialIndices.length > 0) {
          buildings[specialIndices[0]].type = 'hospital';
          buildings[specialIndices[0]].img = null;
          buildings[specialIndices[0]].label = 'Hospital';
      }
      if (specialIndices.length > 1) {
          buildings[specialIndices[1]].type = 'armory';
          buildings[specialIndices[1]].img = null;
          buildings[specialIndices[1]].label = 'Armory';
      }
      if (specialIndices.length > 2 && images.police) {
          // Assign multiple police stations (e.g., 3)
          let policeCount = 3;
          for(let k=0; k<policeCount && (2+k) < specialIndices.length; k++) {
              let idx = specialIndices[2+k];
              buildings[idx].type = 'police';
              buildings[idx].img = images.police;
              buildings[idx].label = 'Police Station';
          }
      }
  }

  // Shuffle potential spots to avoid bias
  shuffle(potentialObstacleSpots, true);

  for (let spot of potentialObstacleSpots) {
      let canPlace = true;
      let obstacleSize = spot.type === 'tree' ? 80 : (spot.type === 'rock' ? 50 : 40);
      
      // 1. Check against Buildings
      for (let b of buildings) {
          let bCenter = b.getCollisionCenter();
          let bSize = b.getCollisionSize();
          let halfDiagonal = sqrt((bSize.w * bSize.w) + (bSize.h * bSize.h)) * 0.5;
          if (dist(spot.px, spot.py, bCenter.x, bCenter.y) < (obstacleSize / 2 + halfDiagonal + 20)) {
              canPlace = false;
              break;
          }
      }
      
      if (!canPlace) continue;

      // 2. Check against existing Obstacles
      for (let o of obstacles) {
          // Use a safe gap to prevent getting stuck
          // Gap should be larger than car size (approx 40-50 for safety)
          let minDistance = (obstacleSize/2) + (o.w/2) + 60; 
          if (dist(spot.px, spot.py, o.pos.x, o.pos.y) < minDistance) {
              canPlace = false;
              break;
          }
      }

      if (canPlace) {
          obstacles.push(new Obstacle(spot.px, spot.py, spot.type));
      }
  }
}

function draw() {
  if (gameState === 'BOOT_LOADING') {
      background(15, 20, 25);
      
      if (isBootLoadingComplete()) {
          gameState = 'MENU';
          return;
      }
      
      push();
      translate(width / 2, height / 2);
      
      // Outer rotating ring
      noFill();
      stroke(255, 196, 70, 150);
      strokeWeight(4);
      let angle = millis() * 0.003;
      arc(0, 0, 60, 60, angle, angle + PI + QUARTER_PI);
      
      // Inner rotating ring
      stroke(255, 80, 80, 200);
      strokeWeight(2);
      let angle2 = -millis() * 0.004;
      arc(0, 0, 40, 40, angle2, angle2 + PI + HALF_PI);
      
      // Loading Text
      fill(255, 200);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(18);
      let dots = '';
      let t = floor(millis() / 400) % 4;
      for (let i = 0; i < t; i++) dots += '.';
      text("LOADING" + dots, 0, 60);
      pop();
      return;
  }

  // 0. Menu Handling (Full Screen, No Camera/Status Bar Offset)
  if (gameState === 'MENU') {
      if (defeatVideo) defeatVideo.pause();
      if (victoryVideo) victoryVideo.pause();
      drawMainMenu();
      return; // Stop drawing anything else
  } else if (gameState === 'AUTH') {
      if (defeatVideo) defeatVideo.pause();
      if (victoryVideo) victoryVideo.pause();
      drawCoverBackground();
      return;
  } else if (gameState === 'DIFFICULTY_SELECT') {
      if (defeatVideo) defeatVideo.pause();
      if (victoryVideo) victoryVideo.pause();
      drawDifficultySelect();
      return; // Stop drawing anything else
  } else if (gameState === 'MENU_SHOP') {
      if (defeatVideo) defeatVideo.pause();
      if (victoryVideo) victoryVideo.pause();
      drawShopMenu();
      return;
  }
  if (gameState !== 'GAMEOVER' && defeatVideo) defeatVideo.pause();
  if (gameState !== 'WIN' && victoryVideo) victoryVideo.pause();

  updateGameplayViewport();
  imageMode(CENTER);

  background(0);

  if (player) {
    let focusX = player.pos.x;
    let focusY = player.pos.y;
    if (gameState === 'MISSILE_CONTROL' && typeof loiteringMissile !== 'undefined' && loiteringMissile) {
      focusX = loiteringMissile.pos.x;
      focusY = loiteringMissile.pos.y;
    }
    let pIso = projectIso(focusX, focusY);
    camX = pIso.x - gameWidth / 2;
    camY = pIso.y - gameHeight / 2;
    camX = constrain(camX, 0, mapWidth - gameWidth);
    camY = constrain(camY, 0, mapHeight - gameHeight);
  }

  push();
  translate(gameViewX, statusHeight + gameViewY);
  let ctx = drawingContext;
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, gameWidth, gameHeight);
  ctx.clip();
  translate(-camX, -camY);
  
  if (shakeAmount > 0) {
    translate(random(-shakeAmount, shakeAmount), random(-shakeAmount, shakeAmount));
    shakeAmount *= 0.9; 
    if (shakeAmount < 0.5) shakeAmount = 0;
  }

  if (!mapGraphics) {
    if (!tileMap || tileMap.length === 0) {
      generateTileMap();
    }
    createMapGraphics();
  }
  if (!mapTextureRefreshDone && areMapBaseTexturesReady()) {
    createMapGraphics();
    mapTextureRefreshDone = true;
  }

  // Map
  if (mapGraphics) {
    image(mapGraphics, mapWidth/2, mapHeight/2);
  } else {
    // Fallback
    noFill(); stroke(0); strokeWeight(5); rect(0, 0, mapWidth, mapHeight);
    fill(50); noStroke(); rect(0, 0, mapWidth, mapHeight);
  }

  // Entities
  if (gameState === 'PLAY') {
      playGame();
  } else if (gameState === 'MAP_SELECT') {
      drawGameObjects();
  } else if (gameState === 'MISSILE_CONTROL') {
      updateLoiteringMissile();
      
      if (mapGraphics) image(mapGraphics, mapWidth/2, mapHeight/2);
      
      drawGameObjects();
      
      if (loiteringMissile) {
          push();
          let isoPos = projectIso(loiteringMissile.pos.x, loiteringMissile.pos.y);
          translate(isoPos.x, isoPos.y);
          let hVec = p5.Vector.fromAngle(loiteringMissile.heading);
          let isoH = projectIsoVector(hVec.x, hVec.y);
          rotate(isoH.heading());
          let bodyW = 96;
          let bodyH = 56;
          let droneIcon = images && images.weaponShop ? images.weaponShop[WEAPON_TYPES.LOITERING] : null;
          if (droneIcon && droneIcon.width > 0 && droneIcon.height > 0) {
              imageMode(CENTER);
              let ratio = min(bodyW / droneIcon.width, bodyH / droneIcon.height);
              tint(255, 245);
              push();
              rotate(HALF_PI);
              image(droneIcon, 0, 0, droneIcon.width * ratio, droneIcon.height * ratio);
              pop();
              noTint();
          } else {
              noStroke();
              fill(210, 215, 235);
              ellipse(4, 0, bodyW * 0.75, bodyH * 0.85);
              fill(90, 120, 170);
              ellipse(8, 0, bodyW * 0.32, bodyH * 0.45);
              fill(75, 90, 120);
              triangle(-8, -bodyH * 0.5, 6, -bodyH * 0.2, -10, -bodyH * 0.05);
              triangle(-8, bodyH * 0.5, 6, bodyH * 0.2, -10, bodyH * 0.05);
          }

          let flamePulse = 0.75 + 0.25 * sin(frameCount * 0.6);
          noStroke();
          fill(255, 170, 0, 190);
          triangle(-bodyW * 0.52, 0, -bodyW * 0.92, 5 * flamePulse, -bodyW * 0.92, -5 * flamePulse);
          fill(255, 80, 0, 220);
          triangle(-bodyW * 0.45, 0, -bodyW * 0.75, 2.8 * flamePulse, -bodyW * 0.75, -2.8 * flamePulse);
          pop();
      }
  } else if (gameState === 'PAUSED' || gameState === 'SHOP' || gameState === 'HELP' || gameState === 'TUTORIAL' || gameState === 'GAMEOVER' || gameState === 'WIN') {
      drawGameObjects();
  }
  ctx.restore();
  pop();

  push();
  translate(gameViewX, statusHeight + gameViewY);
  
  if (gameState === 'PAUSED') {
      if (boundaryWarningAlpha > 0) drawBoundaryWarning();
      drawPaused();
  } else if (gameState === 'TUTORIAL') {
      if (boundaryWarningAlpha > 0) drawBoundaryWarning();
      if (tutorialSystem) tutorialSystem.draw(0, 0, gameWidth, gameHeight, statusHeight);
  } else if (gameState === 'HELP') {
      drawHelp();
  } else if (gameState === 'SHOP') {
      drawShop();
  } else if (gameState === 'PLAY' || gameState === 'MAP_SELECT') {
      if (boundaryWarningAlpha > 0) drawBoundaryWarning();
  }
  
  pop();

  if (gameState === 'GAMEOVER') {
      drawGameOver();
      return;
  }
  if (gameState === 'WIN') {
      drawWin();
      return;
  }

  drawStatusBar();
  
  if (gameState === 'PLAY' || gameState === 'PAUSED' || (gameState === 'SHOP' && !isBuildingInteractionOpen()) || gameState === 'MAP_SELECT') {
      drawMiniMap();
  }
  if (gameState === 'PLAY' || gameState === 'PAUSED' || (gameState === 'SHOP' && !isBuildingInteractionOpen()) || gameState === 'MAP_SELECT' || gameState === 'MISSILE_CONTROL') {
      drawControlGuidePanel();
  }
}



function drawBoundaryWarning() {
    // Draw red vignette
    noFill();
    stroke(255, 0, 0, boundaryWarningAlpha);
    strokeWeight(20);
    rectMode(CORNER);
    rect(0, 0, gameWidth, gameHeight);
    
    // Text warning
    if (boundaryWarningAlpha > 50) {
        fill(255, 0, 0, boundaryWarningAlpha);
        noStroke();
        textSize(30);
        textAlign(CENTER, CENTER);
        text("WARNING: LEAVING CITY LIMITS", gameWidth/2, gameHeight/2 - 100);
    }
}

let miniMapGraphics;
let miniMapBuildingsGraphics;
let dongfengTargetLocked = false;
let mapSelectCharged = false;
let mapSelectLockX = 0;
let mapSelectLockY = 0;

function consumeCurrentSpecialWeapon() {
    if (!player || !player.currentSpecialWeapon) return;
    player.specialWeaponCount = max(0, (player.specialWeaponCount || 0) - 1);
    if (player.specialWeaponCount === 0) {
        player.currentSpecialWeapon = null;
    }
}

function isPlayerControlLocked() {
    return gameState === 'MISSILE_CONTROL';
}

function enterMapSelectState() {
    gameState = 'MAP_SELECT';
    pauseStartTime = millis();
    mapSelectStart = 0;
    dongfengTargetLocked = false;
    mapSelectCharged = false;
}

function exitMapSelectState() {
    if (gameState === 'MAP_SELECT') {
        totalPausedTime += millis() - pauseStartTime;
    }
    gameState = 'PLAY';
    pauseStartTime = 0;
    mapSelectStart = 0;
    dongfengTargetLocked = false;
    mapSelectCharged = false;
}

function triggerDongfengFromMiniMap(cursorX, cursorY, scaleFactor) {
    if (dongfengTargetLocked) return;
    dongfengTargetLocked = true;
    mapSelectStart = 0;

    let focusIso = projectIso(mapWidth / 2, mapHeight / 2);
    let isoX = (cursorX / scaleFactor) + focusIso.x;
    let isoY = (cursorY / scaleFactor) + focusIso.y;
    let dx = isoX - mapOffsetX;
    let dy = isoY - mapOffsetY;
    let W = tileSize / 2;
    let H = tileSize / 4;
    let gridX = (dx / W + dy / H) / 2;
    let gridY = (dy / H - dx / W) / 2;
    let targetX = gridX * tileSize;
    let targetY = gridY * tileSize;

    if (!Number.isFinite(targetX) || !Number.isFinite(targetY)) {
        exitMapSelectState();
        dongfengTargetLocked = false;
        return;
    }

    targetX = constrain(targetX, 0, mapWidth);
    targetY = constrain(targetY, 0, mapHeight);

    let strikeFn = null;
    if (typeof fireDongfengStrike === 'function') {
        strikeFn = fireDongfengStrike;
    } else if (typeof globalThis !== 'undefined' && typeof globalThis.fireDongfengStrike === 'function') {
        strikeFn = globalThis.fireDongfengStrike;
    }

    exitMapSelectState();
    if (strikeFn) {
        strikeFn(targetX, targetY);
    } else {
        consumeCurrentSpecialWeapon();
        setTimeout(() => {
            createExplosion(targetX, targetY, color(255, 50, 0), 80);
            shakeAmount = max(shakeAmount, 30);
            for (let i = enemies.length - 1; i >= 0; i--) {
                let e = enemies[i];
                if (dist(e.pos.x, e.pos.y, targetX, targetY) < 300) {
                    e.hp -= 50;
                    if (e.hp <= 0) enemies.splice(i, 1);
                }
            }
        }, 850);
    }
    dongfengTargetLocked = false;
    mapSelectCharged = false;
}

function createAbstractMapGraphics() {
    if (miniMapGraphics) miniMapGraphics.remove();
    miniMapGraphics = createGraphics(mapWidth, mapHeight);
    
    if (miniMapBuildingsGraphics) miniMapBuildingsGraphics.remove();
    miniMapBuildingsGraphics = createGraphics(mapWidth, mapHeight);
    
    // Transparent background
    miniMapGraphics.clear();
    miniMapGraphics.noStroke();
    
    miniMapBuildingsGraphics.clear();
    miniMapBuildingsGraphics.noStroke();
    
    // Draw abstract terrain
    for (let y = 0; y < mapRows; y++) {
        for (let x = 0; x < mapCols; x++) {
            let tile = tileMap[y][x];
            let isoPos = projectIso(x * tileSize, y * tileSize);
            
            // Draw diamond shape
            miniMapGraphics.beginShape();
            miniMapGraphics.vertex(isoPos.x, isoPos.y - tileSize/4);
            miniMapGraphics.vertex(isoPos.x + tileSize/2, isoPos.y);
            miniMapGraphics.vertex(isoPos.x, isoPos.y + tileSize/4);
            miniMapGraphics.vertex(isoPos.x - tileSize/2, isoPos.y);
            
            if (tile.type === 'road') {
                miniMapGraphics.fill(40, 45, 60, 255); // Dark Blue-Grey Road
            } else if (tile.type === 'pavement') {
                miniMapGraphics.fill(30, 30, 40, 255); // Darker Pavement
            } else if (tile.type === 'grass') {
                  miniMapGraphics.fill(15, 25, 15, 255);
            } else {
                  miniMapGraphics.fill(20, 20, 10, 255); // Sand/Other
            }
            miniMapGraphics.endShape(CLOSE);
        }
    }
    
    // Pre-render Buildings
    miniMapBuildingsGraphics.rectMode(CENTER);
    miniMapBuildingsGraphics.noStroke();
    for (let b of buildings) {
        let isoPos = projectIso(b.pos.x, b.pos.y);
        let bw = b.w; 
        let bh = b.h;
        
        if (b.type === 'hospital') miniMapBuildingsGraphics.fill(50, 255, 100, 200);
        else if (b.type === 'armory') miniMapBuildingsGraphics.fill(255, 150, 50, 200);
        else miniMapBuildingsGraphics.fill(150, 200, 255, 180);
        
        miniMapBuildingsGraphics.beginShape();
        miniMapBuildingsGraphics.vertex(isoPos.x, isoPos.y - bh/2);
        miniMapBuildingsGraphics.vertex(isoPos.x + bw/2, isoPos.y);
        miniMapBuildingsGraphics.vertex(isoPos.x, isoPos.y + bh/2);
        miniMapBuildingsGraphics.vertex(isoPos.x - bw/2, isoPos.y);
        miniMapBuildingsGraphics.endShape(CLOSE);
    }
}

function getMiniMapLayout(isTargeting = false) {
    let margin = 20; // Tight margin to top-left
    
    if (isTargeting) {
        // Large Targeting Map (Centered)
        let mapR = min(gameWidth, gameHeight) * 0.4; // Radius
        let centerX = gameWidth / 2;
        let centerY = gameHeight / 2;
        
        // Calculate scale to fit map inside circle (Cover or Contain?)
        // Map is wider than tall (3200x2400)
        // Let's fit width to diameter for max visibility
        let scaleFactor = (mapR * 2) / mapWidth;
        
        return { centerX, centerY, mapR, scaleFactor, mode: 'fixed' };
    } else {
        // Normal Mini-map (Top-Left, Player Centered)
        let mapR = 90; // Radius
        let centerX = gameViewX + mapR + margin;
        let centerY = statusHeight + gameViewY + mapR + margin;
        
        // Zoomed in scale for local view
        // Show approx 800 units width in minimap
        let viewWidth = 1200;
        let scaleFactor = (mapR * 2) / viewWidth;
        
        return { centerX, centerY, mapR, scaleFactor, mode: 'follow' };
    }
}

function drawMiniMap() {
    let isTargeting = gameState === 'MAP_SELECT';
    let { centerX, centerY, mapR, scaleFactor, mode } = getMiniMapLayout(isTargeting);
    if (!isTargeting) {
        mapSelectStart = 0;
        dongfengTargetLocked = false;
        mapSelectCharged = false;
    }
    
    if (mode === 'fixed' && !miniMapGraphics) {
        if (!tileMap || tileMap.length === 0) generateTileMap();
        createAbstractMapGraphics();
    }
    
    push();
    translate(centerX, centerY);
    noStroke();
    fill(0, 10, 20, 240);
    ellipse(0, 0, mapR * 2, mapR * 2);

    let ctx = drawingContext;
    ctx.save();
    ctx.beginPath();
    ctx.arc(0, 0, mapR, 0, TWO_PI);
    ctx.clip();

    if (mode === 'follow' && player) {
        // Use a larger scale for ISO view because projection shrinks coordinates
        // World 100px -> Iso 50px width. So we double the scale to keep visual size similar.
        let radarScale = (mapR / 420) * 2;
        
        // Draw Roads
        noStroke();
        fill(120, 120, 120, 180);
        
        // Calculate Diamond Dimensions for Road Tile
        let rW = tileSize * radarScale; // Width
        let rH = rW * 0.5; // Height (2:1 aspect)
        
        if (roadCenters && roadCenters.length > 0) {
            for (let rc of roadCenters) {
                let worldDx = rc.x - player.pos.x;
                let worldDy = rc.y - player.pos.y;
                
                // Convert to Isometric Screen Difference
                // IsoX = (x - y) / 2
                // IsoY = (x + y) / 4
                let dx = (worldDx - worldDy) * 0.5 * radarScale;
                let dy = (worldDx + worldDy) * 0.25 * radarScale;
                
                // Optimization: Skip if far outside
                // Check against mapR plus some buffer
                if (dx*dx + dy*dy > (mapR + rW) * (mapR + rW)) continue;
                
                // Draw Diamond (Rhombus)
                quad(
                    dx, dy - rH/2,      // Top
                    dx + rW/2, dy,      // Right
                    dx, dy + rH/2,      // Bottom
                    dx - rW/2, dy       // Left
                );
            }
        }

        noStroke();
        fill(60, 140, 220, 95);
        for (let b of buildings) {
            let worldDx = b.pos.x - player.pos.x;
            let worldDy = b.pos.y - player.pos.y;
            let dx = (worldDx - worldDy) * 0.5 * radarScale;
            let dy = (worldDx + worldDy) * 0.25 * radarScale;
            
            if (dx * dx + dy * dy > mapR * mapR) continue;
            ellipse(dx, dy, 5, 5);
        }

        // Draw Obstacles (Abstract: small dots/squares)
        noStroke();
        fill(160, 120, 80, 200); // Brownish/Grey for obstacles
        for (let o of obstacles) {
            let worldDx = o.pos.x - player.pos.x;
            let worldDy = o.pos.y - player.pos.y;
            let dx = (worldDx - worldDy) * 0.5 * radarScale;
            let dy = (worldDx + worldDy) * 0.25 * radarScale;

            if (dx * dx + dy * dy > mapR * mapR) continue;
            
            // Abstract shape: small circle or square
            // Obstacles are generally smaller than buildings
            ellipse(dx, dy, 4, 4);
        }

        for (let e of enemies) {
            let worldDx = e.pos.x - player.pos.x;
            let worldDy = e.pos.y - player.pos.y;
            let dx = (worldDx - worldDy) * 0.5 * radarScale;
            let dy = (worldDx + worldDy) * 0.25 * radarScale;
            
            if (dx * dx + dy * dy > mapR * mapR) continue;
            let pulse = (frameCount % 60) / 60;
            fill(255, 50, 50, 220 - pulse * 180);
            ellipse(dx, dy, 5 + 4 * pulse, 5 + 4 * pulse);
        }
        fill(0, 255, 255);
        ellipse(0, 0, 7, 7);
        stroke(0, 255, 255, 200);
        strokeWeight(2);
        // Player heading indicator also needs to be projected?
        // Heading is in world space (angle).
        // A vector (cos(h), sin(h)) in world space becomes (cos(h)-sin(h), cos(h)+sin(h)) in Iso?
        // Let's project the tip of the heading vector.
        let hLen = 14;
        let hTipX = cos(player.heading) * hLen;
        let hTipY = sin(player.heading) * hLen;
        // Project vector
        let isoHx = (hTipX - hTipY) * 0.5; // No scale needed for direction really, but relative to 14px
        let isoHy = (hTipX + hTipY) * 0.25;
        // Normalize and scale to desired length? Or just apply projection.
        // If we project, length changes. That's correct for Iso.
        line(0, 0, isoHx, isoHy);
    } else {
        let centerIso = projectIso(mapWidth / 2, mapHeight / 2);
        let viewOffsetX = -centerIso.x * scaleFactor;
        let viewOffsetY = -centerIso.y * scaleFactor;
        translate(viewOffsetX, viewOffsetY);
        if (miniMapGraphics) {
            push();
            scale(scaleFactor);
            imageMode(CORNER);
            tint(200, 255, 255, 220);
            image(miniMapGraphics, 0, 0);
            if (miniMapBuildingsGraphics) image(miniMapBuildingsGraphics, 0, 0);
            noTint();
            pop();
        }
        noStroke();
        for (let e of enemies) {
            let isoPos = projectIso(e.pos.x, e.pos.y);
            let ex = isoPos.x * scaleFactor;
            let ey = isoPos.y * scaleFactor;
            if ((ex + viewOffsetX) * (ex + viewOffsetX) + (ey + viewOffsetY) * (ey + viewOffsetY) > mapR * mapR) continue;
            let pulse = (frameCount % 60) / 60;
            fill(255, 50, 50, 220 - pulse * 180);
            ellipse(ex, ey, 5 + 4 * pulse, 5 + 4 * pulse);
        }
        if (player) {
            let isoPos = projectIso(player.pos.x, player.pos.y);
            let px = isoPos.x * scaleFactor;
            let py = isoPos.y * scaleFactor;
            fill(0, 255, 255);
            ellipse(px, py, 7, 7);
            stroke(255, 255, 255, 100);
            strokeWeight(1);
            noFill();
            rectMode(CORNER);
            rect(camX * scaleFactor, camY * scaleFactor, gameWidth * scaleFactor, gameHeight * scaleFactor);
        }
    }

    ctx.restore();
    noFill();
    stroke(0, 255, 255);
    strokeWeight(4);
    ellipse(0, 0, mapR * 2, mapR * 2);
    stroke(0, 255, 255, 50);
    strokeWeight(1);
    ellipse(0, 0, mapR * 1.8, mapR * 1.8);
    fill(0, 255, 255);
    noStroke();
    textSize(10);
    textAlign(CENTER, BOTTOM);
    text("N", 0, -mapR + 12);

    if (isTargeting) {
        let dx = mouseX - centerX;
        let dy = mouseY - centerY;
        let distFromCenter = sqrt(dx*dx + dy*dy);
        let insideMap = distFromCenter < mapR;
        let cursorX = dx;
        let cursorY = dy;
        if (distFromCenter > mapR) {
            let angle = atan2(dy, dx);
            cursorX = cos(angle) * (mapR - 5);
            cursorY = sin(angle) * (mapR - 5);
        }
        stroke(255, 50, 50);
        strokeWeight(1);
        line(cursorX - 10, cursorY, cursorX + 10, cursorY);
        line(cursorX, cursorY - 10, cursorX, cursorY + 10);
        if (mouseIsPressed && insideMap && !dongfengTargetLocked) {
            if (mapSelectStart === 0) mapSelectStart = millis();
            let progress = min(1, (millis() - mapSelectStart) / 2000);
            noFill();
            stroke(255, 0, 0);
            strokeWeight(3);
            arc(cursorX, cursorY, 40, 40, -HALF_PI, -HALF_PI + TWO_PI * progress);
            if (progress >= 1) {
                mapSelectCharged = true;
                mapSelectLockX = cursorX;
                mapSelectLockY = cursorY;
                triggerDongfengFromMiniMap(mapSelectLockX, mapSelectLockY, scaleFactor);
                mapSelectStart = 0;
                mapSelectCharged = false;
            }
        } else if (!mouseIsPressed) {
            mapSelectStart = 0;
            mapSelectCharged = false;
        }
        fill(255);
        noStroke();
        textSize(16);
        textAlign(CENTER, TOP);
        text("SATELLITE TARGETING", 0, mapR + 20);
    }
    
    pop();
}

function getCoverRect(viewW = width, viewH = height, sourceOverride = null, forceContain = null) {
  let source = sourceOverride;
  let sourceW = 0;
  let sourceH = 0;

  if (source) {
      if (source.elt && source.elt.videoWidth > 0) {
          sourceW = source.elt.videoWidth;
          sourceH = source.elt.videoHeight;
      } else if (source.width && source.height) {
          sourceW = source.width;
          sourceH = source.height;
      }
  } else if (gameCoverVideo && gameCoverVideo.elt && gameCoverVideo.elt.videoWidth > 0) {
      source = gameCoverVideo;
      sourceW = gameCoverVideo.elt.videoWidth;
      sourceH = gameCoverVideo.elt.videoHeight;
  }

  let rect = { x: 0, y: 0, w: viewW, h: viewH, source };
  if (!source || sourceW <= 0 || sourceH <= 0) return rect;

  let imgAspect = sourceW / sourceH;
  let screenAspect = viewW / viewH;
  let drawW, drawH, offX, offY;
  let useContain = forceContain !== null ? forceContain : source === gameCoverVideo;

  if (useContain) {
      if (screenAspect > imgAspect) {
          drawH = viewH;
          drawW = viewH * imgAspect;
          offX = (viewW - drawW) / 2;
          offY = 0;
      } else {
          drawW = viewW;
          drawH = viewW / imgAspect;
          offX = 0;
          offY = (viewH - drawH) / 2;
      }
  } else {
      if (screenAspect > imgAspect) {
          drawW = viewW;
          drawH = viewW / imgAspect;
          offX = 0;
          offY = (viewH - drawH) / 2;
      } else {
          drawH = viewH;
          drawW = viewH * imgAspect;
          offX = (viewW - drawW) / 2;
          offY = 0;
      }
  }

  rect.x = offX;
  rect.y = offY;
  rect.w = drawW;
  rect.h = drawH;
  return rect;
}

function drawCoverBackground(dimValue = 255) {
  let rect = getCoverRect();
  lastCoverRect = rect;

  // Clear the whole canvas first so previous gameplay UI cannot bleed into menu side margins.
  background(0);
  
  if (rect.source) {
      imageMode(CORNER);
      if (dimValue !== 255) tint(dimValue);
      if (rect.source === gameCoverVideo && gameCoverVideo.elt && gameCoverVideo.elt.paused) gameCoverVideo.loop();
      
      image(rect.source, rect.x, rect.y, rect.w, rect.h);
      
      if (dimValue !== 255) noTint();
  } else {
      background(0);
  }
}

function getMenuButtonLayout() {
  let rect = lastCoverRect || getCoverRect();
  let iconSize = min(150, rect.h * 0.22);
  let hoverRadius = iconSize / 2;
  let leftMargin = rect.w * 0.18;
  let bottomMargin = rect.h * 0.08 + iconSize / 2;
  let gap = rect.h * 0.22;
  
  let exitX = rect.x + leftMargin;
  let exitY = rect.y + rect.h - bottomMargin;
  let startX = exitX;
  let startY = exitY - gap;
  let shopX = exitX;
  let shopY = startY - gap;
  let labelOffsetX = 100;
  
  return { shopX, shopY, startX, startY, exitX, exitY, iconSize, hoverRadius, labelOffsetX };
}

function getMenuAccountLayout() {
  let rect = lastCoverRect || getCoverRect();
  let iconSize = 64;
  let margin = 32;
  let iconX = rect.x + rect.w - margin - iconSize / 2;
  let iconY = rect.y + margin + iconSize / 2;
  let popupW = 320;
  let popupH = authUI && authUI.isLoggedIn() ? 240 : 180;
  let popupX = iconX - popupW + iconSize / 2;
  let popupY = iconY + iconSize / 2 + 16;
  return { iconX, iconY, iconSize, popupX, popupY, popupW, popupH };
}

async function openMenuLoginDialog() {
    gameState = 'AUTH';
    authUI.state = 'login';
    authUI.show();
    authUI.onCloseRequested = () => {
        gameState = 'MENU';
    };
    authUI.onLoginSuccess = async () => {
        let loaded = await refreshUserProgress();
        if (!loaded) {
            setStartGateMessage('Unable to load profile data. Please login again.');
            gameState = 'MENU';
            return;
        }
        menuAccountOpen = false;
        gameState = 'MENU';
    };
}

function drawMenuAccountPanel() {
  let layout = getMenuAccountLayout();
  let isHover = dist(mouseX, mouseY, layout.iconX, layout.iconY) <= layout.iconSize / 2;
  let isLoggedIn = authUI && authUI.isLoggedIn();
  let user = authUI && authUI.user ? authUI.user : null;
  let initials = '?';
  if (isLoggedIn && user && user.username) initials = String(user.username).trim().charAt(0).toUpperCase() || 'U';
  else if (isLoggedIn && user && user.email) initials = String(user.email).trim().charAt(0).toUpperCase() || 'U';

  menuAccountIconRect = { x: layout.iconX - layout.iconSize / 2, y: layout.iconY - layout.iconSize / 2, w: layout.iconSize, h: layout.iconSize };
  menuAccountPopupRect = null;
  menuAccountPrimaryButtonRect = null;
  menuAccountSecondaryButtonRect = null;

  // Draw Avatar Icon
  push();
  // Outer glow
  drawingContext.shadowBlur = isHover || menuAccountOpen ? 25 : 12;
  drawingContext.shadowColor = isLoggedIn ? 'rgba(70, 150, 255, 0.6)' : 'rgba(0,0,0,0.5)';
  
  // Background circle
  fill(isLoggedIn ? color(35, 45, 60, 245) : color(45, 50, 55, 245));
  stroke(isLoggedIn ? color(100, 170, 255, 200) : color(120, 130, 140, 200));
  strokeWeight(3);
  ellipse(layout.iconX, layout.iconY, layout.iconSize, layout.iconSize);
  
  // Inner avatar styling
  drawingContext.shadowBlur = 0;
  noStroke();
  if (isLoggedIn) {
      fill(255);
      textAlign(CENTER, CENTER);
      textStyle(BOLD);
      textSize(28);
      text(initials, layout.iconX, layout.iconY + 2);
  } else {
      // Draw a simple user silhouette
      fill(180);
      ellipse(layout.iconX, layout.iconY - 6, 18, 18);
      arc(layout.iconX, layout.iconY + 16, 36, 24, PI, 0, CHORD);
  }
  pop();

  if (!menuAccountOpen) return;

  let buttonW = layout.popupW - 40;
  let buttonH = 44;
  let primaryY = layout.popupY + layout.popupH - 64;
  let secondaryY = primaryY - 56;
  menuAccountPopupRect = { x: layout.popupX, y: layout.popupY, w: layout.popupW, h: layout.popupH };

  // Draw Popup Background
  push();
  rectMode(CORNER);
  drawingContext.shadowBlur = 30;
  drawingContext.shadowColor = 'rgba(0,0,0,0.6)';
  fill(25, 30, 38, 250);
  stroke(60, 75, 90, 220);
  strokeWeight(2);
  rect(layout.popupX, layout.popupY, layout.popupW, layout.popupH, 16);
  drawingContext.shadowBlur = 0;

  // Popup Header
  fill(35, 45, 60, 250);
  noStroke();
  // Draw header rect with top rounded corners
  rect(layout.popupX, layout.popupY, layout.popupW, 46, 14, 14, 0, 0);
  
  fill(255);
  textAlign(LEFT, CENTER);
  textStyle(BOLD);
  textSize(16);
  text('ACCOUNT INFO', layout.popupX + 20, layout.popupY + 23);

  // Content Area
  fill(200);
  textStyle(NORMAL);
  textSize(14);
  let emailText = isLoggedIn && user && user.email ? user.email : 'Guest User';
  let userText = isLoggedIn && user && user.username ? user.username : 'Not logged in';
  
  textAlign(LEFT, TOP);
  if (isLoggedIn) {
      text(`Email:`, layout.popupX + 20, layout.popupY + 62);
      fill(255);
      textStyle(BOLD);
      text(`${emailText}`, layout.popupX + 70, layout.popupY + 62);
      
      fill(200);
      textStyle(NORMAL);
      text(`User:`, layout.popupX + 20, layout.popupY + 86);
      fill(255);
      textStyle(BOLD);
      text(`${userText}`, layout.popupX + 70, layout.popupY + 86);
  } else {
      textAlign(CENTER, TOP);
      text('You are currently playing as a Guest.\nLogin to save your progress!', layout.popupX + layout.popupW/2, layout.popupY + 65);
  }

  // Draw Buttons
  let isPrimaryHover = mouseX >= layout.popupX + 20 && mouseX <= layout.popupX + 20 + buttonW && mouseY >= primaryY && mouseY <= primaryY + buttonH;
  let isSecondaryHover = isLoggedIn && mouseX >= layout.popupX + 20 && mouseX <= layout.popupX + 20 + buttonW && mouseY >= secondaryY && mouseY <= secondaryY + buttonH;

  if (isLoggedIn) {
      menuAccountSecondaryButtonRect = { x: layout.popupX + 20, y: secondaryY, w: buttonW, h: buttonH };
      fill(isSecondaryHover ? color(80, 95, 110) : color(60, 75, 90));
      rect(menuAccountSecondaryButtonRect.x, menuAccountSecondaryButtonRect.y, buttonW, buttonH, 10);
      fill(255);
      textAlign(CENTER, CENTER);
      textStyle(BOLD);
      textSize(14);
      text('CLOSE', menuAccountSecondaryButtonRect.x + buttonW / 2, menuAccountSecondaryButtonRect.y + buttonH / 2);
  }

  menuAccountPrimaryButtonRect = { x: layout.popupX + 20, y: primaryY, w: buttonW, h: buttonH };
  
  if (isLoggedIn) {
      fill(isPrimaryHover ? color(220, 80, 80) : color(190, 60, 60)); // Red for logout
  } else {
      fill(isPrimaryHover ? color(60, 180, 100) : color(45, 150, 80)); // Green for login
  }
  
  rect(menuAccountPrimaryButtonRect.x, menuAccountPrimaryButtonRect.y, buttonW, buttonH, 10);
  fill(255);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  textSize(15);
  text(isLoggedIn ? 'LOGOUT' : 'LOGIN TO ACCOUNT', menuAccountPrimaryButtonRect.x + buttonW / 2, menuAccountPrimaryButtonRect.y + buttonH / 2);
  pop();
}

function drawMainMenu() {
  drawCoverBackground();
  let layout = getMenuButtonLayout();
  
  imageMode(CENTER);
  
  let shopX = layout.shopX;
  let shopY = layout.shopY;
  let startX = layout.startX;
  let startY = layout.startY;
  let exitX = layout.exitX;
  let exitY = layout.exitY;
  let iconSize = layout.iconSize;
  let hoverRadius = layout.hoverRadius;
  let labelOffsetX = layout.labelOffsetX;
  
  if (shopBtnImg) {
      let s = 1.0;
      if (dist(mouseX, mouseY, shopX, shopY) < hoverRadius) s = 1.1;
      
      push();
      translate(shopX, shopY);
      scale(s);
      image(shopBtnImg, 0, 0, iconSize, iconSize);
      pop();
      
      if (dist(mouseX, mouseY, shopX, shopY) < hoverRadius) {
          fill(255); noStroke(); textAlign(LEFT, CENTER); textSize(32); textStyle(BOLD);
          text("SHOP", shopX + labelOffsetX, shopY);
      }
  }
  
  if (startBtnImg) {
      let s = 1.0;
      if (dist(mouseX, mouseY, startX, startY) < hoverRadius) s = 1.1;
      
      push();
      translate(startX, startY);
      scale(s);
      image(startBtnImg, 0, 0, iconSize, iconSize); 
      pop();
      
      if (dist(mouseX, mouseY, startX, startY) < hoverRadius) {
          fill(255); noStroke(); textAlign(LEFT, CENTER); textSize(32); textStyle(BOLD);
          text("START", startX + labelOffsetX, startY);
      }
  }
  
  if (exitBtnImg) {
      let s = 1.0;
      if (dist(mouseX, mouseY, exitX, exitY) < hoverRadius) s = 1.1;
      
      push();
      translate(exitX, exitY);
      scale(s);
      image(exitBtnImg, 0, 0, iconSize, iconSize);
      pop();
      
      if (dist(mouseX, mouseY, exitX, exitY) < hoverRadius) {
          fill(255); noStroke(); textAlign(LEFT, CENTER); textSize(32); textStyle(BOLD);
          text("EXIT", exitX + labelOffsetX, exitY);
      }
  }

  if (startGatePending || millis() < startGateMessageUntil) {
      fill(startGateMessageColor[0], startGateMessageColor[1], startGateMessageColor[2]);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(20);
      let msg = startGatePending ? 'Checking backend service...' : startGateMessage;
      text(msg, width / 2, height - 50);
  }

  drawMenuAccountPanel();
}

function drawDifficultySelect() {
  drawCoverBackground(100);
  
  let centerX = width/2;
  let centerY = height/2;
  let panelW = 420;
  let panelH = 460;
  
  push();
  rectMode(CENTER);
  textAlign(CENTER, CENTER);
  
  // 1. Darken Background with Blur feel
  fill(10, 15, 20, 200);
  noStroke();
  rect(centerX, centerY, width, height);

  // 2. Main Panel
  // Shadow for depth
  drawingContext.shadowBlur = 30;
  drawingContext.shadowColor = 'rgba(0, 0, 0, 0.6)';
  
  fill(25, 30, 40, 245);
  stroke(60, 70, 80);
  strokeWeight(1);
  rect(centerX, centerY, panelW, panelH, 16);
  
  // Reset shadow for internal elements
  drawingContext.shadowBlur = 0;
  
  // 3. Header
  fill(255);
  textSize(42);
  textStyle(BOLD);
  drawingContext.shadowBlur = 10;
  drawingContext.shadowColor = 'rgba(255, 255, 255, 0.2)';
  text("SELECT DIFFICULTY", centerX, centerY - 150);
  drawingContext.shadowBlur = 0;
  
  // 4. Options
  let diffs = [
      { id: 'EASY', color: color(80, 200, 120) },
      { id: 'NORMAL', color: color(255, 215, 0) }, // Gold
      { id: 'HARD', color: color(255, 80, 80) }
  ];
  let btnH = 60;
  let gap = 80;
  let startY = centerY - gap + 20; // Center the group vertically a bit better
  let btnW = 280;
  
  for (let i = 0; i < diffs.length; i++) {
      let d = diffs[i];
      let btnY = startY + i * gap;
      
      // Hover check
      let isHover = abs(mouseX - centerX) <= btnW / 2 && abs(mouseY - btnY) <= btnH / 2;
      let isPressed = isHover && mouseIsPressed;
      
      drawModernButton(centerX, btnY, btnW, btnH, d.id, isHover, isPressed, d.color);
  }
  
  // Back instruction
  fill(160, 170, 190);
  textSize(16);
  textStyle(NORMAL);
  text("Press ESC to Back", centerX, centerY + 180);

  pop();

  if (startGatePending || millis() < startGateMessageUntil) {
      fill(startGateMessageColor[0], startGateMessageColor[1], startGateMessageColor[2]);
      noStroke();
      textSize(18);
      textAlign(CENTER, CENTER);
      let msg = startGatePending ? 'Checking backend service...' : startGateMessage;
      text(msg, width / 2, height - 80);
  }
}

function getPausedLayout() {
    let centerX = gameWidth * 0.5;
    let centerY = gameHeight * 0.5;
    let panelW = 400;
    let panelH = 320;
    
    // Title
    let titleY = centerY - 100;
    let hintY = centerY - 60;
    
    // Buttons
    let btnW = 280;
    let btnH = 60;
    let btnGap = 20;
    
    let restartY = centerY + 20;
    let menuY = restartY + btnH + btnGap;
    
    return { centerX, centerY, panelW, panelH, titleY, hintY, btnW, btnH, restartY, menuY };
}

function drawPaused() {
    let layout = getPausedLayout();
    let localX = mouseX - gameViewX;
    let localY = mouseY - (statusHeight + gameViewY);
    
    // Check hovers
    let restartHover = abs(localX - layout.centerX) <= layout.btnW / 2 && abs(localY - layout.restartY) <= layout.btnH / 2;
    let menuHover = abs(localX - layout.centerX) <= layout.btnW / 2 && abs(localY - layout.menuY) <= layout.btnH / 2;
    
    // Click effect (scale down if clicked)
    let restartPressed = restartHover && mouseIsPressed;
    let menuPressed = menuHover && mouseIsPressed;

    push();
    rectMode(CENTER);
    textAlign(CENTER, CENTER);
    
    // 1. Darken Background with Blur feel
    fill(10, 15, 20, 200);
    noStroke();
    rect(gameWidth / 2, gameHeight / 2, gameWidth, gameHeight);

    // 2. Main Panel
    // Shadow for depth
    drawingContext.shadowBlur = 30;
    drawingContext.shadowColor = 'rgba(0, 0, 0, 0.6)';
    
    fill(25, 30, 40, 245);
    stroke(60, 70, 80);
    strokeWeight(1);
    rect(layout.centerX, layout.centerY, layout.panelW, layout.panelH, 16);
    
    // Reset shadow for internal elements
    drawingContext.shadowBlur = 0;

    // 3. Title
    fill(255);
    textSize(42);
    textStyle(BOLD);
    drawingContext.shadowBlur = 10;
    drawingContext.shadowColor = 'rgba(255, 255, 255, 0.2)';
    text("PAUSED", layout.centerX, layout.titleY);
    drawingContext.shadowBlur = 0;

    // 4. Subtitle
    fill(160, 170, 190);
    textSize(16);
    textStyle(NORMAL);
    text("Game paused. Take a break.", layout.centerX, layout.hintY);

    // 5. Restart Button
    drawModernButton(layout.centerX, layout.restartY, layout.btnW, layout.btnH, 
        "RESTART", restartHover, restartPressed, color(255, 80, 80));

    // 6. Menu Button
    drawModernButton(layout.centerX, layout.menuY, layout.btnW, layout.btnH, 
        "MAIN MENU", menuHover, menuPressed, color(80, 160, 255));

    pop();
}

function drawModernButton(x, y, w, h, label, isHover, isPressed, accentColor) {
    push();
    translate(x, y);
    if (isPressed) scale(0.96);
    else if (isHover) scale(1.02);

    // Button Background
    if (isHover) {
        fill(45, 50, 60);
        stroke(accentColor);
        strokeWeight(2);
        drawingContext.shadowBlur = 15;
        drawingContext.shadowColor = accentColor;
    } else {
        fill(35, 40, 50);
        stroke(60, 70, 80);
        strokeWeight(1);
    }
    
    rect(0, 0, w, h, 12);
    drawingContext.shadowBlur = 0; // Reset

    // Accent Bar (Left side)
    noStroke();
    fill(accentColor);
    rect(-w/2 + 6, 0, 4, h - 16, 4);

    // Text
    fill(255);
    textSize(18);
    textStyle(BOLD);
    textAlign(CENTER, CENTER);
    text(label, 0, 0);

    pop();
}

function getPoliceSpawnPoint() {
    // ... existing ...
    let policeStations = buildings.filter(b => b.type === 'police');
    if (policeStations.length === 0) return getRandomRoadCenter();
    let station = random(policeStations);
    let nearest = null;
    let minDist = Infinity;
    if (roadCenters && roadCenters.length > 0) {
        for(let rc of roadCenters) {
             let d = dist(rc.x, rc.y, station.pos.x, station.pos.y);
             if (d < minDist && d > 80) { 
                 minDist = d;
                 nearest = rc;
             }
        }
    }
    return nearest || getRandomRoadCenter();
}

function playGame() {
  if (gameState === 'SHOP' || gameState === 'PAUSED' || gameState === 'TUTORIAL') {
      return;
  }
  
  // Tutorial Check
  if (tutorialSystem && tutorialSystem.check(player, enemies, buildings, powerups)) {
      gameState = 'TUTORIAL';
      pauseStartTime = millis();
      return;
  }
  
  // Boundary Warning Logic
  // Check if player is near edges of map
  let margin = 300; // Warning distance
  let nearLeft = player.pos.x < margin;
  let nearRight = player.pos.x > mapWidth - margin;
  let nearTop = player.pos.y < margin;
  let nearBottom = player.pos.y > mapHeight - margin;
  
  if (nearLeft || nearRight || nearTop || nearBottom) {
      boundaryWarningAlpha = min(boundaryWarningAlpha + 10, 150);
  } else {
      boundaryWarningAlpha = max(boundaryWarningAlpha - 10, 0);
  }
  
  // Timer
  let elapsed = (millis() - startTime - totalPausedTime) / 1000;
  let remaining = survivalTime - elapsed;
  
  if (remaining <= 0) {
    if (typeof clearSpecialWeaponEffects === 'function') {
        clearSpecialWeaponEffects();
    }
    gameState = 'WIN';
  }

    if (frameCount % 3600 === 0) { // Every 60 seconds (60fps * 60s)
        if (authUI && authUI.isLoggedIn()) {
            let data = {
                coins: player.coins,
                unlockedWeapons: Array.isArray(player.ownedWeapons) ? player.ownedWeapons : [WEAPON_TYPES.PISTOL],
                unlockedSpecialWeapons: Array.isArray(player.unlockedSpecialWeapons) ? player.unlockedSpecialWeapons : [],
                upgradeState: {
                    maxHp: player.bonusMaxHp,
                    maxAmmo: player.bonusMaxAmmo,
                    topSpeed: player.bonusTopSpeed,
                    acceleration: player.bonusAcceleration
                }
            };
            authUI.saveProgress(data);
        }
    }

    if (frameCount % 60 === 0) {
        player.coins += (difficulty === 'EASY' ? 3 : 2);
    }

  // Spawning Enemies
  let spawnInterval = 5000;
  if (difficulty === 'EASY') spawnInterval = 6000;
  if (difficulty === 'HARD') spawnInterval = 3000;
  
  if (millis() - lastEnemySpawnTime > spawnInterval) { 
    let spawn = getPoliceSpawnPoint();
    if (spawn) {
        let canSpawn = true;
        for (let e of enemies) {
            if (dist(spawn.x, spawn.y, e.pos.x, e.pos.y) < 140) {
                canSpawn = false;
                break;
            }
        }
        if (canSpawn) {
            enemies.push(new Enemy(spawn.x, spawn.y));
        }
    }
    lastEnemySpawnTime = millis();
  }

  // Spawning PowerUps
  if (millis() - lastPowerUpSpawnTime > 2500) {
    if (difficulty === 'HARD') {
        lastPowerUpSpawnTime = millis();
    } else {
    let types = ['speed', 'shield', 'health', 'coin', 'coin'];
    if (difficulty === 'EASY') {
        types = ['speed', 'shield', 'health', 'health', 'coin', 'coin'];
    } else if (difficulty === 'NORMAL') {
        types = ['speed', 'shield', 'health', 'coin', 'coin'];
    }
    let type;
    let hasUnlockedSpecial = player.unlockedSpecialWeapons && player.unlockedSpecialWeapons.length > 0;
    let choseSpecialDrop = false;
    
    if (hasUnlockedSpecial) {
        let specialChance = min(0.45 + specialDropFailCount * 0.08, 0.85);
        let forceSpecialDrop = specialDropFailCount >= 6;
        if (forceSpecialDrop || random() < specialChance) {
             let pool = player.unlockedSpecialWeapons;
             let totalWeight = 0;
             for (let id of pool) {
                 totalWeight += (WEAPON_CONFIG[id] && WEAPON_CONFIG[id].dropWeight) || 10;
             }
             let r = random(totalWeight);
             let sum = 0;
             for (let id of pool) {
                 sum += (WEAPON_CONFIG[id] && WEAPON_CONFIG[id].dropWeight) || 10;
                 if (r < sum) {
                     type = id;
                     choseSpecialDrop = true;
                     break;
                 }
             }
             if (!type) {
                 type = pool[0];
                 choseSpecialDrop = true;
             }
        } else {
            type = random(types);
        }
    } else {
        type = random(types);
    }
    
    let px = random(100, mapWidth - 100);
    let py = random(100, mapHeight - 100);
    
    // Simple check to avoid spawning inside buildings
    let valid = true;
    for (let b of buildings) {
        if (px > b.pos.x - b.w/2 && px < b.pos.x + b.w/2 && 
            py > b.pos.y - b.h/2 && py < b.pos.y + b.h/2) {
            valid = false;
            break;
        }
    }
    
    if (valid) {
        powerups.push(new PowerUp(px, py, type));
        lastPowerUpSpawnTime = millis();
        if (hasUnlockedSpecial) {
            if (choseSpecialDrop) specialDropFailCount = 0;
            else specialDropFailCount = min(10, specialDropFailCount + 1);
        }
    }
    }
  }

  drawGameObjects();
  
}

function drawGameObjects() {
  let shouldUpdate = gameState === 'PLAY' || gameState === 'MISSILE_CONTROL';
  let playerLocked = shouldUpdate && isPlayerControlLocked();
  let hideBuildingLabels = isBuildingInteractionOpen();
  // Draw Buildings
  for (let b of buildings) {
    b.display();
    if (!hideBuildingLabels) {
      b.showNameLabel();
      b.showTooltip(player); // Show tooltip if close
    }
  }

  // Update & Display Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    if (shouldUpdate) particles[i].update();
    particles[i].display();
    if (shouldUpdate && particles[i].isDead()) {
      particles.splice(i, 1);
    }
  }
  
    // Display Obstacles
    for (let o of obstacles) {
        o.display();
        if (shouldUpdate) {
            if (!playerLocked) o.checkCollision(player);
            for(let e of enemies) o.checkCollision(e);
        }
    }

    // Update & Display Missile Strikes (Dongfeng)
    let updateStrikeFn = null;
    let drawStrikeFn = null;
    if (typeof updateMissileStrikes === 'function') updateStrikeFn = updateMissileStrikes;
    else if (typeof globalThis !== 'undefined' && typeof globalThis.updateMissileStrikes === 'function') updateStrikeFn = globalThis.updateMissileStrikes;
    if (typeof drawMissileStrikes === 'function') drawStrikeFn = drawMissileStrikes;
    else if (typeof globalThis !== 'undefined' && typeof globalThis.drawMissileStrikes === 'function') drawStrikeFn = globalThis.drawMissileStrikes;
    if (updateStrikeFn && drawStrikeFn) {
        if (shouldUpdate) updateStrikeFn();
        drawStrikeFn();
    }
    let updateAtomicFn = null;
    let drawAtomicFn = null;
    if (typeof updateAtomicStrikes === 'function') updateAtomicFn = updateAtomicStrikes;
    else if (typeof globalThis !== 'undefined' && typeof globalThis.updateAtomicStrikes === 'function') updateAtomicFn = globalThis.updateAtomicStrikes;
    if (typeof drawAtomicStrikes === 'function') drawAtomicFn = drawAtomicStrikes;
    else if (typeof globalThis !== 'undefined' && typeof globalThis.drawAtomicStrikes === 'function') drawAtomicFn = globalThis.drawAtomicStrikes;
    if (updateAtomicFn && drawAtomicFn) {
        if (shouldUpdate) updateAtomicFn();
        drawAtomicFn();
    }

  // Update & Display Projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
      let p = projectiles[i];
      if (shouldUpdate) p.update();
      p.display();
      
      if (!shouldUpdate) continue; 

      if (p.isDead()) {
          projectiles.splice(i, 1);
          continue;
      }

      if (p.isLaserBeam) {
          continue;
      }
      
      // Check collision with buildings
      for (let b of buildings) {
          if (p.pos.x > b.pos.x - b.w/2 && p.pos.x < b.pos.x + b.w/2 &&
              p.pos.y > b.pos.y - b.h/2 && p.pos.y < b.pos.y + b.h/2) {
              
              // RICOCHET LOGIC
              if (p.type === 'ricochet' && p.bounces > 0) {
                  // Determine which side was hit to reflect correctly
                  // Simple approx: check distance to center vs width/height
                  let dx = p.pos.x - b.pos.x;
                  let dy = p.pos.y - b.pos.y;
                  
                  // Normalize by aspect ratio of building to find collision side
                  // if abs(dx / w) > abs(dy / h) -> hit side (X bounce)
                  // else -> hit top/bottom (Y bounce)
                  
                  if (abs(dx / b.w) > abs(dy / b.h)) {
                      p.vel.x *= -1;
                  } else {
                      p.vel.y *= -1;
                  }
                  
                  // Move out of collision to prevent sticking
                  p.pos.add(p.vel); 
                  
                  p.bounces--;
                  createExplosion(p.pos.x, p.pos.y, color(255, 0, 255), 3);
              } else {
                  projectiles.splice(i, 1);
                  createExplosion(p.pos.x, p.pos.y, color(200), 5);
              }
              break;
          }
      }
      
      // Check collision with obstacles
      if (i < projectiles.length) { 
          for (let o of obstacles) {
              if (o.isSolid && p.pos.dist(o.pos) < o.w/2) {
                  if (p.type === 'ricochet' && p.bounces > 0) {
                       let n = p5.Vector.sub(p.pos, o.pos).normalize();
                       // Reflect: v = v - 2(v.n)n
                       let v = p.vel.copy();
                       let dot = v.dot(n);
                       n.mult(2 * dot);
                       v.sub(n);
                       p.vel = v;
                       p.pos.add(p.vel);
                       p.bounces--;
                  } else {
                      projectiles.splice(i, 1);
                      createExplosion(p.pos.x, p.pos.y, color(150, 100, 50), 5);
                  }
                  break;
              }
          }
      }
  }

  // Update & Display PowerUps
  for (let i = powerups.length - 1; i >= 0; i--) {
    let p = powerups[i];
    p.display();
    if (shouldUpdate && p.checkCollision(player)) {
      let consumed = applyPowerUp(p);
      if (consumed) {
          createExplosion(p.pos.x, p.pos.y, color(255, 255, 255), 10);
          powerups.splice(i, 1);
      }
    }
  }

  // Update & Display Player
  if (shouldUpdate && !playerLocked) {
      player.edges();
      player.update();
  } else if (playerLocked) {
      player.vel.mult(0);
      player.acc.mult(0);
  }
  
  if (shouldUpdate && !playerLocked) {
      for (let b of buildings) {
        b.checkCollision(player);
      }
  }
  player.display();

  // Update & Display Enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    let e = enemies[i];
    if (shouldUpdate) e.update(player);
    
    if (shouldUpdate) {
        for (let b of buildings) {
            b.checkCollision(e);
        }
        
        for (let j = projectiles.length - 1; j >= 0; j--) {
            let p = projectiles[j];
            if (p.checkCollision(e)) {
                let config = WEAPON_CONFIG[p.type];
                let dmg = config ? (p.isLaserBeam ? (config.damagePerFrame || config.damage || 1) : config.damage) : 1;
                
                e.hp -= dmg;
                if (!p.isLaserBeam) {
                    createExplosion(e.pos.x, e.pos.y, color(255, 0, 0), 5);
                }
                
                if (e.hp <= 0) {
                    createExplosion(e.pos.x, e.pos.y, color(255, 50, 0), 15);
                    enemies.splice(i, 1);
                    player.coins += 5; 
                    shakeAmount = 5;
                } else {
                    // Knockback?
                    if (!p.isLaserBeam) {
                        let push = p5.Vector.sub(e.pos, p.pos).normalize().mult(2);
                        e.pos.add(push);
                    }
                }
                
                if (!config || !config.penetrates && !p.isFireArea) {
                     projectiles.splice(j, 1);
                }
                break; 
            }
        }
    }
    
    if (i < enemies.length) {
        e.display();
        
        if (shouldUpdate) {
            let d = p5.Vector.dist(player.pos, e.pos);
            if (d < player.r + e.r) {
              createExplosion(player.pos.x, player.pos.y, color(255, 100, 0), 20);
              shakeAmount = 10;
              
              if (player.hasShield) {
                player.hasShield = false;
                let pushVec = p5.Vector.sub(e.pos, player.pos);
                pushVec.setMag(10);
                e.applyForce(pushVec);
              } else {
                player.hp--;
                enemies.splice(i, 1); 
                if (player.hp <= 0) {
                  if (typeof clearSpecialWeaponEffects === 'function') {
                      clearSpecialWeaponEffects();
                  }
                  gameState = 'GAMEOVER';
                }
              }
            }
        }
    }
  }
}

function ensurePlayerProfile() {
    if (!player) {
        player = new Player(mapWidth / 2, mapHeight / 2);
    }
}

function applyProgressData(data) {
    if (!data) return;
    ensurePlayerProfile();
    player.coins = Number.isFinite(data.coins) ? data.coins : 0;
    player.ownedWeapons = Array.isArray(data.ownedWeapons) ? data.ownedWeapons : [WEAPON_TYPES.PISTOL];
    player.ownedCars = Array.isArray(data.ownedCars) ? data.ownedCars : ['starter'];
    player.currentWeapon = data.currentWeapon || WEAPON_TYPES.PISTOL;
    player.unlockedSpecialWeapons = Array.isArray(data.unlockedSpecialWeapons)
        ? data.unlockedSpecialWeapons
        : (Array.isArray(data.unlockedWeapons) ? data.unlockedWeapons : []);
    let targetCar = data.carType || 'starter';
    if (player.ownedCars.includes(targetCar)) {
        player.applyCarType(targetCar);
    }
    let upgradeState = data.upgradeState && typeof data.upgradeState === 'object' ? data.upgradeState : {};
    player.bonusMaxHp = constrain(Number(upgradeState.maxHp) || 0, 0, 2);
    player.bonusMaxAmmo = constrain(Number(upgradeState.maxAmmo) || 0, 0, 5);
    player.bonusTopSpeed = constrain(Number(upgradeState.topSpeed) || 0, 0, 5);
    player.bonusAcceleration = constrain(Number(upgradeState.acceleration) || 0, 0, 5);
    player.shieldDurationLevel = 0;
    player.currentSpecialWeapon = null;
    player.specialWeaponCount = 0;
    player.applyCarType(player.carType || targetCar);
}

async function refreshUserProgress() {
    if (!authUI || !authUI.isLoggedIn()) return false;
    let data = await authUI.loadProgress();
    if (!data) return false;
    applyProgressData(data);
    return true;
}

function setStartGateMessage(msg, colorRgb = [255, 80, 80], durationMs = 3000) {
    startGateMessage = msg;
    startGateMessageColor = colorRgb;
    startGateMessageUntil = millis() + durationMs;
}

async function isBackendAvailable() {
    if (!authUI || !authUI.apiBaseUrl) return false;
    let controller = new AbortController();
    let timer = setTimeout(() => controller.abort(), 3000);
    try {
        let res = await fetch(`${authUI.apiBaseUrl}/api/health`, {
            method: 'GET',
            signal: controller.signal
        });
        clearTimeout(timer);
        return res.ok;
    } catch (e) {
        clearTimeout(timer);
        return false;
    }
}

async function continueStartAfterAuth() {
    let loaded = await refreshUserProgress();
    if (!loaded) {
        authUI.showMessage('Failed to load progress. Please check backend and retry.');
        return;
    }
    authUI.hide();
    loadGameplayAssets();
    gameState = 'DIFFICULTY_SELECT';
}

async function prepareGameplayStartFromDifficultySelect() {
    if (!authUI || !authUI.isLoggedIn()) {
        setStartGateMessage('Please login before starting the game.');
        return false;
    }

    let loaded = await refreshUserProgress();
    if (!loaded) {
        setStartGateMessage('Unable to reach backend or load profile. Cannot start game now.');
        return false;
    }

    return true;
}

async function beginMenuShopFlow() {
    ensurePlayerProfile();
    loadShopSupportAssets();
    let backendOk = await isBackendAvailable();
    if (!backendOk) {
        setStartGateMessage('Backend unavailable. Please start login service first.');
        return;
    }
    if (authUI.isLoggedIn()) {
        let loaded = await refreshUserProgress();
        if (!loaded) {
            setStartGateMessage('Unable to load profile data. Please login again.');
            return;
        }
        gameState = 'MENU_SHOP';
        return;
    }
    gameState = 'AUTH';
    authUI.state = 'login';
    authUI.show();
    authUI.onCloseRequested = () => {
        gameState = 'MENU';
    };
    authUI.onLoginSuccess = async () => {
        let loaded = await refreshUserProgress();
        if (!loaded) {
            setStartGateMessage('Unable to load profile data. Please login again.');
            gameState = 'MENU';
            return;
        }
        gameState = 'MENU_SHOP';
    };
}

async function beginStartFlow() {
    if (startGatePending) return;
    startGatePending = true;
    let backendOk = await isBackendAvailable();
    if (!backendOk) {
        setStartGateMessage('Backend unavailable. Please start login service first.');
        startGatePending = false;
        return;
    }

    if (authUI.isLoggedIn()) {
        let loaded = await refreshUserProgress();
        if (!loaded) {
            setStartGateMessage('Unable to load profile data. Please login again.');
            startGatePending = false;
            return;
        }
        loadGameplayAssets();
        gameState = 'DIFFICULTY_SELECT';
        startGatePending = false;
        return;
    }

    gameState = 'AUTH';
    authUI.state = 'login';
    authUI.show();
    authUI.onCloseRequested = () => {
        gameState = 'MENU';
    };
    authUI.onLoginSuccess = async () => {
        await continueStartAfterAuth();
    };
    startGatePending = false;
}

function buyCar(carId) {
    if (!CAR_CATALOG || !CAR_CATALOG[carId]) return;
    let data = CAR_CATALOG[carId];
    if (player.coins < data.price) return;
    player.coins -= data.price;
    player.applyCarType(carId);
}

function buyWeapon(weaponId, price) {
    if (player.coins < price) return;
    
    // Check if special unlock
    let config = WEAPON_CONFIG[weaponId];
    if (config && config.type === 'special') {
        if (player.unlockedSpecialWeapons.includes(weaponId)) return; // Already unlocked
        player.coins -= price;
        player.unlockedSpecialWeapons.push(weaponId);
    } else {
        // Basic weapon
        if (player.currentWeapon === weaponId) return;
        player.coins -= price;
        player.currentWeapon = weaponId;
    }
}

function buyUpgrade(type, price) {
    if (player.coins < price) return;
    player.coins -= price;
    if (type === 'maxHp') {
        player.bonusMaxHp += 1;
        player.maxHp += 1;
        player.hp = min(player.hp, player.maxHp);
    } else if (type === 'maxAmmo') {
        player.bonusMaxAmmo += 10;
        player.maxAmmo += 10;
        player.ammo = min(player.ammo, player.maxAmmo);
    }
}

function drawShopMenu() {
    ensurePlayerProfile();
    drawCoverBackground();
    let rect = lastCoverRect || getCoverRect();
    shopUI.draw(rect.w, rect.h, rect.x, rect.y);
}

function drawShop() {
    if (shopBuilding && (shopBuilding.type === 'hospital' || shopBuilding.type === 'armory')) {
        drawBuildingInteractionPanel(gameWidth, gameHeight, 0, 0, gameViewX, statusHeight + gameViewY);
        return;
    }
    shopUI.draw(gameWidth, gameHeight, 0, 0, gameViewX, statusHeight + gameViewY);
}

function isBuildingInteractionOpen() {
    return gameState === 'SHOP' && !!shopBuilding && (shopBuilding.type === 'hospital' || shopBuilding.type === 'armory');
}

function openBuildingInteraction(building) {
    if (!building || !building.isInteractable()) return false;
    gameState = 'SHOP';
    pauseStartTime = millis();
    shopBuilding = building;
    return true;
}

function tryOpenNearbyBuildingInteraction() {
    if (gameState !== 'PLAY' || !player || isPlayerControlLocked()) return false;

    let nearestBuilding = null;
    let nearestDistance = Infinity;
    for (let b of buildings) {
        if (!b.isPlayerInRange(player)) continue;
        let center = typeof b.getInteractionCenter === 'function' ? b.getInteractionCenter() : b.getCollisionCenter();
        let distanceToBuilding = dist(player.pos.x, player.pos.y, center.x, center.y);
        if (distanceToBuilding < nearestDistance) {
            nearestDistance = distanceToBuilding;
            nearestBuilding = b;
        }
    }

    return openBuildingInteraction(nearestBuilding);
}

function getBuildingInteractionDetails(building = shopBuilding) {
    if (!building || !player) return null;
    let config = BUILDING_INTERACTION_CONFIG[building.type];
    if (!config) return null;

    let currentValue = 0;
    let maxValue = 0;
    if (building.type === 'armory') {
        currentValue = player.ammo || 0;
        maxValue = player.maxAmmo || 0;
    } else if (building.type === 'hospital') {
        currentValue = player.hp || 0;
        maxValue = player.maxHp || 0;
    }

    let missing = max(0, maxValue - currentValue);
    let purchaseAmount = min(config.amount, missing);
    let affordable = player.coins >= config.price;
    let atMax = purchaseAmount <= 0;
    let actionLabel = building.type === 'armory'
        ? `Buy +${config.amount} Ammo`
        : `Buy +${config.amount} HP`;
    let statusText = '';

    if (atMax) {
        statusText = building.type === 'armory' ? 'Ammo is already full.' : 'Health is already full.';
    } else if (!affordable) {
        statusText = `Need ${config.price} coins.`;
    } else {
        statusText = `Spend ${config.price} coins for +${purchaseAmount}.`;
    }

    return {
        building,
        config,
        currentValue,
        maxValue,
        purchaseAmount,
        affordable,
        atMax,
        canBuy: !atMax && affordable,
        actionLabel,
        statusText
    };
}

function purchaseBuildingInteraction() {
    let details = getBuildingInteractionDetails();
    if (!details || !details.canBuy) return false;

    player.coins -= details.config.price;
    if (details.building.type === 'armory') {
        player.ammo = min(player.maxAmmo, player.ammo + details.purchaseAmount);
    } else if (details.building.type === 'hospital') {
        player.hp = min(player.maxHp, player.hp + details.purchaseAmount);
    }

    details.building.lastInteractionTime = millis();
    return true;
}

function isPointInUiRect(px, py, rect) {
    return !!rect && px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}

function drawInteractionHeartIcon(x, y, scaleFactor = 1) {
    push();
    translate(x, y);
    scale(scaleFactor);
    fill(255, 70, 70);
    stroke(180, 0, 0);
    strokeWeight(1);
    beginShape();
    vertex(0, 0);
    bezierVertex(-5, -5, -10, 0, 0, 10);
    bezierVertex(10, 0, 5, -5, 0, 0);
    endShape(CLOSE);
    pop();
}

function drawBuildingInteractionPanel(viewW, viewH, viewX = 0, viewY = 0, inputOffsetX = 0, inputOffsetY = 0) {
    let details = getBuildingInteractionDetails();
    if (!details) {
        shopUI.draw(viewW, viewH, viewX, viewY, inputOffsetX, inputOffsetY);
        return;
    }

    buildingInteractionUI.inputOffsetX = inputOffsetX;
    buildingInteractionUI.inputOffsetY = inputOffsetY;

    let panelW = min(540, viewW * 0.7);
    let panelH = min(470, viewH * 0.78);
    let panelX = viewX + (viewW - panelW) / 2;
    let panelY = viewY + (viewH - panelH) / 2;
    let accent = details.config.accent;
    let closeSize = 34;
    let closeX = panelX + panelW - closeSize - 18;
    let closeY = panelY + 18;
    let buttonW = min(280, panelW - 80);
    let buttonH = 54;
    let buttonX = panelX + (panelW - buttonW) / 2;
    let cardY = panelY + 150;
    let cardH = 110;
    let priceY = cardY + cardH + 26;
    let buttonY = priceY + 26;
    let statusY = buttonY + buttonH + 24;
    let escY = statusY + 36;
    let actionHover = isPointInUiRect(mouseX - inputOffsetX, mouseY - inputOffsetY, { x: buttonX, y: buttonY, w: buttonW, h: buttonH });
    let closeHover = isPointInUiRect(mouseX - inputOffsetX, mouseY - inputOffsetY, { x: closeX, y: closeY, w: closeSize, h: closeSize });

    buildingInteractionUI.closeRect = { x: closeX, y: closeY, w: closeSize, h: closeSize };
    buildingInteractionUI.actionRect = { x: buttonX, y: buttonY, w: buttonW, h: buttonH };

    push();
    rectMode(CORNER);
    noStroke();
    fill(0, 0, 0, 215);
    rect(viewX, viewY, viewW, viewH, 20);

    fill(48, 36, 28, 252);
    stroke(accent[0], accent[1], accent[2]);
    strokeWeight(3);
    rect(panelX, panelY, panelW, panelH, 18);

    noStroke();
    fill(255, 244, 225);
    textAlign(CENTER, TOP);
    textSize(30);
    text(details.config.title, panelX + panelW / 2, panelY + 24);

    textSize(16);
    fill(225, 214, 190);
    text(details.config.description, panelX + panelW / 2, panelY + 70);

    fill(255, 215, 120);
    textSize(18);
    text(`Coins: ${player.coins}`, panelX + panelW / 2, panelY + 116);

    fill(94, 68, 48, 240);
    rect(panelX + 40, cardY, panelW - 80, cardH, 14);
    fill(255, 240, 215);
    textSize(20);
    text(details.config.itemLabel, panelX + panelW / 2, panelY + 170);

    fill(230, 220, 205);
    textSize(16);
    if (details.building.type === 'armory') {
        text(`Ammo: ${details.currentValue} / ${details.maxValue}`, panelX + panelW / 2, panelY + 210);
    } else {
        text(`Health: ${details.currentValue} / ${details.maxValue}`, panelX + panelW / 2, panelY + 210);
        drawInteractionHeartIcon(panelX + panelW / 2, panelY + 240, 1.2);
    }

    fill(210, 196, 170);
    textSize(15);
    text(`Price: ${details.config.price} coins`, panelX + panelW / 2, priceY);

    if (details.canBuy) {
        fill(actionHover ? color(accent[0] + 20, accent[1] + 20, accent[2] + 20) : color(accent[0], accent[1], accent[2]));
    } else {
        fill(110, 110, 110);
    }
    noStroke();
    rect(buttonX, buttonY, buttonW, buttonH, 12);

    fill(30);
    textSize(18);
    textAlign(CENTER, CENTER);
    text(`${details.actionLabel}  ($${details.config.price})`, buttonX + buttonW / 2, buttonY + buttonH / 2);

    fill(details.canBuy ? 210 : 255, details.canBuy ? 225 : 170, details.canBuy ? 190 : 170);
    textSize(14);
    text(details.statusText, panelX + panelW / 2, statusY);

    if (closeHover) fill(accent[0], accent[1], accent[2]);
    else fill(156, 110, 78);
    rect(closeX, closeY, closeSize, closeSize, 8);
    stroke(35, 24, 15);
    strokeWeight(2.5);
    line(closeX + 9, closeY + 9, closeX + closeSize - 9, closeY + closeSize - 9);
    line(closeX + closeSize - 9, closeY + 9, closeX + 9, closeY + closeSize - 9);
    noStroke();

    fill(235, 220, 200);
    textAlign(CENTER, CENTER);
    textSize(14);
    text("Press ESC to Close", panelX + panelW / 2, escY);
    pop();
}

function handleBuildingInteractionClick() {
    let localX = mouseX - buildingInteractionUI.inputOffsetX;
    let localY = mouseY - buildingInteractionUI.inputOffsetY;

    if (isPointInUiRect(localX, localY, buildingInteractionUI.closeRect)) {
        closeShopFromUI();
        return true;
    }
    if (isPointInUiRect(localX, localY, buildingInteractionUI.actionRect)) {
        purchaseBuildingInteraction();
        return true;
    }
    return false;
}

function createExplosion(x, y, col, count) {
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(x, y, col));
  }
}

function applyPowerUp(p) {
  if (p.type === 'speed') {
    player.maxSpeed += 2;
    let bonusTime = (player.shieldDurationLevel || 0) * 2000;
    setTimeout(() => player.maxSpeed -= 2, 5000 + bonusTime); // Temporary boost
    return true;
  } else if (p.type === 'shield') {
    player.hasShield = true;
    return true;
  } else if (p.type === 'health') {
    player.hp = min(player.hp + 1, player.maxHp);
    return true;
  } else if (p.type === 'coin') {
    player.coins += p.value || 5;
    return true;
  } else if (p.type === WEAPON_TYPES.DONGFENG || p.type === WEAPON_TYPES.LOITERING || p.type === WEAPON_TYPES.ATOMIC) {
      if (player.currentSpecialWeapon && player.currentSpecialWeapon !== p.type) {
          if (tutorialSystem && !tutorialSystem.shown.inventory_full) {
              tutorialSystem.trigger('inventory_full');
              gameState = 'TUTORIAL';
              pauseStartTime = millis();
          }
          return false;
      }
      if (player.currentSpecialWeapon !== p.type) {
          player.currentSpecialWeapon = p.type;
          player.specialWeaponCount = 0;
      }
      player.specialWeaponCount = (player.specialWeaponCount || 0) + 1;
      shakeAmount = 5;
      return true;
  }
  return true;
}

function drawStatusBar() {
  if (gameState === 'BOOT_LOADING' || gameState === 'MENU' || gameState === 'DIFFICULTY_SELECT' || gameState === 'MENU_SHOP') return;

  // Background
  fill(30);
  noStroke();
  rect(width/2, statusHeight/2, width, statusHeight);
  
  // Border line
  stroke(100);
  strokeWeight(4);
  line(0, statusHeight, width, statusHeight);

  if (gameState !== 'PLAY' && gameState !== 'PAUSED' && gameState !== 'SHOP' && gameState !== 'HELP' && gameState !== 'MAP_SELECT') return; 

  let currentMillis = millis();
  if (gameState === 'PAUSED' || gameState === 'SHOP' || gameState === 'HELP' || gameState === 'MAP_SELECT') {
      currentMillis = pauseStartTime;
  }
  let elapsed = (currentMillis - startTime - totalPausedTime) / 1000;
  let remaining = max(0, survivalTime - elapsed);
  let statusSections = [
      { key: 'health', label: 'HEALTH', width: 250 },
      { key: 'ammo', label: 'AMMO', width: 180 },
      { key: 'coins', label: 'COINS', width: 130 },
      { key: 'time', label: 'TIME', width: 120 },
      { key: 'mode', label: 'MODE', width: 100 }
  ];
  if (player.hasShield) statusSections.push({ key: 'shield', label: 'SHIELD', width: 82 });
  if (player.currentSpecialWeapon) statusSections.push({ key: 'special', label: 'SPECIAL', width: 88 });

  let sectionGap = 16;
  let iconReservedW = 150;
  let layoutLeft = 20;
  let layoutRight = width - iconReservedW;
  let totalSectionW = statusSections.reduce((sum, section) => sum + section.width, 0) + sectionGap * (statusSections.length - 1);
  let startX = max(layoutLeft, layoutLeft + (layoutRight - layoutLeft - totalSectionW) / 2);
  let sectionMap = {};
  let cursorX = startX;
  for (let section of statusSections) {
      sectionMap[section.key] = {
          x: cursorX,
          w: section.width,
          cx: cursorX + section.width / 2
      };
      cursorX += section.width + sectionGap;
  }

  // --- Interactive Icons ---
  drawInteractiveStatusIcon(width - 110, statusHeight / 2, 50, helpIconImg, 'HELP');
  drawInteractiveStatusIcon(width - 50, statusHeight / 2, 50, settingIconImg, 'GEAR');
  
  // --- Health ---
  let healthSection = sectionMap.health;
  fill(200);
  textSize(16);
  noStroke();
  textAlign(CENTER, CENTER);
  text("HEALTH", healthSection.cx, 25);
  
  let heartCols = 6;
  let heartSpacingX = 38;
  let heartSpacingY = 28;
  let heartBaseY = 52;
  let heartScale = 1.35;
  let totalHearts = max(0, floor(player.hp));
  let heartRows = max(1, ceil(totalHearts / heartCols));
  for (let row = 0; row < heartRows; row++) {
      let heartsInRow = min(heartCols, totalHearts - row * heartCols);
      let rowStartX = healthSection.cx - ((heartsInRow - 1) * heartSpacingX) / 2;
      for (let col = 0; col < heartsInRow; col++) {
          push();
          translate(rowStartX + col * heartSpacingX, heartBaseY + row * heartSpacingY);
          scale(heartScale);
          fill(255, 50, 50);
          stroke(200, 0, 0);
          strokeWeight(1);
          beginShape();
          vertex(0, 0);
          bezierVertex(-5, -5, -10, 0, 0, 10);
          bezierVertex(10, 0, 5, -5, 0, 0);
          endShape(CLOSE);
          pop();
      }
  }

  // --- Ammo ---
  let ammoSection = sectionMap.ammo;
  fill(200);
  noStroke();
  textAlign(CENTER, CENTER);
  text("AMMO", ammoSection.cx, 25);
  
  let ammoCols = 10;
  let ammoSpacingX = 15;
  let ammoSpacingY = 25;
  let ammoBaseY = 52;
  let totalAmmo = max(0, floor(player.ammo));
  let ammoRows = max(1, ceil(totalAmmo / ammoCols));
  for (let row = 0; row < ammoRows; row++) {
      let bulletsInRow = min(ammoCols, totalAmmo - row * ammoCols);
      let rowStartX = ammoSection.cx - ((bulletsInRow - 1) * ammoSpacingX) / 2;
      for (let col = 0; col < bulletsInRow; col++) {
          push();
          translate(rowStartX + col * ammoSpacingX, ammoBaseY + row * ammoSpacingY);
          fill(255, 215, 0);
          stroke(200, 150, 0);
          strokeWeight(1);
          rect(0, 0, 8, 20, 2);
          pop();
      }
  }
  
  // --- Coins ---
  let coinsSection = sectionMap.coins;
  fill(200);
  noStroke();
  textAlign(CENTER, CENTER);
  text("COINS", coinsSection.cx, 25);
  
  fill(255, 215, 0);
  textSize(32);
  text(player.coins, coinsSection.cx, 55);

  // --- Time ---
  let timeSection = sectionMap.time;
  fill(200);
  textSize(16);
  text("TIME", timeSection.cx, 25);
  
  fill(255);
  textSize(32);
  text(nf(remaining, 0, 1), timeSection.cx, 55);
  
  // --- Mode ---
  let modeSection = sectionMap.mode;
  fill(200);
  textSize(14);
  text("MODE", modeSection.cx, 25);
  fill(255, 255, 0);
  textSize(22);
  text(difficulty, modeSection.cx, 55);
  
  // --- Shield ---
  if (player.hasShield) {
      let shieldSection = sectionMap.shield;
      fill(0, 255, 255);
      textSize(14);
      textAlign(CENTER, CENTER);
      text("SHIELD", shieldSection.cx, 25);
      
      noFill();
      stroke(0, 255, 255);
      strokeWeight(2);
      ellipse(shieldSection.cx, 55, 40, 40);
      fill(0, 255, 255, 100);
      noStroke();
      ellipse(shieldSection.cx, 55, 30, 30);
  }
  
  // --- Special Weapon ---
  if (player.currentSpecialWeapon) {
      let specialSection = sectionMap.special;
      let label = "SPECIAL";
      if (player.currentSpecialWeapon === WEAPON_TYPES.DONGFENG) label = "MISSILE";
      else if (player.currentSpecialWeapon === WEAPON_TYPES.LOITERING) label = "DRONE";
      else if (player.currentSpecialWeapon === WEAPON_TYPES.ATOMIC) label = "NUKE";
      
      fill(255, 100, 0);
      textSize(14);
      textAlign(CENTER, CENTER);
      text(label, specialSection.cx, 25);
      
      noFill();
      stroke(255, 100, 0);
      strokeWeight(2);
      rect(specialSection.cx, 55, 50, 50, 5);
      
      let icon = images && images.weaponShop ? images.weaponShop[player.currentSpecialWeapon] : null;
      if (icon && icon.width > 0) {
          imageMode(CENTER);
          // Fit within 40x40 box
          let ratio = min(40 / icon.width, 40 / icon.height);
          image(icon, specialSection.cx, 55, icon.width * ratio, icon.height * ratio);
      } else {
          fill(255, 100, 0);
          textSize(20);
          textStyle(BOLD);
          noStroke();
          text("X", specialSection.cx, 55);
          textStyle(NORMAL);
      }
      
      fill(255, 180, 80);
      textSize(14);
      noStroke();
      text("x" + (player.specialWeaponCount || 0), specialSection.cx, 90);
  }

}

function drawControlGuidePanel() {
  let items = [
      { key: 'W', label: 'Forward' },
      { key: 'UP', label: 'Forward' },
      { key: 'A', label: 'Left' },
      { key: 'LEFT', label: 'Left' },
      { key: 'S', label: 'Brake/Back' },
      { key: 'DOWN', label: 'Brake/Back' },
      { key: 'D', label: 'Right' },
      { key: 'RIGHT', label: 'Right' },
      { key: 'X', label: 'Special' }
  ];

  let cols = items.length;
  let iconSize = 22;
  let labelGap = 9;
  let cellW = 62;
  let cellH = 44;
  let rows = ceil(items.length / cols);
  let panelW = cols * cellW + 14;
  let panelH = rows * cellH + 10;
  let panelX = gameViewX + (gameWidth - panelW) / 2;
  let panelY = statusHeight + gameViewY + gameHeight - panelH - 12;

  push();
  rectMode(CORNER);
  noStroke();
  fill(255, 255, 255, 220);
  rect(panelX, panelY, panelW, panelH, 18);

  textAlign(CENTER, TOP);
  textSize(9);
  fill(35);
  for (let i = 0; i < items.length; i++) {
      let item = items[i];
      let col = i % cols;
      let row = floor(i / cols);
      let cx = panelX + 10 + col * cellW + cellW / 2;
      let cy = panelY + 8 + row * cellH;
      let img = controlKeyImgs[item.key];

      if (img && img.width > 0 && img.height > 0) {
          imageMode(CENTER);
          image(img, cx, cy + iconSize / 2, iconSize, iconSize);
      } else {
          fill(40, 40, 40, 180);
          rect(cx - iconSize / 2, cy, iconSize, iconSize, 6);
          fill(245);
          text(item.key, cx, cy + 8);
      }
      fill(35);
      text(item.label, cx, cy + iconSize + labelGap);
  }
  pop();
}

function drawGameOver() {
  loadEndingVideos();
  push();
  let videoReady = ensureVideoPlayable(defeatVideo);
  let source = videoReady ? defeatVideo : (defeatImg ? defeatImg : gameCoverImg);
  let coverRect = getCoverRect(width, height, source, true);
  if (videoReady) {
      imageMode(CORNER);
      image(defeatVideo, coverRect.x, coverRect.y, coverRect.w, coverRect.h);
  } else if (defeatImg) {
      imageMode(CORNER);
      image(defeatImg, coverRect.x, coverRect.y, coverRect.w, coverRect.h);
  } else {
      fill(0, 0, 0, 150);
      rect(width/2, height/2, width, height);
      fill(255, 0, 0);
      textSize(48);
      textAlign(CENTER, CENTER);
      text("GAME OVER", width / 2, height / 3);
  }

  let contentLeft = gameViewX;
  let contentTop = statusHeight + gameViewY;
  let contentW = gameWidth;
  let contentH = gameHeight;
  let panelW = contentW * 0.6;
  let panelH = 56;
  let bottomOffset = contentH * 0.08;
  let panelX = contentLeft + (contentW - panelW) * 0.5;
  let panelY = contentTop + contentH - bottomOffset - panelH;

  fill(0, 0, 0, 120);
  noStroke();
  rectMode(CORNER);
  rect(panelX, panelY, panelW, panelH, 12);
  fill(255);
  textSize(24);
  textAlign(CENTER, CENTER);
  text("Press ENTER to Try Again", panelX + panelW * 0.5, panelY + panelH * 0.5);
  pop();
}

function drawWin() {
  loadEndingVideos();
  push();
  let videoReady = ensureVideoPlayable(victoryVideo);
  let source = videoReady ? victoryVideo : (victoryImg ? victoryImg : gameCoverImg);
  let coverRect = getCoverRect(width, height, source, true);
  if (videoReady) {
      imageMode(CORNER);
      image(victoryVideo, coverRect.x, coverRect.y, coverRect.w, coverRect.h);
  } else if (victoryImg) {
      imageMode(CORNER);
      image(victoryImg, coverRect.x, coverRect.y, coverRect.w, coverRect.h);
  } else {
      fill(0, 0, 0, 150);
      rect(width/2, height/2, width, height);
      fill(0, 255, 0);
      textSize(48);
      textAlign(CENTER, CENTER);
      text("MISSION ACCOMPLISHED", width / 2, height / 3);
  }

  let contentLeft = gameViewX;
  let contentTop = statusHeight + gameViewY;
  let contentW = gameWidth;
  let contentH = gameHeight;
  let panelW = contentW * 0.6;
  let panelH = 104;
  let bottomOffset = contentH * 0.08;
  let panelX = contentLeft + (contentW - panelW) * 0.5;
  let panelY = contentTop + contentH - bottomOffset - panelH;

  fill(0, 0, 0, 120);
  noStroke();
  rectMode(CORNER);
  rect(panelX, panelY, panelW, panelH, 12);
  fill(255);
  textSize(24);
  textAlign(CENTER, CENTER);
  
  let nextDiff = difficulty === 'EASY' ? 'NORMAL' : (difficulty === 'NORMAL' ? 'HARD' : null);
  
  if (nextDiff) {
      text("Press SPACE for Next Level (" + nextDiff + ")", panelX + panelW * 0.5, panelY + panelH * 0.38);
  } else {
      text("You have conquered all difficulties!", panelX + panelW * 0.5, panelY + panelH * 0.38);
  }
  
  text("Press ENTER for Main Menu", panelX + panelW * 0.5, panelY + panelH * 0.74);
  pop();
}

function ensureVideoPlayable(video) {
  if (!video || !video.elt) return false;
  let el = video.elt;
  el.muted = true;
  el.playsInline = true;
  el.loop = true;
  if (el.readyState < 2) return false;
  if (el.paused) {
      let p = el.play();
      if (p && typeof p.catch === 'function') p.catch(() => {});
  }
  return true;
}

function togglePause() {
    if (gameState === 'PLAY') {
        gameState = 'PAUSED';
        pauseStartTime = millis();
    } else if (gameState === 'PAUSED') {
        gameState = 'PLAY';
        totalPausedTime += millis() - pauseStartTime;
    }
}

function enterGameplayStateAfterReset() {
    loadGameplayAssets();
    if (tutorialSystem && tutorialSystem.activeTutorial === 'intro') {
        gameState = 'TUTORIAL';
        pauseStartTime = millis();
    } else {
        gameState = 'PLAY';
    }
}

function closeShopFromUI() {
    if (gameState === 'SHOP') {
        totalPausedTime += millis() - pauseStartTime;
        gameState = 'PLAY';
        shopBuilding = null;
        return;
    }
    if (gameState === 'MENU_SHOP') {
        gameState = 'MENU';
        shopBuilding = null;
        return;
    }
}

function keyPressed() {
  if (keyCode === ENTER) {
    if (gameState === 'GAMEOVER') {
      resetGame(true);
      enterGameplayStateAfterReset();
    } else if (gameState === 'WIN') {
      gameState = 'MENU'; // Go back to menu from Win
    }
  } else if (key === ' ' && gameState === 'WIN') {
      // Next Level Logic
      if (difficulty === 'EASY') difficulty = 'NORMAL';
      else if (difficulty === 'NORMAL') difficulty = 'HARD';
      else if (difficulty === 'HARD') {
          // Stay on Hard or Loop? For now stay on hard or just return to menu
          gameState = 'MENU';
          return;
      }
      
      resetGame(true); // Keep progress
      enterGameplayStateAfterReset();
  } else if ((key === ' ' || keyCode === ENTER) && gameState === 'TUTORIAL') {
       if (tutorialSystem) {
           let wasIntro = tutorialSystem.activeTutorial === 'intro';
           tutorialSystem.dismiss();
           if (wasIntro) {
               tutorialSystem.trigger('controls');
           } else {
               gameState = 'PLAY';
               totalPausedTime += millis() - pauseStartTime;
           }
       }
  } else if (key === 'f' || key === 'F') {
      if (gameState === 'PLAY') {
          tryOpenNearbyBuildingInteraction();
      }
  } else if (keyCode === ESCAPE) {
      if (gameState === 'PLAY' || gameState === 'PAUSED') {
          togglePause();
      } else if (gameState === 'DIFFICULTY_SELECT') {
          gameState = 'MENU';
      } else if (gameState === 'SHOP' || gameState === 'MENU_SHOP') {
          closeShopFromUI();
      } else if (gameState === 'AUTH') {
          if (authUI && typeof authUI.requestClose === 'function') authUI.requestClose();
          else {
              gameState = 'MENU';
              if (authUI) authUI.hide();
          }
      }
  } else if (key === 'x' || key === 'X') {
      if (gameState === 'PLAY') {
          if (player.currentSpecialWeapon === WEAPON_TYPES.DONGFENG) {
               enterMapSelectState();
          } else if (player.currentSpecialWeapon === WEAPON_TYPES.LOITERING) {
               launchLoiteringMunition();
          } else if (player.currentSpecialWeapon === WEAPON_TYPES.ATOMIC) {
               triggerAtomicBomb();
               consumeCurrentSpecialWeapon();
          }
      } else if (gameState === 'MAP_SELECT') {
          exitMapSelectState();
      }
  } else if (key === 'r' || key === 'R') {
      if (gameState === 'PAUSED') {
          resetGame(true);
          enterGameplayStateAfterReset();
      }
  }
}

async function mousePressed() {
    if (gameState === 'SHOP' || gameState === 'MENU_SHOP') {
        if (gameState === 'SHOP' && shopBuilding && (shopBuilding.type === 'hospital' || shopBuilding.type === 'armory')) {
            handleBuildingInteractionClick();
            return;
        }
        shopUI.handleClick();
        return;
    }
    
    if (gameState === 'AUTH') {
        // Clicks handled by DOM elements
        return;
    }
    
    if (gameState === 'BOOT_LOADING') {
        return;
    }
    
    if (gameState === 'MENU') {
        if (menuAccountIconRect && mouseX >= menuAccountIconRect.x && mouseX <= menuAccountIconRect.x + menuAccountIconRect.w && mouseY >= menuAccountIconRect.y && mouseY <= menuAccountIconRect.y + menuAccountIconRect.h) {
            menuAccountOpen = !menuAccountOpen;
            return;
        }
        if (menuAccountOpen) {
            let inPopup = menuAccountPopupRect &&
                mouseX >= menuAccountPopupRect.x && mouseX <= menuAccountPopupRect.x + menuAccountPopupRect.w &&
                mouseY >= menuAccountPopupRect.y && mouseY <= menuAccountPopupRect.y + menuAccountPopupRect.h;
            if (menuAccountPrimaryButtonRect &&
                mouseX >= menuAccountPrimaryButtonRect.x && mouseX <= menuAccountPrimaryButtonRect.x + menuAccountPrimaryButtonRect.w &&
                mouseY >= menuAccountPrimaryButtonRect.y && mouseY <= menuAccountPrimaryButtonRect.y + menuAccountPrimaryButtonRect.h) {
                if (authUI && authUI.isLoggedIn()) {
                    menuAccountOpen = false;
                    authUI.logout();
                } else {
                    menuAccountOpen = false;
                    await openMenuLoginDialog();
                }
                return;
            }
            if (menuAccountSecondaryButtonRect &&
                mouseX >= menuAccountSecondaryButtonRect.x && mouseX <= menuAccountSecondaryButtonRect.x + menuAccountSecondaryButtonRect.w &&
                mouseY >= menuAccountSecondaryButtonRect.y && mouseY <= menuAccountSecondaryButtonRect.y + menuAccountSecondaryButtonRect.h) {
                menuAccountOpen = false;
                return;
            }
            if (inPopup) {
                return;
            }
            menuAccountOpen = false;
            return;
        }

        let layout = getMenuButtonLayout();
        let shopX = layout.shopX;
        let shopY = layout.shopY;
        let startX = layout.startX;
        let startY = layout.startY;
        let exitX = layout.exitX;
        let exitY = layout.exitY;
        let hoverRadius = layout.hoverRadius;
        
        if (dist(mouseX, mouseY, shopX, shopY) < hoverRadius) {
             await beginMenuShopFlow();
             return;
        }
        
        if (dist(mouseX, mouseY, startX, startY) < hoverRadius) {
             await beginStartFlow();
        }
        
        if (dist(mouseX, mouseY, exitX, exitY) < hoverRadius) {
             noLoop();
             background(0);
             fill(255);
             textAlign(CENTER, CENTER);
             textSize(32);
             text("Game Exited. Please close the tab.", width/2, height/2);
        }
    } else if (gameState === 'DIFFICULTY_SELECT') {
        let diffs = ['EASY', 'NORMAL', 'HARD'];
        let gap = 80;
        let startY = height/2 - gap + 20;
        
        for (let i = 0; i < diffs.length; i++) {
            let d = diffs[i];
            let btnY = startY + i * gap;
            
            // Check click on difficulty button
            if (abs(mouseX - width/2) < 140 && abs(mouseY - btnY) < 30) {
                if (difficultyStartPending) return;
                difficultyStartPending = true;
                let ready = await prepareGameplayStartFromDifficultySelect();
                difficultyStartPending = false;
                if (!ready) {
                    return;
                }
                difficulty = d;
                resetGame(true);
                enterGameplayStateAfterReset();
            }
        }
    } else if (gameState === 'HELP') {
        let layout = getHelpLayout();
        let localX = mouseX - gameViewX;
        let localY = mouseY - (statusHeight + gameViewY);
        if (
            localX >= layout.closeX - layout.closeSize / 2 &&
            localX <= layout.closeX + layout.closeSize / 2 &&
            localY >= layout.closeY - layout.closeSize / 2 &&
            localY <= layout.closeY + layout.closeSize / 2
        ) {
            gameState = 'PAUSED';
            return;
        }
        
        // Tab Click Detection
        let tabY = layout.panelY - layout.panelH / 2 + 64;
        let tabH = 40;
        if (localY >= tabY && localY <= tabY + tabH) {
            let tabW = (layout.panelW - 60) / 3;
            let startX = layout.panelX - layout.panelW / 2 + 30;
            let tabs = ['BASICS', 'VEHICLES', 'WEAPONS'];
            
            for (let i = 0; i < tabs.length; i++) {
                let tx = startX + i * tabW;
                // Check if click is within this tab's width (minus gap)
                if (localX >= tx && localX <= tx + tabW - 10) {
                    helpTab = tabs[i];
                    return;
                }
            }
        }
    } else if (gameState === 'TUTORIAL') {
         if (tutorialSystem) {
             let wasIntro = tutorialSystem.activeTutorial === 'intro';
             tutorialSystem.dismiss();
             if (wasIntro) {
                 tutorialSystem.trigger('controls');
             } else {
                 gameState = 'PLAY';
                 totalPausedTime += millis() - pauseStartTime;
             }
         }
         return;
    } else if (gameState === 'PLAY' || gameState === 'PAUSED') {
        if (dist(mouseX, mouseY, width - 50, statusHeight / 2) < 25) {
            togglePause();
            return;
        }

        if (dist(mouseX, mouseY, width - 110, statusHeight / 2) < 25) {
             if (gameState === 'PLAY') {
                 gameState = 'HELP';
                 pauseStartTime = millis();
             } else {
                 gameState = 'HELP';
             }
             return;
        }

        if (gameState === 'PAUSED') {
            let localX = mouseX - gameViewX;
            let localY = mouseY - (statusHeight + gameViewY);
            let layout = getPausedLayout();
            if (abs(localX - layout.centerX) <= layout.btnW / 2 && abs(localY - layout.restartY) <= layout.btnH / 2) {
                resetGame(true);
                enterGameplayStateAfterReset();
                return;
            }
            if (abs(localX - layout.centerX) <= layout.btnW / 2 && abs(localY - layout.menuY) <= layout.btnH / 2) {
                gameState = 'MENU';
                shopBuilding = null;
                return;
            }
        }

        if (gameState === 'PLAY') {
            if (mouseX >= gameViewX && mouseX <= gameViewX + gameWidth && mouseY >= statusHeight + gameViewY && mouseY <= statusHeight + gameViewY + gameHeight) {
                if (!isPlayerControlLocked()) {
                    let target = getMouseWorldPos();
                    if (WEAPON_CONFIG[player.currentWeapon] && player.ammo >= WEAPON_CONFIG[player.currentWeapon].ammoCost) {
                        player.fire(target.x, target.y);
                    }
                }
            }
        }
    }
}

function mouseDragged() {
    if (gameState === 'SHOP' || gameState === 'MENU_SHOP') {
        if (shopUI.handleMouseDragged()) return false;
    }
}

function mouseReleased() {
    if (gameState === 'SHOP' || gameState === 'MENU_SHOP') {
        shopUI.handleMouseReleased();
    }
}

function mouseWheel(event) {
    if (gameState === 'SHOP' || gameState === 'MENU_SHOP') {
        if (shopUI.handleWheel(event.delta)) return false;
    }
}

function drawImageContain(img, x, y, boxW, boxH) {
    if (!img) return;
    let imgAspect = img.width / img.height;
    let boxAspect = boxW / boxH;
    let drawW, drawH;
    
    if (imgAspect > boxAspect) {
        drawW = boxW;
        drawH = boxW / imgAspect;
    } else {
        drawH = boxH;
        drawW = boxH * imgAspect;
    }
    image(img, x, y, drawW, drawH);
}

function getHelpLayout() {
    let viewX = 0;
    let viewY = 0;
    let viewW = gameWidth;
    let viewH = gameHeight;
    let panelW = min(viewW * 0.94, 1120);
    let panelH = min(viewH * 0.92, 760);
    let panelX = viewW / 2;
    let panelY = viewH / 2;
    let closeSize = 40;
    let closeX = panelX + panelW / 2 - 34;
    let closeY = panelY - panelH / 2 + 34;
    return { viewX, viewY, viewW, viewH, panelX, panelY, panelW, panelH, closeX, closeY, closeSize };
}

function drawHelp() {
    push();
    let layout = getHelpLayout();
    
    rectMode(CORNER); // Reset to corner for background
    fill(0, 175);
    noStroke();
    rect(layout.viewX, layout.viewY, layout.viewW, layout.viewH);

    // Main Panel (Center)
    rectMode(CENTER);
    fill(28, 33, 39);
    stroke(100);
    strokeWeight(2);
    rect(layout.panelX, layout.panelY, layout.panelW, layout.panelH, 15);

    noStroke();
    fill(255);
    textSize(30);
    textAlign(CENTER, TOP);
    text("TACTICAL GUIDE", layout.panelX, layout.panelY - layout.panelH / 2 + 18);

    // Close Button
    rectMode(CENTER);
    fill(200, 60, 60);
    rect(layout.closeX, layout.closeY, layout.closeSize, layout.closeSize, 8);
    fill(255);
    textSize(24);
    textAlign(CENTER, CENTER);
    text("X", layout.closeX, layout.closeY);

    // TABS
    let tabY = layout.panelY - layout.panelH / 2 + 64;
    let tabs = ['BASICS', 'VEHICLES', 'WEAPONS'];
    let tabW = (layout.panelW - 60) / 3;
    let tabH = 40;
    let startX = layout.panelX - layout.panelW / 2 + 30;
    
    textAlign(CENTER, CENTER);
    textSize(16);
    rectMode(CORNER);
    
    for (let i = 0; i < tabs.length; i++) {
        let t = tabs[i];
        let id = i === 0 ? 'BASICS' : (i === 1 ? 'VEHICLES' : 'WEAPONS');
        let tx = startX + i * tabW;
        
        let isActive = helpTab === id;
        
        fill(isActive ? color(255, 200, 0) : color(60, 70, 80));
        rect(tx, tabY, tabW - 10, tabH, 8);
        
        fill(isActive ? 0 : 200);
        text(t, tx + (tabW - 10) / 2, tabY + tabH / 2);
    }

    rectMode(CORNER);
    let contentY = tabY + 45; // Start below tabs
    let bottomY = layout.panelY + layout.panelH / 2 - 24;
    let innerH = bottomY - contentY;
    let leftX = layout.panelX - layout.panelW / 2 + 30;
    let totalW = layout.panelW - 60;

    // Content Area Background
    fill(36, 42, 50);
    stroke(70);
    strokeWeight(1);
    rect(leftX, contentY, totalW, innerH, 10);
    
    let padding = 20;
    let contentStartX = leftX + padding;
    let contentStartY = contentY + padding;
    let contentW = totalW - padding * 2;

    noStroke();
    textAlign(LEFT, TOP);

    if (helpTab === 'BASICS') {
        // --- BASICS TAB ---
        let colGap = 40;
        let colW = (contentW - colGap) / 2;
        
        // Left Column: Controls
        let currY = contentStartY;
        fill(255, 200, 0);
        textSize(22);
        text("CONTROLS", contentStartX, currY);
        
        currY += 40;
        let keySize = 34;
        let keyGap = 10;
        let keyGroupW = keySize * 3 + keyGap * 2;
        let keyCenterX = contentStartX + colW / 2;
        
        imageMode(CENTER);
        if (controlKeyImgs.W) image(controlKeyImgs.W, keyCenterX, currY, keySize, keySize);
        if (controlKeyImgs.A) image(controlKeyImgs.A, keyCenterX - keySize - keyGap, currY + keySize + keyGap, keySize, keySize);
        if (controlKeyImgs.S) image(controlKeyImgs.S, keyCenterX, currY + keySize + keyGap, keySize, keySize);
        if (controlKeyImgs.D) image(controlKeyImgs.D, keyCenterX + keySize + keyGap, currY + keySize + keyGap, keySize, keySize);
        
        currY += 100;
        
        fill(220);
        textSize(15);
        textLeading(26);
        text("Move: WASD / Arrows\nAim & Fire: Mouse Left\nInteract / Shop: F\nPause: ESC\nToggle Help: H", contentStartX, currY, colW, 200);

        // Right Column: Environment & Mission
        let rightX = contentStartX + colW + colGap;
        let rightY = contentStartY;
        
        fill(255, 200, 0);
        textSize(22);
        text("ENVIRONMENT", rightX, rightY);
        
        rightY += 40;
        let obsY = rightY + 20;
        if (images.trees && images.trees.length > 0) drawImageContain(images.trees[0], rightX + colW * 0.2, obsY, 44, 44);
        if (images.rocks && images.rocks.length > 0) drawImageContain(images.rocks[0], rightX + colW * 0.5, obsY, 36, 36);
        if (images.bushes && images.bushes.length > 0) drawImageContain(images.bushes[0], rightX + colW * 0.8, obsY, 34, 34);

        rightY += 60;
        fill(220);
        textSize(15);
        textLeading(22);
        text("Trees & Rocks are solid obstacles.\nBushes are passable cover.", rightX, rightY, colW, 80);

        rightY += 80;
        fill(255, 200, 0);
        textSize(22);
        text("MISSION", rightX, rightY);
        rightY += 35;
        fill(220);
        textSize(15);
        text("Survive until time runs out!\nDefeat enemies to earn coins.\nFind shops to upgrade.", rightX, rightY, colW, 100);

    } else if (helpTab === 'VEHICLES') {
        // --- VEHICLES & UPGRADES TAB ---
        let colGap = 40;
        let colW = (contentW - colGap) / 2;

        // Left: Vehicles
        let currY = contentStartY;
        fill(255, 200, 0);
        textSize(22);
        text("VEHICLES", contentStartX, currY);
        currY += 35;
        
        fill(220);
        textSize(15);
        textLeading(24);
        text(
            "STARTER\nBalanced stats. Good for beginners.\n\n" +
            "SPEEDSTER\nHigh speed, low HP. Hit & run tactics.\n\n" +
            "TANK\nHigh HP, slow speed. Can take a beating.\n\n" +
            "DRIFTER\nHigh handling. Master the drift.", 
            contentStartX, currY, colW, 400
        );

        // Right: Upgrades & Difficulty
        let rightX = contentStartX + colW + colGap;
        let rightY = contentStartY;
        
        fill(255, 200, 0);
        textSize(22);
        text("UPGRADES & DIFFICULTY", rightX, rightY);
        rightY += 35;
        
        fill(220);
        textSize(15);
        textLeading(24);
        text(
            "STATS:\n" +
            "• Max HP: Increases health capacity\n" +
            "• Max Ammo: Increases magazine size\n" +
            "• Top Speed: Increases max velocity\n" +
            "• Acceleration: Increases pick-up speed\n\n" +
            "DIFFICULTY CAPS:\n" +
            "• EASY: Full Power (Max Lv 5)\n" +
            "• NORMAL: Capped at Lv 3 (+30%)\n" +
            "• HARD: Capped at Lv 1 (+10%)",
            rightX, rightY, colW, 400
        );

    } else if (helpTab === 'WEAPONS') {
        // --- WEAPONS TAB ---
        let currY = contentStartY;
        fill(255, 200, 0);
        textSize(22);
        text("WEAPON DATABASE", contentStartX, currY);
        currY += 40;

        let allWeapons = [
            WEAPON_TYPES.PISTOL, WEAPON_TYPES.SHOTGUN, WEAPON_TYPES.RIFLE, WEAPON_TYPES.LASER,
            WEAPON_TYPES.MOLOTOV, WEAPON_TYPES.DONGFENG, WEAPON_TYPES.LOITERING, WEAPON_TYPES.ATOMIC
        ];
        
        let rowH = 60;
        let iconBox = 48;
        let colGap = 20;
        let cellW = (contentW - colGap) / 2; 

        for (let i = 0; i < allWeapons.length; i++) {
            let wType = allWeapons[i];
            let conf = WEAPON_CONFIG[wType];
            if (!conf) continue;

            let col = i % 2;
            let row = floor(i / 2);
            let itemX = contentStartX + col * (cellW + colGap);
            let itemY = currY + row * (rowH + 10);

            if (itemY + rowH > contentStartY + innerH) break;

            // Item Box
            fill(45, 50, 58);
            stroke(76);
            strokeWeight(1);
            rect(itemX, itemY, cellW, rowH, 8);

            // Icon
            fill(58);
            noStroke();
            rect(itemX + 6, itemY + 6, iconBox, iconBox, 6);
            let icon = images.weaponShop ? images.weaponShop[wType] : null;
            if (icon) {
                drawImageContain(icon, itemX + 6 + iconBox/2, itemY + 6 + iconBox/2, 40, 40);
            }

            // Text Info
            noStroke();
            fill(conf.type === 'special' ? color(255, 100, 100) : color(100, 200, 255));
            textSize(15);
            textAlign(LEFT, TOP);
            text(conf.name || wType, itemX + 64, itemY + 7);

            fill(180);
            textSize(11);
            let rateStr = conf.cooldown > 0 ? (1000 / conf.cooldown).toFixed(1) + "/s" : "Manual";
            let stats = `DMG: ${conf.damage}`;
            if (conf.cooldown > 0) stats += ` | Rate: ${rateStr}`;
            if (conf.count && conf.count > 1) stats += ` x${conf.count}`;
            text(stats, itemX + 64, itemY + 26);
            
            fill(220);
            textSize(11);
            textLeading(14);
            text(conf.description || "", itemX + 64, itemY + 41, cellW - 70, 18);
        }
    }

    pop();
}

function drawInteractiveStatusIcon(x, y, size, img, type) {
    let isHover = dist(mouseX, mouseY, x, y) < size / 2;
    let isPressed = isHover && mouseIsPressed;
    
    push();
    translate(x, y);
    rectMode(CENTER);
    imageMode(CENTER);
    
    if (isPressed) scale(0.9);
    else if (isHover) {
        scale(1.15);
        drawingContext.shadowBlur = 15;
        drawingContext.shadowColor = 'rgba(255, 255, 255, 0.6)';
    }
    
    if (img && img.width > 0) {
        image(img, 0, 0, size, size);
    } else {
        if (type === 'HELP') {
             noFill();
             stroke(200);
             strokeWeight(3);
             ellipse(0, 0, 30, 30);
             fill(200);
             noStroke();
             textAlign(CENTER, CENTER);
             textSize(20);
             text('?', 0, 0);
        } else if (type === 'GEAR') {
             noFill();
             stroke(200);
             strokeWeight(3);
             ellipse(0, 0, 30, 30);
             fill(200);
             noStroke();
             for(let i=0; i<8; i++) {
                 push();
                 rotate(TWO_PI * i / 8);
                 rect(0, -18, 6, 8);
                 pop();
             }
             fill(30);
             ellipse(0, 0, 10, 10);
        }
    }
    
    drawingContext.shadowBlur = 0;
    pop();
}
