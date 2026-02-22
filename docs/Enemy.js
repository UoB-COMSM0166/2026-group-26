class Enemy extends Vehicle {
  constructor(x, y) {
    super(x, y, color(255, 0, 0));
    this.maxSpeed = 3;
    this.maxForce = 0.1;
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
    super.update();
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
  }
}
