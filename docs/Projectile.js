
class Projectile {
  constructor(x, y, heading, type) {
    this.pos = createVector(x, y);
    this.type = type;
    this.heading = heading;
    this.vel = p5.Vector.fromAngle(heading);
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
    
    this.vel.mult(this.speed);
    
    // Special handling
    this.isMolotov = (type === WEAPON_TYPES.MOLOTOV);
    this.isFireArea = false;
    this.target = null;
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
        
    } else if (this.type === WEAPON_TYPES.LASER) {
        // Draw laser trail projected to Iso
        stroke(this.color);
        strokeWeight(2);
        let tail = p5.Vector.mult(this.vel, -2); // Length of tail in World Units
        let isoTail = projectIsoVector(tail.x, tail.y);
        line(0, 0, isoTail.x, isoTail.y);
        
        fill(255);
        noStroke();
        ellipse(0, 0, this.r * 2);
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
