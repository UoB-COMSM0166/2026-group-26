class Player extends Vehicle {
  constructor(x, y) {
    let carData = CAR_CATALOG ? CAR_CATALOG.starter : { color: [0, 255, 0], maxSpeed: 12, turnSpeed: 0.05, friction: 0.96, maxHp: 5, maxAmmo: 10 };
    super(x, y, color(carData.color[0], carData.color[1], carData.color[2]));
    this.carType = 'starter';
    this.bonusMaxHp = 0;
    this.bonusMaxAmmo = 0;
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

  applyCarType(carId) {
    if (!CAR_CATALOG || !CAR_CATALOG[carId]) return;
    let data = CAR_CATALOG[carId];
    this.carType = carId;
    this.color = color(data.color[0], data.color[1], data.color[2]);
    this.maxSpeed = data.maxSpeed;
    this.turnSpeed = data.turnSpeed;
    this.friction = data.friction;
    this.maxHp = data.maxHp + this.bonusMaxHp;
    this.maxAmmo = data.maxAmmo + this.bonusMaxAmmo;
    this.hp = min(this.hp, this.maxHp);
    this.ammo = min(this.ammo, this.maxAmmo);
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
      force.mult(0.5 * timeScale); // Scale Force
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
}
