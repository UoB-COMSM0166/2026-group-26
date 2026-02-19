class Building {
  constructor(x, y, w, h, type = 'normal') {
    this.pos = createVector(x, y);
    this.w = w;
    this.h = h;
    this.type = type; // 'normal', 'hospital', 'armory'
    this.lastInteractionTime = 0;
    this.cooldown = 2000; // 2 seconds interaction cooldown
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);
    rectMode(CENTER);
    
    // Shadow
    fill(0, 0, 0, 50);
    noStroke();
    rect(5, 5, this.w, this.h);
    
    // Building Body
    stroke(50);
    strokeWeight(2);
    
    if (this.type === 'hospital') {
        fill(255, 200, 200); // Light Red
    } else if (this.type === 'armory') {
        fill(200, 200, 255); // Light Blue
    } else {
        fill(100); // Gray
    }
    
    rect(0, 0, this.w, this.h);
    
    // Roof / Detail
    if (this.type === 'hospital') {
        fill(255);
        rect(0, 0, this.w - 10, this.h - 10);
        // Red Cross
        fill(255, 0, 0);
        rect(0, 0, 10, 30);
        rect(0, 0, 30, 10);
    } else if (this.type === 'armory') {
        fill(150, 150, 200);
        rect(0, 0, this.w - 10, this.h - 10);
        // Gun Icon (Simple L shape)
        fill(50);
        rect(0, 0, 30, 10);
        rect(-10, 5, 10, 15);
    } else {
        fill(80);
        rect(0, 0, this.w - 10, this.h - 10);
    }
    
    // Cooldown indicator
    if (millis() - this.lastInteractionTime < this.cooldown) {
        fill(0, 0, 0, 100);
        rect(0, 0, this.w, this.h);
    }

    pop();
  }

  checkCollision(vehicle) {
    // Simple AABB vs Circle collision check
    // Find the closest point on the rectangle to the circle center
    let closestX = constrain(vehicle.pos.x, this.pos.x - this.w/2, this.pos.x + this.w/2);
    let closestY = constrain(vehicle.pos.y, this.pos.y - this.h/2, this.pos.y + this.h/2);

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

  showTooltip(player) {
      // Check distance for tooltip (larger than collision)
      let d = p5.Vector.dist(this.pos, player.pos);
      if (d < this.w) { // Rough proximity check
          push();
          translate(this.pos.x, this.pos.y - this.h/2 - 20);
          fill(0, 0, 0, 200);
          noStroke();
          rectMode(CENTER);
          rect(0, 0, 160, 40, 5); // Widened for F key prompt
          
          fill(255);
          textAlign(CENTER, CENTER);
          textSize(12);
          
          if (this.type === 'hospital') {
              text("Hospital\nPress 'F' to Open Shop", 0, 0);
          } else if (this.type === 'armory') {
              text("Armory\nPress 'F' to Open Shop", 0, 0);
          } else {
              text("Building", 0, 0);
          }
          pop();
      }
  }
}
