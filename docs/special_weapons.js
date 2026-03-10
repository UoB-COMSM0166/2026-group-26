
let mapSelectStart = 0;
let loiteringMissile = null;
let missileStrikes = []; // Array to manage active missile effects
let atomicStrikes = [];

class MissileStrike {
    constructor(targetX, targetY) {
        this.target = createVector(targetX, targetY);
        this.startHeight = max(520, gameHeight * 0.85);
        this.currentHeight = this.startHeight;
        this.warningFrames = 0;
        this.fallFrame = 0;
        this.fallDuration = 120;
        this.hasExploded = false;
        this.explosionRadius = 300;
        this.explosionDuration = 60;
        this.explosionTimer = 0;
    }

    update() {
        if (!this.hasExploded) {
            if (this.warningFrames > 0) {
                this.warningFrames--;
                return;
            }
            this.fallFrame++;
            let t = min(1, this.fallFrame / this.fallDuration);
            let eased = t * t;
            this.currentHeight = lerp(this.startHeight, 0, eased);
            if (t >= 1) {
                this.currentHeight = 0;
                this.explode();
            }
        } else {
            this.explosionTimer++;
        }
    }
    
    explode() {
        this.hasExploded = true;
        createExplosion(this.target.x, this.target.y, color(255, 100, 50), 100);
        shakeAmount = 30;
        
        // Damage Logic
        for (let i = enemies.length - 1; i >= 0; i--) {
            let e = enemies[i];
            if (dist(e.pos.x, e.pos.y, this.target.x, this.target.y) < this.explosionRadius) {
                e.hp -= 50;
                if (e.hp <= 0) enemies.splice(i, 1);
            }
        }
    }
    
    display() {
        let isoPos = projectIso(this.target.x, this.target.y);

        push();
        translate(isoPos.x, isoPos.y);
        noFill();
        stroke(255, 0, 0, 140 + sin(frameCount * 0.45) * 90);
        strokeWeight(3);
        let ringBase = this.warningFrames > 0 ? 40 + this.warningFrames * 2.4 : 120 * (this.currentHeight / this.startHeight);
        let ringW = 80 + max(0, ringBase);
        let ringH = 40 + max(0, ringBase * 0.5);
        ellipse(0, 0, ringW, ringH);
        stroke(255, 70, 70, 180);
        line(-20, 0, 20, 0);
        line(0, -10, 0, 10);
        pop();

        if (this.hasExploded) {
            if (this.explosionTimer < this.explosionDuration) {
                push();
                translate(isoPos.x, isoPos.y);
                noFill();
                stroke(255, 200, 50, 255 - (this.explosionTimer * 4));
                strokeWeight(10);
                let r = (this.explosionTimer / this.explosionDuration) * this.explosionRadius * 2;
                ellipse(0, 0, r, r * 0.5);
                fill(255, 50, 0, 100 - this.explosionTimer);
                noStroke();
                ellipse(0, 0, r * 0.8, r * 0.4);
                pop();
            }
            return;
        }

        if (this.warningFrames > 0) {
            push();
            translate(isoPos.x, isoPos.y);
            stroke(255, 100, 80, 120);
            strokeWeight(2);
            line(0, -20, 0, 20);
            pop();
            return;
        }

        let screenX = isoPos.x;
        let visibleTop = camY + 30;
        let visibleBottom = camY + gameHeight - 140;
        let screenY = constrain(isoPos.y - this.currentHeight, visibleTop, visibleBottom);

        push();
        translate(screenX, screenY);
        fill(200);
        stroke(100);
        rectMode(CENTER);
        rect(0, 0, 20, 80);
        fill(100);
        triangle(-10, -40, -25, -60, -10, -60);
        triangle(10, -40, 25, -60, 10, -60);
        fill(255, 0, 0);
        triangle(-10, 40, 10, 40, 0, 60);
        fill(255, 150, 0);
        noStroke();
        triangle(-8, -40, 8, -40, 0, -100 - random(30));
        pop();

        push();
        translate(isoPos.x, isoPos.y);
        let progress = 1 - (this.currentHeight / this.startHeight);
        stroke(255, 180, 120, 120 + progress * 120);
        strokeWeight(2);
        line(0, -600 * progress, 0, -20);
        noStroke();
        fill(0, 0, 0, 100 * progress);
        ellipse(0, 0, 40 * progress, 20 * progress);
        pop();
    }
    
    isDead() {
        return this.hasExploded && this.explosionTimer >= this.explosionDuration;
    }
}

class AtomicStrike {
    constructor(targetX, targetY) {
        this.target = createVector(targetX, targetY);
        this.startHeight = max(760, gameHeight * 1.2);
        this.currentHeight = this.startHeight;
        this.fallFrame = 0;
        this.fallDuration = 150;
        this.hasExploded = false;
        this.explosionTimer = 0;
        this.explosionDuration = 120;
    }

    update() {
        if (!this.hasExploded) {
            this.fallFrame++;
            let t = min(1, this.fallFrame / this.fallDuration);
            this.currentHeight = lerp(this.startHeight, 0, t * t);
            if (t >= 1) {
                this.currentHeight = 0;
                this.explode();
            }
            return;
        }
        this.explosionTimer++;
        if (this.explosionTimer < 45) {
            let decay = 1 - this.explosionTimer / 45;
            shakeAmount = max(shakeAmount, 25 + decay * 120);
        }
    }

    explode() {
        this.hasExploded = true;
        shakeAmount = 150;
        createExplosion(this.target.x, this.target.y, color(255, 255, 255), 360);
        for (let e of enemies) {
            createExplosion(e.pos.x, e.pos.y, color(255, 255, 255), 28);
        }
        enemies = [];
    }

    display() {
        let isoPos = projectIso(this.target.x, this.target.y);
        if (this.hasExploded) {
            let t = min(1, this.explosionTimer / this.explosionDuration);
            let flashAlpha = max(0, 220 - this.explosionTimer * 3);
            push();
            translate(isoPos.x, isoPos.y);
            noStroke();
            fill(255, 255, 255, flashAlpha);
            ellipse(0, 0, 2200 * t, 1200 * t);
            fill(180, 255, 240, max(0, 200 - this.explosionTimer * 2));
            ellipse(0, -220 * t, 1100 * t, 680 * t);
            fill(120, 220, 255, max(0, 170 - this.explosionTimer * 2));
            ellipse(0, 0, 2500 * t, 1280 * t);
            fill(240, 120, 80, max(0, 140 - this.explosionTimer * 2));
            rectMode(CENTER);
            rect(0, -120 * t, 180 * t, 360 * t, 55 * t);
            pop();
            return;
        }

        push();
        translate(isoPos.x, isoPos.y);
        noFill();
        stroke(100, 255, 230, 190 + sin(frameCount * 0.35) * 60);
        strokeWeight(5);
        ellipse(0, 0, 340, 180);
        stroke(150, 210, 255, 170);
        ellipse(0, 0, 460, 240);
        line(-40, 0, 40, 0);
        line(0, -24, 0, 24);
        pop();

        let screenX = isoPos.x;
        let visibleTop = camY + 20;
        let visibleBottom = camY + gameHeight - 160;
        let screenY = constrain(isoPos.y - this.currentHeight, visibleTop, visibleBottom);

        push();
        translate(screenX, screenY);
        let atomicIcon = images && images.weaponShop ? images.weaponShop[WEAPON_TYPES.ATOMIC] : null;
        if (atomicIcon && atomicIcon.width > 0 && atomicIcon.height > 0) {
            imageMode(CENTER);
            let iconW = 66;
            let iconH = 102;
            let ratio = min(iconW / atomicIcon.width, iconH / atomicIcon.height);
            tint(255, 250);
            push();
            rotate(PI);
            image(atomicIcon, 0, 0, atomicIcon.width * ratio, atomicIcon.height * ratio);
            pop();
            noTint();
        } else {
            fill(120, 130, 145);
            stroke(70, 80, 90);
            strokeWeight(2);
            rectMode(CENTER);
            rect(0, 0, 34, 120, 10);
            fill(95, 105, 120);
            triangle(-17, -60, -34, -84, -17, -84);
            triangle(17, -60, 34, -84, 17, -84);
            fill(220, 70, 70);
            triangle(-17, 60, 17, 60, 0, 88);
        }
        noStroke();
        fill(210, 255, 255, 220);
        ellipse(0, -72, 12, 46 + random(30));
        pop();
    }

    isDead() {
        return this.hasExploded && this.explosionTimer >= this.explosionDuration;
    }
}

function updateMissileStrikes() {
    for (let i = missileStrikes.length - 1; i >= 0; i--) {
        let m = missileStrikes[i];
        m.update();
        if (m.isDead()) {
            missileStrikes.splice(i, 1);
        }
    }
}

function drawMissileStrikes() {
    for (let m of missileStrikes) {
        m.display();
    }
}

function updateAtomicStrikes() {
    for (let i = atomicStrikes.length - 1; i >= 0; i--) {
        let n = atomicStrikes[i];
        n.update();
        if (n.isDead()) {
            atomicStrikes.splice(i, 1);
        }
    }
}

function drawAtomicStrikes() {
    for (let n of atomicStrikes) {
        n.display();
    }
}

function hasActiveMissileStrike() {
    return missileStrikes.length > 0;
}

function getActiveMissileStrikeTarget() {
    if (missileStrikes.length === 0) return null;
    let m = missileStrikes[0];
    return m && m.target ? m.target : null;
}

function fireDongfengStrike(targetX, targetY) {
    // Instead of instant explosion, spawn a MissileStrike object
    missileStrikes.push(new MissileStrike(targetX, targetY));
    
    gameState = 'PLAY';
    if (typeof consumeCurrentSpecialWeapon === 'function') {
        consumeCurrentSpecialWeapon();
    } else {
        player.currentSpecialWeapon = null;
    }
    mapSelectStart = 0;
}

function triggerAtomicBomb() {
    if (!player) return;
    atomicStrikes.push(new AtomicStrike(player.pos.x, player.pos.y));
    shakeAmount = max(shakeAmount, 25);
}

function launchLoiteringMunition() {
    // Switch player control to missile?
    // User said: "Player stops controlling car, starts controlling missile".
    // So we can just swap 'player' reference temporarily? Or have a flag?
    // Better to have a flag `isControllingMissile`.
    
    loiteringMissile = new Vehicle(player.pos.x, player.pos.y, color(255, 0, 0));
    loiteringMissile.maxSpeed = 5;
    loiteringMissile.heading = player.heading;
    loiteringMissile.vel = p5.Vector.fromAngle(player.heading).mult(5);
    loiteringMissile.isMissile = true;
    player.vel.mult(0);
    player.acc.mult(0);
    if (typeof consumeCurrentSpecialWeapon === 'function') {
        consumeCurrentSpecialWeapon();
    } else {
        player.currentSpecialWeapon = null;
    }
    gameState = 'MISSILE_CONTROL';
}

function updateLoiteringMissile() {
    if (!loiteringMissile) return;
    
    // Accelerate
    loiteringMissile.maxSpeed += 0.05;
    loiteringMissile.maxSpeed = min(loiteringMissile.maxSpeed, 20);
    
    // Control
    if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) {
        loiteringMissile.heading -= 0.1;
    }
    if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) {
        loiteringMissile.heading += 0.1;
    }
    
    loiteringMissile.vel = p5.Vector.fromAngle(loiteringMissile.heading).mult(loiteringMissile.maxSpeed);
    loiteringMissile.pos.add(loiteringMissile.vel);
    
    // Collision
    for (let b of buildings) {
        if (loiteringMissile.pos.x > b.pos.x - b.w/2 && loiteringMissile.pos.x < b.pos.x + b.w/2 &&
            loiteringMissile.pos.y > b.pos.y - b.h/2 && loiteringMissile.pos.y < b.pos.y + b.h/2) {
            explodeMissile();
            return;
        }
    }
    
    for (let e of enemies) {
        if (p5.Vector.dist(loiteringMissile.pos, e.pos) < 50) {
            explodeMissile();
            return;
        }
    }
}

function explodeMissile() {
    createExplosion(loiteringMissile.pos.x, loiteringMissile.pos.y, color(255, 100, 0), 30);
    // Damage nearby enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        if (p5.Vector.dist(e.pos, loiteringMissile.pos) < 200) {
            e.hp -= 50; // Massive damage
            if (e.hp <= 0) {
                enemies.splice(i, 1);
            }
        }
    }
    loiteringMissile = null;
    player.vel.mult(0);
    player.acc.mult(0);
    gameState = 'PLAY';
}

function drawMapSelect() {
    background(0);
    
    // Draw Map Scaled
    let scaleF = min(width / mapWidth, height / mapHeight);
    let drawW = mapWidth * scaleF;
    let drawH = mapHeight * scaleF;
    let offX = (width - drawW) / 2;
    let offY = (height - drawH) / 2;
    
    if (mapGraphics) {
        image(mapGraphics, width/2, height/2, drawW, drawH);
    }
    
    // Draw Player
    fill(0, 255, 0);
    noStroke();
    let px = offX + player.pos.x * scaleF;
    let py = offY + player.pos.y * scaleF;
    ellipse(px, py, 10, 10);
    
    // Draw Cursor Target
    let mx = mouseX;
    let my = mouseY;
    
    stroke(255, 0, 0);
    noFill();
    line(mx - 20, my, mx + 20, my);
    line(mx, my - 20, mx, my + 20);
    
    // Long Press Logic
    if (mouseIsPressed) {
        if (mapSelectStart === 0) mapSelectStart = millis();
        
        let progress = (millis() - mapSelectStart) / 2000; // 2 seconds to confirm
        
        // Draw Progress Circle
        noFill();
        stroke(255, 0, 0);
        strokeWeight(4);
        arc(mx, my, 60, 60, -HALF_PI, -HALF_PI + TWO_PI * progress);
        
        if (progress >= 1.0) {
            let targetX = (mx - offX) / scaleF;
            let targetY = (my - offY) / scaleF;
            fireDongfengStrike(targetX, targetY);
        }
    } else {
        mapSelectStart = 0;
    }
    
    fill(255);
    noStroke();
    textSize(20);
    textAlign(CENTER, BOTTOM);
    text("Select Target. Hold Left Click to Fire.", width/2, height - 30);
}

if (typeof globalThis !== 'undefined') {
    globalThis.updateMissileStrikes = updateMissileStrikes;
    globalThis.drawMissileStrikes = drawMissileStrikes;
    globalThis.updateAtomicStrikes = updateAtomicStrikes;
    globalThis.drawAtomicStrikes = drawAtomicStrikes;
    globalThis.hasActiveMissileStrike = hasActiveMissileStrike;
    globalThis.getActiveMissileStrikeTarget = getActiveMissileStrikeTarget;
    globalThis.fireDongfengStrike = fireDongfengStrike;
    globalThis.triggerAtomicBomb = triggerAtomicBomb;
    globalThis.launchLoiteringMunition = launchLoiteringMunition;
    globalThis.updateLoiteringMissile = updateLoiteringMissile;
    globalThis.drawMapSelect = drawMapSelect;
}
