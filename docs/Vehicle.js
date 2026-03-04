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
    
    // Visual Enhancements
    this.skidMarks = []; // Replaces trail
    this.maxSkidLength = 50;
    this.isDrifting = false;
    this.isBraking = false;
  }

  applyForce(force) {
    this.acc.add(force);
  }

  update() {
    this.vel.add(this.acc);
    this.vel.limit(this.maxSpeed);
    this.pos.add(this.vel);
    this.acc.mult(0);
    
    // Skid Marks Logic
    // Add skid marks if drifting or braking hard while moving
    let speed = this.vel.mag();
    if (speed > 1 && (this.isDrifting || this.isBraking)) {
        // Calculate rear tire positions based on heading
        // Left Rear and Right Rear
        let rearOffset = -this.length / 2;
        let sideOffset = this.width / 2 - 2; // Slightly inside
        
        // We need to rotate these offsets by the car's heading
        let angle = this.heading;
        
        let p1 = createVector(rearOffset, -sideOffset).rotate(angle).add(this.pos);
        let p2 = createVector(rearOffset, sideOffset).rotate(angle).add(this.pos);
        
        this.skidMarks.push({
            p1: p1,
            p2: p2,
            alpha: 255, // Full opacity start
            life: 120 // Frames to live
        });
    }
    
    // Update Skid Marks (fade out)
    for (let i = this.skidMarks.length - 1; i >= 0; i--) {
        this.skidMarks[i].alpha -= 4; // Fade out speed
        if (this.skidMarks[i].alpha <= 0) {
            this.skidMarks.splice(i, 1);
        }
    }
  }

  display() {
    // Draw Skid Marks (Ground level)
    noStroke();
    for (let mark of this.skidMarks) {
        let isoP1 = projectIso(mark.p1.x, mark.p1.y);
        let isoP2 = projectIso(mark.p2.x, mark.p2.y);
        
        fill(30, 30, 30, mark.alpha);
        ellipse(isoP1.x, isoP1.y, 4, 2); // Simple dot for now, or lines connecting them if we stored previous?
        ellipse(isoP2.x, isoP2.y, 4, 2);
    }

    push();
    // Project position to Iso
    let isoPos = projectIso(this.pos.x, this.pos.y);
    translate(isoPos.x, isoPos.y);
    
    // Project heading to Iso angle
    let headingVec = p5.Vector.fromAngle(this.heading);
    let isoHeadingVec = projectIsoVector(headingVec.x, headingVec.y);
    let isoAngle = isoHeadingVec.heading();
    
    // Draw Predictive Arrow (Under the car, rotating with inputs)
    // Only if this is the player (simple check: if it has turnSpeed)
    if (this.turnSpeed) { 
        this.drawPredictiveArrow(isoAngle);
    }

    rotate(isoAngle);
    
    // Car Body - Enhanced for Orientation
    stroke(255); 
    strokeWeight(1.5);
    fill(this.color);
    rectMode(CENTER);
    
    // Main Body (Slightly tapered to show front?)
    // Let's use a custom shape instead of rect to indicate direction
    beginShape();
    vertex(this.length/2 + 5, 0); // Pointy Front
    vertex(this.length/2, -this.width/2);
    vertex(-this.length/2, -this.width/2);
    vertex(-this.length/2, this.width/2);
    vertex(this.length/2, this.width/2);
    endShape(CLOSE);
    
    // Spoiler (Rear)
    fill(this.color);
    rect(-this.length/2 - 2, 0, 4, this.width + 4);
    
    // Stripe/Detail
    noStroke();
    fill(255, 255, 255, 150);
    rect(5, 0, this.length * 0.6, this.width * 0.4); // Racing stripe
    
    // Windshield (Black/Dark Blue)
    stroke(0);
    strokeWeight(1);
    fill(50, 50, 100); 
    rect(2, 0, 10, 18, 2); 
    
    // Headlights (Brighter & Cone)
    fill(255, 255, 150);
    noStroke();
    ellipse(this.length/2 + 2, -this.width/3, 5, 5);
    ellipse(this.length/2 + 2, this.width/3, 5, 5);
    
    // Headlight Beams (Subtle glow)
    fill(255, 255, 200, 50);
    arc(this.length/2 + 5, -this.width/3, 40, 30, -PI/4, PI/4);
    arc(this.length/2 + 5, this.width/3, 40, 30, -PI/4, PI/4);
    
    // Brake lights (red) - Brighten when braking
    if (this.isBraking) {
        fill(255, 0, 0);
        stroke(255, 100, 100);
        strokeWeight(2);
    } else {
        fill(150, 0, 0);
        noStroke();
    }
    rect(-this.length/2, -this.width/3, 3, 6);
    rect(-this.length/2, this.width/3, 3, 6);
    
    pop();
  }
  
  drawPredictiveArrow(currentIsoAngle) {
      // Calculate predicted trajectory
      // Style: Crosswalk/Dashed line (vertically stacked rectangles)
      
      push();
      
      // Sim parameters
      let simSteps = 15;
      let simPos = createVector(0, 0); // Relative to car center
      let simVel = p5.Vector.fromAngle(this.heading).setMag(max(this.vel.mag(), 5)); 
      let simHeading = this.heading;
      let simTurnSpeed = 0.05 * 0.8; 
      
      // Check inputs for prediction
      let turnInput = 0;
      if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) turnInput = -1;
      if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) turnInput = 1;
      
      // Draw Trajectory as individual segments (Dashed/Rectangles)
      rectMode(CENTER);
      noStroke();
      
      for(let i=0; i<simSteps; i++) {
          // Update heading
          simHeading += simTurnSpeed * turnInput;
          
          // Update velocity direction
          simVel = p5.Vector.fromAngle(simHeading).setMag(simVel.mag());
          
          // Calculate step displacement in World
          let step = simVel.copy().mult(3); // Scale up for visibility distance
          
          // Project step to Iso
          let isoStep = projectIsoVector(step.x, step.y);
          
          simPos.add(isoStep);
          
          // Draw Segment at simPos
          push();
          translate(simPos.x, simPos.y);
          
          // Calculate rotation for this segment in Iso space
          let segmentHeadingVec = p5.Vector.fromAngle(simHeading);
          let isoSegmentHeading = projectIsoVector(segmentHeadingVec.x, segmentHeadingVec.y);
          rotate(isoSegmentHeading.heading());
          
          // Draw "Crosswalk" rectangle
          // Fade out opacity as it gets further
          let alpha = map(i, 0, simSteps, 150, 0); 
          fill(255, 255, 255, alpha); // White, transparent
          
          // Rectangle size (wider than long to look like crosswalk stripes across path?)
          // User said "vertically stacked rectangles", usually means perpendicular to path like a ladder.
          // Width (perp to path) > Length (along path)
          rect(0, 0, 4, 12); 
          
          pop();
      }
      
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
