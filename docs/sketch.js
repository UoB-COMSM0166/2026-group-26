let player;
let enemies = [];
let powerups = [];
let particles = [];
let buildings = [];
let projectiles = [];
let gameState = 'MENU'; // MENU, PLAY, GAMEOVER, WIN, SHOP
let shopBuilding = null; // Store which building opened the shop
let lastShotTime = 0; // For weapon cooldown
let startTime;
let survivalTime = 60; // 60 seconds to win
let lastEnemySpawnTime = 0;
let lastPowerUpSpawnTime = 0;
let shakeAmount = 0;

// Layout Constants
let gameWidth = 900;
let gameHeight = 600;
let statusHeight = 100;

// Map & Camera
let mapWidth = 2400; // Larger map
let mapHeight = 1800;
let camX = 0;
let camY = 0;

function setup() {
  createCanvas(gameWidth, gameHeight + statusHeight);
  textAlign(CENTER, CENTER);
  rectMode(CENTER);
}

function resetGame() {
  player = new Player(mapWidth / 2, mapHeight / 2); // Start in middle of large map
  enemies = [];
  powerups = [];
  particles = [];
  buildings = [];
  projectiles = [];
  startTime = millis();
  lastEnemySpawnTime = millis();
  lastPowerUpSpawnTime = millis();
  shakeAmount = 0;
  
  generateCity();
  
  // Initial enemy
  enemies.push(new Enemy(random(mapWidth), random(mapHeight)));
}

function generateCity() {
  // Simple grid based city generation
  let cols = 12; // More columns for larger map
  let rows = 9;  // More rows
  
  let startX = 100;
  let startY = 100;
  let gapX = (mapWidth - 2 * startX) / (cols - 1);
  let gapY = (mapHeight - 2 * startY) / (rows - 1);

  let bWidth = 100;
  let bHeight = 80;

  // Store coordinates for shops
  let buildingCoords = [];

  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      // Don't place building in the center (start area) - expanded safe zone
      if (Math.abs(i - cols/2) < 2 && Math.abs(j - rows/2) < 2) continue;
      
      // Randomly skip some buildings for more open space
      if (random() < 0.2) continue;
      
      let x = startX + i * gapX;
      let y = startY + j * gapY;
      
      // Add some random offset
      x += random(-20, 20);
      y += random(-20, 20);
      
      buildingCoords.push({x: x, y: y});
    }
  }

  // Assign types
  // Ensure at least one hospital and one armory
  if (buildingCoords.length > 0) {
      let hospitalIdx = floor(random(buildingCoords.length));
      let armoryIdx = floor(random(buildingCoords.length));
      while(armoryIdx === hospitalIdx && buildingCoords.length > 1) {
          armoryIdx = floor(random(buildingCoords.length));
      }
      
      for (let i = 0; i < buildingCoords.length; i++) {
          let type = 'normal';
          if (i === hospitalIdx) type = 'hospital';
          else if (i === armoryIdx) type = 'armory';
          else if (random() < 0.1) type = random(['hospital', 'armory']); // Chance for extra shops
          
          buildings.push(new Building(buildingCoords[i].x, buildingCoords[i].y, bWidth, bHeight, type));
      }
  }
}

function draw() {
  // Draw Background (Grass) - Clear entire canvas first
  background(34, 139, 34); // Forest Green

  // Update Camera
  if (player) {
    // Center camera on player, but clamp to map boundaries
    // We want the view (0,0) to map to (camX, camY) in world space
    // So if player is at (px, py), we want that to be at screen center (gw/2, gh/2)
    // camX = px - gw/2
    camX = player.pos.x - gameWidth / 2;
    camY = player.pos.y - gameHeight / 2;
    
    // Clamp
    camX = constrain(camX, 0, mapWidth - gameWidth);
    camY = constrain(camY, 0, mapHeight - gameHeight);
  }

  // --- Game Area ---
  push();
  // Translate to Status Bar area first, THEN apply camera
  translate(0, statusHeight); 
  
  // Apply Camera Translation (Negative because we move the world opposite to camera)
  translate(-camX, -camY);
  
  // Screen Shake (Only affects game area)
  if (shakeAmount > 0) {
    translate(random(-shakeAmount, shakeAmount), random(-shakeAmount, shakeAmount));
    shakeAmount *= 0.9; // Decay shake
    if (shakeAmount < 0.5) shakeAmount = 0;
  }

  // Draw World Background (Grass for whole map)
  // Since we cleared with background(), we might need to draw a big rect for map limits if we want to see edges
  // Or just rely on the background color. Let's draw map borders.
  noFill();
  stroke(0);
  strokeWeight(5);
  rectMode(CORNER);
  rect(0, 0, mapWidth, mapHeight);

  // Draw Roads (City base) - Covers entire map
  fill(50);
  noStroke();
  rectMode(CORNER);
  rect(0, 0, mapWidth, mapHeight); // Base road color for whole city
  
  // Draw Grid lines or something to show movement?
  // Let's draw some grass patches or sidewalk lines to make movement visible
  stroke(255, 255, 255, 50);
  strokeWeight(2);
  for(let i=0; i<mapWidth; i+=200) line(i, 0, i, mapHeight);
  for(let j=0; j<mapHeight; j+=200) line(0, j, mapWidth, j);

  if (gameState === 'MENU') {
    // Reset translation for menu to center on screen
    pop(); 
    push();
    translate(0, statusHeight);
    drawMenu();
  } else if (gameState === 'PLAY') {
    playGame();
  } else if (gameState === 'SHOP') {
    // Keep drawing game in background but dimmed
    playGame(); // Draw game scene
    // Reset translation for shop UI
    pop();
    push();
    translate(0, statusHeight);
    drawShop();
  } else if (gameState === 'GAMEOVER') {
    // Reset translation for game over
    pop();
    push();
    translate(0, statusHeight);
    drawGameOver();
  } else if (gameState === 'WIN') {
    // Reset translation for win
    pop();
    push();
    translate(0, statusHeight);
    drawWin();
  }
  
  pop(); 

  // Draw Status Bar LAST (Top) - Ensures it's always on top
  drawStatusBar();
  
  // Draw Mini-Map (Top Left, below status bar)
  if (gameState === 'PLAY') {
      drawMiniMap();
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
    fill(0, 255, 0);
    ellipse(player.pos.x * scaleFactor, player.pos.y * scaleFactor, 5, 5);
    
    // Viewport Rectangle (Camera View)
    noFill();
    stroke(255, 255, 0, 100);
    strokeWeight(1);
    rect(camX * scaleFactor, camY * scaleFactor, gameWidth * scaleFactor, gameHeight * scaleFactor);
    
    pop();
}


function drawMenu() {
  fill(0, 0, 0, 150);
  rect(gameWidth/2, gameHeight/2, gameWidth, gameHeight);
  
  fill(255);
  textSize(48);
  text("HOTLINE ESCAPE", gameWidth / 2, gameHeight / 3);
  
  textSize(24);
  text("Use ARROW KEYS or WASD to drive", gameWidth / 2, gameHeight / 2);
  text("MOUSE CLICK to Shoot", gameWidth / 2, gameHeight / 2 + 30);
  text("Survive for " + survivalTime + " seconds!", gameWidth / 2, gameHeight / 2 + 70);
  
  fill(0, 255, 0);
  textSize(30);
  text("Press ENTER to Start", gameWidth / 2, gameHeight * 0.75);
}

function playGame() {
  if (gameState === 'SHOP') {
      // Don't update game logic in shop mode, just draw
      drawGameObjects();
      return;
  }
  
  // Timer
  let elapsed = (millis() - startTime) / 1000;
  let remaining = survivalTime - elapsed;
  
  if (remaining <= 0) {
    gameState = 'WIN';
  }

  // Passive XP gain (survival)
  if (frameCount % 60 === 0) { // Every second
      player.xp += 1;
  }

  // Spawning Enemies
  if (millis() - lastEnemySpawnTime > 5000) { // Every 5 seconds
    let edge = floor(random(4));
    let ex, ey;
    if (edge === 0) { ex = random(gameWidth); ey = -20; }
    else if (edge === 1) { ex = gameWidth + 20; ey = random(gameHeight); }
    else if (edge === 2) { ex = random(gameWidth); ey = gameHeight + 20; }
    else { ex = -20; ey = random(gameHeight); }
    
    enemies.push(new Enemy(ex, ey));
    lastEnemySpawnTime = millis();
  }

  // Spawning PowerUps
  if (millis() - lastPowerUpSpawnTime > 8000) { // Every 8 seconds
    let types = ['speed', 'shield', 'health'];
    let type = random(types);
    let px = random(50, gameWidth-50);
    let py = random(50, gameHeight-50);
    
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
          // Check proximity
          if (p5.Vector.dist(player.pos, b.pos) < b.w) {
              // Open Shop
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
    if (gameState !== 'SHOP') particles[i].update();
    particles[i].display();
    if (gameState !== 'SHOP' && particles[i].isDead()) {
      particles.splice(i, 1);
    }
  }

  // Update & Display Projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
      let p = projectiles[i];
      if (gameState !== 'SHOP') p.update();
      p.display();
      
      if (gameState === 'SHOP') continue; // Skip collision logic in shop

      if (p.isDead()) {
          projectiles.splice(i, 1);
          continue;
      }
      
      // Check collision with buildings
      for (let b of buildings) {
          // Simple point in rect check
          if (p.pos.x > b.pos.x - b.w/2 && p.pos.x < b.pos.x + b.w/2 &&
              p.pos.y > b.pos.y - b.h/2 && p.pos.y < b.pos.y + b.h/2) {
              projectiles.splice(i, 1);
              createExplosion(p.pos.x, p.pos.y, color(200), 5);
              break;
          }
      }
  }

  // Update & Display PowerUps
  for (let i = powerups.length - 1; i >= 0; i--) {
    let p = powerups[i];
    p.display();
    if (gameState !== 'SHOP' && p.checkCollision(player)) {
      applyPowerUp(p);
      createExplosion(p.pos.x, p.pos.y, color(255, 255, 255), 10);
      powerups.splice(i, 1);
    }
  }

  // Update & Display Player
  if (gameState !== 'SHOP') {
      player.edges();
      player.update();
  }
  
  // Check collision with buildings
  if (gameState !== 'SHOP') {
      for (let b of buildings) {
        b.checkCollision(player);
      }
  }
  player.display();

  // Update & Display Enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    let e = enemies[i];
    if (gameState !== 'SHOP') e.update(player);
    
    if (gameState !== 'SHOP') {
        // Check collision with buildings for enemies too
        for (let b of buildings) {
            b.checkCollision(e);
        }
        
        // Check collision with projectiles
        for (let j = projectiles.length - 1; j >= 0; j--) {
            let p = projectiles[j];
            if (p.checkCollision(e)) {
                // Apply damage based on weapon type (simple for now)
                let dmg = 1;
                // Laser penetrates, shotgun spreads... handled in Projectile class or here
                // For now, assume 1 hit kill for normal enemies
                
                if (p.type !== 'laser') { // Laser doesn't get destroyed on hit immediately (penetration)
                    projectiles.splice(j, 1);
                }
                
                createExplosion(e.pos.x, e.pos.y, color(255, 0, 0), 15);
                // Enemy destroyed
                enemies.splice(i, 1);
                player.xp += 5; // Kill reward
                shakeAmount = 5;
                break; // Break inner loop (projectiles), continue outer loop (enemies)
            }
        }
    }
    
    // Check if enemy still exists (might be destroyed by projectile)
    if (i < enemies.length) {
        e.display();
        
        if (gameState !== 'SHOP') {
            // Collision Player vs Enemy
            let d = p5.Vector.dist(player.pos, e.pos);
            if (d < player.r + e.r) {
              createExplosion(player.pos.x, player.pos.y, color(255, 100, 0), 20);
              shakeAmount = 10;
              
              if (player.hasShield) {
                player.hasShield = false;
                // Push enemy back
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
            }}
        ];
    }
    
    let startY = gameHeight/2 - 50;
    for (let i = 0; i < options.length; i++) {
        let opt = options[i];
        fill(80);
        stroke(200);
        rect(gameWidth/2, startY + i * 60, 400, 50, 5);
        
        fill(255);
        noStroke();
        textSize(18);
        text(`[${opt.key}] ${opt.label}`, gameWidth/2, startY + i * 60);
    }
    
    // Close instruction
    fill(200);
    textSize(14);
    text("Press ESC or F to Close", gameWidth/2, gameHeight/2 + 150);
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

  if (gameState !== 'PLAY') return; 

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
  // Wrap bullets if too many
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
  
  // Shield Status (Overlay in game area or status bar?)
  // Let's put it in status bar far right
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
  text("Press ENTER to Play Again", gameWidth / 2, gameHeight * 0.75);
}

function keyPressed() {
  if (keyCode === ENTER) {
    if (gameState === 'MENU' || gameState === 'GAMEOVER' || gameState === 'WIN') {
      resetGame();
      gameState = 'PLAY';
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
              }
          }
      }
  }
}

function mousePressed() {
    if (gameState === 'PLAY') {
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
                }
                lastShotTime = millis();
            }
        }
    }
}
