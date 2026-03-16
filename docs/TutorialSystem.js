class TutorialSystem {
    constructor() {
        this.shown = {
            attack: false,
            powerup: false,
            dongfeng: false,
            loitering: false,
            atomic: false,
            intro: false,
            inventory_full: false,
            controls: false
        };
        this.activeTutorial = null;
        this.introData = null;
    }

    triggerLevelIntro(difficulty) {
        this.activeTutorial = 'intro';
        this.shown.intro = true;
        
        if (difficulty === 'EASY') {
            this.introData = {
                title: "EASY MODE",
                color: [0, 255, 0],
                features: [
                    "Standard Speed",
                    "Abundant Drops",
                    "Survival Time: 60s"
                ]
            };
        } else if (difficulty === 'NORMAL') {
            this.introData = {
                title: "NORMAL MODE",
                color: [255, 255, 0],
                features: [
                    "Standard Speed",
                    "Standard Drops",
                    "Survival Time: 90s"
                ]
            };
        } else if (difficulty === 'HARD') {
             this.introData = {
                title: "HARD MODE",
                color: [255, 50, 50],
                features: [
                    "Player Speed: -10%",
                    "Enemy Speed: +10%",
                    "NO WEAPON/HEALTH DROPS",
                    "Survival Time: 120s"
                ]
            };
        }
    }

    check(player, enemies, buildings, powerups) {
        if (this.activeTutorial) return null;

        // Weapon Tutorials
        if (player.currentSpecialWeapon) {
            let type = player.currentSpecialWeapon;
            if (type === WEAPON_TYPES.DONGFENG && !this.shown.dongfeng) {
                this.trigger('dongfeng');
                return 'dongfeng';
            } else if (type === WEAPON_TYPES.LOITERING && !this.shown.loitering) {
                this.trigger('loitering');
                return 'loitering';
            } else if (type === WEAPON_TYPES.ATOMIC && !this.shown.atomic) {
                this.trigger('atomic');
                return 'atomic';
            }
        }

        if (!this.shown.attack && enemies.length > 0) {
            let playerPos = player.pos;
            let triggerRadius = 900;
            for (let e of enemies) {
                if (p5.Vector.dist(playerPos, e.pos) <= triggerRadius) {
                    this.trigger('attack');
                    return 'attack';
                }
            }
        }
        
        // Powerup Tutorial
        if (!this.shown.powerup && powerups && powerups.length > 0) {
            for (let p of powerups) {
                if (p5.Vector.dist(player.pos, p.pos) < 350) {
                    if (this.hasLineOfSight(player.pos, p.pos, buildings)) {
                        this.trigger('powerup');
                        return 'powerup';
                    }
                }
            }
        }

        return null;
    }
    
    hasLineOfSight(p1, p2, buildings) {
        // Simple raycast check against building bounding boxes
        let steps = 10;
        for(let i=1; i<steps; i++) {
            let p = p5.Vector.lerp(p1, p2, i/steps);
            for(let b of buildings) {
                 // Check if point is inside building rect (with some buffer)
                 if (p.x > b.pos.x - b.w/2 && p.x < b.pos.x + b.w/2 &&
                     p.y > b.pos.y - b.h/2 && p.y < b.pos.y + b.h/2) {
                     return false;
                 }
            }
        }
        return true;
    }

    trigger(type) {
        this.activeTutorial = type;
        this.shown[type] = true;
    }

    draw(x, y, w, h) {
        if (!this.activeTutorial) return;

        push();
        // Assume we are in the correct context (translated to game view)
        translate(x, y);
        
        // Overlay
        fill(0, 0, 0, 160);
        rectMode(CORNER);
        rect(0, 0, w, h);
        
        // Content
        textAlign(CENTER, CENTER);
        
        let cx = w / 2;
        let cy = h / 2;
        
        if (this.activeTutorial === 'attack') {
            fill(255, 50, 50);
            textSize(36);
            textStyle(BOLD);
            text("ENEMY SPOTTED!", cx, cy - 100);
            
            fill(255);
            textSize(22);
            textStyle(NORMAL);
            text("Enemy nearby! LEFT CLICK to attack now!", cx, cy + 100);
            
            // Draw Mouse Animation
            this.drawMouseAnimation(cx, cy);
        } else if (this.activeTutorial === 'powerup') {
            fill(255, 215, 0);
            textSize(36);
            textStyle(BOLD);
            text("ITEM FOUND!", cx, cy - 100);
            
            fill(255);
            textSize(22);
            textStyle(NORMAL);
            text("Drive over items to collect them!", cx, cy + 100);
            text("(Health, Ammo, Coins, or Boosts)", cx, cy + 140);
            
            // Draw Icon
            this.drawPowerupIcon(cx, cy);
        } else if (this.activeTutorial === 'dongfeng') {
            this.drawWeaponTutorial(cx, cy, "DONGFENG MISSILE", "Strategic Nuclear Strike", 
                "Press X to open Target Map\nClick on map to launch missile");
        } else if (this.activeTutorial === 'loitering') {
            this.drawWeaponTutorial(cx, cy, "LOITERING DRONE", "Remote Controlled Munition", 
                "Press X to launch Drone\nUse Arrow Keys to steer into enemies");
        } else if (this.activeTutorial === 'atomic') {
            this.drawWeaponTutorial(cx, cy, "ATOMIC BOMB", "Ultimate Weapon", 
                "Press X to detonate immediately\nDestroys EVERYTHING nearby");
        } else if (this.activeTutorial === 'intro') {
             this.drawIntro(cx, cy, w, h);
        } else if (this.activeTutorial === 'controls') {
             this.drawControls(cx, cy);
        } else if (this.activeTutorial === 'inventory_full') {
            fill(255, 50, 50);
            textSize(36);
            textStyle(BOLD);
            text("INVENTORY FULL!", cx, cy - 100);
            
            fill(255);
            textSize(22);
            textStyle(NORMAL);
            text("You can only carry ONE special weapon at a time!", cx, cy + 60);
            text("Use your current weapon before picking up a new one.", cx, cy + 100);
            
            // Draw Icon (Reuse Powerup Icon style but maybe red?)
            push();
            translate(cx, cy - 20);
            scale(2);
            fill(50); 
            stroke(255, 50, 50);
            strokeWeight(2);
            rectMode(CENTER);
            rect(0, 0, 40, 40, 5);
            
            noStroke();
            fill(255, 50, 50);
            textAlign(CENTER, CENTER);
            textSize(24);
            text("!", 0, 0);
            pop();
        }
        
        // Pulse effect for "Click to Continue"
        let alpha = 150 + 100 * sin(millis() * 0.005);
        fill(255, 255, 255, alpha);
        textSize(18);
        text("Click or Press SPACE to Continue", cx, cy + 200);
        
        pop();
    }
    
    drawIntro(cx, cy, w, h) {
        if (!this.introData) return;
        
        let d = this.introData;
        
        // Header
        fill(d.color);
        textSize(48);
        textStyle(BOLD);
        text(d.title, cx, cy - 120);
        
        // Features
        fill(255);
        textSize(24);
        textStyle(NORMAL);
        textAlign(CENTER, CENTER);
        
        for (let i = 0; i < d.features.length; i++) {
            let f = d.features[i];
            text("• " + f, cx, cy - 20 + i * 40);
        }
        
        // Decoration
        stroke(d.color);
        strokeWeight(4);
        noFill();
        rectMode(CENTER);
        rect(cx, cy, 400, 300, 20);
    }
    
    drawControls(cx, cy) {
        fill(255);
        textSize(42);
        textStyle(BOLD);
        text("VEHICLE CONTROLS", cx, cy - 200);
        
        textSize(20);
        textStyle(NORMAL);
        fill(200);
        text("Master your vehicle to survive", cx, cy - 160);

        // Layout Constants
        let keySize = 60; // Slightly larger
        let gap = 15;
        let startY = cy + 20; // Shift down to avoid title overlap

        // Draw W
        this.drawKey(cx, startY - keySize - gap, 'W', keySize);
        // Label Above W
        fill(100, 200, 255);
        textSize(16);
        textStyle(BOLD);
        text("ACCELERATE", cx, startY - keySize - gap - 45);

        // Draw A / S / D
        this.drawKey(cx - keySize - gap, startY, 'A', keySize);
        this.drawKey(cx, startY, 'S', keySize);
        this.drawKey(cx + keySize + gap, startY, 'D', keySize);
        
        // Labels for A/D (Steer)
        fill(100, 200, 255);
        text("STEER", cx - keySize - gap, startY + 45);
        text("STEER", cx + keySize + gap, startY + 45);
        
        // Label for S (Brake)
        text("BRAKE / REV", cx, startY + 45);
        
        // Draw Space (Drift)
        let spaceW = keySize * 3 + gap * 2;
        let spaceY = startY + keySize + gap + 40;
        this.drawKey(cx, spaceY, 'SPACE', keySize, false, spaceW);
        
        // Label for Space
        text("DRIFT / HANDBRAKE (HOLD)", cx, spaceY + 45);
        
        // Small hint about arrows
        fill(150);
        textSize(14);
        textStyle(ITALIC);
        text("(Arrow Keys also supported)", cx, spaceY + 80);
    }

    drawKey(x, y, label, size, isArrow = false, widthOverride = null) {
        let w = widthOverride || size;
        let h = size;
        
        push();
        translate(x, y);
        
        // Simple animation: "Press" every 2 seconds
        let press = (millis() % 2000) < 1000;
        // Alternate press for different keys to make it lively
        if (label === 'W' || label === '▲') press = (millis() % 2000) < 500;
        else if (label === 'S' || label === '▼') press = (millis() % 2000) > 1000 && (millis() % 2000) < 1500;
        
        let offset = press ? 2 : 0;
        
        fill(220);
        stroke(50);
        strokeWeight(2);
        rectMode(CENTER);
        
        // Key Base
        rect(0, 0, w, h, 8);
        
        // Key Top
        fill(isArrow ? 240 : 255);
        if (press) fill(200);
        rect(0, -4 + offset, w - 6, h - 6, 6);
        
        fill(50);
        textSize(isArrow ? size * 0.5 : size * 0.4);
        if (widthOverride) textSize(size * 0.35); // Smaller text for SPACE
        textStyle(BOLD);
        textAlign(CENTER, CENTER);
        text(label, 0, -4 + offset);
        
        pop();
    }
    
    drawWeaponTutorial(cx, cy, title, subtitle, instructions) {
        fill(255, 100, 0);
        textSize(36);
        textStyle(BOLD);
        text(title, cx, cy - 100);
        
        fill(255, 200, 100);
        textSize(24);
        textStyle(BOLD);
        text(subtitle, cx, cy - 60);
        
        fill(255);
        textSize(22);
        textStyle(NORMAL);
        // Split instructions by newline
        let lines = instructions.split('\n');
        for(let i=0; i<lines.length; i++) {
            text(lines[i], cx, cy + 100 + i * 30);
        }
        
        // Draw 'X' Key Animation
        this.drawKeyAnimation(cx, cy, 'X');
    }

    drawKeyAnimation(x, y, keyLabel) {
        push();
        translate(x, y);
        scale(1.5);
        
        let press = (millis() % 1000) < 500;
        let offset = press ? 2 : 0;
        
        fill(200);
        stroke(50);
        strokeWeight(2);
        rectMode(CENTER);
        
        // Key base
        rect(0, 0, 50, 50, 8);
        
        // Key top (simulating depth)
        fill(245);
        rect(0, -4 + offset, 44, 44, 6);
        
        fill(50);
        textSize(24);
        textStyle(BOLD);
        textAlign(CENTER, CENTER);
        text(keyLabel, 0, -4 + offset);
        
        pop();
    }

    drawMouseAnimation(x, y) {
        push();
        translate(x, y);
        scale(1.5);
        
        // Mouse Body
        fill(240);
        stroke(50);
        strokeWeight(2);
        rectMode(CENTER);
        rect(0, 10, 36, 54, 12);
        
        // Buttons line
        line(0, -17, 0, 0);
        line(-18, 0, 18, 0);
        
        // Left Click Animation
        if (frameCount % 60 < 30) {
            fill(255, 50, 50, 200);
            noStroke();
            // Left button area (top left quadrant of mouse)
            arc(-9, -8.5, 18, 17, PI, TWO_PI); 
            
            // Ripple
            noFill();
            stroke(255, 50, 50, 255 - (frameCount % 30) * 8);
            strokeWeight(3);
            ellipse(-9, -15, 10 + (frameCount % 30), 10 + (frameCount % 30) * 0.6);
        }
        
        pop();
    }
    
    drawPowerupIcon(x, y) {
        push();
        translate(x, y);
        scale(2);
        
        fill(255, 215, 0); // Gold Box
        stroke(255);
        strokeWeight(2);
        rectMode(CENTER);
        rect(0, 0, 40, 40, 5);
        
        fill(255);
        textAlign(CENTER, CENTER);
        textSize(24);
        text("?", 0, 0);
        
        // Float animation
        let offset = sin(frameCount * 0.1) * 5;
        translate(0, offset);
        
        pop();
    }
    
    dismiss() {
        if (this.activeTutorial) {
            this.activeTutorial = null;
            return true;
        }
        return false;
    }
}
