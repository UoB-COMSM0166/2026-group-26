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
    this.currentWeapon = 'pistol';
    this.hasShield = false;
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
    // Determine direction of movement (forward or backward) relative to heading
    let direction = 0;
    let forward = p5.Vector.fromAngle(this.heading);
    if (this.vel.dot(forward) > 0.1) direction = 1;
    else if (this.vel.dot(forward) < -0.1) direction = -1;

    // Steering
    // Only steer if moving
    if (this.vel.mag() > 0.1) {
        // Dynamic Turn Speed: Reduced when not accelerating (coasting) to simulate lack of power steering/grip
        let currentTurnSpeed = this.turnSpeed;
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
      force.mult(0.5); // Significantly increased acceleration (0.1 -> 0.5) to overcome friction
      this.applyForce(force);
    }
    
    // Reverse / Brake (S key)
    if (keyIsDown(DOWN_ARROW) || keyIsDown(83)) { // Down or S
       let force = p5.Vector.fromAngle(this.heading);
       force.mult(-0.8); // Increased reverse speed as requested
       this.applyForce(force);
    }

    // --- Drift & Grip Physics ---
    let grip = 0.15; // How fast velocity aligns with heading (0.15 = snappy but smooth)
    let friction = this.friction; // Use instance friction

    // Spacebar for Handbrake / Drift
    if (keyIsDown(32)) { 
        grip = 0.01; // Lose traction (Drift)
        friction = 0.92; // Decelerate more (Brake)
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
        this.vel.lerp(targetVel, grip);
        
        // Apply Friction/Drag
        this.vel.mult(friction);
    } else {
        // Stop completely if very slow and no input
        if (this.vel.mag() < 0.05 && !keyIsDown(UP_ARROW) && !keyIsDown(87)) {
            this.vel.mult(0);
        }
    }

    super.update();

    // Visual Feedback for Drifting
    if (this.isDrifting && this.vel.mag() > 2) {
        // Calculate rear position based on heading
        let rear = p5.Vector.fromAngle(this.heading);
        rear.mult(-this.length/2); // Behind center
        rear.add(this.pos);
        
        // Add smoke particles
        // Note: accessing global 'particles' array from sketch.js
        if (frameCount % 3 === 0) { // Don't add every frame to save performance
            particles.push(new Particle(rear.x + random(-5, 5), rear.y + random(-5, 5), color(220, 220, 220, 100)));
        }
    }

    // Mud Splash on Grass
    let tileX = floor(this.pos.x / tileSize);
    let tileY = floor(this.pos.y / tileSize);

    if (typeof mapCols !== 'undefined' && tileX >= 0 && tileX < mapCols && tileY >= 0 && tileY < mapRows) {
         let tile = tileMap[tileY][tileX];
         // If on grass and moving fast enough
         if (tile && tile.type === 'grass' && this.vel.mag() > 2) {
             // Emit mud particles
             if (frameCount % 4 === 0) { // Throttle
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
