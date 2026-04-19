
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
