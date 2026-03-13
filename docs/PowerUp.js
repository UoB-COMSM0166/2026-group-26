class PowerUp {
  constructor(x, y, type) {
    this.pos = createVector(x, y);
    this.type = type; // 'speed', 'shield', 'health', 'coin'
    this.r = 10;
    this.value = type === 'coin' ? 10 : 0;
  }

  display() {
    push();
    let isoPos = projectIso(this.pos.x, this.pos.y);
    translate(isoPos.x, isoPos.y);
    
    // Scale up for better visibility
    scale(1.8);
    
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
    
    // Glowing Halo
    let pulse = 20 + sin(frameCount * 0.1) * 5;
    noStroke();
    if (this.type === 'speed') fill(255, 255, 0, 100);
    else if (this.type === 'shield') fill(0, 255, 255, 100);
    else if (this.type === 'coin') fill(255, 215, 0, 120);
    else fill(255, 50, 50, 100);
    ellipse(0, 0, pulse, pulse);

    strokeWeight(2);
    
    if (this.type === 'speed') {
      // Lightning Bolt Icon
      fill(255, 255, 0); // Yellow
      stroke(255, 200, 0); // Orange outline
      
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
      stroke(0, 100, 255); // Blue outline
      
      beginShape();
      vertex(-9, -9);
      vertex(9, -9);
      vertex(9, 3);
      bezierVertex(9, 11, 0, 15, 0, 15); // Bottom curve
      bezierVertex(0, 15, -9, 11, -9, 3);
      endShape(CLOSE);
      
      // Inner detail
      noFill();
      stroke(255, 255, 255, 200);
      strokeWeight(2);
      beginShape();
      vertex(-5, -5);
      vertex(5, -5);
      vertex(5, 2);
      bezierVertex(5, 8, 0, 11, 0, 11);
      bezierVertex(0, 11, -5, 8, -5, 2);
      endShape(CLOSE);

    } else if (this.type === 'health') {
      // Medkit Icon
      fill(255); // White box
      stroke(200); // Gray outline
      rectMode(CENTER);
      rect(0, 0, 24, 20, 4); // Slightly larger
      
      // Handle
      noFill();
      stroke(150);
      strokeWeight(2);
      arc(0, -10, 10, 10, PI, TWO_PI);

      // Red Cross
      fill(255, 0, 0);
      noStroke();
      rect(0, 1, 8, 14); // Vertical bar
      rect(0, 1, 14, 8); // Horizontal bar
    } else if (this.type === 'coin') {
      fill(255, 215, 0);
      stroke(200, 150, 0);
      ellipse(0, 0, 14, 14);
      fill(200, 150, 0);
      noStroke();
      textAlign(CENTER, CENTER);
      textSize(10);
      text("$", 0, 0);
    } else if (this.type === WEAPON_TYPES.DONGFENG || this.type === WEAPON_TYPES.LOITERING || this.type === WEAPON_TYPES.ATOMIC) {
        let weaponIcon = images && images.weaponShop ? images.weaponShop[this.type] : null;
        if (weaponIcon) {
          push();
          imageMode(CENTER);
          noStroke();
          tint(255, 245);
          let maxSide = 24;
          let ratio = min(maxSide / weaponIcon.width, maxSide / weaponIcon.height);
          let drawW = weaponIcon.width * ratio;
          let drawH = weaponIcon.height * ratio;
          image(weaponIcon, 0, 0, drawW, drawH);
          noTint();
          pop();
        } else if (this.type === WEAPON_TYPES.DONGFENG) {
          fill(200);
          stroke(100);
          rect(0, 0, 10, 20);
          triangle(-5, 10, 5, 10, 0, -15);
        } else if (this.type === WEAPON_TYPES.LOITERING) {
          fill(100, 100, 255);
          rect(0, 0, 20, 10);
          ellipse(0, 0, 5, 5);
        } else {
          fill(0);
          stroke(255, 255, 0);
          ellipse(0, 0, 20, 20);
          fill(255, 255, 0);
          arc(0, 0, 20, 20, 0, PI/3);
          arc(0, 0, 20, 20, 2 * PI/3, PI);
          arc(0, 0, 20, 20, 4 * PI/3, 5 * PI/3);
        }
    }

    pop();
  }

  checkCollision(vehicle) {
    let d = p5.Vector.dist(this.pos, vehicle.pos);
    let extraRange = 24;
    if (this.type === 'coin') extraRange = 34;
    if (this.type === WEAPON_TYPES.DONGFENG || this.type === WEAPON_TYPES.LOITERING || this.type === WEAPON_TYPES.ATOMIC) {
      extraRange = 36;
    }
    return d < this.r + vehicle.r + extraRange;
  }
}
