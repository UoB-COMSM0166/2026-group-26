class Enemy extends Vehicle {
  constructor(x, y) {
    super(x, y, color(255, 0, 0));
    this.maxSpeed = 3;
    this.maxForce = 0.1;
  }

  seek(target) {
    let desired = p5.Vector.sub(target.pos, this.pos);
    desired.setMag(this.maxSpeed);
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
}
