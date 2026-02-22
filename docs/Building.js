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

  getDisplayName() {
      if (this.label) return this.label;
      if (this.type === 'hospital') return 'Hospital';
      if (this.type === 'armory') return 'Armory';
      if (this.type === 'police') return 'Police Station';
      return 'Residence';
  }

  showTooltip(player) {
      // Check distance for tooltip (larger than collision)
      let size = this.getCollisionSize();
      let d = p5.Vector.dist(this.pos, player.pos);
      if (d < max(size.w, size.h)) {
          push();
          let center = this.getCollisionCenter();
          let isoPos = projectIso(center.x, center.y);
          let offset = max(size.w, size.h) * 0.6 + 10;
          translate(isoPos.x, isoPos.y - offset);
          fill(0, 0, 0, 200);
          noStroke();
          rectMode(CENTER);
          let lines = [this.getDisplayName()];
          if (this.isInteractable()) {
              lines.push("Press F to Interact");
          }
          let boxH = lines.length === 1 ? 24 : 40;
          rect(0, 0, 160, boxH, 5);
          
          fill(255);
          textAlign(CENTER, CENTER);
          textSize(12);
          text(lines.join("\n"), 0, 0);
          pop();
      }
  }
}
