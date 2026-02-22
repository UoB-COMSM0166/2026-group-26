class PowerUp {
  constructor(x, y, type) {
    this.pos = createVector(x, y);
    this.type = type; // 'speed', 'shield', 'health'
    this.r = 10;
  }

  display() {
    push();
    let isoPos = projectIso(this.pos.x, this.pos.y);
    translate(isoPos.x, isoPos.y);
    
    // Floating animation
    let floatY = sin(frameCount * 0.05) * 5;
    
    // Draw Shadow on ground (fixed, doesn't float)
    push();
    translate(0, 15); 
    fill(0, 0, 0, 50);
    noStroke();
    ellipse(0, 0, 16, 6);
    pop();

    // Draw Item (floating)
    translate(0, floatY);
    strokeWeight(2);
    
    if (this.type === 'speed') {
      // Lightning Bolt Icon
      fill(255, 255, 0); // Yellow
      stroke(200, 150, 0); // Darker yellow/orange outline
      
      beginShape();
      vertex(4, -12);
      vertex(-4, -2);
      vertex(0, -2);
      vertex(-6, 12);
      vertex(6, 2);
      vertex(2, 2);
      endShape(CLOSE);
      
    } else if (this.type === 'shield') {
      // Shield Icon
      fill(0, 255, 255); // Cyan
      stroke(0, 100, 200); // Blue outline
      
      beginShape();
      vertex(-9, -9);
      vertex(9, -9);
      vertex(9, 3);
      bezierVertex(9, 11, 0, 15, 0, 15); // Bottom curve
      bezierVertex(0, 15, -9, 11, -9, 3);
      endShape(CLOSE);
      
      // Inner detail
      noFill();
      stroke(255, 255, 255, 150);
      strokeWeight(1);
      beginShape();
      vertex(-5, -5);
      vertex(5, -5);
      vertex(5, 2);
      bezierVertex(5, 8, 0, 11, 0, 11);
      bezierVertex(0, 11, -5, 8, -5, 2);
      endShape(CLOSE);

    } else if (this.type === 'health') {
      // Medkit Icon
      fill(250); // White box
      stroke(100); // Gray outline
      rectMode(CENTER);
      rect(0, 0, 22, 18, 3);
      
      // Handle
      noFill();
      stroke(100);
      strokeWeight(2);
      arc(0, -9, 8, 8, PI, TWO_PI);

      // Red Cross
      fill(255, 0, 0);
      noStroke();
      rect(0, 1, 6, 12); // Vertical bar
      rect(0, 1, 12, 6); // Horizontal bar
    }
    pop();
  }

  checkCollision(vehicle) {
    let d = p5.Vector.dist(this.pos, vehicle.pos);
    return d < this.r + vehicle.r;
  }
}
