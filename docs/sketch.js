let player;
let enemies = [];
let powerups = [];
let particles = [];
let buildings = [];
let projectiles = [];
let gameState = 'MENU'; // MENU, PLAY, PAUSED, GAMEOVER, WIN, SHOP
let shopBuilding = null; // Store which building opened the shop
let lastShotTime = 0; // For weapon cooldown
let startTime;
let survivalTime = 60; // 60 seconds to win
let lastEnemySpawnTime = 0;
let lastPowerUpSpawnTime = 0;
let shakeAmount = 0;
let hospitalImg;
let armoryImg;

// Game Settings
let difficulty = 'NORMAL'; // EASY, NORMAL, HARD
let currentLevel = 1;
let isPaused = false;
let boundaryWarningAlpha = 0;

// Layout Constants
let gameWidth;
let gameHeight;
let statusHeight = 130;

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
  
  // Load terrain and environment assets
  images.grass = loadImage('icon/grass_1.png');
  images.grassAlt1 = loadImage('icon/Grass.png');
  images.grassAlt2 = loadImage('icon/grass_piece.png');
  images.grassAlt3 = loadImage('icon/grass_hole.png');
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

  images.grassVariants = [images.grass, images.grassAlt1, images.grassAlt2, images.grassAlt3];
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
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  gameWidth = windowWidth;
  gameHeight = windowHeight - statusHeight;
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
      player.xp = oldPlayer.xp;
      player.hp = oldPlayer.hp;
      player.maxAmmo = oldPlayer.maxAmmo;
      player.ammo = oldPlayer.ammo;
      player.currentWeapon = oldPlayer.currentWeapon;
      player.hasShield = oldPlayer.hasShield;
      player.maxSpeed = oldPlayer.maxSpeed;
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
  boundaryWarningAlpha = 0;
  
  // Difficulty Adjustments
  if (difficulty === 'EASY') {
      survivalTime = 60;
  } else if (difficulty === 'NORMAL') {
      survivalTime = 90;
  } else if (difficulty === 'HARD') {
      survivalTime = 120;
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
          let bSize = max(b.w, b.h);
          // Ensure enough clearance around buildings
          if (dist(spot.px, spot.py, b.pos.x, b.pos.y) < (obstacleSize/2 + bSize/2 + 30)) {
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
  // 1. Background
  background(34, 139, 34); // Forest Green

  // 2. Camera Update
  if (player) {
    // Center camera on player in Isometric Space
    let pIso = projectIso(player.pos.x, player.pos.y);
    camX = pIso.x - gameWidth / 2;
    camY = pIso.y - gameHeight / 2;
    
    // Clamp to map boundaries
    camX = constrain(camX, 0, mapWidth - gameWidth);
    camY = constrain(camY, 0, mapHeight - gameHeight);
  }

  // 3. Draw World (Inside Camera Transform)
  push();
  translate(0, statusHeight); 
  translate(-camX, -camY);
  
  if (shakeAmount > 0) {
    translate(random(-shakeAmount, shakeAmount), random(-shakeAmount, shakeAmount));
    shakeAmount *= 0.9; 
    if (shakeAmount < 0.5) shakeAmount = 0;
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
      playGame(); // Logic + Draw
  } else if (gameState === 'PAUSED' || gameState === 'SHOP' || gameState === 'GAMEOVER' || gameState === 'WIN') {
      drawGameObjects(); // Just Draw
  }
  
  pop(); // End Camera Transform

  // 4. Draw UI (Screen Space)
  push();
  translate(0, statusHeight);
  
  if (gameState === 'MENU') {
      drawMenu();
  } else if (gameState === 'PAUSED') {
      if (boundaryWarningAlpha > 0) drawBoundaryWarning();
      drawPaused();
  } else if (gameState === 'SHOP') {
      drawShop();
  } else if (gameState === 'GAMEOVER') {
      drawGameOver();
  } else if (gameState === 'WIN') {
      drawWin();
  } else if (gameState === 'PLAY') {
      if (boundaryWarningAlpha > 0) drawBoundaryWarning();
  }
  
  pop();

  // 5. Always on top UI
  drawStatusBar();
  
  if (gameState === 'PLAY' || gameState === 'PAUSED' || gameState === 'SHOP') {
      drawMiniMap();
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

function drawMiniMap() {
    let mapSize = 150; // Size of minimap on screen
    let scaleFactor = mapSize / mapWidth; // Scale world to minimap
    let mapH = mapHeight * scaleFactor;
    
    let margin = 20;
    let mmX = margin;
    let mmY = statusHeight + margin;
    
    push();
    translate(mmX, mmY);
    
    // Minimap Background
    fill(0, 0, 0, 150);
    stroke(200);
    strokeWeight(2);
    rectMode(CORNER);
    rect(0, 0, mapSize, mapH);
    
    // Buildings
    noStroke();
    fill(100);
    for(let b of buildings) {
        let bx = b.pos.x * scaleFactor;
        let by = b.pos.y * scaleFactor;
        let bw = b.w * scaleFactor;
        let bh = b.h * scaleFactor;
        rect(bx - bw/2, by - bh/2, bw, bh); // b.pos is center
    }
    
    // Enemies
    fill(255, 0, 0);
    for(let e of enemies) {
        ellipse(e.pos.x * scaleFactor, e.pos.y * scaleFactor, 4, 4);
    }
    
    // Player
    if (player) {
        fill(0, 255, 0);
        ellipse(player.pos.x * scaleFactor, player.pos.y * scaleFactor, 5, 5);
    }
    
    pop();
}

function drawMenu() {
  fill(0, 0, 0, 150);
  rectMode(CENTER);
  rect(gameWidth/2, gameHeight/2, gameWidth, gameHeight);
  
  fill(255);
  textSize(60);
  textStyle(BOLD);
  text("HOTLINE ESCAPE", gameWidth / 2, gameHeight / 4);
  textStyle(NORMAL);
  
  textSize(20);
  text("Objective: Survive and Escape the City", gameWidth / 2, gameHeight / 3);
  
  // Difficulty Selection
  textSize(24);
  text("Select Difficulty:", gameWidth / 2, gameHeight / 2 - 40);
  
  let diffs = ['EASY', 'NORMAL', 'HARD'];
  let startY = gameHeight / 2;
  
  for (let i = 0; i < diffs.length; i++) {
      let d = diffs[i];
      if (difficulty === d) {
          fill(0, 255, 0);
          textSize(32);
          text("> " + d + " <", gameWidth / 2, startY + i * 50);
      } else {
          fill(150);
          textSize(24);
          text(d, gameWidth / 2, startY + i * 50);
      }
  }
  
  fill(255);
  textSize(16);
  text("Click or use UP/DOWN to select difficulty", gameWidth / 2, gameHeight * 0.7);
  
  // Start Button
  fill(0, 200, 255);
  rect(gameWidth/2, gameHeight * 0.8, 200, 60, 10);
  fill(255);
  textSize(30);
  text("START GAME", gameWidth/2, gameHeight * 0.8);
}

function drawPaused() {
    fill(0, 0, 0, 150);
    rectMode(CENTER);
    rect(gameWidth/2, gameHeight/2, gameWidth, gameHeight);
    
    fill(255);
    textSize(50);
    text("PAUSED", gameWidth/2, gameHeight/3);
    
    textSize(20);
    text("Press P to Resume", gameWidth/2, gameHeight/2);
    
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
  let elapsed = (millis() - startTime) / 1000;
  let remaining = survivalTime - elapsed;
  
  if (remaining <= 0) {
    gameState = 'WIN';
  }

  // Passive XP gain (survival) - Scale with difficulty?
  if (frameCount % 60 === 0) { // Every second
      player.xp += (difficulty === 'EASY' ? 2 : 1);
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
  if (millis() - lastPowerUpSpawnTime > 3000) { // Increased spawn rate: Every 3 seconds
    let types = ['speed', 'shield', 'health'];
    let type = random(types);
    
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
    }
  }

  drawGameObjects();
  
  // Interactions check for 'F' key
  if (keyIsDown(70)) { // F key
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
  // Draw Buildings
  for (let b of buildings) {
    b.display();
    b.showTooltip(player); // Show tooltip if close
  }

  // Update & Display Particles
  for (let i = particles.length - 1; i >= 0; i--) {
    if (gameState !== 'SHOP' && gameState !== 'PAUSED' && gameState !== 'GAMEOVER' && gameState !== 'WIN') particles[i].update();
    particles[i].display();
    if (gameState !== 'SHOP' && gameState !== 'PAUSED' && gameState !== 'GAMEOVER' && gameState !== 'WIN' && particles[i].isDead()) {
      particles.splice(i, 1);
    }
  }
  
  // Display Obstacles
  for (let o of obstacles) {
      o.display();
      if (gameState !== 'SHOP' && gameState !== 'PAUSED' && gameState !== 'GAMEOVER' && gameState !== 'WIN') {
          o.checkCollision(player);
          for(let e of enemies) o.checkCollision(e);
      }
  }

  // Update & Display Projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
      let p = projectiles[i];
      if (gameState !== 'SHOP' && gameState !== 'PAUSED' && gameState !== 'GAMEOVER' && gameState !== 'WIN') p.update();
      p.display();
      
      if (gameState === 'SHOP' || gameState === 'PAUSED' || gameState === 'GAMEOVER' || gameState === 'WIN') continue; 

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
    if (gameState !== 'SHOP' && gameState !== 'PAUSED' && gameState !== 'GAMEOVER' && gameState !== 'WIN' && p.checkCollision(player)) {
      applyPowerUp(p);
      createExplosion(p.pos.x, p.pos.y, color(255, 255, 255), 10);
      powerups.splice(i, 1);
    }
  }

  // Update & Display Player
  if (gameState !== 'SHOP' && gameState !== 'PAUSED' && gameState !== 'GAMEOVER' && gameState !== 'WIN') {
      player.edges();
      player.update();
  }
  
  if (gameState !== 'SHOP' && gameState !== 'PAUSED' && gameState !== 'GAMEOVER' && gameState !== 'WIN') {
      for (let b of buildings) {
        b.checkCollision(player);
      }
  }
  player.display();

  // Update & Display Enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    let e = enemies[i];
    if (gameState !== 'SHOP' && gameState !== 'PAUSED' && gameState !== 'GAMEOVER' && gameState !== 'WIN') e.update(player);
    
    if (gameState !== 'SHOP' && gameState !== 'PAUSED' && gameState !== 'GAMEOVER' && gameState !== 'WIN') {
        for (let b of buildings) {
            b.checkCollision(e);
        }
        
        for (let j = projectiles.length - 1; j >= 0; j--) {
            let p = projectiles[j];
            if (p.checkCollision(e)) {
                let dmg = 1;
                if (p.type !== 'laser' && p.type !== 'ricochet') { 
                    projectiles.splice(j, 1);
                }
                
                createExplosion(e.pos.x, e.pos.y, color(255, 0, 0), 15);
                enemies.splice(i, 1);
                player.xp += 5; 
                shakeAmount = 5;
                break; 
            }
        }
    }
    
    if (i < enemies.length) {
        e.display();
        
        if (gameState !== 'SHOP' && gameState !== 'PAUSED' && gameState !== 'GAMEOVER' && gameState !== 'WIN') {
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

function drawShop() {
    // Darken background
    fill(0, 0, 0, 200);
    rectMode(CORNER);
    rect(0, 0, gameWidth, gameHeight);
    
    // Shop Panel
    rectMode(CENTER);
    fill(50);
    stroke(255);
    strokeWeight(2);
    rect(gameWidth/2, gameHeight/2, 600, 400, 10);
    
    // Header
    fill(255);
    noStroke();
    textSize(32);
    textAlign(CENTER, TOP);
    let title = shopBuilding.type === 'hospital' ? "HOSPITAL" : "ARMORY";
    text(title, gameWidth/2, gameHeight/2 - 180);
    
    // Player Stats in Shop
    textSize(16);
    textAlign(CENTER, TOP); // Changed to center
    
    // Conditional display based on shop type
    if (shopBuilding.type === 'hospital') {
        text(`XP Available: ${player.xp}`, gameWidth/2, gameHeight/2 - 130);
        text(`Current HP: ${player.hp}/5`, gameWidth/2, gameHeight/2 - 110);
        // Hide Ammo and Weapon for Hospital
    } else { // Armory
        text(`XP Available: ${player.xp}`, gameWidth/2, gameHeight/2 - 130);
        // Hide HP for Armory
        text(`Ammo: ${player.ammo}/${player.maxAmmo}`, gameWidth/2, gameHeight/2 - 110);
        text(`Weapon: ${player.currentWeapon.toUpperCase()}`, gameWidth/2, gameHeight/2 - 90);
    }
    
    // Options
    textAlign(CENTER, CENTER);
    let options = [];
    
    if (shopBuilding.type === 'hospital') {
        options = [
            { key: '1', label: "Heal 1 HP (10 XP)", action: () => {
                if (player.xp >= 10 && player.hp < 5) {
                    player.xp -= 10;
                    player.hp++;
                }
            }},
            { key: '2', label: "Full Heal (40 XP)", action: () => {
                if (player.xp >= 40 && player.hp < 5) {
                    player.xp -= 40;
                    player.hp = 5;
                }
            }}
        ];
    } else {
        options = [
            { key: '1', label: "Buy Ammo x10 (5 XP)", action: () => {
                if (player.xp >= 5 && player.ammo < player.maxAmmo) {
                    player.xp -= 5;
                    player.ammo = min(player.ammo + 10, player.maxAmmo);
                }
            }},
            { key: '2', label: "Shotgun (50 XP)", action: () => {
                if (player.xp >= 50 && player.currentWeapon !== 'shotgun') {
                    player.xp -= 50;
                    player.currentWeapon = 'shotgun';
                }
            }},
            { key: '3', label: "Laser Cannon (100 XP)", action: () => {
                if (player.xp >= 100 && player.currentWeapon !== 'laser') {
                    player.xp -= 100;
                    player.currentWeapon = 'laser';
                }
            }},
            { key: '4', label: "Ricochet (150 XP)", action: () => {
                if (player.xp >= 150 && player.currentWeapon !== 'ricochet') {
                    player.xp -= 150;
                    player.currentWeapon = 'ricochet';
                }
            }}
        ];
    }
    
    let startY = gameHeight/2 - 70;
    for (let i = 0; i < options.length; i++) {
        let opt = options[i];
        fill(80);
        stroke(200);
        rect(gameWidth/2, startY + i * 55, 400, 45, 5);
        
        fill(255);
        noStroke();
        textSize(18);
        text(`[${opt.key}] ${opt.label}`, gameWidth/2, startY + i * 55);
    }
    
    // Close instruction
    fill(200);
    textSize(14);
    text("Press ESC or F to Close", gameWidth/2, gameHeight/2 + 180);
}

function createExplosion(x, y, col, count) {
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(x, y, col));
  }
}

function applyPowerUp(p) {
  if (p.type === 'speed') {
    player.maxSpeed += 2;
    setTimeout(() => player.maxSpeed -= 2, 5000); // Temporary boost
  } else if (p.type === 'shield') {
    player.hasShield = true;
  } else if (p.type === 'health') {
    player.hp++;
  }
}

function drawStatusBar() {
  // Background
  fill(30);
  noStroke();
  rect(width/2, statusHeight/2, width, statusHeight);
  
  // Border line
  stroke(100);
  strokeWeight(4);
  line(0, statusHeight, width, statusHeight);

  if (gameState !== 'PLAY' && gameState !== 'PAUSED' && gameState !== 'SHOP') return; 

  let elapsed = (millis() - startTime) / 1000;
  let remaining = max(0, survivalTime - elapsed);

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
  
  // --- Middle Right: XP ---
  fill(200);
  noStroke();
  text("XP", 500, 25);
  
  fill(0, 200, 255); // Cyan
  textSize(32);
  text(player.xp, 500, 55);

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

  // Controls Overlay
  fill(200);
  textSize(14);
  textAlign(CENTER, CENTER);
  text("WASD: Move | CLICK: Shoot | F: Shop | P: Pause", width/2, statusHeight - 15);
}

function drawGameOver() {
  fill(0, 0, 0, 150);
  rect(gameWidth/2, gameHeight/2, gameWidth, gameHeight);

  fill(255, 0, 0);
  textSize(48);
  textAlign(CENTER, CENTER);
  text("GAME OVER", gameWidth / 2, gameHeight / 3);
  
  fill(255);
  textSize(24);
  text("Press ENTER to Try Again", gameWidth / 2, gameHeight * 0.75);
}

function drawWin() {
  fill(0, 0, 0, 150);
  rect(gameWidth/2, gameHeight/2, gameWidth, gameHeight);

  fill(0, 255, 0);
  textSize(48);
  textAlign(CENTER, CENTER);
  text("MISSION ACCOMPLISHED", gameWidth / 2, gameHeight / 3);
  
  fill(255);
  textSize(24);
  text("Press SPACE for Next Level", gameWidth / 2, gameHeight * 0.6);
  text("Press ENTER for Main Menu", gameWidth / 2, gameHeight * 0.75);
}

function keyPressed() {
  if (keyCode === ENTER) {
    if (gameState === 'MENU' || gameState === 'GAMEOVER') {
      resetGame();
      gameState = 'PLAY';
    } else if (gameState === 'WIN') {
      gameState = 'MENU'; // Go back to menu from Win
    }
  } else if (key === ' ' && gameState === 'WIN') {
      // Next Level
      resetGame(true); // Keep progress
      gameState = 'PLAY';
  } else if (keyCode === 80) { // P key
      if (gameState === 'PLAY') gameState = 'PAUSED';
      else if (gameState === 'PAUSED') gameState = 'PLAY';
  } else if (key === 'r' || key === 'R') {
      if (gameState === 'PAUSED') {
          resetGame();
          gameState = 'PLAY';
      }
  } else if (gameState === 'MENU') {
      // Difficulty Selection
      if (keyCode === UP_ARROW) {
          if (difficulty === 'NORMAL') difficulty = 'EASY';
          else if (difficulty === 'HARD') difficulty = 'NORMAL';
      } else if (keyCode === DOWN_ARROW) {
          if (difficulty === 'EASY') difficulty = 'NORMAL';
          else if (difficulty === 'NORMAL') difficulty = 'HARD';
      }
  } else if (gameState === 'SHOP') {
      if (keyCode === ESCAPE || keyCode === 70) { // ESC or F to close
          gameState = 'PLAY';
          shopBuilding = null;
      } else {
          // Shop interactions
          if (shopBuilding.type === 'hospital') {
              if (key === '1') { // Heal 1
                  if (player.xp >= 10 && player.hp < 5) {
                      player.xp -= 10;
                      player.hp++;
                  }
              } else if (key === '2') { // Full Heal
                  if (player.xp >= 40 && player.hp < 5) {
                      player.xp -= 40;
                      player.hp = 5;
                  }
              }
          } else if (shopBuilding.type === 'armory') {
              if (key === '1') { // Buy Ammo
                  if (player.xp >= 5 && player.ammo < player.maxAmmo) {
                      player.xp -= 5;
                      player.ammo = min(player.ammo + 10, player.maxAmmo);
                  }
              } else if (key === '2') { // Buy Shotgun
                  if (player.xp >= 50 && player.currentWeapon !== 'shotgun') {
                      player.xp -= 50;
                      player.currentWeapon = 'shotgun';
                  }
              } else if (key === '3') { // Buy Laser
                  if (player.xp >= 100 && player.currentWeapon !== 'laser') {
                      player.xp -= 100;
                      player.currentWeapon = 'laser';
                  }
              } else if (key === '4') { // Buy Ricochet
                  if (player.xp >= 150 && player.currentWeapon !== 'ricochet') {
                      player.xp -= 150;
                      player.currentWeapon = 'ricochet';
                  }
              }
          }
      }
  }
}

function mousePressed() {
    if (gameState === 'MENU') {
        // Simple click detection for difficulty
        // Approx coordinates from drawMenu
        let startY = gameHeight / 2;
        let dE = dist(mouseX, mouseY, gameWidth/2, startY);
        let dN = dist(mouseX, mouseY, gameWidth/2, startY + 50);
        let dH = dist(mouseX, mouseY, gameWidth/2, startY + 100);
        
        if (mouseY > startY - 20 && mouseY < startY + 20) difficulty = 'EASY';
        if (mouseY > startY + 30 && mouseY < startY + 70) difficulty = 'NORMAL';
        if (mouseY > startY + 80 && mouseY < startY + 120) difficulty = 'HARD';
        
        // Start Button
        if (mouseX > gameWidth/2 - 100 && mouseX < gameWidth/2 + 100 &&
            mouseY > gameHeight * 0.8 - 30 && mouseY < gameHeight * 0.8 + 30) {
            resetGame();
            gameState = 'PLAY';
        }
    } else if (gameState === 'PLAY') {
        // Adjust click check for top status bar
        if (mouseY > statusHeight) { 
            // Cooldown check (simple)
            if (millis() - lastShotTime > 200) { // 200ms cooldown base
                if (player.currentWeapon === 'pistol' && player.ammo >= 1) {
                    projectiles.push(new Projectile(player.pos.x, player.pos.y, player.heading, 'pistol'));
                    player.ammo--;
                    shakeAmount = 2;
                } else if (player.currentWeapon === 'shotgun' && player.ammo >= 3) {
                    // Spread shot
                    for(let i = -1; i <= 1; i++) {
                        projectiles.push(new Projectile(player.pos.x, player.pos.y, player.heading + i*0.15, 'shotgun'));
                    }
                    player.ammo = max(0, player.ammo - 3); // Costs 3 ammo
                    shakeAmount = 5;
                } else if (player.currentWeapon === 'laser' && player.ammo >= 2) {
                    projectiles.push(new Projectile(player.pos.x, player.pos.y, player.heading, 'laser'));
                    player.ammo = max(0, player.ammo - 2); // Costs 2 ammo
                    shakeAmount = 3;
                } else if (player.currentWeapon === 'ricochet' && player.ammo >= 2) {
                    projectiles.push(new Projectile(player.pos.x, player.pos.y, player.heading, 'ricochet'));
                    player.ammo = max(0, player.ammo - 2); 
                    shakeAmount = 3;
                }
                lastShotTime = millis();
            }
        }
    }
}
