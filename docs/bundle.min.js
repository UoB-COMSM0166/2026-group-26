function getMouseWorldPos() {
    let mx = mouseX - gameViewX + camX;
    let my = mouseY - statusHeight - gameViewY + camY;
    
    let dx = mx - mapOffsetX;
    let dy = my - mapOffsetY;
    
    let W = tileSize / 2;
    let H = tileSize / 4;
    
    let gridX = (dx / W + dy / H) / 2;
    let gridY = (dy / H - dx / W) / 2;
    
    return createVector(gridX * tileSize, gridY * tileSize);
}


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
    description: "Basic sidearm. Left click to shoot single shots. Good for early game."
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
    description: "Fires 5 pellets at once. High damage at close range. Slow fire rate."
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
    count: 5, // Burst count
    burstDelay: 5, // Frames between burst shots
    description: "Fires 5-round bursts rapidly. Excellent for mid-range combat."
  },
  [WEAPON_TYPES.LASER]: {
    name: 'Laser Gun',
    type: 'basic',
    damage: 12, // Displayed as per-second beam damage
    damagePerFrame: 0.2,
    speed: 0,
    cooldown: 2000,
    ammoCost: 1,
    color: [90, 200, 255],
    lifespan: 120,
    duration: 120,
    beamWidth: 26,
    growFrames: 6,
    fadeFrames: 12,
    maxLength: 2200,
    penetrates: true,
    description: "Projects a sustained blue laser beam for 2 seconds. Damages enemies continuously until cover blocks it."
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
    description: "Throws a fire bottle that creates a burning area. Damages enemies over time."
  },
  // Special Weapons (Drops)
  [WEAPON_TYPES.DONGFENG]: {
    name: 'Dongfeng Missile',
    type: 'special',
    damage: 50,
    cooldown: 0,
    ammoCost: 1, // Uses the item itself
    description: "Strategic nuke. Press Space to open Map, Click to launch missile at target area.",
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
    description: "Drone missile. Press Space to launch. Use Arrow Keys to guide it to targets.",
    dropWeight: 30,
    dropRateText: "Low"
  },
  [WEAPON_TYPES.ATOMIC]: {
    name: 'Atomic Bomb',
    type: 'special',
    damage: 9999,
    cooldown: 0,
    ammoCost: 1,
    description: "The ultimate weapon. Press Space to detonate. Destroys EVERYTHING on screen.",
    dropWeight: 5,
    dropRateText: "Very Rare"
  }
};

class Particle {
  constructor(x, y, color) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D();
    this.vel.mult(random(1, 3));
    this.acc = createVector(0, 0);
    this.lifespan = 255;
    this.color = color;
    this.r = 4;
  }

  update() {
    this.vel.add(this.acc);
    this.vel.mult(0.95);
    this.pos.add(this.vel);
    this.lifespan -= 5;
  }

  display() {
    let isoPos = projectIso(this.pos.x, this.pos.y);
    noStroke();
    fill(red(this.color), green(this.color), blue(this.color), this.lifespan);
    ellipse(isoPos.x, isoPos.y, this.r * 2);
  }

  isDead() {
    return this.lifespan < 0;
  }
}

const CAR_CATALOG = {
  starter: { name: 'Starter', color: [0, 255, 0], maxSpeed: 12, turnSpeed: 0.05, friction: 0.96, maxHp: 5, maxAmmo: 10, price: 0 },
  speedster: { name: 'Speedster', color: [0, 180, 255], maxSpeed: 16, turnSpeed: 0.06, friction: 0.97, maxHp: 4, maxAmmo: 10, price: 120 },
  tank: { name: 'Tank', color: [255, 140, 0], maxSpeed: 8, turnSpeed: 0.04, friction: 0.95, maxHp: 8, maxAmmo: 12, price: 150 },
  drifter: { name: 'Drifter', color: [180, 80, 255], maxSpeed: 13, turnSpeed: 0.08, friction: 0.94, maxHp: 5, maxAmmo: 10, price: 110 }
};

class Vehicle {
  constructor(x, y, color) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.maxSpeed = 5;
    this.maxForce = 0.1;
    this.r = 16;
    this.color = color;
    this.heading = 0; // Direction the vehicle is facing
    this.width = 20;
    this.length = 36;
    
    // Visual Enhancements
    this.skidMarks = []; // Replaces trail
    this.maxSkidLength = 50;
    this.isDrifting = false;
    this.isBraking = false;
  }

  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0);
    
    // Skid Marks Logic
    // Add skid marks if drifting or braking hard while moving
    let speed = this.vel.mag();
    if (speed > 1 && (this.isDrifting || this.isBraking)) {
        // Calculate rear tire positions based on heading
        // Left Rear and Right Rear
        let rearOffset = -this.length / 2;
        let sideOffset = this.width / 2 - 2; // Slightly inside
        
        // We need to rotate these offsets by the car's heading
        let angle = this.heading;
        
        let p1 = createVector(rearOffset, -sideOffset).rotate(angle).add(this.pos);
        let p2 = createVector(rearOffset, sideOffset).rotate(angle).add(this.pos);
        
        this.skidMarks.push({
            p1: p1,
            p2: p2,
            alpha: 255, // Full opacity start
            life: 120 // Frames to live
        });
    }
    
    // Update Skid Marks (fade out)
    for (let i = this.skidMarks.length - 1; i >= 0; i--) {
        this.skidMarks[i].alpha -= 4; // Fade out speed
        if (this.skidMarks[i].alpha <= 0) {
            this.skidMarks.splice(i, 1);
        }
    }
  }

  display() {
    // Draw Skid Marks (Ground level)
    noStroke();
    for (let mark of this.skidMarks) {
        let isoP1 = projectIso(mark.p1.x, mark.p1.y);
        let isoP2 = projectIso(mark.p2.x, mark.p2.y);
        
        fill(30, 30, 30, mark.alpha);
        ellipse(isoP1.x, isoP1.y, 4, 2); // Simple dot for now, or lines connecting them if we stored previous?
        ellipse(isoP2.x, isoP2.y, 4, 2);
    }

    push();
    // Project position to Iso
    let isoPos = projectIso(this.pos.x, this.pos.y);
    translate(isoPos.x, isoPos.y);
    
    // Project heading to Iso angle
    let headingVec = p5.Vector.fromAngle(this.heading);
    let isoHeadingVec = projectIsoVector(headingVec.x, headingVec.y);
    let isoAngle = isoHeadingVec.heading();
    
    // Draw Predictive Arrow (Under the car, rotating with inputs)
    // Only if this is the player (simple check: if it has turnSpeed)
    if (this.turnSpeed) { 
        this.drawPredictiveArrow(isoAngle);
    }

    rotate(isoAngle);
    
    // Car Body - Enhanced for Orientation
    stroke(255); 
    strokeWeight(1.5);
    fill(this.color);
    rectMode(CENTER);
    
    // Main Body (Slightly tapered to show front?)
    // Let's use a custom shape instead of rect to indicate direction
    beginShape();
    vertex(this.length/2 + 5, 0); // Pointy Front
    vertex(this.length/2, -this.width/2);
    vertex(-this.length/2, -this.width/2);
    vertex(-this.length/2, this.width/2);
    vertex(this.length/2, this.width/2);
    endShape(CLOSE);
    
    // Spoiler (Rear)
    fill(this.color);
    rect(-this.length/2 - 2, 0, 4, this.width + 4);
    
    // Stripe/Detail
    noStroke();
    fill(255, 255, 255, 150);
    rect(5, 0, this.length * 0.6, this.width * 0.4); // Racing stripe
    
    // Windshield (Black/Dark Blue)
    stroke(0);
    strokeWeight(1);
    fill(50, 50, 100); 
    rect(2, 0, 10, 18, 2); 
    
    // Headlights (Brighter & Cone)
    fill(255, 255, 150);
    noStroke();
    ellipse(this.length/2 + 2, -this.width/3, 5, 5);
    ellipse(this.length/2 + 2, this.width/3, 5, 5);
    
    // Headlight Beams (Subtle glow)
    fill(255, 255, 200, 50);
    arc(this.length/2 + 5, -this.width/3, 40, 30, -PI/4, PI/4);
    arc(this.length/2 + 5, this.width/3, 40, 30, -PI/4, PI/4);
    
    // Brake lights (red) - Brighten when braking
    if (this.isBraking) {
        fill(255, 0, 0);
        stroke(255, 100, 100);
        strokeWeight(2);
    } else {
        fill(150, 0, 0);
        noStroke();
    }
    rect(-this.length/2, -this.width/3, 3, 6);
    rect(-this.length/2, this.width/3, 3, 6);
    
    pop();
  }
  
  drawPredictiveArrow(currentIsoAngle) {
      // Calculate predicted trajectory
      // Style: Crosswalk/Dashed line (vertically stacked rectangles)
      
      push();
      
      // Sim parameters
      let simSteps = 15;
      let simPos = createVector(0, 0); // Relative to car center
      let simVel = p5.Vector.fromAngle(this.heading).setMag(max(this.vel.mag(), 5)); 
      let simHeading = this.heading;
      let simTurnSpeed = 0.05 * 0.8; 
      
      // Check inputs for prediction
      let turnInput = 0;
      if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) turnInput = -1;
      if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) turnInput = 1;
      
      // Draw Trajectory as individual segments (Dashed/Rectangles)
      rectMode(CENTER);
      noStroke();
      
      for(let i=0; i<simSteps; i++) {
          // Update heading
          simHeading += simTurnSpeed * turnInput;
          
          // Update velocity direction
          simVel = p5.Vector.fromAngle(simHeading).setMag(simVel.mag());
          
          // Calculate step displacement in World
          let step = simVel.copy().mult(3); // Scale up for visibility distance
          
          // Project step to Iso
          let isoStep = projectIsoVector(step.x, step.y);
          
          simPos.add(isoStep);
          
          // Draw Segment at simPos
          push();
          translate(simPos.x, simPos.y);
          
          // Calculate rotation for this segment in Iso space
          let segmentHeadingVec = p5.Vector.fromAngle(simHeading);
          let isoSegmentHeading = projectIsoVector(segmentHeadingVec.x, segmentHeadingVec.y);
          rotate(isoSegmentHeading.heading());
          
          // Draw "Crosswalk" rectangle
          // Fade out opacity as it gets further
          let alpha = map(i, 0, simSteps, 150, 0); 
          fill(255, 255, 255, alpha); // White, transparent
          
          // Rectangle size (wider than long to look like crosswalk stripes across path?)
          // User said "vertically stacked rectangles", usually means perpendicular to path like a ladder.
          // Width (perp to path) > Length (along path)
          rect(0, 0, 4, 12); 
          
          pop();
      }
      
      pop();
  }

  edges() {
    // Check map boundaries instead of viewport width/height
    if (typeof mapWidth !== 'undefined' && typeof mapHeight !== 'undefined') {
        // Hard limits (no wrapping)
        if (this.pos.x > mapWidth) {
            this.pos.x = mapWidth;
            this.vel.x *= -0.5; // Bounce back slightly
        }
        if (this.pos.x < 0) {
            this.pos.x = 0;
            this.vel.x *= -0.5;
        }
        if (this.pos.y > mapHeight) {
            this.pos.y = mapHeight;
            this.vel.y *= -0.5;
        }
        if (this.pos.y < 0) {
            this.pos.y = 0;
            this.vel.y *= -0.5;
        }
    } else {
        // Fallback to old behavior if mapWidth is not defined
        if (this.pos.x > width) this.pos.x = 0;
        if (this.pos.x < 0) this.pos.x = width;
        if (this.pos.y > gameHeight) this.pos.y = 0;
        if (this.pos.y < 0) this.pos.y = gameHeight;
    }
  }
}

class Player extends Vehicle {
  constructor(x, y) {
    let carData = CAR_CATALOG ? CAR_CATALOG.starter : { color: [0, 255, 0], maxSpeed: 12, turnSpeed: 0.05, friction: 0.96, maxHp: 5, maxAmmo: 10 };
    super(x, y, color(carData.color[0], carData.color[1], carData.color[2]));
    this.carType = 'starter';
    this.bonusMaxHp = 0;
    this.bonusMaxAmmo = 0;
    this.bonusTopSpeed = 0; // Each level gives +10% max speed
    this.bonusAcceleration = 0; // Each level gives +10% acceleration
    this.coins = 0;
    this.maxSpeed = carData.maxSpeed;
    this.friction = carData.friction;
    this.turnSpeed = carData.turnSpeed; 
    this.isBraking = false;
    this.maxHp = carData.maxHp;
    this.hp = this.maxHp;
    this.maxAmmo = carData.maxAmmo;
    this.ammo = this.maxAmmo;
    this.currentWeapon = WEAPON_TYPES.PISTOL;
    this.ownedWeapons = [WEAPON_TYPES.PISTOL];
    this.unlockedSpecialWeapons = []; // Special weapons unlocked in shop
    this.currentSpecialWeapon = null; // Currently held special weapon (from drop)
    this.specialWeaponCount = 0;
    this.shieldDurationLevel = 0;
    this.hasShield = false;
  }

  canFire() {
    if (!WEAPON_CONFIG[this.currentWeapon]) return false;
    return millis() - lastShotTime > WEAPON_CONFIG[this.currentWeapon].cooldown;
  }

  fire(tx, ty) {
    let config = WEAPON_CONFIG[this.currentWeapon];
    if (!config) return;

    if (this.ammo < config.ammoCost) return;

    // Deduct ammo (once per fire action)
    this.ammo -= config.ammoCost;
    lastShotTime = millis();
    shakeAmount = config.damage * 2;

    // Create Projectiles based on type
    if (this.currentWeapon === WEAPON_TYPES.SHOTGUN) {
        let count = config.count;
        let spread = config.spread;
        let startAngle = this.heading - (spread * (count - 1)) / 2;
        for (let i = 0; i < count; i++) {
            let angle = startAngle + i * spread;
            projectiles.push(new Projectile(this.pos.x, this.pos.y, angle, this.currentWeapon));
        }
    } else if (this.currentWeapon === WEAPON_TYPES.RIFLE) {
        // Fire first shot immediately
        projectiles.push(new Projectile(this.pos.x, this.pos.y, this.heading, this.currentWeapon));
        // Schedule remaining shots
        this.startBurst(config.count - 1, config.burstDelay);
    } else if (this.currentWeapon === WEAPON_TYPES.LASER) {
        let laser = new Projectile(this.pos.x, this.pos.y, this.heading, this.currentWeapon);
        laser.attachToEntity(this, this.length * 0.55);
        projectiles.push(laser);
    } else if (this.currentWeapon === WEAPON_TYPES.MOLOTOV) {
        // Calculate velocity to reach target
        // tx, ty are World Coordinates (not Screen)
        // Projectile needs to know it's a thrown object
        let p = new Projectile(this.pos.x, this.pos.y, this.heading, this.currentWeapon);
        p.setTarget(tx, ty);
        projectiles.push(p);
    } else {
        // Pistol, Laser, etc.
        projectiles.push(new Projectile(this.pos.x, this.pos.y, this.heading, this.currentWeapon));
    }
  }

  // Handle burst fire state
  startBurst(count, delay) {
      this.burstCount = count;
      this.burstDelay = delay;
      this.burstTimer = 0;
  }

  getUpgradeCaps() {
    if (typeof difficulty === 'undefined') return { hp: 2, ammo: 5, speed: 5, accel: 5 };
    if (difficulty === 'EASY') return { hp: 2, ammo: 5, speed: 5, accel: 5 };
    if (difficulty === 'NORMAL') return { hp: 1, ammo: 3, speed: 3, accel: 3 };
    if (difficulty === 'HARD') return { hp: 0, ammo: 1, speed: 1, accel: 1 };
    return { hp: 2, ammo: 5, speed: 5, accel: 5 };
  }

  applyCarType(carId) {
    if (!CAR_CATALOG || !CAR_CATALOG[carId]) return;
    let data = CAR_CATALOG[carId];
    this.carType = carId;
    this.color = color(data.color[0], data.color[1], data.color[2]);
    
    // Apply stats with percentage bonuses from upgrades
    // Apply Difficulty Caps
    const caps = this.getUpgradeCaps();
    const effectiveSpeedBonus = Math.min(this.bonusTopSpeed, caps.speed);
    const effectiveAccelBonus = Math.min(this.bonusAcceleration, caps.accel);
    const effectiveHpBonus = Math.min(this.bonusMaxHp, caps.hp);
    const effectiveAmmoBonus = Math.min(this.bonusMaxAmmo, caps.ammo);

    // Top speed bonus: +10% per level
    let topSpeedMultiplier = 1 + (effectiveSpeedBonus * 0.10);
    this.maxSpeed = data.maxSpeed * topSpeedMultiplier;
    
    // Acceleration/Handling bonus: +10% per level
    let accelMultiplier = 1 + (effectiveAccelBonus * 0.10);
    this.turnSpeed = data.turnSpeed * accelMultiplier;
    
    this.friction = data.friction;
    this.maxHp = data.maxHp + effectiveHpBonus;
    this.maxAmmo = data.maxAmmo + effectiveAmmoBonus;
    this.hp = min(this.hp, this.maxHp);
    this.ammo = min(this.ammo, this.maxAmmo);
  }

  getAcceleration() {
      // Vehicle base acceleration (using default fallback if missing)
      let baseAccel = (typeof CAR_CATALOG !== 'undefined' && CAR_CATALOG[this.carType] && CAR_CATALOG[this.carType].acceleration) || 0.5;
      
      // Apply Difficulty Caps
      const caps = this.getUpgradeCaps();
      const effectiveAccelBonus = Math.min(this.bonusAcceleration, caps.accel);

      // Apply acceleration bonus
      let accelMultiplier = 1 + (effectiveAccelBonus * 0.10);
      return baseAccel * accelMultiplier;
  }

  update() {
    let timeScale = 1;
    
    // Handle Burst Fire
    if (this.burstCount > 0) {
        this.burstTimer -= timeScale; // Compensate timer
        if (this.burstTimer <= 0) {
             projectiles.push(new Projectile(this.pos.x, this.pos.y, this.heading, this.currentWeapon));
             this.burstCount--;
             this.burstTimer = this.burstDelay;
        }
    }

    // Determine direction of movement (forward or backward) relative to heading
    let direction = 0;
    let forward = p5.Vector.fromAngle(this.heading);
    if (this.vel.dot(forward) > 0.1) direction = 1;
    else if (this.vel.dot(forward) < -0.1) direction = -1;

    // Steering
    // Only steer if moving
    if (this.vel.mag() > 0.1) {
        // Dynamic Turn Speed: Reduced when not accelerating (coasting) to simulate lack of power steering/grip
        let currentTurnSpeed = this.turnSpeed * timeScale; // Scale turn speed
        if (!keyIsDown(UP_ARROW) && !keyIsDown(87)) {
            currentTurnSpeed *= 0.4; // Significantly reduce turning ability when coasting
        }
        
        if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) { // Left or A
            // Reverse steering if moving backwards
            let turnDir = direction !== 0 ? direction : 1;
            this.heading -= currentTurnSpeed * turnDir;
        }
        if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) { // Right or D
            let turnDir = direction !== 0 ? direction : 1;
            this.heading += currentTurnSpeed * turnDir;
        }
    }

    // Acceleration (Engine Force)
    if (keyIsDown(UP_ARROW) || keyIsDown(87)) { // Up or W
      let force = p5.Vector.fromAngle(this.heading);
      force.mult(this.getAcceleration() * timeScale); // Scale Force
      this.applyForce(force);
    }
    
    // Reverse / Brake (S key)
    if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) { // Down or S
       let force = p5.Vector.fromAngle(this.heading);
       force.mult(-0.8 * timeScale); // Scale Force
       this.applyForce(force);
    }

    // --- Drift & Grip Physics ---
    let grip = 0.15; // How fast velocity aligns with heading (0.15 = snappy but smooth)
    // Adjust grip for timeScale? Lerp is non-linear with time.
    // Ideally: newVel = lerp(vel, target, 1 - pow(1 - grip, timeScale))
    // Approximation for small grip: grip * timeScale
    let gripFactor = 1 - pow(1 - grip, timeScale);
    
    let friction = this.friction; // Use instance friction
    // Friction is per frame: vel *= friction
    // With timeScale: vel *= pow(friction, timeScale)
    let frictionFactor = pow(friction, timeScale);

    // Spacebar for Handbrake / Drift
    if (keyIsDown(32)) { 
        gripFactor = 1 - pow(1 - 0.01, timeScale); // Lose traction (Drift)
        frictionFactor = pow(0.92, timeScale); // Decelerate more (Brake)
        this.isDrifting = true;
    } else {
        this.isDrifting = false;
    }

    // Apply Grip: Redirect velocity towards heading
    if (this.vel.mag() > 0.1) {
        let currentSpeed = this.vel.mag();
        let targetVel = p5.Vector.fromAngle(this.heading);
        targetVel.setMag(currentSpeed);
        
        // Lerp current velocity towards target velocity
        // This preserves momentum while turning (solving the "slow down" issue)
        this.vel.lerp(targetVel, gripFactor);
        
        // Apply Friction/Drag
        this.vel.mult(frictionFactor);
    } else {
        // Stop completely if very slow and no input
        if (this.vel.mag() < 0.05 && !keyIsDown(UP_ARROW) && !keyIsDown(87)) {
            this.vel.mult(0);
        }
    }

    // super.update() logic needs timeScale too?
    // Vehicle.update() does: vel += acc; pos += vel; acc *= 0;
    // We should manually update position here to control timeScale
    // Or modify Vehicle.update to accept timeScale.
    // Let's override here since Vehicle is simple.
    
    // Physics Integration
    // vel = vel + acc (acc already scaled by force application)
    // pos = pos + vel * timeScale
    
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    
    // Scale velocity for position update ONLY
    let scaledVel = p5.Vector.mult(this.vel, timeScale);
    this.pos.add(scaledVel);
    
    this.acc.mult(0);
    
    // Skid Marks Logic (Visuals)
    // ... (Keep existing skid mark logic, maybe scale fade out?)
    let speed = this.vel.mag();
    if (speed > 1 && (this.isDrifting || this.isBraking)) {
        let rearOffset = -this.length / 2;
        let sideOffset = this.width / 2 - 2; 
        let angle = this.heading;
        let p1 = createVector(rearOffset, -sideOffset).rotate(angle).add(this.pos);
        let p2 = createVector(rearOffset, sideOffset).rotate(angle).add(this.pos);
        
        this.skidMarks.push({
            p1: p1,
            p2: p2,
            alpha: 255, 
            life: 120 
        });
    }
    
    for (let i = this.skidMarks.length - 1; i >= 0; i--) {
        this.skidMarks[i].alpha -= 4 * timeScale; // Fade out scaled
        if (this.skidMarks[i].alpha <= 0) {
            this.skidMarks.splice(i, 1);
        }
    }

    // Visual Feedback for Drifting
    if (this.isDrifting && this.vel.mag() > 2) {
        // ...
        // Add smoke particles
        if (frameCount % 3 === 0) { 
            let rear = p5.Vector.fromAngle(this.heading);
            rear.mult(-this.length/2); 
            rear.add(this.pos);
            particles.push(new Particle(rear.x + random(-5, 5), rear.y + random(-5, 5), color(220, 220, 220, 100)));
        }
    }

    // Mud Splash on Grass
    let tileX = floor(this.pos.x / tileSize);
    let tileY = floor(this.pos.y / tileSize);

    if (typeof mapCols !== 'undefined' && tileX >= 0 && tileX < mapCols && tileY >= 0 && tileY < mapRows) {
         let tile = tileMap[tileY][tileX];
         if (tile && tile.type === 'grass' && this.vel.mag() > 2) {
             if (frameCount % 4 === 0) { 
                 let rear = p5.Vector.fromAngle(this.heading);
                 rear.mult(-this.length/2);
                 rear.add(this.pos);
                 
                 // Create a few particles for a "splash" effect
                 for(let i=0; i<2; i++) {
                     // Earthy/Muddy colors
                     let mudColor = color(101 + random(-20,20), 67 + random(-20,20), 33, 200);
                     let p = new Particle(rear.x + random(-5, 5), rear.y + random(-5, 5), mudColor);
                     
                     // Velocity: Opposite to heading + wide spread
                     let splashVel = p5.Vector.fromAngle(this.heading + PI + random(-0.8, 0.8));
                     splashVel.mult(random(2, 6)); // Faster, splatter-like
                     p.vel = splashVel;
                     
                     p.lifespan = 150; // Shorter lived than smoke
                     p.r = random(2, 5); // Varying chunks
                     
                     particles.push(p);
                 }
             }
         }
    }
  }
  
  display() {
    super.display();
    this.drawHealthHearts();
    if (this.hasShield) {
        push();
        let isoPos = projectIso(this.pos.x, this.pos.y);
        translate(isoPos.x, isoPos.y);
        
        // Pulsing effect
        let pulse = sin(frameCount * 0.1) * 5;
        // Increase size to fully enclose the car (Car length ~36)
        let sW = this.r * 5 + pulse; // ~80 + pulse
        let sH = sW * 0.5; // Isometric aspect ratio 2:1 for ground circle
        
        // Draw Ground Ring
        noFill();
        stroke(0, 255, 255);
        strokeWeight(2);
        ellipse(0, 0, sW, sH);
        
        // Draw "Bubble" (Sphere-like)
        // Adjust offset to cover the car height
        fill(0, 255, 255, 40); // Slightly more opaque
        noStroke();
        // Shift up to center the sphere over the car body
        // Moved down by 20px (accumulated) as requested to better fit the car
        ellipse(0, -this.r * 1.5 + 20, sW, sW * 0.9); 
        
        pop();
    }
  }

  drawHealthHearts() {
    push();
    let isoPos = projectIso(this.pos.x, this.pos.y);
    translate(isoPos.x, isoPos.y);

    let heartCount = max(0, floor(this.hp));
    let spacing = 14;
    let startX = -((heartCount - 1) * spacing) / 2;
    let yOffset = -(this.width || 20) / 2 - 24;

    for (let i = 0; i < heartCount; i++) {
      push();
      translate(startX + i * spacing, yOffset);
      scale(0.8);
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

    pop();
  }
}

class Enemy extends Vehicle {
  constructor(x, y) {
    super(x, y, color(255, 0, 0));
    this.maxSpeed = 3.6;
    if (typeof difficulty !== 'undefined' && difficulty === 'HARD') {
        this.maxSpeed = 4.0; // Faster in Hard mode
    }
    this.maxForce = 0.12;
    this.hp = 5; // Reasonable HP
    this.maxHp = 5;
  }

  seek(target) {
    let desired = p5.Vector.sub(target.pos, this.pos);

    if (desired.mag() > 0) {
        desired.setMag(this.maxSpeed);
    }
    
    let steer = p5.Vector.sub(desired, this.vel);
    steer.limit(this.maxForce);
    this.applyForce(steer);
    
    // Rotate to face velocity

    if (this.vel.mag() > 0.1) {
        this.heading = this.vel.heading();
    }
  }

  update(target) {
    this.seek(target);
    this.separate();
    super.update();
  }

  separate() {
    if (!Array.isArray(enemies) || enemies.length < 2) return;
    let desiredSeparation = this.r * 2.5;
    let steer = createVector(0, 0);
    let count = 0;
    for (let other of enemies) {
      if (other === this) continue;
      let d = p5.Vector.dist(this.pos, other.pos);
      if (d > 0 && d < desiredSeparation) {
        let diff = p5.Vector.sub(this.pos, other.pos);
        diff.normalize();
        diff.div(max(d, 0.01));
        steer.add(diff);
        count++;
      }
    }
    if (count === 0) return;
    steer.div(count);
    if (steer.mag() === 0) return;
    steer.setMag(this.maxSpeed);
    steer.sub(this.vel);
    steer.limit(this.maxForce * 1.8);
    this.applyForce(steer);
  }

  display() {
    push();
    let isoPos = projectIso(this.pos.x, this.pos.y);
    translate(isoPos.x, isoPos.y);

    let headingVec = p5.Vector.fromAngle(this.heading);
    let isoHeadingVec = projectIsoVector(headingVec.x, headingVec.y);
    let isoAngle = isoHeadingVec.heading();
    rotate(isoAngle);

    rectMode(CENTER);

    // Shadow
    fill(0, 80);
    noStroke();
    rect(2, 4, this.length, this.width, 5);

    // Chassis (Black Bottom)
    fill(20);
    stroke(0);
    strokeWeight(1);
    rect(0, 0, this.length, this.width, 4);

    // Body (White Middle) - Police Design
    fill(255);
    // Draw white doors/middle section
    rect(0, 0, this.length * 0.6, this.width, 2);

    // Hood & Trunk (Black)
    fill(20);
    // Front Hood
    rect(this.length * 0.35, 0, this.length * 0.3, this.width * 0.9, 2);
    // Rear Trunk
    rect(-this.length * 0.35, 0, this.length * 0.3, this.width * 0.9, 2);

    // Windshield / Roof
    fill(50, 50, 70); // Dark Glass
    rect(0, 0, this.length * 0.4, this.width * 0.7, 3);
    
    // Siren Light Bar
    noStroke();
    let blink = floor(millis() / 150) % 2 === 0;
    
    // Light Bar Base
    fill(50);
    rect(0, 0, 4, this.width * 0.8);
    
    // Lights
    if (blink) {
        fill(255, 0, 0); // Red Left
        rect(0, -this.width * 0.25, 6, 6);
        fill(0, 0, 255); // Blue Right
        rect(0, this.width * 0.25, 6, 6);
        
        // Glow Effect
        fill(255, 0, 0, 100);
        ellipse(0, -this.width * 0.25, 20, 20);
        fill(0, 0, 255, 100);
        ellipse(0, this.width * 0.25, 20, 20);
    } else {
        fill(0, 0, 255); // Blue Left
        rect(0, -this.width * 0.25, 6, 6);
        fill(255, 0, 0); // Red Right
        rect(0, this.width * 0.25, 6, 6);
        
        // Glow Effect
        fill(0, 0, 255, 100);
        ellipse(0, -this.width * 0.25, 20, 20);
        fill(255, 0, 0, 100);
        ellipse(0, this.width * 0.25, 20, 20);
    }

    pop();

    // Draw Health Bar
    this.drawHealthBar();
  }

  drawHealthBar() {
    push();
    let isoPos = projectIso(this.pos.x, this.pos.y);
    translate(isoPos.x, isoPos.y);
    
    let barWidth = 40;
    let barHeight = 6;
    let yOffset = -(this.width || 20) / 2 - 20; // Position above the car in iso space

    // Background (gray)
    fill(50, 50, 50, 200);
    noStroke();
    rectMode(CENTER);
    rect(0, yOffset, barWidth, barHeight, 3);

    // Health (red to green depending on hp percentage)
    let hpPercent = Math.max(0, this.hp / this.maxHp);
    
    // Shield color override
    if (this.isShielded) {
        fill(100, 200, 255); // Shield color
    } else {
        if (hpPercent > 0.6) fill(50, 200, 50); // Green
        else if (hpPercent > 0.3) fill(255, 200, 0); // Yellow
        else fill(255, 50, 50); // Red
    }

    rectMode(CORNER);
    rect(-barWidth / 2, yOffset - barHeight / 2, barWidth * hpPercent, barHeight, 3);

    // Outline
    noFill();
    stroke(20, 20, 20);
    strokeWeight(1);
    rectMode(CENTER);
    rect(0, yOffset, barWidth, barHeight, 3);
    
    pop();
  }
}


class Projectile {
  constructor(x, y, heading, type) {
    this.pos = createVector(x, y);
    this.origin = this.pos.copy();
    this.type = type;
    this.heading = heading;
    this.direction = p5.Vector.fromAngle(heading);
    this.vel = this.direction.copy();
    this.hitList = []; // For penetrating weapons
    
    let config = WEAPON_CONFIG[type];
    if (!config) {
        // Fallback or error
        config = WEAPON_CONFIG['pistol'];
    }

    this.r = config.r || 4;
    this.lifespan = config.lifespan || 60;
    this.color = config.color ? color(config.color[0], config.color[1], config.color[2]) : color(255);
    this.speed = config.speed || 10;

    // Special handling
    this.isLaserBeam = (type === WEAPON_TYPES.LASER);
    this.isMolotov = (type === WEAPON_TYPES.MOLOTOV);
    this.isFireArea = false;
    this.target = null;

    if (this.isLaserBeam) {
        this.duration = config.duration || this.lifespan;
        this.maxBeamLength = config.maxLength || max(
            typeof mapWidth !== 'undefined' ? mapWidth : 0,
            typeof mapHeight !== 'undefined' ? mapHeight : 0,
            2200
        );
        this.beamWidth = config.beamWidth || 26;
        this.growFrames = config.growFrames || 6;
        this.fadeFrames = config.fadeFrames || 12;
        this.beamEnd = this.origin.copy();
        this.sourceEntity = null;
        this.sourceForwardOffset = 0;
        this.vel.mult(0);
        this.updateLaserGeometry();
    } else {
        this.vel.mult(this.speed);
    }
  }

  attachToEntity(entity, forwardOffset = 0) {
      this.sourceEntity = entity || null;
      this.sourceForwardOffset = forwardOffset || 0;
      this.refreshLaserAnchor();
  }

  refreshLaserAnchor() {
      if (!this.isLaserBeam || !this.sourceEntity) return;

      this.heading = this.sourceEntity.heading;
      this.direction = p5.Vector.fromAngle(this.heading);

      let forward = this.direction.copy().mult(this.sourceForwardOffset);
      this.origin = p5.Vector.add(this.sourceEntity.pos, forward);
      this.pos = this.origin.copy();
  }

  getLaserThickness() {
      if (!this.isLaserBeam) return this.r * 2;

      let age = max(0, this.duration - this.lifespan);
      let maxWidth = this.beamWidth;

      if (age < this.growFrames) {
          return lerp(2, maxWidth, age / max(1, this.growFrames));
      }
      if (this.lifespan < this.fadeFrames) {
          return lerp(2, maxWidth, this.lifespan / max(1, this.fadeFrames));
      }
      return maxWidth;
  }

  isBlockingBuildingPoint(point, building) {
      let size = building.getCollisionSize ? building.getCollisionSize() : { w: building.w, h: building.h };
      let center = building.getCollisionCenter ? building.getCollisionCenter() : building.pos;
      let halfW = size.w / 2;
      let halfH = size.h / 2;
      return (
          point.x >= center.x - halfW &&
          point.x <= center.x + halfW &&
          point.y >= center.y - halfH &&
          point.y <= center.y + halfH
      );
  }

  isBlockingObstaclePoint(point, obstacle) {
      return obstacle.isSolid && p5.Vector.dist(point, obstacle.pos) <= obstacle.w / 2;
  }

  updateLaserGeometry() {
      if (!this.isLaserBeam) return;

      let step = 12;
      let lastFreeDistance = 0;
      for (let distance = step; distance <= this.maxBeamLength; distance += step) {
          let sample = p5.Vector.add(this.origin, p5.Vector.mult(this.direction, distance));
          let blocked = false;

          for (let b of buildings) {
              if (this.isBlockingBuildingPoint(sample, b)) {
                  blocked = true;
                  break;
              }
          }

          if (!blocked) {
              for (let o of obstacles) {
                  if (this.isBlockingObstaclePoint(sample, o)) {
                      blocked = true;
                      break;
                  }
              }
          }

          if (blocked) {
              break;
          }
          lastFreeDistance = distance;
      }

      this.beamLength = lastFreeDistance;
      this.beamEnd = p5.Vector.add(this.origin, p5.Vector.mult(this.direction, this.beamLength));
  }

  pointToSegmentDistance(point, segStart, segEnd) {
      let segment = p5.Vector.sub(segEnd, segStart);
      let segmentLengthSq = segment.magSq();
      if (segmentLengthSq <= 0.0001) {
          return p5.Vector.dist(point, segStart);
      }

      let toPoint = p5.Vector.sub(point, segStart);
      let t = constrain(toPoint.dot(segment) / segmentLengthSq, 0, 1);
      let projection = p5.Vector.add(segStart, p5.Vector.mult(segment, t));
      return p5.Vector.dist(point, projection);
  }

  setTarget(tx, ty) {
      if (this.isMolotov) {
          this.target = createVector(tx, ty);
          // Calculate velocity to reach target in ~30 frames?
          // Or move at constant speed?
          // Let's move at constant speed.
          let dir = p5.Vector.sub(this.target, this.pos);
          let dist = dir.mag();
          dir.normalize();
          this.vel = dir.mult(this.speed);
          this.lifespan = dist / this.speed + 10; // Ensure it reaches
      }
  }

  update() {
    if (this.isLaserBeam) {
        this.lifespan--;
        this.refreshLaserAnchor();
        this.updateLaserGeometry();
        return;
    }

    if (this.isFireArea) {
        this.lifespan--;
        return;
    }

    this.pos.add(this.vel);
    this.lifespan--;

    if (this.isMolotov && this.target) {
        // Check if reached target
        if (this.pos.dist(this.target) < this.speed) {
            // Explode!
            this.becomeFireArea();
        }
    }
  }

  becomeFireArea() {
      this.isFireArea = true;
      this.vel.mult(0);
      let config = WEAPON_CONFIG[WEAPON_TYPES.MOLOTOV];
      this.lifespan = config.areaDuration || 300;
      this.r = config.areaRadius || 60; // AOE Radius
      this.fireParticles = []; // Initialize fire particles
  }

  display() {
    if (this.isLaserBeam) {
        push();
        let startIso = projectIso(this.origin.x, this.origin.y);
        let endIso = projectIso(this.beamEnd.x, this.beamEnd.y);
        let beamWidth = this.getLaserThickness() * (0.96 + 0.08 * sin(frameCount * 0.6));

        strokeCap(ROUND);
        noFill();

        stroke(40, 120, 255, 35);
        strokeWeight(beamWidth * 2.1);
        line(startIso.x, startIso.y, endIso.x, endIso.y);

        stroke(70, 180, 255, 90);
        strokeWeight(beamWidth * 1.35);
        line(startIso.x, startIso.y, endIso.x, endIso.y);

        stroke(140, 235, 255, 180);
        strokeWeight(beamWidth * 0.72);
        line(startIso.x, startIso.y, endIso.x, endIso.y);

        stroke(235, 250, 255, 235);
        strokeWeight(max(2, beamWidth * 0.2));
        line(startIso.x, startIso.y, endIso.x, endIso.y);

        noStroke();
        fill(150, 230, 255, 180);
        ellipse(startIso.x, startIso.y, beamWidth * 1.35, beamWidth * 1.35);
        fill(200, 245, 255, 150);
        ellipse(endIso.x, endIso.y, beamWidth * 0.85, beamWidth * 0.85);
        pop();
        return;
    }

    push();
    let isoPos = projectIso(this.pos.x, this.pos.y);
    translate(isoPos.x, isoPos.y);
    
    if (this.isFireArea) {
        // --- Enhanced Fire Effect ---
        
        // 1. Scorch Mark (Base)
        noStroke();
        fill(20, 10, 5, 100);
        ellipse(0, 0, this.r * 2.2, this.r * 1.1); // Slightly larger dark patch
        
        // 2. Heat Haze / Glow (Pulsing)
        let pulse = sin(frameCount * 0.1);
        fill(255, 80, 0, 30 + pulse * 10);
        ellipse(0, 0, this.r * 2.5, this.r * 1.25);
        
        // 3. Fire Particles
        // Generate new particles occasionally
        if (frameCount % 2 === 0) {
            let angle = random(TWO_PI);
            let dist = random(this.r * 0.8);
            // Elliptical distribution for ISO
            let px = cos(angle) * dist;
            let py = sin(angle) * dist * 0.5;
            
            this.fireParticles.push({
                x: px,
                y: py,
                size: random(10, 25),
                life: 255,
                decay: random(5, 15),
                driftX: random(-0.5, 0.5),
                driftY: random(-1, -3), // Rise up
                colorOffset: random(0, 50)
            });
        }
        
        // Update & Draw Particles
        for (let i = this.fireParticles.length - 1; i >= 0; i--) {
            let p = this.fireParticles[i];
            p.life -= p.decay;
            p.x += p.driftX;
            p.y += p.driftY;
            p.size *= 0.95; // Shrink
            
            if (p.life <= 0) {
                this.fireParticles.splice(i, 1);
                continue;
            }
            
            // Color gradient: White -> Yellow -> Orange -> Red -> Smoke
            let c;
            if (p.life > 180) c = color(255, 255, 100, p.life); // Yellow-White
            else if (p.life > 100) c = color(255, 150 + p.colorOffset, 0, p.life); // Orange
            else c = color(150, 50, 50, p.life); // Dark Red/Smoke
            
            fill(c);
            ellipse(p.x, p.y, p.size, p.size);
        }
        
    } else if (this.type === WEAPON_TYPES.MOLOTOV) {
        // Draw Bottle
        fill(this.color);
        stroke(255);
        strokeWeight(1);
        rectMode(CENTER);
        
        // Spin effect
        rotate(frameCount * 0.2);
        rect(0, 0, 10, 20);
    } else {
        fill(this.color);
        noStroke();
        ellipse(0, 0, this.r * 2);
    }
    pop();
  }

  isDead() {
    return this.lifespan < 0;
  }

  checkCollision(enemy) {
    if (this.isLaserBeam) {
        let effectiveRadius = this.getLaserThickness() * 0.45 + enemy.r * 0.75;
        return this.pointToSegmentDistance(enemy.pos, this.origin, this.beamEnd) <= effectiveRadius;
    }

    if (this.isFireArea) {
        // AOE damage
        let d = p5.Vector.dist(this.pos, enemy.pos);
        if (d < this.r + enemy.r) {
            // Apply damage every frame? Or throttled?
            // Usually fire does continuous damage.
            // Let's return true but NOT kill the projectile.
            // But we need to avoid applying damage every single frame if it's too high.
            // Let's assume damage is low per frame.
            return true;
        }
        return false;
    }

    let d = p5.Vector.dist(this.pos, enemy.pos);
    if (d < this.r + enemy.r) {
        if (this.hitList.includes(enemy)) return false; // Already hit this enemy

        let config = WEAPON_CONFIG[this.type];
        if (config && config.penetrates) {
            this.hitList.push(enemy);
            return true; // Hit, but don't destroy projectile
        }
        return true; // Hit and destroy
    }
    return false;
  }
}

class PowerUp {
  constructor(x, y, type) {
    this.pos = createVector(x, y);
    this.type = type; // 'speed', 'shield', 'health', 'coin'
    this.r = 10;
    this.value = type === 'coin' ? 10 : 0;
  }

  display() {
    push();
    let isoPos = projectIso(this.pos.x, this.pos.y);
    translate(isoPos.x, isoPos.y);
    
    // Scale up for better visibility
    scale(1.8);
    
    // Floating animation
    let floatY = sin(frameCount * 0.05) * 5;
    
    // Draw Shadow on ground (fixed, doesn't float)
    push();
    translate(0, 15); 
    fill(0, 0, 0, 50);
    noStroke();
    ellipse(0, 0, 16, 6);
    pop();

    // Draw Item (floating)
    translate(0, floatY);
    
    // Glowing Halo
    let pulse = 20 + sin(frameCount * 0.1) * 5;
    noStroke();
    if (this.type === 'speed') fill(255, 255, 0, 100);
    else if (this.type === 'shield') fill(0, 255, 255, 100);
    else if (this.type === 'coin') fill(255, 215, 0, 120);
    else fill(255, 50, 50, 100);
    ellipse(0, 0, pulse, pulse);

    strokeWeight(2);
    
    if (this.type === 'speed') {
      // Lightning Bolt Icon
      fill(255, 255, 0); // Yellow
      stroke(255, 200, 0); // Orange outline
      
      beginShape();
      vertex(4, -12);
      vertex(-4, -2);
      vertex(0, -2);
      vertex(-6, 12);
      vertex(6, 2);
      vertex(2, 2);
      endShape(CLOSE);
      
    } else if (this.type === 'shield') {
      // Shield Icon
      fill(0, 255, 255); // Cyan
      stroke(0, 100, 255); // Blue outline
      
      beginShape();
      vertex(-9, -9);
      vertex(9, -9);
      vertex(9, 3);
      bezierVertex(9, 11, 0, 15, 0, 15); // Bottom curve
      bezierVertex(0, 15, -9, 11, -9, 3);
      endShape(CLOSE);
      
      // Inner detail
      noFill();
      stroke(255, 255, 255, 200);
      strokeWeight(2);
      beginShape();
      vertex(-5, -5);
      vertex(5, -5);
      vertex(5, 2);
      bezierVertex(5, 8, 0, 11, 0, 11);
      bezierVertex(0, 11, -5, 8, -5, 2);
      endShape(CLOSE);

    } else if (this.type === 'health') {
      // Medkit Icon
      fill(255); // White box
      stroke(200); // Gray outline
      rectMode(CENTER);
      rect(0, 0, 24, 20, 4); // Slightly larger
      
      // Handle
      noFill();
      stroke(150);
      strokeWeight(2);
      arc(0, -10, 10, 10, PI, TWO_PI);

      // Red Cross
      fill(255, 0, 0);
      noStroke();
      rect(0, 1, 8, 14); // Vertical bar
      rect(0, 1, 14, 8); // Horizontal bar
    } else if (this.type === 'coin') {
      fill(255, 215, 0);
      stroke(200, 150, 0);
      ellipse(0, 0, 14, 14);
      fill(200, 150, 0);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(10);
      text("$", 0, 0);
    } else if (this.type === WEAPON_TYPES.DONGFENG || this.type === WEAPON_TYPES.LOITERING || this.type === WEAPON_TYPES.ATOMIC) {
        let weaponIcon = images && images.weaponShop ? images.weaponShop[this.type] : null;
        if (weaponIcon) {
          push();
          imageMode(CENTER);
          noStroke();
          tint(255, 245);
          let maxSide = 24;
          let ratio = min(maxSide / weaponIcon.width, maxSide / weaponIcon.height);
          let drawW = weaponIcon.width * ratio;
          let drawH = weaponIcon.height * ratio;
          image(weaponIcon, 0, 0, drawW, drawH);
          noTint();
          pop();
        } else if (this.type === WEAPON_TYPES.DONGFENG) {
          fill(200);
          stroke(100);
          rect(0, 0, 10, 20);
          triangle(-5, 10, 5, 10, 0, -15);
        } else if (this.type === WEAPON_TYPES.LOITERING) {
          fill(100, 100, 255);
          rect(0, 0, 20, 10);
          ellipse(0, 0, 5, 5);
        } else {
          fill(0);
          stroke(255, 255, 0);
          ellipse(0, 0, 20, 20);
          fill(255, 255, 0);
          arc(0, 0, 20, 20, 0, PI/3);
          arc(0, 0, 20, 20, 2 * PI/3, PI);
          arc(0, 0, 20, 20, 4 * PI/3, 5 * PI/3);
        }
    }

    pop();
  }

  checkCollision(vehicle) {
    let d = p5.Vector.dist(this.pos, vehicle.pos);
    let extraRange = 24;
    if (this.type === 'coin') extraRange = 34;
    if (this.type === WEAPON_TYPES.DONGFENG || this.type === WEAPON_TYPES.LOITERING || this.type === WEAPON_TYPES.ATOMIC) {
      extraRange = 36;
    }
    return d < this.r + vehicle.r + extraRange;
  }
}

class Building {
  constructor(x, y, w, h, type = 'normal', img = null, label = null) {
    this.pos = createVector(x, y);
    this.w = w;
    this.h = h;
    this.type = type; // 'normal', 'hospital', 'armory'
    this.img = img;
    this.label = label;
    this.lastInteractionTime = 0;
    this.cooldown = 2000; // 2 seconds interaction cooldown
    this.seed = random(10000); // Random seed for building details
  }

  getDisplayImage() {
    let displayImg = this.img;
    if (this.type === 'hospital' && typeof hospitalImg !== 'undefined' && hospitalImg) displayImg = hospitalImg;
    if (this.type === 'armory' && typeof armoryImg !== 'undefined' && armoryImg) displayImg = armoryImg;
    return displayImg;
  }

  getImageDrawSize(displayImg) {
    let imgAspect = displayImg.width / displayImg.height;
    let scale = this.img ? 1.5 : 1.1;
    let size = max(this.w, this.h) * scale;
    let drawW, drawH;
    if (imgAspect > 1) {
      drawW = size;
      drawH = size / imgAspect;
    } else {
      drawH = size;
      drawW = size * imgAspect;
    }
    return { w: drawW, h: drawH };
  }

  getCollisionSize() {
    let displayImg = this.getDisplayImage();
    if (displayImg) {
      let drawSize = this.getImageDrawSize(displayImg);
      return { w: drawSize.w, h: drawSize.h };
    }
    return { w: this.w, h: this.h };
  }

  getCollisionCenter() {
    let displayImg = this.getDisplayImage();
    if (displayImg) {
      let drawSize = this.getImageDrawSize(displayImg);
      return { x: this.pos.x, y: this.pos.y - drawSize.h / 4 };
    }
    return { x: this.pos.x, y: this.pos.y };
  }

  getInteractionCenter() {
    let displayImg = this.getDisplayImage();
    if (displayImg) {
      let drawSize = this.getImageDrawSize(displayImg);
      // Interactions should happen near the building footprint rather than the roof center.
      return { x: this.pos.x, y: this.pos.y + drawSize.h * 0.08 };
    }
    return { x: this.pos.x, y: this.pos.y };
  }

  display() {
    push();
    let isoPos = projectIso(this.pos.x, this.pos.y);
    translate(isoPos.x, isoPos.y);
    rectMode(CENTER);
    
    // --- Special handling for Image Mode (Hospital, Armory, or Generic Image) ---
    let displayImg = this.getDisplayImage();
    if (displayImg) {
        let drawSize = this.getImageDrawSize(displayImg);
        image(displayImg, 0, -drawSize.h / 4, drawSize.w, drawSize.h);
        
        if (millis() - this.lastInteractionTime < this.cooldown) {
            fill(0, 0, 0, 100);
            noStroke();
            rect(0, -drawSize.h / 4, drawSize.w, drawSize.h); 
        }
        pop();
        return;
    }

    // --- Pseudo-3D Depth (Side Walls) ---
    // Draw a darker rectangle slightly offset to simulate height
    let depth = 15; // How tall the building looks
    
    // Shadow/Side
    fill(30, 30, 30, 200); 
    noStroke();
    // Draw "extrusion" downwards to simulate 3D perspective from top-down
    rect(0, depth/2, this.w, this.h + depth); 
    
    // --- Roof (Main Building Surface) ---
    stroke(0);
    strokeWeight(2);
    
    if (this.type === 'hospital') {
        this.drawHospital();
    } else if (this.type === 'armory') {
        this.drawArmory();
    } else {
        this.drawNormalBuilding();
    }
    
    // Cooldown indicator (dim if recently used)
    if (millis() - this.lastInteractionTime < this.cooldown) {
        fill(0, 0, 0, 100);
        noStroke();
        rect(0, 0, this.w, this.h);
    }

    pop();
  }

  drawHospital() {
      if (typeof hospitalImg !== 'undefined' && hospitalImg) {
          // User requested: No base, larger icon
          
          let imgAspect = hospitalImg.width / hospitalImg.height;
          
          // Calculate size to be larger than building bounds
          // Base size on max dimension
          let size = max(this.w, this.h) * 1.1;
          
          let drawW, drawH;
          if (imgAspect > 1) {
              drawW = size;
              drawH = size / imgAspect;
          } else {
              drawH = size;
              drawW = size * imgAspect;
          }
          
          image(hospitalImg, 0, 0, drawW, drawH);
          return;
      }
      // Fallback if image not loaded
      // White clean roof
      fill(240, 240, 255);
      stroke(150);
      strokeWeight(1);
      rect(0, 0, this.w, this.h);
      
      // Helipad H
      noStroke();
      fill(200, 200, 220);
      ellipse(0, 0, this.h * 0.7, this.h * 0.7);
      
      fill(255, 50, 50); // Red H
      textAlign(CENTER, CENTER);
      textSize(32);
      textStyle(BOLD);
      text("H", 0, 0);
      textStyle(NORMAL); // Reset
      
      // Red Cross Sign (on a small raised section)
      push();
      translate(-this.w/3, -this.h/3);
      fill(255);
      stroke(200);
      strokeWeight(1);
      rect(0, 0, 25, 25);
      
      fill(255, 0, 0);
      noStroke();
      rect(0, 0, 6, 18);
      rect(0, 0, 18, 6);
      pop();
      
      // Some vents/details
      fill(200);
      stroke(150);
      rect(this.w/3, this.h/3, 20, 15);
  }

  drawArmory() {
      if (typeof armoryImg !== 'undefined' && armoryImg) {
          // Same logic as hospital: scale up and maintain aspect ratio
          let imgAspect = armoryImg.width / armoryImg.height;
          let size = max(this.w, this.h) * 1.1; 
          
          let drawW, drawH;
          if (imgAspect > 1) {
              drawW = size;
              drawH = size / imgAspect;
          } else {
              drawH = size;
              drawW = size * imgAspect;
          }
          
          image(armoryImg, 0, 0, drawW, drawH);
          return;
      }
      
      // Dark Metallic / Camo Green
      fill(60, 70, 60); // Dark Camo Green
      stroke(30);
      strokeWeight(2);
      rect(0, 0, this.w, this.h);
      
      // Reinforced Corners
      fill(40, 50, 40);
      noStroke();
      rect(-this.w/2 + 10, -this.h/2 + 10, 20, 20);
      rect(this.w/2 - 10, -this.h/2 + 10, 20, 20);
      rect(-this.w/2 + 10, this.h/2 - 10, 20, 20);
      rect(this.w/2 - 10, this.h/2 - 10, 20, 20);
      
      // "GUNS" Sign / Weapon Icon on roof
      fill(30);
      stroke(100);
      strokeWeight(2);
      rect(0, 0, 60, 40);
      
      // Gun Silhouette (White)
      fill(200);
      noStroke();
      beginShape();
      vertex(-15, 5);
      vertex(5, 5);
      vertex(5, -5);
      vertex(15, -5);
      vertex(15, -10);
      vertex(-5, -10);
      vertex(-5, 0);
      vertex(-15, 0);
      endShape(CLOSE);
      
      // Ammo Crates on roof
      fill(100, 80, 50); // Wood color
      rect(this.w/3, -this.h/4, 15, 15);
      rect(this.w/3 + 5, -this.h/4 + 5, 15, 15);
  }

  drawNormalBuilding() {
      randomSeed(this.seed); // Use stored seed for consistency
      
      // Random Roof Color
      let gray = random(80, 150);
      fill(gray);
      stroke(50);
      strokeWeight(1);
      rect(0, 0, this.w, this.h);
      
      // Roof Border (Parapet)
      noFill();
      stroke(gray - 30);
      strokeWeight(4);
      rect(0, 0, this.w - 4, this.h - 4);
      
      // Random Details (AC Units, Vents, Skylights)
      noStroke();
      let numDetails = floor(random(2, 5));
      
      for(let i=0; i<numDetails; i++) {
          let dx = random(-this.w/2 + 15, this.w/2 - 15);
          let dy = random(-this.h/2 + 15, this.h/2 - 15);
          let dw = random(10, 30);
          let dh = random(10, 30);
          let type = floor(random(3));
          
          push();
          translate(dx, dy);
          if (type === 0) {
              // AC Unit
              fill(200);
              rect(0, 0, dw, dh);
              fill(100);
              ellipse(0, 0, min(dw, dh) * 0.6); // Fan
          } else if (type === 1) {
              // Skylight
              fill(50, 100, 150); // Blue glass
              rect(0, 0, dw, dh);
              stroke(200);
              strokeWeight(1);
              line(-dw/2, -dh/2, dw/2, dh/2); // Reflection line
          } else {
              // Vent Box
              fill(120);
              rect(0, 0, dw, dh);
              fill(80);
              rect(0, 0, dw, dh/3); // Grate
              rect(0, dh/3, dw, dh/3);
          }
          pop();
      }
  }

  checkCollision(vehicle) {
    let size = this.getCollisionSize();
    let center = this.getCollisionCenter();
    let halfW = size.w / 2;
    let halfH = size.h / 2;
    let closestX = constrain(vehicle.pos.x, center.x - halfW, center.x + halfW);
    let closestY = constrain(vehicle.pos.y, center.y - halfH, center.y + halfH);

    // Calculate the distance between the circle's center and this closest point
    let distanceX = vehicle.pos.x - closestX;
    let distanceY = vehicle.pos.y - closestY;

    // If the distance is less than the circle's radius, an intersection occurs
    let distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);
    
    if (distanceSquared < (vehicle.r * vehicle.r)) {
        // Resolve collision
        let overlap = vehicle.r - sqrt(distanceSquared);
        let normal = createVector(distanceX, distanceY);
        normal.normalize();
        
        // Push vehicle out
        let pushOut = p5.Vector.mult(normal, overlap);
        vehicle.pos.add(pushOut);
        
        // --- Wall Sliding Physics ---
        // Instead of bouncing, we want to slide along the wall.
        // We project the velocity vector onto the wall's tangent.
        // Formula: v_new = v - (v . n) * n
        // This removes the component of velocity going INTO the wall.
        
        let vDotN = vehicle.vel.dot(normal);
        
        // Only modify velocity if moving INTO the wall
        if (vDotN < 0) {
            let normalComponent = p5.Vector.mult(normal, vDotN);
            vehicle.vel.sub(normalComponent);
            
            // Apply a small friction when sliding against wall (optional, but realistic)
            vehicle.vel.mult(0.95); 
        }

        // --- Auto-Alignment (Assist) ---
        // If the player is pressing forward (W/Up) and hitting the wall at an angle,
        // help align the car parallel to the wall so they don't get stuck.
        if (keyIsDown(UP_ARROW) || keyIsDown(87)) { // Up or W
            // Calculate tangent vector (perpendicular to normal)
            let tangent = createVector(-normal.y, normal.x);
            
            // Check which tangent direction is closer to current heading
            let headingVec = p5.Vector.fromAngle(vehicle.heading);
            if (headingVec.dot(tangent) < 0) {
                tangent.mult(-1); // Flip tangent to match general forward direction
            }
            
            // Get angle of the wall tangent
            let targetAngle = tangent.heading();
            
            // Smoothly rotate vehicle heading towards target angle
            // Use lerpAngle-like logic (handling wrap-around manually or simple approach)
            let angleDiff = targetAngle - vehicle.heading;
            
            // Normalize angle diff to -PI to PI
            while (angleDiff > PI) angleDiff -= TWO_PI;
            while (angleDiff < -PI) angleDiff += TWO_PI;
            
            // Nudge heading towards wall tangent
            vehicle.heading += angleDiff * 0.1; // 10% alignment per frame
        }
        
        return true;
    }
    return false;
  }
  
  interact(player) {
      // Automatic interaction removed in favor of manual F key interaction
      return false;
  }

  isInteractable() {
      return this.type === 'hospital' || this.type === 'armory';
  }

  getInteractionRange(player) {
      let size = this.getCollisionSize();
      let playerRadius = player && Number.isFinite(player.r) ? player.r : 20;
      return max(size.w, size.h) * 0.6 + playerRadius + 36;
  }

  isPlayerInRange(player) {
      if (!player || !this.isInteractable()) return false;
      let center = this.getInteractionCenter();
      return dist(player.pos.x, player.pos.y, center.x, center.y) <= this.getInteractionRange(player);
  }

  getDisplayName() {
      if (this.label) return this.label;
      if (this.type === 'hospital') return 'Hospital';
      if (this.type === 'armory') return 'Armory';
      if (this.type === 'police') return 'Police Station';
      return 'Residence';
  }

  showNameLabel() {
      let size = this.getCollisionSize();
      let center = this.getCollisionCenter();
      let label = this.getDisplayName();
      if (!label) return;

      push();
      let isoPos = projectIso(center.x, center.y);
      let offset = max(size.w, size.h) * 0.6 + 8;
      translate(isoPos.x, isoPos.y - offset);
      rectMode(CENTER);
      textAlign(CENTER, CENTER);
      textSize(12);

      let paddingX = 14;
      let boxW = max(96, textWidth(label) + paddingX * 2);
      fill(0, 0, 0, 170);
      noStroke();
      rect(0, 0, boxW, 24, 6);

      fill(255);
      text(label, 0, 1);
      pop();
  }

  showTooltip(player) {
      if (!player || !this.isPlayerInRange(player)) return;
      let size = this.getCollisionSize();
      push();
      let center = this.getCollisionCenter();
      let isoPos = projectIso(center.x, center.y);
      let offset = max(size.w, size.h) * 0.6 + 36;
      translate(isoPos.x, isoPos.y - offset);
      fill(0, 0, 0, 200);
      noStroke();
      rectMode(CENTER);
      let lines = [];
      if (this.isInteractable()) {
          lines.push("Press F to Interact");
      }
      if (lines.length === 0) {
          pop();
          return;
      }
      let boxH = 24;
      rect(0, 0, 160, boxH, 5);
      
      fill(255);
      textAlign(CENTER, CENTER);
      textSize(12);
      text(lines.join("\n"), 0, 0);
      pop();
  }
}

class AuthUI {
  constructor() {
    this.container = null;
    this.state = 'login';
    this.apiBaseUrl = this.resolveApiBaseUrl();
    this.token = localStorage.getItem('authToken');
    this.user = JSON.parse(localStorage.getItem('user') || 'null');
    this.pendingVerificationEmail = '';
    this.onCloseRequested = null;
  }

  resolveApiBaseUrl() {
    let explicit = '';
    if (typeof window !== 'undefined' && window.__API_BASE_URL__) {
      explicit = String(window.__API_BASE_URL__).trim();
    }
    if (!explicit) {
      let saved = localStorage.getItem('apiBaseUrl');
      if (saved) explicit = String(saved).trim();
    }
    if (explicit) {
      return explicit.replace(/\/+$/, '');
    }

    let origin = window.location.origin;
    let host = window.location.hostname;
    let port = window.location.port;
    let isLocalHost = host === 'localhost' || host === '127.0.0.1';
    if (isLocalHost && port !== '3000') {
      return 'http://localhost:3000';
    }
    return origin;
  }

  isLoggedIn() {
    return !!this.token;
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    location.reload();
  }

  show() {
    if (this.container) return;

    this.container = createDiv('');
    this.container.position(0, 0);
    this.container.size(windowWidth, windowHeight);
    this.container.style('background', 'rgba(0, 0, 0, 0.85)');
    this.container.style('display', 'flex');
    this.container.style('justify-content', 'center');
    this.container.style('align-items', 'center');
    this.container.style('z-index', '1000');

    this.render();
  }

  hide() {
    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }

  requestClose() {
    this.hide();
    if (typeof this.onCloseRequested === 'function') {
      this.onCloseRequested();
    }
  }

  render() {
    if (!this.container) return;
    this.container.html('');

    let box = createDiv('');
    box.parent(this.container);
    box.addClass('auth-box');
    box.style('position', 'relative');

    let closeBtn = createButton('✕');
    closeBtn.parent(box);
    closeBtn.addClass('auth-close-btn');
    closeBtn.mousePressed(() => this.requestClose());

    let title = createElement('h2', this.getTitle());
    title.parent(box);
    title.addClass('auth-title');

    // Error Message Area
    this.msgBox = createDiv('');
    this.msgBox.parent(box);
    this.msgBox.addClass('auth-msg-error');

    if (this.state === 'login') {
      this.createInput(box, 'email', 'Email', 'email');
      this.createInput(box, 'password', 'Password', 'password', '', () => this.handleLogin());
      this.createButton(box, 'LOGIN', () => this.handleLogin(), 'primary');
      
      let links = createDiv('');
      links.parent(box);
      links.style('margin-top', '20px');
      links.style('font-size', '14px');
      
      let regLink = createSpan('Register');
      regLink.parent(links);
      regLink.addClass('auth-link');
      regLink.mousePressed(() => { this.state = 'register'; this.render(); });

      let forgotLink = createSpan('Forgot Password?');
      forgotLink.parent(links);
      forgotLink.addClass('auth-link');
      forgotLink.mousePressed(() => { this.state = 'forgot'; this.render(); });

    } else if (this.state === 'register') {
      this.createInput(box, 'username', 'Username', 'text');
      this.createInput(box, 'email', 'Email', 'email');
      this.createInput(box, 'password', 'Password', 'password');
      this.createButton(box, 'REGISTER', () => this.handleRegister(), 'primary');

      let links = createDiv('');
      links.parent(box);
      links.style('margin-top', '20px');
      links.style('font-size', '14px');
      
      let loginLink = createSpan('Back to Login');
      loginLink.parent(links);
      loginLink.addClass('auth-link');
      loginLink.mousePressed(() => { this.state = 'login'; this.render(); });

    } else if (this.state === 'verify') {
      let desc = createP('Enter the verification code sent to your email.');
      desc.parent(box);
      desc.style('font-size', '14px');
      desc.style('margin-bottom', '20px');
      desc.style('color', '#bdc3c7');

      this.createInput(box, 'verify-email', 'Email', 'email', this.pendingVerificationEmail);
      this.createInput(box, 'verify-code', 'Verification Code', 'text');
      this.createButton(box, 'VERIFY EMAIL', () => this.handleVerifyCode(), 'primary');
      this.createButton(box, 'RESEND CODE', () => this.handleResendCode(), 'secondary');

      let links = createDiv('');
      links.parent(box);
      links.style('margin-top', '20px');
      links.style('font-size', '14px');

      let loginLink = createSpan('Back to Login');
      loginLink.parent(links);
      loginLink.addClass('auth-link');
      loginLink.mousePressed(() => { this.state = 'login'; this.render(); });

    } else if (this.state === 'forgot') {
      let desc = createP('Enter your email to receive a password reset link.');
      desc.parent(box);
      desc.style('font-size', '14px');
      desc.style('margin-bottom', '20px');
      desc.style('color', '#bdc3c7');

      this.createInput(box, 'email', 'Email', 'email');
      this.createButton(box, 'SEND RESET LINK', () => this.handleForgot(), 'primary');

      let links = createDiv('');
      links.parent(box);
      links.style('margin-top', '20px');
      links.style('font-size', '14px');
      
      let loginLink = createSpan('Back to Login');
      loginLink.parent(links);
      loginLink.addClass('auth-link');
      loginLink.mousePressed(() => { this.state = 'login'; this.render(); });
    }
  }

  createInput(parent, id, placeholder, type, value = '', onEnter = null) {
    let wrapper = createDiv('');
    wrapper.parent(parent);
    wrapper.style('margin-bottom', '15px');
    
    let inp = createElement('input');
    inp.parent(wrapper);
    inp.id('auth-' + id);
    inp.attribute('type', type);
    inp.attribute('placeholder', placeholder);
    if (value) inp.value(value);
    inp.addClass('auth-input');
    if (onEnter) {
      inp.elt.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.repeat) {
          event.preventDefault();
          onEnter();
        }
      });
    }
  }

  createButton(parent, text, onClick, type = 'primary') {
    let btn = createButton(text);
    btn.parent(parent);
    btn.addClass('auth-btn');
    if (type === 'primary') {
        btn.addClass('auth-btn-primary');
    } else {
        btn.addClass('auth-btn-secondary');
    }
    btn.mousePressed(onClick);
  }

  getTitle() {
    if (this.state === 'login') return 'LOGIN';
    if (this.state === 'register') return 'CREATE ACCOUNT';
    if (this.state === 'verify') return 'VERIFY EMAIL';
    if (this.state === 'forgot') return 'RESET PASSWORD';
    return '';
  }

  async handleLogin() {
    let email = select('#auth-email').value();
    let password = select('#auth-password').value();

    if (!email || !password) {
      this.showMessage('Please fill in all fields');
      return;
    }

    this.showMessage('Logging in...', '#f1c40f');

    try {
      let res = await fetch(`${this.apiBaseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      let data = await res.json();

      if (res.ok) {
        this.token = data.token;
        this.user = data.user;
        localStorage.setItem('authToken', this.token);
        localStorage.setItem('user', JSON.stringify(this.user));
        this.hide();
        this.onLoginSuccess();
      } else {
        if (res.status === 403) {
          this.pendingVerificationEmail = email;
          this.state = 'verify';
          this.render();
        }
        this.showMessage(data.error || 'Login failed');
      }
    } catch (e) {
      this.showMessage('Network error. Check server.');
      console.error(e);
    }
  }

  async handleRegister() {
    let username = select('#auth-username').value();
    let email = select('#auth-email').value();
    let password = select('#auth-password').value();

    if (!username || !email || !password) {
      this.showMessage('Please fill in all fields');
      return;
    }

    this.showMessage('Registering...', '#f1c40f');

    try {
      let res = await fetch(`${this.apiBaseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });
      let data = await res.json();

      if (res.ok) {
        this.pendingVerificationEmail = email;
        this.state = 'verify';
        this.render();
        this.showMessage(data.message || 'Registration successful. Please verify your email.', '#2ecc71');
      } else {
        this.showMessage(data.error || 'Registration failed');
      }
    } catch (e) {
      this.showMessage('Network error.');
    }
  }

  async handleForgot() {
    let email = select('#auth-email').value();
    if (!email) {
      this.showMessage('Please enter your email');
      return;
    }

    this.showMessage('Sending...', '#f1c40f');

    try {
      let res = await fetch(`${this.apiBaseUrl}/api/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      let data = await res.json();

      if (res.ok) {
        this.showMessage(data.message, '#2ecc71');
      } else {
        this.showMessage(data.error || 'Request failed');
      }
    } catch (e) {
      this.showMessage('Network error.');
    }
  }

  async handleVerifyCode() {
    let email = select('#auth-verify-email').value();
    let code = select('#auth-verify-code').value();
    if (!email || !code) {
      this.showMessage('Please enter your email and verification code');
      return;
    }

    this.showMessage('Verifying...', '#f1c40f');
    try {
      let res = await fetch(`${this.apiBaseUrl}/api/auth/verify-email-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code })
      });
      let data = await res.json();
      if (res.ok) {
        this.state = 'login';
        this.pendingVerificationEmail = email;
        this.render();
        this.showMessage('Email verified. Please login now.', '#2ecc71');
      } else {
        this.showMessage(data.error || 'Verification failed');
      }
    } catch (e) {
      this.showMessage('Network error.');
    }
  }

  async handleResendCode() {
    let email = select('#auth-verify-email').value();
    if (!email) {
      this.showMessage('Please enter your email');
      return;
    }

    this.showMessage('Sending code...', '#f1c40f');
    try {
      let res = await fetch(`${this.apiBaseUrl}/api/auth/resend-verification-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      let data = await res.json();
      if (res.ok) {
        this.showMessage(data.message || 'Verification code sent.', '#2ecc71');
      } else {
        this.showMessage(data.error || 'Failed to resend code');
      }
    } catch (e) {
      this.showMessage('Network error.');
    }
  }

  showMessage(msg, color = '#e74c3c') {
    if (this.msgBox) {
      this.msgBox.html(msg);
      this.msgBox.style('color', color);
    }
  }

  onLoginSuccess() {
    console.log('Logged in!');
  }

  async loadProgress() {
    if (!this.token) return null;
    try {
      let res = await fetch(`${this.apiBaseUrl}/api/progress`, {
        headers: { 'Authorization': `Bearer ${this.token}` }
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.error('Failed to load progress', e);
    }
    return null;
  }

  async saveProgress(data) {
    if (!this.token) return;
    try {
      await fetch(`${this.apiBaseUrl}/api/progress`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.token}`
        },
        body: JSON.stringify(data)
      });
      console.log('Progress saved to server');
    } catch (e) {
      console.error('Failed to save progress', e);
    }
  }
}

class ShopUI {
  constructor() {
    this.tabs = ['WEAPONS', 'VEHICLES', 'UPGRADES'];
    this.currentTab = 'WEAPONS';
    this.sidebarWidth = 170;
    this.sidebarOffsetX = 18;
    this.sidebarOffsetY = 20;
    this.padding = 20;
    this.cardWidth = 210;
    this.cardHeight = 250;
    this.buttonHeight = 34;
    this.colors = {
      text: [245, 226, 190],
      panel: [78, 55, 37, 235],
      cardBg: [96, 66, 44, 230],
      cardBorder: [186, 132, 79, 255],
      tab: [140, 95, 60, 240],
      tabActive: [184, 123, 74, 255],
      accent: [255, 190, 96],
      success: [96, 198, 128],
      disabled: [100, 100, 100],
      button: [196, 126, 74]
    };
    this.boardX = 0;
    this.boardY = 0;
    this.boardW = 0;
    this.boardH = 0;
    this.innerX = 0;
    this.innerY = 0;
    this.innerW = 0;
    this.innerH = 0;
    this.panelX = 0;
    this.panelY = 0;
    this.panelW = 0;
    this.panelH = 0;
    this.inputOffsetX = 0;
    this.inputOffsetY = 0;
    this.lastGrid = null;
    this.scrollbarWidth = 10;
    this.scrollOffsets = { WEAPONS: 0, VEHICLES: 0, UPGRADES: 0 };
    this.lastScrollbar = null;
    this.isDraggingScrollbar = false;
    this.scrollDragOffsetY = 0;
    this.closeButtonRect = null;
    this.catalog = null;
    this.catalogLoading = false;
    this.catalogError = '';
  }

  draw(viewW = width, viewH = height, viewX = 0, viewY = 0, inputOffsetX = 0, inputOffsetY = 0) {
    push();
    rectMode(CORNER);
    this.boardX = viewX;
    this.boardY = viewY;
    this.boardW = viewW;
    this.boardH = viewH;
    this.inputOffsetX = inputOffsetX;
    this.inputOffsetY = inputOffsetY;

    if (typeof shopBoardImg !== 'undefined' && shopBoardImg) {
      imageMode(CORNER);
      image(shopBoardImg, this.boardX, this.boardY, this.boardW, this.boardH);
    } else {
      fill(133, 95, 60, 240);
      stroke(84, 56, 36);
      strokeWeight(4);
      rect(this.boardX, this.boardY, this.boardW, this.boardH, 16);
    }

    this.innerX = this.boardX + this.boardW * 0.04;
    this.innerY = this.boardY + this.boardH * 0.24;
    this.innerW = this.boardW * 0.92;
    this.innerH = this.boardH * 0.70;
    this.sidebarWidth = constrain(this.innerW * 0.18, 150, 210);

    let sidebarX = this.innerX + this.sidebarOffsetX;
    let sidebarY = this.innerY + this.sidebarOffsetY;
    let sidebarH = max(0, this.innerH - this.sidebarOffsetY);
    let contentX = sidebarX + this.sidebarWidth + this.padding;
    let contentY = this.innerY + this.padding;
    let contentW = max(0, this.innerX + this.innerW - contentX - this.padding);
    let contentH = max(0, this.innerH - this.padding * 2);

    this.panelX = sidebarX;
    this.panelY = sidebarY;
    this.panelW = this.sidebarWidth;
    this.panelH = sidebarH;

    this.drawSidebar(sidebarX, sidebarY, this.sidebarWidth, sidebarH);
    this.drawContent(contentX, contentY, contentW, contentH);
    this.drawTopBar();

    fill(255);
    noStroke();
    textAlign(CENTER, BOTTOM);
    textSize(15);
    text("Press ESC to Close", this.boardX + this.boardW / 2, this.boardY + 24);
    pop();
  }

  drawTopBar() {
    let barX = this.innerX;
    let barW = this.innerW;
    let barH = constrain(this.boardH * 0.09, 44, 70);
    let barY = this.boardY + this.boardH * 0.165;
    let barRadius = min(16, floor(barH * 0.33));
    let barPad = constrain(barH * 0.24, 10, 18);
    let closeSize = constrain(barH * 0.62, 26, 42);
    let closeX = barX + barW - barPad - closeSize;
    let closeY = barY + (barH - closeSize) / 2;
    let isCloseHover = this.isMouseOver(closeX, closeY, closeSize, closeSize);

    noStroke();

    fill(247, 232, 210);
    textAlign(CENTER, CENTER);
    textSize(constrain(barH * 0.42, 20, 34));
    text("SHOP", barX + barW * 0.45, barY + barH / 2 + 1);

    if (isCloseHover) fill(this.colors.accent);
    else fill(168, 118, 80, 240);
    rect(closeX, closeY, closeSize, closeSize, 8);

    stroke(35, 24, 15);
    strokeWeight(2.5);
    let linePad = closeSize * 0.26;
    line(closeX + linePad, closeY + linePad, closeX + closeSize - linePad, closeY + closeSize - linePad);
    line(closeX + closeSize - linePad, closeY + linePad, closeX + linePad, closeY + closeSize - linePad);
    noStroke();

    this.closeButtonRect = { x: closeX, y: closeY, w: closeSize, h: closeSize };
  }

  drawSidebar(x, y, w, h) {
    fill(72, 48, 33, 210);
    noStroke();
    rect(x, y, this.sidebarWidth, h, 10);

    fill(this.colors.text);
    textSize(18);
    textAlign(CENTER, TOP);
    text("SHOP", x + this.sidebarWidth / 2, y + 12);

    textSize(16);
    fill(255, 214, 120);
    text(`$ ${player.coins}`, x + this.sidebarWidth / 2, y + 38);

    let startY = y + 72;
    let tabH = 54;
    for (let i = 0; i < this.tabs.length; i++) {
      let tab = this.tabs[i];
      let ty = startY + i * (tabH + 10);
      let tx = x + 10;
      let tw = this.sidebarWidth - 20;
      let isHover = this.isMouseOver(tx, ty, tw, tabH);
      let isActive = this.currentTab === tab;

      if (isActive) fill(this.colors.tabActive);
      else if (isHover) fill(this.colors.tab);
      else fill(112, 76, 48, 230);
      rect(tx, ty, tw, tabH, 12);

      fill(247, 232, 210);
      textAlign(CENTER, CENTER);
      textSize(14);
      text(tab, x + this.sidebarWidth/2, ty + tabH/2);
    }
  }

  drawContent(x, y, w, h) {
    this.ensureCatalogLoaded();
    fill(this.colors.text);
    textAlign(LEFT, TOP);
    textSize(24);
    text(this.currentTab, x, y);
    let tabData = this.getCurrentTabData();
    if (tabData.loading) {
      textSize(16);
      fill(236, 216, 185);
      text('Loading shop catalog...', x, y + 42);
      this.lastGrid = null;
      this.lastScrollbar = null;
      return;
    }
    if (tabData.error) {
      textSize(16);
      fill(255, 150, 150);
      text(tabData.error, x, y + 42);
      this.lastGrid = null;
      this.lastScrollbar = null;
      return;
    }
    let listY = y + 34;
    let listH = h - 34;
    this.drawSectionedGrid(tabData.sections, tabData.type, x, listY, w, listH);
  }
  
  getCurrentTabData() {
    if (!player.ownedWeapons) player.ownedWeapons = ['pistol'];
    if (!player.ownedCars) player.ownedCars = ['starter'];
    if (!this.catalog) {
      return {
        type: 'none',
        sections: [],
        loading: this.catalogLoading,
        error: this.catalogError
      };
    }
    if (this.currentTab === 'WEAPONS') {
      let basic = this.catalog.weaponsBasic || [];
      let specials = this.catalog.weaponsSpecial || [];
      return {
        type: 'weapon',
        sections: [
            { title: "Basic Weapons", items: basic },
            { title: "Drop Weapons", items: specials }
        ]
      };
    }
    if (this.currentTab === 'VEHICLES') {
      let sourceItems = this.catalog.vehicles || [];
      let items = sourceItems.map((serverItem) => {
          let id = serverItem.id;
          let car = Object.assign({}, CAR_CATALOG[id]);
          car.name = serverItem.name;
          car.price = serverItem.price;
          car.id = id;
          return car;
        });
      return {
        type: 'vehicle',
        sections: [{ title: null, items: items }]
      };
    }
    let upgrades = this.catalog.upgrades || [];
    return { 
        type: 'upgrade', 
        sections: [{ title: null, items: upgrades }]
    };
  }

  async ensureCatalogLoaded(forceRefresh = false) {
    if (this.catalogLoading) return;
    if (this.catalog && !forceRefresh) return;
    if (typeof authUI === 'undefined' || !authUI || !authUI.token) {
      this.catalogError = 'Please login to load shop data.';
      return;
    }
    this.catalogLoading = true;
    this.catalogError = '';
    try {
      let res = await fetch(`${authUI.apiBaseUrl}/api/shop/catalog`, {
        headers: {
          Authorization: `Bearer ${authUI.token}`
        }
      });
      let data = await res.json();
      if (res.ok) {
        this.catalog = data;
      } else {
        this.catalogError = data.error || 'Failed to load shop catalog.';
      }
    } catch (error) {
      this.catalogError = 'Failed to connect to shop server.';
    } finally {
      this.catalogLoading = false;
    }
  }

  applyServerProgress(progress) {
    if (!progress || !player) return;
    let upgradeState = progress.upgradeState && typeof progress.upgradeState === 'object' ? progress.upgradeState : {};
    player.coins = progress.coins ?? player.coins;
    player.ownedWeapons = progress.ownedWeapons || [WEAPON_TYPES.PISTOL];
    player.ownedCars = progress.ownedCars || ['starter'];
    player.currentWeapon = progress.currentWeapon || player.currentWeapon || WEAPON_TYPES.PISTOL;
    player.unlockedSpecialWeapons = progress.unlockedSpecialWeapons || [];
    player.bonusMaxHp = constrain(Number(upgradeState.maxHp) || 0, 0, 2);
    player.bonusMaxAmmo = constrain(Number(upgradeState.maxAmmo) || 0, 0, 5);
    player.bonusTopSpeed = constrain(Number(upgradeState.topSpeed) || 0, 0, 5);
    player.bonusAcceleration = constrain(Number(upgradeState.acceleration) || 0, 0, 5);
    player.shieldDurationLevel = 0;
    let targetCar = progress.carType || 'starter';
    if (player.ownedCars.includes(targetCar)) {
      player.applyCarType(targetCar);
    }
    if (player.hp > player.maxHp) player.hp = player.maxHp;
    if (player.ammo > player.maxAmmo) player.ammo = player.maxAmmo;
  }

  drawSectionedGrid(sections, type, x, y, w, h) {
    if (!sections || sections.length === 0) {
      this.lastGrid = null;
      this.lastScrollbar = null;
      return;
    }
    
    let gapX = 12;
    let gapY = 16;
    let sectionGap = 24;
    let titleH = 30;
    let viewportPaddingY = 4;
    
    let cardW = this.cardWidth;
    let cardH = max(170, this.cardHeight);
    
    let availableW = w;
    let cols = 3; 
    
    // Determine layout based on available width
    // Try 3 columns
    if (3 * cardW + 2 * gapX > availableW) {
        // Try shrinking cardW
        cardW = floor((availableW - 2 * gapX) / 3);
        if (cardW < 130) {
            // Reduce to 2 cols
            cols = 2;
            cardW = floor((availableW - gapX) / 2);
            if (cardW < 130) {
                cols = 1;
                cardW = availableW;
            }
        }
    }

    // Calculate total height
    let totalH = 0;
    for(let section of sections) {
        if (section.title) totalH += titleH;
        let rows = Math.ceil(section.items.length / cols);
        if (rows > 0) {
            totalH += rows * cardH + (rows - 1) * gapY;
        }
        totalH += sectionGap;
    }
    if (totalH > 0) totalH -= sectionGap; // Remove last gap
    
    let viewportH = max(0, h - viewportPaddingY * 2);
    let needsScroll = totalH > viewportH;
    let scrollbarReserve = 0;
    
    if (needsScroll) {
        scrollbarReserve = this.scrollbarWidth + 10;
        availableW = max(0, w - scrollbarReserve);
        // Recalculate layout with reduced width
        if (3 * this.cardWidth + 2 * gapX > availableW) {
             cardW = floor((availableW - 2 * gapX) / 3);
             if (cardW < 130) {
                 cols = 2;
                 cardW = floor((availableW - gapX) / 2);
                 if (cardW < 130) {
                     cols = 1;
                     cardW = availableW;
                 }
             } else {
                 cardW = max(130, cardW);
                 cols = 3;
             }
        } else {
            cardW = this.cardWidth;
            cols = 3;
        }
        
        // Recalculate totalH isn't strictly necessary if cols didn't change, 
        // but let's do it to be safe in case row count changes
        totalH = 0;
        for(let section of sections) {
            if (section.title) totalH += titleH;
            let rows = Math.ceil(section.items.length / cols);
            if (rows > 0) {
                totalH += rows * cardH + (rows - 1) * gapY;
            }
            totalH += sectionGap;
        }
        if (totalH > 0) totalH -= sectionGap;
    }
    
    let gridW = cols * cardW + (cols - 1) * gapX;
    let viewportW = max(0, availableW);
    let startX = x + max(0, (viewportW - gridW) / 2);
    let maxScroll = max(0, totalH - viewportH);
    let scrollOffset = constrain(this.getCurrentScrollOffset(), 0, maxScroll);
    this.setCurrentScrollOffset(scrollOffset);
    
    let viewportY = y + viewportPaddingY;
    
    this.lastGrid = {
        sections,
        type,
        startX,
        viewportX: x,
        viewportY,
        viewportW,
        viewportH,
        maxScroll,
        cols,
        cardW,
        cardH,
        gapX,
        gapY,
        titleH,
        sectionGap,
        totalH
    };
    
    let ctx = drawingContext;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, viewportY, viewportW, viewportH);
    ctx.clip();
    
    let currentY = viewportY - scrollOffset;
    
    for (let section of sections) {
        if (section.title) {
            // Draw title
            if (currentY + titleH > viewportY && currentY < viewportY + viewportH) {
                fill(236, 216, 185);
                textSize(18);
                textAlign(LEFT, TOP);
                text(section.title, startX, currentY + 5);
            }
            currentY += titleH;
        }
        
        let items = section.items;
        let rows = Math.ceil(items.length / cols);
        
        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            let col = i % cols;
            let row = floor(i / cols);
            let cx = startX + col * (cardW + gapX);
            let cy = currentY + row * (cardH + gapY);
            
            // Optimization: only draw if visible
            if (cy + cardH > viewportY && cy < viewportY + viewportH) {
                this.drawCard(cx, cy, item, type, cardW, cardH);
            }
        }
        
        if (rows > 0) {
            currentY += rows * cardH + (rows - 1) * gapY;
        }
        currentY += sectionGap;
    }
    
    ctx.restore();

    if (needsScroll && maxScroll > 0) {
      let trackX = x + w - this.scrollbarWidth;
      let trackY = viewportY;
      let trackH = viewportH;
      let thumbH = constrain(trackH * (viewportH / totalH), 32, trackH);
      let thumbY = trackY + (trackH - thumbH) * (scrollOffset / maxScroll);
      let mx = mouseX - this.inputOffsetX;
      let my = mouseY - this.inputOffsetY;
      let isHoverThumb = this.isPointInRect(mx, my, trackX, thumbY, this.scrollbarWidth, thumbH);

      fill(90, 62, 42, 210);
      noStroke();
      rect(trackX, trackY, this.scrollbarWidth, trackH, 8);

      if (isHoverThumb || this.isDraggingScrollbar) fill(this.colors.accent);
      else fill(181, 140, 95, 240);
      rect(trackX, thumbY, this.scrollbarWidth, thumbH, 8);

      this.lastScrollbar = { trackX, trackY, trackH, thumbY, thumbH };
    } else {
      this.lastScrollbar = null;
    }
  }

  getButtonRect(x, y, cardW, cardH) {
    let btnH = min(this.buttonHeight, floor(cardH * 0.16));
    let btnW = cardW - 30;
    let btnX = x + 15;
    let btnY = y + cardH - btnH - 10;
    return { btnX, btnY, btnW, btnH };
  }

  drawWrappedText(str, x, y, w, size, colorVal) {
      if (colorVal) fill(colorVal);
      textSize(size);
      textLeading(size * 1.2);
      textAlign(CENTER, TOP);
      
      // Calculate lines
      let words = str.split(' ');
      let currentLine = '';
      let lineCount = 1;
      
      // Simple loop to estimate lines. 
      // Note: This logic mirrors p5's wrapping but isn't exact due to font rendering.
      // However, since we use the same font settings, it should be close.
      // We assume spaces are single spaces.
      
      if (textWidth(str) <= w) {
          text(str, x, y, w, size * 2);
          return size * 1.2;
      }
      
      currentLine = words[0];
      for (let i = 1; i < words.length; i++) {
          let testLine = currentLine + ' ' + words[i];
          if (textWidth(testLine) > w) {
              lineCount++;
              currentLine = words[i];
          } else {
              currentLine = testLine;
          }
      }
      
      let h = lineCount * size * 1.2;
      text(str, x, y, w, h + size); // Add buffer for safety
      return h;
  }

  drawCard(x, y, item, type, cardW, cardH) {
    fill(this.colors.cardBg);
    stroke(this.colors.cardBorder);
    let isHover = this.isMouseOver(x, y, cardW, cardH);
    if (isHover) {
        stroke(this.colors.accent);
        fill(112, 77, 51, 235);
    }
    rect(x, y, cardW, cardH, 10);

    noStroke();
    fill(74, 50, 33, 220);
    let previewH = floor(cardH * 0.38);
    let previewX = x + 8;
    let previewY = y + 8;
    let previewW = cardW - 16;
    rect(previewX, previewY, previewW, previewH, 8);
    this.drawItemPreview(x + cardW / 2, y + 8 + previewH / 2, item, type, previewW, previewH);

    fill(247, 232, 210);
    textAlign(CENTER, TOP);
    let titleY = y + 8 + previewH + 8;
    // Use wrapped text for title
    let nameH = this.drawWrappedText(item.name, x + 5, titleY, cardW - 10, 16, color(247, 232, 210));

    textSize(13);
    fill(234, 210, 175);
    let infoY = titleY + nameH + 8; // Adjust start based on title height
    
    if (type === 'vehicle') {
        text(`Speed: ${item.maxSpeed}`, x + cardW / 2, infoY);
        text(`HP: ${item.maxHp}`, x + cardW / 2, infoY + 18);
    } else if (type === 'weapon') {
        let info = this.getWeaponInfo(item);
        
        // Draw category
        let h1 = this.drawWrappedText(info.category, x + 5, infoY, cardW - 10, 11, color(234, 210, 175));
        infoY += h1 + 4;
        
        let h2 = this.drawWrappedText(info.damage, x + 5, infoY, cardW - 10, 11, color(234, 210, 175));
        infoY += h2 + 4;
        
        let h3 = this.drawWrappedText(info.attack, x + 5, infoY, cardW - 10, 11, color(234, 210, 175));
    } else {
        let val = 0;
        if (item.id === 'maxHp') val = `+${constrain(player.bonusMaxHp || 0, 0, 2)} (Max 2)`;
        if (item.id === 'maxAmmo') val = `+${constrain(player.bonusMaxAmmo || 0, 0, 5)} (Max 5)`;
        if (item.id === 'topSpeed') val = `+${constrain(player.bonusTopSpeed || 0, 0, 5) * 10}% (Max 50%)`;
        if (item.id === 'acceleration') val = `+${constrain(player.bonusAcceleration || 0, 0, 5) * 10}% (Max 50%)`;
        text(`Current: ${val}`, x + cardW / 2, infoY);
    }

    let { btnX, btnY, btnW, btnH } = this.getButtonRect(x, y, cardW, cardH);
    let state = this.getItemState(item, type);
    let btnColor = this.colors.button;
    let btnText = "BUY";
    let btnTextColor = color(255);

    if (state === 'equipped') {
        btnColor = this.colors.success;
        btnText = "EQUIPPED";
    } else if (state === 'unlocked') {
        btnColor = this.colors.success;
        btnText = "UNLOCKED";
    } else if (state === 'owned') {
        btnColor = [122, 164, 220];
        btnText = "SELECT";
    } else if (state === 'max_level') {
        btnColor = this.colors.disabled;
        btnText = "MAX LEVEL";
        btnTextColor = color(200);
    } else if (state === 'too_expensive') {
        btnColor = this.colors.disabled;
        btnText = `$ ${item.price}`;
        btnTextColor = color(200);
    } else {
        btnText = `$ ${item.price}`;
    }

    if (type === 'upgrade') {
        if (state !== 'max_level') {
            btnText = `$ ${item.price}`;
            if (player.coins < item.price) {
                 btnColor = this.colors.disabled;
            } else {
                 btnColor = this.colors.accent;
            }
        }
    }

    fill(btnColor);
    noStroke();
    rect(btnX, btnY, btnW, btnH, 8);

    fill(btnTextColor);
    textAlign(CENTER, CENTER);
    text(btnText, btnX + btnW/2, btnY + btnH/2);

    if (isHover && this.isMouseOver(btnX, btnY, btnW, btnH)) {
        noFill();
        stroke(255, 140);
        strokeWeight(2);
        rect(btnX, btnY, btnW, btnH, 8);
    }
  }

  drawHeartPreview(x, y, scaleFactor = 1.8) {
      push();
      translate(x, y);
      scale(scaleFactor);
      fill(255, 70, 70);
      stroke(180, 0, 0);
      strokeWeight(1.2);
      beginShape();
      vertex(0, 0);
      bezierVertex(-5, -5, -10, 0, 0, 10);
      bezierVertex(10, 0, 5, -5, 0, 0);
      endShape(CLOSE);
      pop();
  }

  drawSpeedometerPreview(x, y, previewW, previewH) {
      let radius = min(previewW, previewH) * 0.28;
      push();
      translate(x, y + 8);
      noFill();
      stroke(255, 215, 90);
      strokeWeight(5);
      arc(0, 0, radius * 2, radius * 2, PI, TWO_PI);

      for (let i = 0; i <= 4; i++) {
          let angle = map(i, 0, 4, PI, TWO_PI);
          let x1 = cos(angle) * radius * 0.72;
          let y1 = sin(angle) * radius * 0.72;
          let x2 = cos(angle) * radius * 0.94;
          let y2 = sin(angle) * radius * 0.94;
          stroke(255, 235, 170);
          strokeWeight(2);
          line(x1, y1, x2, y2);
      }

      stroke(255, 90, 90);
      strokeWeight(4);
      let needleAngle = TWO_PI - 0.55;
      line(0, 0, cos(needleAngle) * radius * 0.8, sin(needleAngle) * radius * 0.8);
      noStroke();
      fill(255, 90, 90);
      ellipse(0, 0, 10, 10);
      pop();
  }

  drawAccelerationPreview(x, y, previewW) {
      let trailW = min(14, previewW * 0.08);
      push();
      translate(x, y);
      noStroke();
      fill(255, 170, 70, 160);
      rectMode(CENTER);
      rect(-24, 0, trailW, 10, 4);
      rect(-10, 0, trailW + 4, 14, 4);
      fill(255, 215, 90);
      beginShape();
      vertex(-8, -18);
      vertex(18, -18);
      vertex(18, -30);
      vertex(42, 0);
      vertex(18, 30);
      vertex(18, 18);
      vertex(-8, 18);
      endShape(CLOSE);
      pop();
  }

  drawUpgradePreview(x, y, item, previewW, previewH) {
      if (item.id === 'maxHp') {
          this.drawHeartPreview(x, y + 2, 2.1);
          return;
      }

      if (item.id === 'maxAmmo') {
          if (typeof bulletIconImg !== 'undefined' && bulletIconImg && bulletIconImg.width > 0) {
              push();
              imageMode(CENTER);
              let maxW = max(24, previewW * 0.32);
              let ratio = min(maxW / bulletIconImg.width, (previewH * 0.58) / bulletIconImg.height);
              image(bulletIconImg, x, y, bulletIconImg.width * ratio, bulletIconImg.height * ratio);
              pop();
          } else {
              push();
              translate(x, y);
              rectMode(CENTER);
              noStroke();
              fill(212, 170, 88);
              rect(0, 0, 18, 42, 8);
              fill(255, 225, 120);
              rect(0, -14, 18, 12, 6);
              fill(120, 70, 30);
              rect(0, 15, 18, 8, 3);
              pop();
          }
          return;
      }

      if (item.id === 'topSpeed') {
          this.drawSpeedometerPreview(x, y, previewW, previewH);
          return;
      }

      if (item.id === 'acceleration') {
          this.drawAccelerationPreview(x, y, previewW);
          return;
      }

      fill(255, 215, 0);
      ellipse(x, y, 28, 28);
      fill(0);
      textAlign(CENTER, CENTER);
      textSize(18);
      text("+", x, y);
  }
  
  drawItemPreview(x, y, item, type, previewW = 0, previewH = 0) {
      if (type === 'vehicle') {
          if (item.color) fill(item.color);
          else fill(200);
          rectMode(CENTER);
          rect(x, y, 26, 44, 4);
          fill(255, 255, 255, 100);
          rect(x, y - 8, 20, 9);
          rectMode(CORNER);
      } else if (type === 'weapon') {
          let weaponIcon = images && images.weaponShop ? images.weaponShop[item.id] : null;
          if (weaponIcon) {
              push();
              imageMode(CENTER);
              let maxW = max(20, previewW * 0.9);
              let maxH = max(20, previewH * 0.9);
              let ratio = min(maxW / weaponIcon.width, maxH / weaponIcon.height);
              let drawW = weaponIcon.width * ratio;
              let drawH = weaponIcon.height * ratio;
              image(weaponIcon, x, y, drawW, drawH);
              pop();
              return;
          }
          fill(200);
          if (item.id === 'laser') fill(255, 0, 0);
          if (item.id === 'pistol') fill(100);
          push();
          translate(x, y);
          rotate(-PI/4);
          rectMode(CENTER);
          rect(0, 0, 9, 26);
          rect(0, 9, 9, 9);
          pop();
      } else {
          this.drawUpgradePreview(x, y, item, previewW, previewH);
      }
  }

  getWeaponInfo(item) {
      let cfg = typeof WEAPON_CONFIG !== 'undefined' ? WEAPON_CONFIG[item.id] : null;
      let isBasic = item.type !== 'special';
      let category = isBasic ? "Type: Basic Weapon" : "Type: Drop Weapon";
      
      if (!isBasic && cfg && cfg.dropRateText) {
          category += ` (${cfg.dropRateText} Drop)`;
      }
      
      let damage = "Damage: --";
      let attack = "Attack: --";

      if (cfg) {
          if (item.id === WEAPON_TYPES.SHOTGUN) {
              damage = `Damage: ${cfg.damage} x${cfg.count} pellets`;
              attack = "Attack: Spread, close-range burst";
          } else if (item.id === WEAPON_TYPES.RIFLE) {
              damage = `Damage: ${cfg.damage} x${cfg.count} burst`;
              attack = "Attack: Burst fire, medium-long range";
          } else if (item.id === WEAPON_TYPES.LASER) {
              damage = `Damage: ${cfg.damage}/s`;
              attack = "Attack: Sustained beam, blocked by cover";
          } else if (item.id === WEAPON_TYPES.MOLOTOV) {
              damage = `Damage: ${cfg.damage}/tick, radius ${cfg.areaRadius}`;
              attack = "Attack: Throw + area fire burn";
          } else if (item.id === WEAPON_TYPES.DONGFENG) {
              damage = `Damage: ${cfg.damage}`;
              attack = "Attack: Targeted strike (map select)";
          } else if (item.id === WEAPON_TYPES.LOITERING) {
              damage = `Damage: ${cfg.damage}`;
              attack = "Attack: Guided drone strike";
          } else if (item.id === WEAPON_TYPES.ATOMIC) {
              damage = `Damage: ${cfg.damage}`;
              attack = "Attack: Massive area blast";
          } else {
              damage = `Damage: ${cfg.damage}`;
              attack = "Attack: Single shot, medium range";
          }
      }
      return { category, damage, attack };
  }
  
  getItemState(item, type) {
      if (type === 'vehicle') {
          if (player.carType === item.id) return 'equipped';
          if (player.ownedCars && player.ownedCars.includes(item.id)) return 'owned';
          if (item.price === 0) return 'owned';
          if (player.coins < item.price) return 'too_expensive';
          return 'buyable';
      }
      
      if (type === 'weapon') {
          // Special Weapons
          if (item.type === 'special') {
              if (player.unlockedSpecialWeapons && player.unlockedSpecialWeapons.includes(item.id)) return 'unlocked';
              if (player.coins < item.price) return 'too_expensive';
              return 'buyable_unlock';
          }
          
          // Basic Weapons
          if (player.currentWeapon === item.id) return 'equipped';
          if (player.ownedWeapons && player.ownedWeapons.includes(item.id)) return 'owned';
          if (item.id === WEAPON_TYPES.PISTOL) return 'owned';
          if (player.coins < item.price) return 'too_expensive';
          return 'buyable';
      }
      
      // Upgrades Logic
      if (item.id === 'maxHp' && player.bonusMaxHp >= 2) return 'max_level';
      if (item.id === 'maxAmmo' && player.bonusMaxAmmo >= 5) return 'max_level';
      if (item.id === 'topSpeed' && player.bonusTopSpeed >= 5) return 'max_level'; // 50% max
      if (item.id === 'acceleration' && player.bonusAcceleration >= 5) return 'max_level'; // 50% max
      
      if (player.coins < item.price) return 'too_expensive';
      return 'upgrade';
  }

  isMouseOver(x, y, w, h) {
    let mx = mouseX - this.inputOffsetX;
    let my = mouseY - this.inputOffsetY;
    return mx >= x && mx <= x + w && my >= y && my <= y + h;
  }

  isPointInRect(px, py, x, y, w, h) {
    return px >= x && px <= x + w && py >= y && py <= y + h;
  }

  getCurrentScrollOffset() {
    return this.scrollOffsets[this.currentTab] || 0;
  }

  setCurrentScrollOffset(value) {
    this.scrollOffsets[this.currentTab] = max(0, value || 0);
  }

  handleWheel(delta) {
    if (!this.lastGrid) return false;
    if (this.lastGrid.maxScroll <= 0) return false;
    let mx = mouseX - this.inputOffsetX;
    let my = mouseY - this.inputOffsetY;
    let areaW = this.lastGrid.viewportW + this.scrollbarWidth + 12;
    if (!this.isPointInRect(mx, my, this.lastGrid.viewportX, this.lastGrid.viewportY, areaW, this.lastGrid.viewportH)) {
      return false;
    }
    let step = max(24, abs(delta) * 0.8);
    let next = this.getCurrentScrollOffset() + (delta > 0 ? step : -step);
    this.setCurrentScrollOffset(constrain(next, 0, this.lastGrid.maxScroll));
    return true;
  }

  handleMouseDragged() {
    if (!this.isDraggingScrollbar || !this.lastGrid || !this.lastScrollbar) return false;
    let my = mouseY - this.inputOffsetY;
    let maxThumbTravel = max(1, this.lastScrollbar.trackH - this.lastScrollbar.thumbH);
    let nextThumbTop = constrain(
      my - this.scrollDragOffsetY,
      this.lastScrollbar.trackY,
      this.lastScrollbar.trackY + this.lastScrollbar.trackH - this.lastScrollbar.thumbH
    );
    let ratio = (nextThumbTop - this.lastScrollbar.trackY) / maxThumbTravel;
    this.setCurrentScrollOffset(ratio * this.lastGrid.maxScroll);
    return true;
  }

  handleMouseReleased() {
    this.isDraggingScrollbar = false;
  }
  
  handleClick() {
      let mx = mouseX - this.inputOffsetX;
      let my = mouseY - this.inputOffsetY;
      if (this.closeButtonRect && this.isPointInRect(mx, my, this.closeButtonRect.x, this.closeButtonRect.y, this.closeButtonRect.w, this.closeButtonRect.h)) {
        this.closeShop();
        return;
      }
      let startY = this.panelY + 72;
      let tabH = 54;
      let tabX = this.panelX + 10;
      let tabW = this.sidebarWidth - 20;
      
      for (let i = 0; i < this.tabs.length; i++) {
        let ty = startY + i * (tabH + 10);
        if (this.isMouseOver(tabX, ty, tabW, tabH)) {
            this.currentTab = this.tabs[i];
            return;
        }
      }
      if (!this.lastGrid) return;
      if (this.lastScrollbar) {
        let { trackX, trackY, trackH, thumbY, thumbH } = this.lastScrollbar;
        if (this.isPointInRect(mx, my, trackX, trackY, this.scrollbarWidth, trackH)) {
          if (this.isPointInRect(mx, my, trackX, thumbY, this.scrollbarWidth, thumbH)) {
            this.isDraggingScrollbar = true;
            this.scrollDragOffsetY = my - thumbY;
          } else {
            let pageStep = this.lastGrid.viewportH * 0.8;
            let next = this.getCurrentScrollOffset() + (my < thumbY ? -pageStep : pageStep);
            this.setCurrentScrollOffset(constrain(next, 0, this.lastGrid.maxScroll));
          }
          return;
        }
      }
      if (!this.isPointInRect(mx, my, this.lastGrid.viewportX, this.lastGrid.viewportY, this.lastGrid.viewportW, this.lastGrid.viewportH)) {
        return;
      }
      let { sections, type, startX, viewportY, cols, cardW, cardH, gapX, gapY, titleH, sectionGap } = this.lastGrid;
      
      let currentY = viewportY - this.getCurrentScrollOffset();
      
      for (let section of sections) {
          if (section.title) {
              currentY += titleH;
          }
          
          let items = section.items;
          let rows = Math.ceil(items.length / cols);
          
          for (let i = 0; i < items.length; i++) {
              let item = items[i];
              let col = i % cols;
              let row = floor(i / cols);
              let cx = startX + col * (cardW + gapX);
              let cy = currentY + row * (cardH + gapY);
              
              // Check visibility
              if (cy + cardH < viewportY || cy > viewportY + this.lastGrid.viewportH) continue;
              
              let { btnX, btnY, btnW, btnH } = this.getButtonRect(cx, cy, cardW, cardH);

              if (this.isMouseOver(btnX, btnY, btnW, btnH)) {
                  let state = this.getItemState(item, type);
                  this.handleAction(item, type, state);
                  return;
              }
          }
          
          if (rows > 0) {
              currentY += rows * cardH + (rows - 1) * gapY;
          }
          currentY += sectionGap;
      }
  }

  closeShop() {
      if (typeof gameState !== 'undefined') {
          if (gameState === 'SHOP') {
              if (typeof closeShopFromUI === 'function') {
                  closeShopFromUI();
              } else {
                  gameState = 'PLAY';
                  if (typeof shopBuilding !== 'undefined') {
                      shopBuilding = null;
                  }
              }
              return;
          }
          else if (gameState === 'MENU_SHOP') gameState = 'MENU';
      }
      if (typeof shopBuilding !== 'undefined') {
          shopBuilding = null;
      }
  }
  
  async handleAction(item, type, state) {
      if (state === 'too_expensive' || state === 'unlocked' || state === 'equipped' || state === 'max_level') return;
      if (typeof authUI === 'undefined' || !authUI || !authUI.token) return;
      if (this.catalogLoading) return;
      try {
          let url = `${authUI.apiBaseUrl}/api/shop/purchase`;
          let payload = {};
          if (type === 'vehicle' && state === 'owned') {
              url = `${authUI.apiBaseUrl}/api/shop/select`;
              payload = { selectType: 'vehicle', itemId: item.id };
          } else if (type === 'weapon' && state === 'owned') {
              url = `${authUI.apiBaseUrl}/api/shop/select`;
              payload = { selectType: 'weapon', itemId: item.id };
          } else {
              let category = 'upgrade';
              if (type === 'vehicle') category = 'vehicle';
              if (type === 'weapon') category = 'weapon';
              payload = { category, itemId: item.id };
          }

          let res = await fetch(url, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${authUI.token}`
              },
              body: JSON.stringify(payload)
          });
          let data = await res.json();
          if (!res.ok) {
              console.error(data.error || 'Shop action failed');
              return;
          }
          this.applyServerProgress(data.progress);
      } catch (error) {
          console.error('Shop action failed', error);
      }
  }
  
  applyUpgrade(id) {
      if (id === 'maxHp') {
          if (player.bonusMaxHp < 2) {
              player.bonusMaxHp += 1;
              player.maxHp += 1;
              player.hp = min(player.hp, player.maxHp);
          }
      } else if (id === 'maxAmmo') {
          if (player.bonusMaxAmmo < 5) {
              player.bonusMaxAmmo += 1;
              player.maxAmmo += 1;
              player.ammo = min(player.ammo, player.maxAmmo);
          }
      } else if (id === 'topSpeed') {
          if (player.bonusTopSpeed < 5) {
              player.bonusTopSpeed += 1;
              player.applyCarType(player.carType); // Reapply to calculate new speed
          }
      } else if (id === 'acceleration') {
          if (player.bonusAcceleration < 5) {
              player.bonusAcceleration += 1;
              player.applyCarType(player.carType);
          }
      }
  }
}

class TutorialSystem {
    constructor() {
        this.shown = {
            attack: false,
            powerup: false,
            dongfeng: false,
            loitering: false,
            atomic: false,
            intro: false,
            inventory_full: false,
            controls: false
        };
        this.activeTutorial = null;
        this.introData = null;
    }

    triggerLevelIntro(difficulty) {
        this.activeTutorial = 'intro';
        this.shown.intro = true;
        
        if (difficulty === 'EASY') {
            this.introData = {
                title: "EASY MODE",
                color: [0, 255, 0],
                features: [
                    "Standard Speed",
                    "Abundant Drops",
                    "Survival Time: 60s"
                ]
            };
        } else if (difficulty === 'NORMAL') {
            this.introData = {
                title: "NORMAL MODE",
                color: [255, 255, 0],
                features: [
                    "Standard Speed",
                    "Standard Drops",
                    "Survival Time: 90s"
                ]
            };
        } else if (difficulty === 'HARD') {
             this.introData = {
                title: "HARD MODE",
                color: [255, 50, 50],
                features: [
                    "Player Speed: -10%",
                    "Enemy Speed: +10%",
                    "NO WEAPON/HEALTH DROPS",
                    "Survival Time: 120s"
                ]
            };
        }
    }

    check(player, enemies, buildings, powerups) {
        if (this.activeTutorial) return null;

        // Weapon Tutorials
        if (player.currentSpecialWeapon) {
            let type = player.currentSpecialWeapon;
            if (type === WEAPON_TYPES.DONGFENG && !this.shown.dongfeng) {
                this.trigger('dongfeng');
                return 'dongfeng';
            } else if (type === WEAPON_TYPES.LOITERING && !this.shown.loitering) {
                this.trigger('loitering');
                return 'loitering';
            } else if (type === WEAPON_TYPES.ATOMIC && !this.shown.atomic) {
                this.trigger('atomic');
                return 'atomic';
            }
        }

        if (!this.shown.attack && enemies.length > 0) {
            let playerPos = player.pos;
            let triggerRadius = 900;
            for (let e of enemies) {
                if (p5.Vector.dist(playerPos, e.pos) <= triggerRadius) {
                    this.trigger('attack');
                    return 'attack';
                }
            }
        }
        
        // Powerup Tutorial
        if (!this.shown.powerup && powerups && powerups.length > 0) {
            for (let p of powerups) {
                if (p5.Vector.dist(player.pos, p.pos) < 350) {
                    if (this.hasLineOfSight(player.pos, p.pos, buildings)) {
                        this.trigger('powerup');
                        return 'powerup';
                    }
                }
            }
        }

        return null;
    }
    
    hasLineOfSight(p1, p2, buildings) {
        // Simple raycast check against building bounding boxes
        let steps = 10;
        for(let i=1; i<steps; i++) {
            let p = p5.Vector.lerp(p1, p2, i/steps);
            for(let b of buildings) {
                 // Check if point is inside building rect (with some buffer)
                 if (p.x > b.pos.x - b.w/2 && p.x < b.pos.x + b.w/2 &&
                     p.y > b.pos.y - b.h/2 && p.y < b.pos.y + b.h/2) {
                     return false;
                 }
            }
        }
        return true;
    }

    trigger(type) {
        this.activeTutorial = type;
        this.shown[type] = true;
    }

    draw(x, y, w, h) {
        if (!this.activeTutorial) return;

        push();
        // Assume we are in the correct context (translated to game view)
        translate(x, y);
        
        // Overlay
        fill(0, 0, 0, 160);
        rectMode(CORNER);
        rect(0, 0, w, h);
        
        // Content
        textAlign(CENTER, CENTER);
        
        let cx = w / 2;
        let cy = h / 2;
        
        if (this.activeTutorial === 'attack') {
            fill(255, 50, 50);
            textSize(36);
            textStyle(BOLD);
            text("ENEMY SPOTTED!", cx, cy - 100);
            
            fill(255);
            textSize(22);
            textStyle(NORMAL);
            text("Enemy nearby! LEFT CLICK to attack now!", cx, cy + 100);
            
            // Draw Mouse Animation
            this.drawMouseAnimation(cx, cy);
        } else if (this.activeTutorial === 'powerup') {
            fill(255, 215, 0);
            textSize(36);
            textStyle(BOLD);
            text("ITEM FOUND!", cx, cy - 100);
            
            fill(255);
            textSize(22);
            textStyle(NORMAL);
            text("Drive over items to collect them!", cx, cy + 100);
            text("(Health, Ammo, Coins, or Boosts)", cx, cy + 140);
            
            // Draw Icon
            this.drawPowerupIcon(cx, cy);
        } else if (this.activeTutorial === 'dongfeng') {
            this.drawWeaponTutorial(cx, cy, "DONGFENG MISSILE", "Strategic Nuclear Strike", 
                "Press X to open Target Map\nClick on map to launch missile");
        } else if (this.activeTutorial === 'loitering') {
            this.drawWeaponTutorial(cx, cy, "LOITERING DRONE", "Remote Controlled Munition", 
                "Press X to launch Drone\nUse Arrow Keys to steer into enemies");
        } else if (this.activeTutorial === 'atomic') {
            this.drawWeaponTutorial(cx, cy, "ATOMIC BOMB", "Ultimate Weapon", 
                "Press X to detonate immediately\nDestroys EVERYTHING nearby");
        } else if (this.activeTutorial === 'intro') {
             this.drawIntro(cx, cy, w, h);
        } else if (this.activeTutorial === 'controls') {
             this.drawControls(cx, cy);
        } else if (this.activeTutorial === 'inventory_full') {
            fill(255, 50, 50);
            textSize(36);
            textStyle(BOLD);
            text("INVENTORY FULL!", cx, cy - 100);
            
            fill(255);
            textSize(22);
            textStyle(NORMAL);
            text("You can only carry ONE special weapon at a time!", cx, cy + 60);
            text("Use your current weapon before picking up a new one.", cx, cy + 100);
            
            // Draw Icon (Reuse Powerup Icon style but maybe red?)
            push();
            translate(cx, cy - 20);
            scale(2);
            fill(50); 
            stroke(255, 50, 50);
            strokeWeight(2);
            rectMode(CENTER);
            rect(0, 0, 40, 40, 5);
            
            noStroke();
            fill(255, 50, 50);
            textAlign(CENTER, CENTER);
            textSize(24);
            text("!", 0, 0);
            pop();
        }
        
        // Pulse effect for "Click to Continue"
        let alpha = 150 + 100 * sin(millis() * 0.005);
        fill(255, 255, 255, alpha);
        textSize(18);
        text("Click or Press SPACE to Continue", cx, cy + 200);
        
        pop();
    }
    
    drawIntro(cx, cy, w, h) {
        if (!this.introData) return;
        
        let d = this.introData;
        
        // Header
        fill(d.color);
        textSize(48);
        textStyle(BOLD);
        text(d.title, cx, cy - 120);
        
        // Features
        fill(255);
        textSize(24);
        textStyle(NORMAL);
        textAlign(CENTER, CENTER);
        
        for (let i = 0; i < d.features.length; i++) {
            let f = d.features[i];
            text("• " + f, cx, cy - 20 + i * 40);
        }
        
        // Decoration
        stroke(d.color);
        strokeWeight(4);
        noFill();
        rectMode(CENTER);
        rect(cx, cy, 400, 300, 20);
    }
    
    drawControls(cx, cy) {
        fill(255);
        textSize(42);
        textStyle(BOLD);
        text("VEHICLE CONTROLS", cx, cy - 200);
        
        textSize(20);
        textStyle(NORMAL);
        fill(200);
        text("Master your vehicle to survive", cx, cy - 160);

        // Layout Constants
        let keySize = 60; // Slightly larger
        let gap = 15;
        let startY = cy + 20; // Shift down to avoid title overlap

        // Draw W
        this.drawKey(cx, startY - keySize - gap, 'W', keySize);
        // Label Above W
        fill(100, 200, 255);
        textSize(16);
        textStyle(BOLD);
        text("ACCELERATE", cx, startY - keySize - gap - 45);

        // Draw A / S / D
        this.drawKey(cx - keySize - gap, startY, 'A', keySize);
        this.drawKey(cx, startY, 'S', keySize);
        this.drawKey(cx + keySize + gap, startY, 'D', keySize);
        
        // Labels for A/D (Steer)
        fill(100, 200, 255);
        text("STEER", cx - keySize - gap, startY + 45);
        text("STEER", cx + keySize + gap, startY + 45);
        
        // Label for S (Brake)
        text("BRAKE / REV", cx, startY + 45);
        
        // Draw Space (Drift)
        let spaceW = keySize * 3 + gap * 2;
        let spaceY = startY + keySize + gap + 40;
        this.drawKey(cx, spaceY, 'SPACE', keySize, false, spaceW);
        
        // Label for Space
        text("DRIFT / HANDBRAKE (HOLD)", cx, spaceY + 45);
        
        // Small hint about arrows
        fill(150);
        textSize(14);
        textStyle(ITALIC);
        text("(Arrow Keys also supported)", cx, spaceY + 80);
    }

    drawKey(x, y, label, size, isArrow = false, widthOverride = null) {
        let w = widthOverride || size;
        let h = size;
        
        push();
        translate(x, y);
        
        // Simple animation: "Press" every 2 seconds
        let press = (millis() % 2000) < 1000;
        // Alternate press for different keys to make it lively
        if (label === 'W' || label === '▲') press = (millis() % 2000) < 500;
        else if (label === 'S' || label === '▼') press = (millis() % 2000) > 1000 && (millis() % 2000) < 1500;
        
        let offset = press ? 2 : 0;
        
        fill(220);
        stroke(50);
        strokeWeight(2);
        rectMode(CENTER);
        
        // Key Base
        rect(0, 0, w, h, 8);
        
        // Key Top
        fill(isArrow ? 240 : 255);
        if (press) fill(200);
        rect(0, -4 + offset, w - 6, h - 6, 6);
        
        fill(50);
        textSize(isArrow ? size * 0.5 : size * 0.4);
        if (widthOverride) textSize(size * 0.35); // Smaller text for SPACE
        textStyle(BOLD);
        textAlign(CENTER, CENTER);
        text(label, 0, -4 + offset);
        
        pop();
    }
    
    drawWeaponTutorial(cx, cy, title, subtitle, instructions) {
        fill(255, 100, 0);
        textSize(36);
        textStyle(BOLD);
        text(title, cx, cy - 100);
        
        fill(255, 200, 100);
        textSize(24);
        textStyle(BOLD);
        text(subtitle, cx, cy - 60);
        
        fill(255);
        textSize(22);
        textStyle(NORMAL);
        // Split instructions by newline
        let lines = instructions.split('\n');
        for(let i=0; i<lines.length; i++) {
            text(lines[i], cx, cy + 100 + i * 30);
        }
        
        // Draw 'X' Key Animation
        this.drawKeyAnimation(cx, cy, 'X');
    }

    drawKeyAnimation(x, y, keyLabel) {
        push();
        translate(x, y);
        scale(1.5);
        
        let press = (millis() % 1000) < 500;
        let offset = press ? 2 : 0;
        
        fill(200);
        stroke(50);
        strokeWeight(2);
        rectMode(CENTER);
        
        // Key base
        rect(0, 0, 50, 50, 8);
        
        // Key top (simulating depth)
        fill(245);
        rect(0, -4 + offset, 44, 44, 6);
        
        fill(50);
        textSize(24);
        textStyle(BOLD);
        textAlign(CENTER, CENTER);
        text(keyLabel, 0, -4 + offset);
        
        pop();
    }

    drawMouseAnimation(x, y) {
        push();
        translate(x, y);
        scale(1.5);
        
        // Mouse Body
        fill(240);
        stroke(50);
        strokeWeight(2);
        rectMode(CENTER);
        rect(0, 10, 36, 54, 12);
        
        // Buttons line
        line(0, -17, 0, 0);
        line(-18, 0, 18, 0);
        
        // Left Click Animation
        if (frameCount % 60 < 30) {
            fill(255, 50, 50, 200);
            noStroke();
            // Left button area (top left quadrant of mouse)
            arc(-9, -8.5, 18, 17, PI, TWO_PI); 
            
            // Ripple
            noFill();
            stroke(255, 50, 50, 255 - (frameCount % 30) * 8);
            strokeWeight(3);
            ellipse(-9, -15, 10 + (frameCount % 30), 10 + (frameCount % 30) * 0.6);
        }
        
        pop();
    }
    
    drawPowerupIcon(x, y) {
        push();
        translate(x, y);
        scale(2);
        
        fill(255, 215, 0); // Gold Box
        stroke(255);
        strokeWeight(2);
        rectMode(CENTER);
        rect(0, 0, 40, 40, 5);
        
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(24);
        text("?", 0, 0);
        
        // Float animation
        let offset = sin(frameCount * 0.1) * 5;
        translate(0, offset);
        
        pop();
    }
    
    dismiss() {
        if (this.activeTutorial) {
            this.activeTutorial = null;
            return true;
        }
        return false;
    }
}


let mapSelectStart = 0;
let loiteringMissile = null;
let missileStrikes = []; // Array to manage active missile effects
let atomicStrikes = [];

function clearSpecialWeaponEffects() {
    loiteringMissile = null;
    missileStrikes = [];
    atomicStrikes = [];
    mapSelectStart = 0;
    dongfengTargetLocked = false;
    mapSelectCharged = false;
    mapSelectLockX = 0;
    mapSelectLockY = 0;
}

class MissileStrike {
    constructor(targetX, targetY) {
        this.target = createVector(targetX, targetY);
        this.startHeight = max(520, gameHeight * 0.85);
        this.currentHeight = this.startHeight;
        this.warningFrames = 0;
        this.fallFrame = 0;
        this.fallDuration = 120;
        this.hasExploded = false;
        this.explosionRadius = 300;
        this.explosionDuration = 60;
        this.explosionTimer = 0;
    }

    update() {
        if (!this.hasExploded) {
            if (this.warningFrames > 0) {
                this.warningFrames--;
                return;
            }
            this.fallFrame++;
            let t = min(1, this.fallFrame / this.fallDuration);
            let eased = t * t;
            this.currentHeight = lerp(this.startHeight, 0, eased);
            if (t >= 1) {
                this.currentHeight = 0;
                this.explode();
            }
        } else {
            this.explosionTimer++;
        }
    }
    
    explode() {
        this.hasExploded = true;
        createExplosion(this.target.x, this.target.y, color(255, 100, 50), 100);
        shakeAmount = 30;
        
        // Damage Logic
        for (let i = enemies.length - 1; i >= 0; i--) {
            let e = enemies[i];
            if (dist(e.pos.x, e.pos.y, this.target.x, this.target.y) < this.explosionRadius) {
                e.hp -= 50;
                if (e.hp <= 0) enemies.splice(i, 1);
            }
        }
    }
    
    display() {
        let isoPos = projectIso(this.target.x, this.target.y);

        push();
        translate(isoPos.x, isoPos.y);
        noFill();
        stroke(255, 0, 0, 140 + sin(frameCount * 0.45) * 90);
        strokeWeight(3);
        let ringBase = this.warningFrames > 0 ? 40 + this.warningFrames * 2.4 : 120 * (this.currentHeight / this.startHeight);
        let ringW = 80 + max(0, ringBase);
        let ringH = 40 + max(0, ringBase * 0.5);
        ellipse(0, 0, ringW, ringH);
        stroke(255, 70, 70, 180);
        line(-20, 0, 20, 0);
        line(0, -10, 0, 10);
        pop();

        if (this.hasExploded) {
            if (this.explosionTimer < this.explosionDuration) {
                push();
                translate(isoPos.x, isoPos.y);
                noFill();
                stroke(255, 200, 50, 255 - (this.explosionTimer * 4));
                strokeWeight(10);
                let r = (this.explosionTimer / this.explosionDuration) * this.explosionRadius * 2;
                ellipse(0, 0, r, r * 0.5);
                fill(255, 50, 0, 100 - this.explosionTimer);
                noStroke();
                ellipse(0, 0, r * 0.8, r * 0.4);
                pop();
            }
            return;
        }

        if (this.warningFrames > 0) {
            push();
            translate(isoPos.x, isoPos.y);
            stroke(255, 100, 80, 120);
            strokeWeight(2);
            line(0, -20, 0, 20);
            pop();
            return;
        }

        let screenX = isoPos.x;
        let visibleTop = camY + 30;
        let visibleBottom = camY + gameHeight - 140;
        let screenY = constrain(isoPos.y - this.currentHeight, visibleTop, visibleBottom);

        push();
        translate(screenX, screenY);
        fill(200);
        stroke(100);
        rectMode(CENTER);
        rect(0, 0, 20, 80);
        fill(100);
        triangle(-10, -40, -25, -60, -10, -60);
        triangle(10, -40, 25, -60, 10, -60);
        fill(255, 0, 0);
        triangle(-10, 40, 10, 40, 0, 60);
        fill(255, 150, 0);
        noStroke();
        triangle(-8, -40, 8, -40, 0, -100 - random(30));
        pop();

        push();
        translate(isoPos.x, isoPos.y);
        let progress = 1 - (this.currentHeight / this.startHeight);
        stroke(255, 180, 120, 120 + progress * 120);
        strokeWeight(2);
        line(0, -600 * progress, 0, -20);
        noStroke();
        fill(0, 0, 0, 100 * progress);
        ellipse(0, 0, 40 * progress, 20 * progress);
        pop();
    }
    
    isDead() {
        return this.hasExploded && this.explosionTimer >= this.explosionDuration;
    }
}

class AtomicStrike {
    constructor(targetX, targetY) {
        this.target = createVector(targetX, targetY);
        this.startHeight = max(760, gameHeight * 1.2);
        this.currentHeight = this.startHeight;
        this.fallFrame = 0;
        this.fallDuration = 150;
        this.hasExploded = false;
        this.explosionTimer = 0;
        this.explosionDuration = 120;
    }

    update() {
        if (!this.hasExploded) {
            this.fallFrame++;
            let t = min(1, this.fallFrame / this.fallDuration);
            this.currentHeight = lerp(this.startHeight, 0, t * t);
            if (t >= 1) {
                this.currentHeight = 0;
                this.explode();
            }
            return;
        }
        this.explosionTimer++;
        if (this.explosionTimer < 45) {
            let decay = 1 - this.explosionTimer / 45;
            shakeAmount = max(shakeAmount, 25 + decay * 120);
        }
    }

    explode() {
        this.hasExploded = true;
        shakeAmount = 150;
        createExplosion(this.target.x, this.target.y, color(255, 255, 255), 360);
        for (let e of enemies) {
            createExplosion(e.pos.x, e.pos.y, color(255, 255, 255), 28);
        }
        enemies = [];
    }

    display() {
        let isoPos = projectIso(this.target.x, this.target.y);
        if (this.hasExploded) {
            let t = min(1, this.explosionTimer / this.explosionDuration);
            let flashAlpha = max(0, 220 - this.explosionTimer * 3);
            push();
            translate(isoPos.x, isoPos.y);
            noStroke();
            fill(255, 255, 255, flashAlpha);
            ellipse(0, 0, 2200 * t, 1200 * t);
            fill(180, 255, 240, max(0, 200 - this.explosionTimer * 2));
            ellipse(0, -220 * t, 1100 * t, 680 * t);
            fill(120, 220, 255, max(0, 170 - this.explosionTimer * 2));
            ellipse(0, 0, 2500 * t, 1280 * t);
            fill(240, 120, 80, max(0, 140 - this.explosionTimer * 2));
            rectMode(CENTER);
            rect(0, -120 * t, 180 * t, 360 * t, 55 * t);
            pop();
            return;
        }

        push();
        translate(isoPos.x, isoPos.y);
        noFill();
        stroke(100, 255, 230, 190 + sin(frameCount * 0.35) * 60);
        strokeWeight(5);
        ellipse(0, 0, 340, 180);
        stroke(150, 210, 255, 170);
        ellipse(0, 0, 460, 240);
        line(-40, 0, 40, 0);
        line(0, -24, 0, 24);
        pop();

        let screenX = isoPos.x;
        let visibleTop = camY + 20;
        let visibleBottom = camY + gameHeight - 160;
        let screenY = constrain(isoPos.y - this.currentHeight, visibleTop, visibleBottom);

        push();
        translate(screenX, screenY);
        let atomicIcon = images && images.weaponShop ? images.weaponShop[WEAPON_TYPES.ATOMIC] : null;
        if (atomicIcon && atomicIcon.width > 0 && atomicIcon.height > 0) {
            imageMode(CENTER);
            let iconW = 66;
            let iconH = 102;
            let ratio = min(iconW / atomicIcon.width, iconH / atomicIcon.height);
            tint(255, 250);
            push();
            rotate(PI);
            image(atomicIcon, 0, 0, atomicIcon.width * ratio, atomicIcon.height * ratio);
            pop();
            noTint();
        } else {
            fill(120, 130, 145);
            stroke(70, 80, 90);
            strokeWeight(2);
            rectMode(CENTER);
            rect(0, 0, 34, 120, 10);
            fill(95, 105, 120);
            triangle(-17, -60, -34, -84, -17, -84);
            triangle(17, -60, 34, -84, 17, -84);
            fill(220, 70, 70);
            triangle(-17, 60, 17, 60, 0, 88);
        }
        noStroke();
        fill(210, 255, 255, 220);
        ellipse(0, -72, 12, 46 + random(30));
        pop();
    }

    isDead() {
        return this.hasExploded && this.explosionTimer >= this.explosionDuration;
    }
}

function updateMissileStrikes() {
    for (let i = missileStrikes.length - 1; i >= 0; i--) {
        let m = missileStrikes[i];
        m.update();
        if (m.isDead()) {
            missileStrikes.splice(i, 1);
        }
    }
}

function drawMissileStrikes() {
    for (let m of missileStrikes) {
        m.display();
    }
}

function updateAtomicStrikes() {
    for (let i = atomicStrikes.length - 1; i >= 0; i--) {
        let n = atomicStrikes[i];
        n.update();
        if (n.isDead()) {
            atomicStrikes.splice(i, 1);
        }
    }
}

function drawAtomicStrikes() {
    for (let n of atomicStrikes) {
        n.display();
    }
}

function hasActiveMissileStrike() {
    return missileStrikes.length > 0;
}

function getActiveMissileStrikeTarget() {
    if (missileStrikes.length === 0) return null;
    let m = missileStrikes[0];
    return m && m.target ? m.target : null;
}

function fireDongfengStrike(targetX, targetY) {
    // Instead of instant explosion, spawn a MissileStrike object
    missileStrikes.push(new MissileStrike(targetX, targetY));
    
    gameState = 'PLAY';
    if (typeof consumeCurrentSpecialWeapon === 'function') {
        consumeCurrentSpecialWeapon();
    } else {
        player.currentSpecialWeapon = null;
    }
    mapSelectStart = 0;
}

function triggerAtomicBomb() {
    if (!player) return;
    atomicStrikes.push(new AtomicStrike(player.pos.x, player.pos.y));
    shakeAmount = max(shakeAmount, 25);
}

function launchLoiteringMunition() {
    // Switch player control to missile?
    // User said: "Player stops controlling car, starts controlling missile".
    // So we can just swap 'player' reference temporarily? Or have a flag?
    // Better to have a flag `isControllingMissile`.
    
    loiteringMissile = new Vehicle(player.pos.x, player.pos.y, color(255, 0, 0));
    loiteringMissile.maxSpeed = 5;
    loiteringMissile.heading = player.heading;
    loiteringMissile.vel = p5.Vector.fromAngle(player.heading).mult(5);
    loiteringMissile.isMissile = true;
    player.vel.mult(0);
    player.acc.mult(0);
    if (typeof consumeCurrentSpecialWeapon === 'function') {
        consumeCurrentSpecialWeapon();
    } else {
        player.currentSpecialWeapon = null;
    }
    gameState = 'MISSILE_CONTROL';
}

function updateLoiteringMissile() {
    if (!loiteringMissile) return;
    
    // Accelerate
    loiteringMissile.maxSpeed += 0.05;
    loiteringMissile.maxSpeed = min(loiteringMissile.maxSpeed, 20);
    
    // Control
    if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) {
        loiteringMissile.heading -= 0.1;
    }
    if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) {
        loiteringMissile.heading += 0.1;
    }
    
    loiteringMissile.vel = p5.Vector.fromAngle(loiteringMissile.heading).mult(loiteringMissile.maxSpeed);
    loiteringMissile.pos.add(loiteringMissile.vel);

    if (loiteringMissile.pos.x <= 0 || loiteringMissile.pos.x >= mapWidth || loiteringMissile.pos.y <= 0 || loiteringMissile.pos.y >= mapHeight) {
        explodeMissile();
        return;
    }
    
    // Collision
    for (let b of buildings) {
        if (loiteringMissile.pos.x > b.pos.x - b.w/2 && loiteringMissile.pos.x < b.pos.x + b.w/2 &&
            loiteringMissile.pos.y > b.pos.y - b.h/2 && loiteringMissile.pos.y < b.pos.y + b.h/2) {
            explodeMissile();
            return;
        }
    }
    
    for (let e of enemies) {
        if (p5.Vector.dist(loiteringMissile.pos, e.pos) < 50) {
            explodeMissile();
            return;
        }
    }
}

function explodeMissile() {
    createExplosion(loiteringMissile.pos.x, loiteringMissile.pos.y, color(255, 100, 0), 30);
    // Damage nearby enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        if (p5.Vector.dist(e.pos, loiteringMissile.pos) < 200) {
            e.hp -= 50; // Massive damage
            if (e.hp <= 0) {
                enemies.splice(i, 1);
            }
        }
    }
    loiteringMissile = null;
    player.vel.mult(0);
    player.acc.mult(0);
    gameState = 'PLAY';
}

function drawMapSelect() {
    background(0);
    
    // Draw Map Scaled
    let scaleF = min(width / mapWidth, height / mapHeight);
    let drawW = mapWidth * scaleF;
    let drawH = mapHeight * scaleF;
    let offX = (width - drawW) / 2;
    let offY = (height - drawH) / 2;
    
    if (mapGraphics) {
        image(mapGraphics, width/2, height/2, drawW, drawH);
    }
    
    // Draw Player
    fill(0, 255, 0);
    noStroke();
    let px = offX + player.pos.x * scaleF;
    let py = offY + player.pos.y * scaleF;
    ellipse(px, py, 10, 10);
    
    // Draw Cursor Target
    let mx = mouseX;
    let my = mouseY;
    
    stroke(255, 0, 0);
    noFill();
    line(mx - 20, my, mx + 20, my);
    line(mx, my - 20, mx, my + 20);
    
    // Long Press Logic
    if (mouseIsPressed) {
        if (mapSelectStart === 0) mapSelectStart = millis();
        
        let progress = (millis() - mapSelectStart) / 2000; // 2 seconds to confirm
        
        // Draw Progress Circle
        noFill();
        stroke(255, 0, 0);
        strokeWeight(4);
        arc(mx, my, 60, 60, -HALF_PI, -HALF_PI + TWO_PI * progress);
        
        if (progress >= 1.0) {
            let targetX = (mx - offX) / scaleF;
            let targetY = (my - offY) / scaleF;
            fireDongfengStrike(targetX, targetY);
        }
    } else {
        mapSelectStart = 0;
    }
    
    fill(255);
    noStroke();
    textSize(20);
    textAlign(CENTER, BOTTOM);
    text("Select Target. Hold Left Click to Fire.", width/2, height - 30);
}

if (typeof globalThis !== 'undefined') {
    globalThis.updateMissileStrikes = updateMissileStrikes;
    globalThis.drawMissileStrikes = drawMissileStrikes;
    globalThis.updateAtomicStrikes = updateAtomicStrikes;
    globalThis.drawAtomicStrikes = drawAtomicStrikes;
    globalThis.hasActiveMissileStrike = hasActiveMissileStrike;
    globalThis.getActiveMissileStrikeTarget = getActiveMissileStrikeTarget;
    globalThis.fireDongfengStrike = fireDongfengStrike;
    globalThis.triggerAtomicBomb = triggerAtomicBomb;
    globalThis.launchLoiteringMunition = launchLoiteringMunition;
    globalThis.updateLoiteringMissile = updateLoiteringMissile;
    globalThis.drawMapSelect = drawMapSelect;
}

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
  { file: 'cafe.webp', label: 'Cafe' },
  { file: 'garden.webp', label: 'Garden' },
  { file: 'school.webp', label: 'School' },
  { file: 'supermarket.webp', label: 'Supermarket' }
];

function preloadAssets() {
  // Keep boot-time requests minimal: only map base textures are required to render
  // the initial world buffer. UI, shop, gameplay props, and ending videos load later.
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
    gameCoverVideo = createMutedVideoAsset('icon/game_cover_video.mp4', 'auto');
  }
}

function loadDeferredMenuVisualAssets() {
  if (deferredMenuVisualsRequested) return;
  deferredMenuVisualsRequested = true;
  gameCoverImg = loadImage('icon/game_cover.webp');
  startBtnImg = loadImage('icon/start.webp');
  exitBtnImg = loadImage('icon/exit.webp');
  shopBtnImg = loadImage('icon/basic/store_mainpage.webp');
  settingIconImg = loadImage('icon/basic/setting.webp');
  helpIconImg = loadImage('icon/basic/help.webp');
}


function loadShopSupportAssets() {
  if (shopSupportAssetsRequested) return;
  shopSupportAssetsRequested = true;
  shopBoardImg = loadImage('icon/shop_board.webp');
  bulletIconImg = loadImage('icon/basic/bullet.webp');
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
    [WEAPON_TYPES.PISTOL]: loadImage('icon/WEAPON/pistol.webp'),
    [WEAPON_TYPES.SHOTGUN]: loadImage('icon/WEAPON/short_gun.webp'),
    [WEAPON_TYPES.RIFLE]: loadImage('icon/WEAPON/assault_rifle.webp'),
    [WEAPON_TYPES.LASER]: loadImage('icon/WEAPON/laser_gun.webp'),
    [WEAPON_TYPES.MOLOTOV]: loadImage('icon/WEAPON/molotov.webp'),
    [WEAPON_TYPES.DONGFENG]: loadImage('icon/WEAPON/DF.webp'),
    [WEAPON_TYPES.LOITERING]: loadImage('icon/WEAPON/drone.webp'),
    [WEAPON_TYPES.ATOMIC]: loadImage('icon/WEAPON/nuke.webp')
  };
}

function loadGameplayAssets() {
  if (gameplayAssetsRequested) return;
  gameplayAssetsRequested = true;
  loadShopSupportAssets();
  hospitalImg = loadImage('icon/BUILDING/hospital.webp');
  armoryImg = loadImage('icon/BUILDING/arms.webp');
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
  images.police = loadImage('icon/BUILDING/police_dept.webp');
  images.cityBuildings = [];
  for (let f of CITY_BUILDING_FILES) {
    images.cityBuildings.push({ img: loadImage('icon/BUILDING/' + f.file), label: f.label });
  }
  images.trees = [images.tree1, images.tree2, images.tree3, images.tree4, images.tree5, images.pine1, images.pine2];
  images.rocks = [images.rock1, images.rock2, images.rock3, images.rock4, images.rock5, images.rock6];
  images.bushes = [images.bush1, images.bush2, images.bush3, images.bush4, images.bush5, images.bush6, images.bush7, images.bush8];
}

function loadEndingVideos() {
  if (endingVideosRequested) return;
  endingVideosRequested = true;
  defeatVideo = createMutedVideoAsset('icon/basic/defeat.mp4', 'metadata');
  victoryVideo = createMutedVideoAsset('icon/basic/victory.mp4', 'metadata');
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
    isMapTextureReady(gameCoverImg) &&
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
  return elapsed >= BOOT_LOADING_MAX_MS;
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
  
  // Generate the map
  generateTileMap();
  
  // Create Visuals from TileMap
  createMapGraphics();

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

