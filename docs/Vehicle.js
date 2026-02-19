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
  }

  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0);
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);
    rotate(this.heading);
    
    // Car Body
    fill(this.color);
    stroke(0);
    strokeWeight(1);
    rectMode(CENTER);
    rect(0, 0, this.length, this.width, 5); // Main body
    
    // Windshield
    fill(200, 200, 255);
    rect(5, 0, 8, 16, 2); 
    
    // Headlights
    fill(255, 255, 200);
    noStroke();
    ellipse(this.length/2, -this.width/3, 5, 5);
    ellipse(this.length/2, this.width/3, 5, 5);
    
    // Brake lights (red)
    fill(255, 0, 0);
    rect(-this.length/2, -this.width/3, 2, 6);
    rect(-this.length/2, this.width/3, 2, 6);
    
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
