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
    // Only show health bar if enemy is damaged, or we can show it always
    if (this.hp >= this.maxHp && !this.isShielded) return; // Optional: hide when full health

    push();
    translate(this.pos.x, this.pos.y);
    
    let barWidth = 40;
    let barHeight = 6;
    let yOffset = -(this.height || 30) / 2 - 15; // Position above the car

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
