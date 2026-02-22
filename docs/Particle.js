class Particle {
  constructor(x, y, color) {
    this.pos = createVector(x, y);
    this.vel = p5.Vector.random2D();
    this.vel.mult(random(1, 3));
    this.acc = createVector(0, 0);
    this.lifespan = 255;
    this.color = color;
    this.r = 4;
  }

  update() {
    this.vel.add(this.acc);
    this.vel.mult(0.95);
    this.pos.add(this.vel);
    this.lifespan -= 5;
  }

  display() {
    let isoPos = projectIso(this.pos.x, this.pos.y);
    noStroke();
    fill(red(this.color), green(this.color), blue(this.color), this.lifespan);
    ellipse(isoPos.x, isoPos.y, this.r * 2);
  }

  isDead() {
    return this.lifespan < 0;
  }
}
