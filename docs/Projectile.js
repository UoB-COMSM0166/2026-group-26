class Projectile {
  constructor(x, y, heading, type = 'pistol') {
    this.pos = createVector(x, y);
    this.type = type;
    this.heading = heading;
    this.vel = p5.Vector.fromAngle(heading);
    this.r = 4;
    this.lifespan = 100; // Frames to live
    
    // Customize based on type
    if (this.type === 'pistol') {
        this.vel.mult(10);
        this.color = color(255, 255, 0);
    } else if (this.type === 'shotgun') {
        this.vel.mult(12);
        this.color = color(255, 100, 0);
        this.r = 3;
        this.lifespan = 40; // Short range
    } else if (this.type === 'laser') {
        this.vel.mult(20); // Very fast
        this.color = color(0, 255, 255);
        this.r = 5;
        this.lifespan = 60;
    }
  }

  update() {
    this.pos.add(this.vel);
    this.lifespan--;
  }

  display() {
    push();
    let isoPos = projectIso(this.pos.x, this.pos.y);
    translate(isoPos.x, isoPos.y);
    
    if (this.type === 'laser') {
        // Draw laser trail projected to Iso
        stroke(this.color);
        strokeWeight(2);
        let tail = p5.Vector.mult(this.vel, -2); // Length of tail in World Units
        let isoTail = projectIsoVector(tail.x, tail.y);
        line(0, 0, isoTail.x, isoTail.y);
        
        fill(255);
        noStroke();
        ellipse(0, 0, this.r * 2);
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
    let d = p5.Vector.dist(this.pos, enemy.pos);
    return d < this.r + enemy.r;
  }
}
