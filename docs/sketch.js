let player;
let enemies = [];
let powerups = [];
let particles = [];
let buildings = [];
let projectiles = [];
let gameState = 'MENU'; // MENU, MENU_SHOP, PLAY, PAUSED, GAMEOVER, WIN, SHOP, AUTH
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
let bulletIconImg;
let controlKeyImgs = {};
let lastCoverRect = null;
let shopUI;
let authUI;
let startGateMessage = '';
let startGateMessageColor = [255, 80, 80];
let startGateMessageUntil = 0;
let startGatePending = false;

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

function preload() {
  hospitalImg = loadImage('icon/BUILDING/hospital.png');
  armoryImg = loadImage('icon/BUILDING/arms.png');
  
  gameCoverImg = loadImage('icon/game_cover.png');
  startBtnImg = loadImage('icon/start.png');
  exitBtnImg = loadImage('icon/exit.png');
  shopBtnImg = loadImage('icon/basic/store_mainpage.png');
  shopBoardImg = loadImage('icon/shop_board.png');
  victoryImg = null;
  defeatImg = null;
  settingIconImg = loadImage('icon/basic/setting.png');
  bulletIconImg = loadImage('icon/basic/bullet.png');
  controlKeyImgs = {
    W: loadImage('icon/basic/keyboard_W.png'),
    A: loadImage('icon/basic/keyboard_A.png'),
    S: loadImage('icon/basic/keyboard_S.png'),
    D: loadImage('icon/basic/keyboard_D.png'),
    X: loadImage('icon/basic/keyboard_X.png'),
    UP: loadImage('icon/basic/keyboard_up.png'),
    DOWN: loadImage('icon/basic/keyboard_down.png'),
    LEFT: loadImage('icon/basic/keyboard_left.png'),
    RIGHT: loadImage('icon/basic/keyboard_right.png')
  };
  images.weaponShop = {
    [WEAPON_TYPES.PISTOL]: loadImage('icon/WEAPON/pistol.png'),
    [WEAPON_TYPES.SHOTGUN]: loadImage('icon/WEAPON/short_gun.png'),
    [WEAPON_TYPES.RIFLE]: loadImage('icon/WEAPON/assault_rifle.png'),
    [WEAPON_TYPES.LASER]: loadImage('icon/WEAPON/laser_gun.png'),
    [WEAPON_TYPES.MOLOTOV]: loadImage('icon/WEAPON/molotov.png'),
    [WEAPON_TYPES.DONGFENG]: loadImage('icon/WEAPON/DF.png'),
    [WEAPON_TYPES.LOITERING]: loadImage('icon/WEAPON/drone.png'),
    [WEAPON_TYPES.ATOMIC]: loadImage('icon/WEAPON/nuke.png')
  };
  
  // Load terrain and environment assets
  images.grass = loadImage('icon/grass_1.png');
  images.grassAlt1 = loadImage('icon/Grass.png');
  images.asphalt = loadImage('icon/asphalt.png');
  images.pavement = loadImage('icon/pavement_tile_1.png');
  images.pavementAlt = loadImage('icon/pavement.png');
  
  images.sand = loadImage('icon/sand.png'); 
  
  // Road Tiles (Autotiling)
  images.roadV = loadImage('icon/road_1.png'); 
  images.roadH = loadImage('icon/road_2.png');
  images.roadVAlt = loadImage('icon/road_crosswalk_1.png');
  images.roadHAlt = loadImage('icon/road_crosswalk_2.png');
  images.cross = loadImage('icon/road_cross.png');
  
  // Turns
  images.turnD = loadImage('icon/road_turn_d.png');
  images.turnL = loadImage('icon/road_turn_l.png');
  images.turnR = loadImage('icon/road_turn_r.png');
  images.turnU = loadImage('icon/road_turn_up.png');
  
  // T-Junctions
  images.tCross1 = loadImage('icon/road_t_cross_1.png');
  images.tCross2 = loadImage('icon/road_t_cross_2.png');
  images.tCross3 = loadImage('icon/road_t_cross_3.png');
  images.tCross4 = loadImage('icon/road_t_cross_4.png');
  
  // Obstacles
  images.tree1 = loadImage('icon/tree_1.png');
  images.tree2 = loadImage('icon/tree 2.png');
  images.tree3 = loadImage('icon/tree 3.png');
  images.tree4 = loadImage('icon/tree_4.png');
  images.tree5 = loadImage('icon/tree_5.png');
  images.pine1 = loadImage('icon/Pine.png');
  images.pine2 = loadImage('icon/Pine_2.png');
  images.rock1 = loadImage('icon/stone_1.png');
  images.rock2 = loadImage('icon/stone_2.png');
  images.rock3 = loadImage('icon/stone_3.png');
  images.rock4 = loadImage('icon/stone_4.png');
  images.rock5 = loadImage('icon/stone_5.png');
  images.rock6 = loadImage('icon/stone_6.png');
  images.bush1 = loadImage('icon/bush_1.png');
  images.bush2 = loadImage('icon/bush_2.png');
  images.bush3 = loadImage('icon/bush_3.png');
  images.bush4 = loadImage('icon/bush_4.png');
  images.bush5 = loadImage('icon/bush_5.png');
  images.bush6 = loadImage('icon/bush_6.png');
  images.bush7 = loadImage('icon/bush_7.png');
  images.bush8 = loadImage('icon/bush_8.png');

  images.police = loadImage('icon/BUILDING/police_dept.png');
  images.police = loadImage('icon/BUILDING/police_dept.png');
  images.cityBuildings = [];
  let buildingFiles = [
    { file: 'Anna_house.png', label: 'Residence' },
    { file: 'Ben_house.png', label: 'Residence' },
    { file: 'David_house.png', label: 'Residence' },
    { file: 'Emma_house.png', label: 'Residence' },
    { file: 'Grace_house.png', label: 'Residence' },
    { file: 'Jack_house.png', label: 'Residence' },
    { file: 'Leo_house.png', label: 'Residence' },
    { file: 'Lily_house.png', label: 'Residence' },
    { file: 'Lucy_house.png', label: 'Residence' },
    { file: 'Mike_house.png', label: 'Residence' },
    { file: 'Sarah_house.png', label: 'Residence' },
    { file: 'Tom_house.png', label: 'Residence' },
    { file: 'cafe.png', label: 'Cafe' },
    { file: 'garden.png', label: 'Garden' },
    { file: 'school.png', label: 'School' },
    { file: 'supermarket.png', label: 'Supermarket' }
  ];
  for (let f of buildingFiles) {
      images.cityBuildings.push({ img: loadImage('icon/BUILDING/' + f.file), label: f.label });
  }

  images.grassVariants = [images.grass, images.grassAlt1];
  images.pavementVariants = [images.pavement, images.pavementAlt, images.asphalt];
  images.roadVVariants = [images.roadV, images.roadV, images.roadVAlt];
  images.roadHVariants = [images.roadH, images.roadH, images.roadHAlt];
  images.trees = [images.tree1, images.tree2, images.tree3, images.tree4, images.tree5, images.pine1, images.pine2];
  images.rocks = [images.rock1, images.rock2, images.rock3, images.rock4, images.rock5, images.rock6];
  images.bushes = [images.bush1, images.bush2, images.bush3, images.bush4, images.bush5, images.bush6, images.bush7, images.bush8];
}

// Global Offset for Iso Map centering
let mapOffsetX, mapOffsetY;

function setup() {
  gameWidth = windowWidth;
  gameHeight = windowHeight - statusHeight;
  
  createCanvas(gameWidth, gameHeight + statusHeight);
  textAlign(CENTER, CENTER);
  rectMode(CENTER);
  imageMode(CENTER);
  
  // Calculate Map Grid Dimensions
  mapCols = floor(mapWidth / tileSize);
  mapRows = floor(mapHeight / tileSize);
  
  // Center the map in the render area
  mapOffsetX = mapWidth / 2;
  mapOffsetY = mapHeight / 4; // Start drawing from upper part
  
  // Generate the map
  generateTileMap();
  
  // Create Visuals from TileMap
  createMapGraphics();

  shopUI = new ShopUI();
  authUI = new AuthUI();
  ensurePlayerProfile();
  if (authUI.isLoggedIn()) {
      refreshUserProgress();
  }

  gameCoverVideo = createVideo('icon/game_cover_video.mp4');
  gameCoverVideo.volume(0);
  gameCoverVideo.elt.muted = true;
  gameCoverVideo.elt.playsInline = true;
  gameCoverVideo.loop();
  gameCoverVideo.hide();
  defeatVideo = createVideo('icon/basic/defeat.mp4');
  defeatVideo.volume(0);
  defeatVideo.elt.muted = true;
  defeatVideo.elt.playsInline = true;
  defeatVideo.elt.preload = 'auto';
  defeatVideo.elt.load();
  defeatVideo.hide();
  victoryVideo = createVideo('icon/basic/victory.mp4');
  victoryVideo.volume(0);
  victoryVideo.elt.muted = true;
  victoryVideo.elt.playsInline = true;
  victoryVideo.elt.preload = 'auto';
  victoryVideo.elt.load();
  victoryVideo.hide();
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
  
  player = new Player(mapWidth / 2, mapHeight / 2); // Start in middle of large map
  
  if (keepProgress && oldPlayer) {
      player.coins = oldPlayer.coins;
      player.bonusMaxHp = oldPlayer.bonusMaxHp;
      player.bonusMaxAmmo = oldPlayer.bonusMaxAmmo;
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
  } else if (difficulty === 'NORMAL') {
      survivalTime = 90;
  } else if (difficulty === 'HARD') {
      survivalTime = 120;
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
          
          if (tile.img) {
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
      playGame();
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
  } else if (gameState === 'PAUSED' || gameState === 'SHOP' || gameState === 'GAMEOVER' || gameState === 'WIN') {
      drawGameObjects();
  }
  ctx.restore();
  pop();

  push();
  translate(gameViewX, statusHeight + gameViewY);
  
  if (gameState === 'PAUSED') {
      if (boundaryWarningAlpha > 0) drawBoundaryWarning();
      drawPaused();
  } else if (gameState === 'SHOP') {
      drawShop();
  } else if (gameState === 'GAMEOVER') {
      drawGameOver();
  } else if (gameState === 'WIN') {
      drawWin();
  } else if (gameState === 'PLAY' || gameState === 'MAP_SELECT') {
      if (boundaryWarningAlpha > 0) drawBoundaryWarning();
  }
  
  pop();

  drawStatusBar();
  
  if (gameState === 'PLAY' || gameState === 'PAUSED' || gameState === 'SHOP' || gameState === 'MAP_SELECT') {
      drawMiniMap();
  }
  if (gameState === 'PLAY' || gameState === 'PAUSED' || gameState === 'SHOP' || gameState === 'MAP_SELECT' || gameState === 'MISSILE_CONTROL') {
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
        gameState = 'PLAY';
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

    if (strikeFn) {
        strikeFn(targetX, targetY);
    } else {
        gameState = 'PLAY';
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
        let radarScale = mapR / 420;
        noStroke();
        fill(60, 140, 220, 95);
        for (let b of buildings) {
            let dx = (b.pos.x - player.pos.x) * radarScale;
            let dy = (b.pos.y - player.pos.y) * radarScale;
            if (dx * dx + dy * dy > mapR * mapR) continue;
            ellipse(dx, dy, 3, 3);
        }
        for (let e of enemies) {
            let dx = (e.pos.x - player.pos.x) * radarScale;
            let dy = (e.pos.y - player.pos.y) * radarScale;
            if (dx * dx + dy * dy > mapR * mapR) continue;
            let pulse = (frameCount % 60) / 60;
            fill(255, 50, 50, 220 - pulse * 180);
            ellipse(dx, dy, 5 + 4 * pulse, 5 + 4 * pulse);
        }
        fill(0, 255, 255);
        ellipse(0, 0, 7, 7);
        stroke(0, 255, 255, 200);
        strokeWeight(2);
        line(0, 0, cos(player.heading) * 14, sin(player.heading) * 14);
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
  } else if (gameCoverImg) {
      source = gameCoverImg;
      sourceW = gameCoverImg.width;
      sourceH = gameCoverImg.height;
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
  } else {
      fill(0, 255, 0); rect(startX, startY, 150, 60, 10);
      fill(0); textAlign(CENTER, CENTER); text("START", startX, startY);
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
  } else {
      fill(255, 0, 0); rect(exitX, exitY, 150, 60, 10);
      fill(255); text("EXIT", exitX, exitY);
  }

  if (startGatePending || millis() < startGateMessageUntil) {
      fill(startGateMessageColor[0], startGateMessageColor[1], startGateMessageColor[2]);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(20);
      let msg = startGatePending ? 'Checking backend service...' : startGateMessage;
      text(msg, width / 2, height - 50);
  }
}

function drawDifficultySelect() {
  drawCoverBackground(100);
  
  // 2. Panel
  rectMode(CENTER);
  fill(30, 30, 30, 220);
  stroke(255);
  strokeWeight(2);
  rect(width/2, height/2, 400, 400, 15);
  
  // 3. Header
  fill(255);
  noStroke();
  textSize(32);
  textAlign(CENTER, TOP);
  text("SELECT DIFFICULTY", width/2, height/2 - 150);
  
  // 4. Options
  let diffs = ['EASY', 'NORMAL', 'HARD'];
  let startY = height/2 - 50;
  let gap = 80;
  
  for (let i = 0; i < diffs.length; i++) {
      let d = diffs[i];
      let btnY = startY + i * gap;
      
      // Hover check
      let isHover = abs(mouseX - width/2) < 120 && abs(mouseY - btnY) < 30;
      
      if (isHover) {
          fill(255, 215, 0); // Gold hover
          stroke(255);
          strokeWeight(3);
          rect(width/2, btnY, 240, 60, 10);
          
          fill(0);
          noStroke();
          textSize(28);
          textStyle(BOLD);
          text(d, width/2, btnY);
          textStyle(NORMAL);
      } else {
          fill(50);
          stroke(150);
          strokeWeight(1);
          rect(width/2, btnY, 240, 60, 10);
          
          fill(200);
          noStroke();
          textSize(24);
          text(d, width/2, btnY);
      }
  }
  
  // Back instruction
  fill(150);
  textSize(16);
  text("Press ESC to Back", width/2, height/2 + 160);

  if (startGatePending || millis() < startGateMessageUntil) {
      fill(startGateMessageColor[0], startGateMessageColor[1], startGateMessageColor[2]);
      noStroke();
      textSize(18);
      textAlign(CENTER, CENTER);
      let msg = startGatePending ? 'Checking backend service...' : startGateMessage;
      text(msg, width / 2, height / 2 + 200);
  }
}

function drawPaused() {
    fill(0, 0, 0, 150);
    rectMode(CENTER);
    rect(gameWidth/2, gameHeight/2, gameWidth, gameHeight);
    
    fill(255);
    textSize(50);
    text("SETTINGS", gameWidth/2, gameHeight/3);
    
    textSize(20);
    text("Press ESC to Resume", gameWidth/2, gameHeight/2);
    
    // Restart Button
    fill(255, 50, 50);
    rect(gameWidth/2, gameHeight * 0.7, 200, 50, 10);
    fill(255);
    textSize(24);
    text("RESTART", gameWidth/2, gameHeight * 0.7);
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
  if (gameState === 'SHOP' || gameState === 'PAUSED') {
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
    gameState = 'WIN';
  }

    if (frameCount % 3600 === 0) { // Every 60 seconds (60fps * 60s)
        if (authUI && authUI.isLoggedIn()) {
            let data = {
                coins: player.coins,
                unlockedWeapons: player.unlockedSpecialWeapons,
                upgradeState: {
                    maxHp: player.bonusMaxHp,
                    maxAmmo: player.bonusMaxAmmo,
                    shieldDuration: player.shieldDurationLevel
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
        enemies.push(new Enemy(spawn.x, spawn.y));
    }
    lastEnemySpawnTime = millis();
  }

  // Spawning PowerUps
  if (millis() - lastPowerUpSpawnTime > 2500) {
    let types = ['speed', 'shield', 'health', 'coin', 'coin'];
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

  drawGameObjects();
  
  // Interactions check for 'F' key
  if (!isPlayerControlLocked() && keyIsDown(70)) { // F key
      for (let b of buildings) {
          if (b.isInteractable() && p5.Vector.dist(player.pos, b.pos) < b.w) {
              gameState = 'SHOP';
              shopBuilding = b;
              break;
          }
      }
  }
}

function drawGameObjects() {
  let shouldUpdate = gameState === 'PLAY' || gameState === 'MISSILE_CONTROL';
  let playerLocked = shouldUpdate && isPlayerControlLocked();
  // Draw Buildings
  for (let b of buildings) {
    b.display();
    b.showTooltip(player); // Show tooltip if close
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
                let dmg = config ? config.damage : 1;
                
                e.hp -= dmg;
                createExplosion(e.pos.x, e.pos.y, color(255, 0, 0), 5);
                
                if (e.hp <= 0) {
                    createExplosion(e.pos.x, e.pos.y, color(255, 50, 0), 15);
                    enemies.splice(i, 1);
                    player.coins += 5; 
                    shakeAmount = 5;
                } else {
                    // Knockback?
                    let push = p5.Vector.sub(e.pos, p.pos).normalize().mult(2);
                    e.pos.add(push);
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
    player.bonusMaxHp = upgradeState.maxHp || 0;
    player.bonusMaxAmmo = upgradeState.maxAmmo || 0;
    player.shieldDurationLevel = upgradeState.shieldDuration || 0;
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
    gameState = 'DIFFICULTY_SELECT';
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
        gameState = 'DIFFICULTY_SELECT';
        startGatePending = false;
        return;
    }

    gameState = 'AUTH';
    authUI.show();
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
    shopUI.draw(gameWidth, gameHeight, 0, 0, gameViewX, statusHeight + gameViewY);
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
  if (gameState === 'MENU' || gameState === 'DIFFICULTY_SELECT' || gameState === 'MENU_SHOP') return;

  // Background
  fill(30);
  noStroke();
  rect(width/2, statusHeight/2, width, statusHeight);
  
  // Border line
  stroke(100);
  strokeWeight(4);
  line(0, statusHeight, width, statusHeight);

  if (gameState !== 'PLAY' && gameState !== 'PAUSED' && gameState !== 'SHOP') return; 

  let currentMillis = millis();
  if (gameState === 'PAUSED') {
      currentMillis = pauseStartTime;
  }
  let elapsed = (currentMillis - startTime - totalPausedTime) / 1000;
  let remaining = max(0, survivalTime - elapsed);

  // --- Gear Icon (Settings/Pause) ---
  push();
  translate(width - 50, statusHeight / 2);
  if (settingIconImg && settingIconImg.width > 0 && settingIconImg.height > 0) {
      imageMode(CENTER);
      image(settingIconImg, 0, 0, 50, 50);
  } else {
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
  pop();

  // --- Left Section: HP ---
  textAlign(LEFT, CENTER);
  fill(200);
  textSize(16);
  noStroke();
  text("HEALTH", 30, 25);
  
  // Heart Icons
  for (let i = 0; i < player.hp; i++) {
      push();
      translate(40 + i * 30, 55);
      scale(1.5); 
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

  // --- Middle Left: Ammo ---
  fill(200);
  noStroke();
  text("AMMO", 250, 25);
  
  // Bullet Icons
  let maxCols = 10;
  for (let i = 0; i < player.ammo; i++) {
      let col = i % maxCols;
      let row = floor(i / maxCols);
      
      push();
      translate(260 + col * 15, 55 + row * 25);
      fill(255, 215, 0); // Gold
      stroke(200, 150, 0);
      strokeWeight(1);
      rect(0, 0, 8, 20, 2);
      pop();
  }
  
  // --- Middle Right: COINS ---
  fill(200);
  noStroke();
  text("COINS", 500, 25);
  
  fill(255, 215, 0);
  textSize(32);
  text(player.coins, 500, 55);

  // --- Right Section: Time ---
  fill(200);
  textSize(16);
  text("TIME", 700, 25);
  
  fill(255);
  textSize(32);
  text(nf(remaining, 0, 1), 700, 55);
  
  // Level Indicator
  fill(255, 255, 0);
  textSize(14);
  textAlign(RIGHT, TOP);
  text("LEVEL " + currentLevel, gameWidth - 10, 10);
  
  // Shield Status
  if (player.hasShield) {
      fill(0, 255, 255);
      textSize(14);
      textAlign(CENTER, CENTER);
      text("SHIELD", 820, 25);
      
      noFill();
      stroke(0, 255, 255);
      strokeWeight(2);
      ellipse(820, 55, 40, 40);
      fill(0, 255, 255, 100);
      noStroke();
      ellipse(820, 55, 30, 30);
  }
  
  // Special Weapon Status
  if (player.currentSpecialWeapon) {
      let label = "SPECIAL";
      if (player.currentSpecialWeapon === WEAPON_TYPES.DONGFENG) label = "MISSILE";
      else if (player.currentSpecialWeapon === WEAPON_TYPES.LOITERING) label = "DRONE";
      else if (player.currentSpecialWeapon === WEAPON_TYPES.ATOMIC) label = "NUKE";
      
      fill(255, 100, 0);
      textSize(14);
      textAlign(CENTER, CENTER);
      text(label, 900, 25);
      
      noFill();
      stroke(255, 100, 0);
      strokeWeight(2);
      rect(900, 55, 50, 50, 5);
      
      fill(255, 100, 0);
      textSize(20);
      textStyle(BOLD);
      noStroke();
      text("X", 900, 55);
      textStyle(NORMAL);
      fill(255, 180, 80);
      textSize(14);
      text("x" + (player.specialWeaponCount || 0), 900, 90);
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
  push();
  let videoReady = ensureVideoPlayable(defeatVideo);
  let source = videoReady ? defeatVideo : (defeatImg ? defeatImg : gameCoverImg);
  let coverRect = getCoverRect(gameWidth, gameHeight, source, true);
  if (videoReady) {
      imageMode(CORNER);
      image(defeatVideo, coverRect.x, coverRect.y, coverRect.w, coverRect.h);
  } else if (defeatImg) {
      imageMode(CORNER);
      image(defeatImg, coverRect.x, coverRect.y, coverRect.w, coverRect.h);
  } else {
      fill(0, 0, 0, 150);
      rect(gameWidth/2, gameHeight/2, gameWidth, gameHeight);
      fill(255, 0, 0);
      textSize(48);
      textAlign(CENTER, CENTER);
      text("GAME OVER", gameWidth / 2, gameHeight / 3);
  }

  fill(0, 0, 0, 120);
  noStroke();
  rectMode(CORNER);
  rect(gameWidth * 0.2, gameHeight * 0.68, gameWidth * 0.6, 56, 12);
  fill(255);
  textSize(24);
  text("Press ENTER to Try Again", gameWidth / 2, gameHeight * 0.75);
  pop();
}

function drawWin() {
  push();
  let videoReady = ensureVideoPlayable(victoryVideo);
  let source = videoReady ? victoryVideo : (victoryImg ? victoryImg : gameCoverImg);
  let coverRect = getCoverRect(gameWidth, gameHeight, source, true);
  if (videoReady) {
      imageMode(CORNER);
      image(victoryVideo, coverRect.x, coverRect.y, coverRect.w, coverRect.h);
  } else if (victoryImg) {
      imageMode(CORNER);
      image(victoryImg, coverRect.x, coverRect.y, coverRect.w, coverRect.h);
  } else {
      fill(0, 0, 0, 150);
      rect(gameWidth/2, gameHeight/2, gameWidth, gameHeight);
      fill(0, 255, 0);
      textSize(48);
      textAlign(CENTER, CENTER);
      text("MISSION ACCOMPLISHED", gameWidth / 2, gameHeight / 3);
  }

  fill(0, 0, 0, 120);
  noStroke();
  rectMode(CORNER);
  rect(gameWidth * 0.2, gameHeight * 0.53, gameWidth * 0.6, 96, 12);
  fill(255);
  textSize(24);
  text("Press SPACE for Next Level", gameWidth / 2, gameHeight * 0.6);
  text("Press ENTER for Main Menu", gameWidth / 2, gameHeight * 0.75);
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

function keyPressed() {
  if (keyCode === ENTER) {
    if (gameState === 'GAMEOVER') {
      resetGame(true);
      gameState = 'PLAY';
    } else if (gameState === 'WIN') {
      gameState = 'MENU'; // Go back to menu from Win
    }
  } else if (key === ' ' && gameState === 'WIN') {
      // Next Level
      resetGame(true); // Keep progress
      gameState = 'PLAY';
  } else if (keyCode === ESCAPE) {
      if (gameState === 'PLAY' || gameState === 'PAUSED') {
          togglePause();
      } else if (gameState === 'DIFFICULTY_SELECT') {
          gameState = 'MENU';
      } else if (gameState === 'SHOP' || gameState === 'MENU_SHOP') {
          gameState = gameState === 'SHOP' ? 'PLAY' : 'MENU';
          shopBuilding = null;
      }
  } else if (key === 'x' || key === 'X') {
      if (gameState === 'PLAY') {
          if (player.currentSpecialWeapon === WEAPON_TYPES.DONGFENG) {
               gameState = 'MAP_SELECT';
               mapSelectStart = 0;
               dongfengTargetLocked = false;
               mapSelectCharged = false;
          } else if (player.currentSpecialWeapon === WEAPON_TYPES.LOITERING) {
               launchLoiteringMunition();
          } else if (player.currentSpecialWeapon === WEAPON_TYPES.ATOMIC) {
               triggerAtomicBomb();
               consumeCurrentSpecialWeapon();
          }
      } else if (gameState === 'MAP_SELECT') {
          gameState = 'PLAY';
          mapSelectStart = 0;
          dongfengTargetLocked = false;
          mapSelectCharged = false;
      }
  } else if (key === 'r' || key === 'R') {
      if (gameState === 'PAUSED') {
          resetGame(true);
          gameState = 'PLAY';
      }
  }

  if (gameState === 'SHOP' || gameState === 'MENU_SHOP' || gameState === 'AUTH') {
      if (gameState === 'SHOP' && keyCode === 70) {
          gameState = 'PLAY';
          shopBuilding = null;
      }
      if (gameState === 'AUTH' && keyCode === ESCAPE) {
          gameState = 'MENU';
          authUI.hide();
      }
  }
}

async function mousePressed() {
    if (gameState === 'SHOP' || gameState === 'MENU_SHOP') {
        shopUI.handleClick();
        return;
    }
    
    if (gameState === 'AUTH') {
        // Clicks handled by DOM elements
        return;
    }
    
    if (gameState === 'MENU') {
        let layout = getMenuButtonLayout();
        let shopX = layout.shopX;
        let shopY = layout.shopY;
        let startX = layout.startX;
        let startY = layout.startY;
        let exitX = layout.exitX;
        let exitY = layout.exitY;
        let hoverRadius = layout.hoverRadius;
        
        if (dist(mouseX, mouseY, shopX, shopY) < hoverRadius) {
             ensurePlayerProfile();
             if (authUI.isLoggedIn()) {
                 refreshUserProgress().finally(() => {
                     gameState = 'MENU_SHOP';
                 });
             } else {
                 gameState = 'MENU_SHOP';
             }
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
        let startY = height/2 - 50;
        let gap = 80;
        
        for (let i = 0; i < diffs.length; i++) {
            let d = diffs[i];
            let btnY = startY + i * gap;
            
            // Check click on difficulty button
            if (abs(mouseX - width/2) < 120 && abs(mouseY - btnY) < 30) {
                let backendOk = await isBackendAvailable();
                if (!backendOk) {
                    setStartGateMessage('Backend unavailable. Cannot start game now.');
                    return;
                }
                if (authUI && authUI.isLoggedIn()) {
                    let loaded = await refreshUserProgress();
                    if (!loaded) {
                        setStartGateMessage('Unable to load profile data. Please login again.');
                        return;
                    }
                }
                difficulty = d;
                resetGame(true);
                gameState = 'PLAY';
            }
        }
    } else if (gameState === 'PLAY' || gameState === 'PAUSED') {
        // Check Gear Icon Click (Top Right)
        if (dist(mouseX, mouseY, width - 50, statusHeight / 2) < 25) {
            togglePause();
            return;
        }

        if (gameState === 'PLAY') {
            if (mouseX >= gameViewX && mouseX <= gameViewX + gameWidth && mouseY >= statusHeight + gameViewY && mouseY <= statusHeight + gameViewY + gameHeight) {
                if (!isPlayerControlLocked() && player.canFire()) {
                    let target = getMouseWorldPos();
                    player.fire(target.x, target.y);
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
