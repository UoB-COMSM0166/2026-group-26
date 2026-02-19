class PowerUp {
  constructor(x, y, type) {
    this.pos = createVector(x, y);
    this.type = type; // 'speed', 'shield', 'health'
    this.r = 10;
  }

  display() {
    push();
    translate(this.pos.x, this.pos.y);
    noStroke();
    if (this.type === 'speed') {
      fill(255, 255, 0); // Yellow
      rectMode(CENTER);
      rect(0, 0, this.r * 2, this.r * 2);
    } else if (this.type === 'shield') {
      fill(0, 255, 255); // Cyan
      ellipse(0, 0, this.r * 2, this.r * 2);
    } else if (this.type === 'health') {
      fill(255, 100, 100); // Pink
      rectMode(CENTER);
      rect(0, 0, this.r * 2, this.r * 0.6);
      rect(0, 0, this.r * 0.6, this.r * 2);
    }
    pop();
  }

  checkCollision(vehicle) {
    let d = p5.Vector.dist(this.pos, vehicle.pos);
    return d < this.r + vehicle.r;
  }
}
