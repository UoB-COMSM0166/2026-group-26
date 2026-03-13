class ShopUI {
  constructor() {
    this.tabs = ['WEAPONS', 'VEHICLES', 'UPGRADES'];
    this.currentTab = 'WEAPONS';
    this.sidebarWidth = 170;
    this.sidebarOffsetX = 18;
    this.sidebarOffsetY = 20;
    this.padding = 20;
    this.cardWidth = 210;
    this.cardHeight = 250;
    this.buttonHeight = 34;
    this.colors = {
      text: [245, 226, 190],
      panel: [78, 55, 37, 235],
      cardBg: [96, 66, 44, 230],
      cardBorder: [186, 132, 79, 255],
      tab: [140, 95, 60, 240],
      tabActive: [184, 123, 74, 255],
      accent: [255, 190, 96],
      success: [96, 198, 128],
      disabled: [100, 100, 100],
      button: [196, 126, 74]
    };
    this.boardX = 0;
    this.boardY = 0;
    this.boardW = 0;
    this.boardH = 0;
    this.innerX = 0;
    this.innerY = 0;
    this.innerW = 0;
    this.innerH = 0;
    this.panelX = 0;
    this.panelY = 0;
    this.panelW = 0;
    this.panelH = 0;
    this.inputOffsetX = 0;
    this.inputOffsetY = 0;
    this.lastGrid = null;
    this.scrollbarWidth = 10;
    this.scrollOffsets = { WEAPONS: 0, VEHICLES: 0, UPGRADES: 0 };
    this.lastScrollbar = null;
    this.isDraggingScrollbar = false;
    this.scrollDragOffsetY = 0;
    this.closeButtonRect = null;
    this.catalog = null;
    this.catalogLoading = false;
    this.catalogError = '';
  }

  draw(viewW = width, viewH = height, viewX = 0, viewY = 0, inputOffsetX = 0, inputOffsetY = 0) {
    push();
    rectMode(CORNER);
    this.boardX = viewX;
    this.boardY = viewY;
    this.boardW = viewW;
    this.boardH = viewH;
    this.inputOffsetX = inputOffsetX;
    this.inputOffsetY = inputOffsetY;

    if (typeof shopBoardImg !== 'undefined' && shopBoardImg) {
      imageMode(CORNER);
      image(shopBoardImg, this.boardX, this.boardY, this.boardW, this.boardH);
    } else {
      fill(133, 95, 60, 240);
      stroke(84, 56, 36);
      strokeWeight(4);
      rect(this.boardX, this.boardY, this.boardW, this.boardH, 16);
    }

    this.innerX = this.boardX + this.boardW * 0.04;
    this.innerY = this.boardY + this.boardH * 0.24;
    this.innerW = this.boardW * 0.92;
    this.innerH = this.boardH * 0.70;
    this.sidebarWidth = constrain(this.innerW * 0.18, 150, 210);

    let sidebarX = this.innerX + this.sidebarOffsetX;
    let sidebarY = this.innerY + this.sidebarOffsetY;
    let sidebarH = max(0, this.innerH - this.sidebarOffsetY);
    let contentX = sidebarX + this.sidebarWidth + this.padding;
    let contentY = this.innerY + this.padding;
    let contentW = max(0, this.innerX + this.innerW - contentX - this.padding);
    let contentH = max(0, this.innerH - this.padding * 2);

    this.panelX = sidebarX;
    this.panelY = sidebarY;
    this.panelW = this.sidebarWidth;
    this.panelH = sidebarH;

    this.drawSidebar(sidebarX, sidebarY, this.sidebarWidth, sidebarH);
    this.drawContent(contentX, contentY, contentW, contentH);
    this.drawTopBar();

    fill(255);
    noStroke();
    textAlign(CENTER, BOTTOM);
    textSize(15);
    text("Press ESC to Close", this.boardX + this.boardW / 2, this.boardY + 24);
    pop();
  }

  drawTopBar() {
    let barX = this.innerX;
    let barW = this.innerW;
    let barH = constrain(this.boardH * 0.09, 44, 70);
    let barY = this.boardY + this.boardH * 0.165;
    let barRadius = min(16, floor(barH * 0.33));
    let barPad = constrain(barH * 0.24, 10, 18);
    let closeSize = constrain(barH * 0.62, 26, 42);
    let closeX = barX + barW - barPad - closeSize;
    let closeY = barY + (barH - closeSize) / 2;
    let isCloseHover = this.isMouseOver(closeX, closeY, closeSize, closeSize);

    noStroke();

    fill(247, 232, 210);
    textAlign(CENTER, CENTER);
    textSize(constrain(barH * 0.42, 20, 34));
    text("SHOP", barX + barW * 0.45, barY + barH / 2 + 1);

    if (isCloseHover) fill(this.colors.accent);
    else fill(168, 118, 80, 240);
    rect(closeX, closeY, closeSize, closeSize, 8);

    stroke(35, 24, 15);
    strokeWeight(2.5);
    let linePad = closeSize * 0.26;
    line(closeX + linePad, closeY + linePad, closeX + closeSize - linePad, closeY + closeSize - linePad);
    line(closeX + closeSize - linePad, closeY + linePad, closeX + linePad, closeY + closeSize - linePad);
    noStroke();

    this.closeButtonRect = { x: closeX, y: closeY, w: closeSize, h: closeSize };
  }

  drawSidebar(x, y, w, h) {
    fill(72, 48, 33, 210);
    noStroke();
    rect(x, y, this.sidebarWidth, h, 10);

    fill(this.colors.text);
    textSize(18);
    textAlign(CENTER, TOP);
    text("SHOP", x + this.sidebarWidth / 2, y + 12);

    textSize(16);
    fill(255, 214, 120);
    text(`$ ${player.coins}`, x + this.sidebarWidth / 2, y + 38);

    let startY = y + 72;
    let tabH = 54;
    for (let i = 0; i < this.tabs.length; i++) {
      let tab = this.tabs[i];
      let ty = startY + i * (tabH + 10);
      let tx = x + 10;
      let tw = this.sidebarWidth - 20;
      let isHover = this.isMouseOver(tx, ty, tw, tabH);
      let isActive = this.currentTab === tab;

      if (isActive) fill(this.colors.tabActive);
      else if (isHover) fill(this.colors.tab);
      else fill(112, 76, 48, 230);
      rect(tx, ty, tw, tabH, 12);

      fill(247, 232, 210);
      textAlign(CENTER, CENTER);
      textSize(14);
      text(tab, x + this.sidebarWidth/2, ty + tabH/2);
    }
  }

  drawContent(x, y, w, h) {
    this.ensureCatalogLoaded();
    fill(this.colors.text);
    textAlign(LEFT, TOP);
    textSize(24);
    text(this.currentTab, x, y);
    let tabData = this.getCurrentTabData();
    if (tabData.loading) {
      textSize(16);
      fill(236, 216, 185);
      text('Loading shop catalog...', x, y + 42);
      this.lastGrid = null;
      this.lastScrollbar = null;
      return;
    }
    if (tabData.error) {
      textSize(16);
      fill(255, 150, 150);
      text(tabData.error, x, y + 42);
      this.lastGrid = null;
      this.lastScrollbar = null;
      return;
    }
    let listY = y + 34;
    let listH = h - 34;
    this.drawSectionedGrid(tabData.sections, tabData.type, x, listY, w, listH);
  }
  
  getCurrentTabData() {
    if (!player.ownedWeapons) player.ownedWeapons = ['pistol'];
    if (!player.ownedCars) player.ownedCars = ['starter'];
    if (!this.catalog) {
      return {
        type: 'none',
        sections: [],
        loading: this.catalogLoading,
        error: this.catalogError
      };
    }
    if (this.currentTab === 'WEAPONS') {
      let basic = this.catalog.weaponsBasic || [];
      let specials = this.catalog.weaponsSpecial || [];
      return {
        type: 'weapon',
        sections: [
            { title: "Basic Weapons", items: basic },
            { title: "Drop Weapons", items: specials }
        ]
      };
    }
    if (this.currentTab === 'VEHICLES') {
      let sourceItems = this.catalog.vehicles || [];
      let items = sourceItems.map((serverItem) => {
          let id = serverItem.id;
          let car = Object.assign({}, CAR_CATALOG[id]);
          car.name = serverItem.name;
          car.price = serverItem.price;
          car.id = id;
          return car;
        });
      return {
        type: 'vehicle',
        sections: [{ title: null, items: items }]
      };
    }
    let upgrades = this.catalog.upgrades || [];
    return { 
        type: 'upgrade', 
        sections: [{ title: null, items: upgrades }]
    };
  }

  async ensureCatalogLoaded(forceRefresh = false) {
    if (this.catalogLoading) return;
    if (this.catalog && !forceRefresh) return;
    if (typeof authUI === 'undefined' || !authUI || !authUI.token) {
      this.catalogError = 'Please login to load shop data.';
      return;
    }
    this.catalogLoading = true;
    this.catalogError = '';
    try {
      let res = await fetch(`${authUI.apiBaseUrl}/api/shop/catalog`, {
        headers: {
          Authorization: `Bearer ${authUI.token}`
        }
      });
      let data = await res.json();
      if (res.ok) {
        this.catalog = data;
      } else {
        this.catalogError = data.error || 'Failed to load shop catalog.';
      }
    } catch (error) {
      this.catalogError = 'Failed to connect to shop server.';
    } finally {
      this.catalogLoading = false;
    }
  }

  applyServerProgress(progress) {
    if (!progress || !player) return;
    player.coins = progress.coins ?? player.coins;
    player.ownedWeapons = progress.ownedWeapons || [WEAPON_TYPES.PISTOL];
    player.ownedCars = progress.ownedCars || ['starter'];
    player.currentWeapon = progress.currentWeapon || player.currentWeapon || WEAPON_TYPES.PISTOL;
    player.unlockedSpecialWeapons = progress.unlockedSpecialWeapons || [];
    player.bonusMaxHp = progress.upgradeState && progress.upgradeState.maxHp ? progress.upgradeState.maxHp : 0;
    player.bonusMaxAmmo = progress.upgradeState && progress.upgradeState.maxAmmo ? progress.upgradeState.maxAmmo : 0;
    player.shieldDurationLevel = progress.upgradeState && progress.upgradeState.shieldDuration ? progress.upgradeState.shieldDuration : 0;
    let targetCar = progress.carType || 'starter';
    if (player.ownedCars.includes(targetCar)) {
      player.applyCarType(targetCar);
    }
    if (player.hp > player.maxHp) player.hp = player.maxHp;
    if (player.ammo > player.maxAmmo) player.ammo = player.maxAmmo;
  }

  drawSectionedGrid(sections, type, x, y, w, h) {
    if (!sections || sections.length === 0) {
      this.lastGrid = null;
      this.lastScrollbar = null;
      return;
    }
    
    let gapX = 12;
    let gapY = 16;
    let sectionGap = 24;
    let titleH = 30;
    let viewportPaddingY = 4;
    
    let cardW = this.cardWidth;
    let cardH = max(170, this.cardHeight);
    
    let availableW = w;
    let cols = 3; 
    
    // Determine layout based on available width
    // Try 3 columns
    if (3 * cardW + 2 * gapX > availableW) {
        // Try shrinking cardW
        cardW = floor((availableW - 2 * gapX) / 3);
        if (cardW < 130) {
            // Reduce to 2 cols
            cols = 2;
            cardW = floor((availableW - gapX) / 2);
            if (cardW < 130) {
                cols = 1;
                cardW = availableW;
            }
        }
    }

    // Calculate total height
    let totalH = 0;
    for(let section of sections) {
        if (section.title) totalH += titleH;
        let rows = Math.ceil(section.items.length / cols);
        if (rows > 0) {
            totalH += rows * cardH + (rows - 1) * gapY;
        }
        totalH += sectionGap;
    }
    if (totalH > 0) totalH -= sectionGap; // Remove last gap
    
    let viewportH = max(0, h - viewportPaddingY * 2);
    let needsScroll = totalH > viewportH;
    let scrollbarReserve = 0;
    
    if (needsScroll) {
        scrollbarReserve = this.scrollbarWidth + 10;
        availableW = max(0, w - scrollbarReserve);
        // Recalculate layout with reduced width
        if (3 * this.cardWidth + 2 * gapX > availableW) {
             cardW = floor((availableW - 2 * gapX) / 3);
             if (cardW < 130) {
                 cols = 2;
                 cardW = floor((availableW - gapX) / 2);
                 if (cardW < 130) {
                     cols = 1;
                     cardW = availableW;
                 }
             } else {
                 cardW = max(130, cardW);
                 cols = 3;
             }
        } else {
            cardW = this.cardWidth;
            cols = 3;
        }
        
        // Recalculate totalH isn't strictly necessary if cols didn't change, 
        // but let's do it to be safe in case row count changes
        totalH = 0;
        for(let section of sections) {
            if (section.title) totalH += titleH;
            let rows = Math.ceil(section.items.length / cols);
            if (rows > 0) {
                totalH += rows * cardH + (rows - 1) * gapY;
            }
            totalH += sectionGap;
        }
        if (totalH > 0) totalH -= sectionGap;
    }
    
    let gridW = cols * cardW + (cols - 1) * gapX;
    let viewportW = max(0, availableW);
    let startX = x + max(0, (viewportW - gridW) / 2);
    let maxScroll = max(0, totalH - viewportH);
    let scrollOffset = constrain(this.getCurrentScrollOffset(), 0, maxScroll);
    this.setCurrentScrollOffset(scrollOffset);
    
    let viewportY = y + viewportPaddingY;
    
    this.lastGrid = {
        sections,
        type,
        startX,
        viewportX: x,
        viewportY,
        viewportW,
        viewportH,
        maxScroll,
        cols,
        cardW,
        cardH,
        gapX,
        gapY,
        titleH,
        sectionGap,
        totalH
    };
    
    let ctx = drawingContext;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, viewportY, viewportW, viewportH);
    ctx.clip();
    
    let currentY = viewportY - scrollOffset;
    
    for (let section of sections) {
        if (section.title) {
            // Draw title
            if (currentY + titleH > viewportY && currentY < viewportY + viewportH) {
                fill(236, 216, 185);
                textSize(18);
                textAlign(LEFT, TOP);
                text(section.title, startX, currentY + 5);
            }
            currentY += titleH;
        }
        
        let items = section.items;
        let rows = Math.ceil(items.length / cols);
        
        for (let i = 0; i < items.length; i++) {
            let item = items[i];
            let col = i % cols;
            let row = floor(i / cols);
            let cx = startX + col * (cardW + gapX);
            let cy = currentY + row * (cardH + gapY);
            
            // Optimization: only draw if visible
            if (cy + cardH > viewportY && cy < viewportY + viewportH) {
                this.drawCard(cx, cy, item, type, cardW, cardH);
            }
        }
        
        if (rows > 0) {
            currentY += rows * cardH + (rows - 1) * gapY;
        }
        currentY += sectionGap;
    }
    
    ctx.restore();

    if (needsScroll && maxScroll > 0) {
      let trackX = x + w - this.scrollbarWidth;
      let trackY = viewportY;
      let trackH = viewportH;
      let thumbH = constrain(trackH * (viewportH / totalH), 32, trackH);
      let thumbY = trackY + (trackH - thumbH) * (scrollOffset / maxScroll);
      let mx = mouseX - this.inputOffsetX;
      let my = mouseY - this.inputOffsetY;
      let isHoverThumb = this.isPointInRect(mx, my, trackX, thumbY, this.scrollbarWidth, thumbH);

      fill(90, 62, 42, 210);
      noStroke();
      rect(trackX, trackY, this.scrollbarWidth, trackH, 8);

      if (isHoverThumb || this.isDraggingScrollbar) fill(this.colors.accent);
      else fill(181, 140, 95, 240);
      rect(trackX, thumbY, this.scrollbarWidth, thumbH, 8);

      this.lastScrollbar = { trackX, trackY, trackH, thumbY, thumbH };
    } else {
      this.lastScrollbar = null;
    }
  }

  getButtonRect(x, y, cardW, cardH) {
    let btnH = min(this.buttonHeight, floor(cardH * 0.16));
    let btnW = cardW - 30;
    let btnX = x + 15;
    let btnY = y + cardH - btnH - 10;
    return { btnX, btnY, btnW, btnH };
  }

  drawWrappedText(str, x, y, w, size, colorVal) {
      if (colorVal) fill(colorVal);
      textSize(size);
      textLeading(size * 1.2);
      textAlign(CENTER, TOP);
      
      // Calculate lines
      let words = str.split(' ');
      let currentLine = '';
      let lineCount = 1;
      
      // Simple loop to estimate lines. 
      // Note: This logic mirrors p5's wrapping but isn't exact due to font rendering.
      // However, since we use the same font settings, it should be close.
      // We assume spaces are single spaces.
      
      if (textWidth(str) <= w) {
          text(str, x, y, w, size * 2);
          return size * 1.2;
      }
      
      currentLine = words[0];
      for (let i = 1; i < words.length; i++) {
          let testLine = currentLine + ' ' + words[i];
          if (textWidth(testLine) > w) {
              lineCount++;
              currentLine = words[i];
          } else {
              currentLine = testLine;
          }
      }
      
      let h = lineCount * size * 1.2;
      text(str, x, y, w, h + size); // Add buffer for safety
      return h;
  }

  drawCard(x, y, item, type, cardW, cardH) {
    fill(this.colors.cardBg);
    stroke(this.colors.cardBorder);
    let isHover = this.isMouseOver(x, y, cardW, cardH);
    if (isHover) {
        stroke(this.colors.accent);
        fill(112, 77, 51, 235);
    }
    rect(x, y, cardW, cardH, 10);

    noStroke();
    fill(74, 50, 33, 220);
    let previewH = floor(cardH * 0.38);
    let previewX = x + 8;
    let previewY = y + 8;
    let previewW = cardW - 16;
    rect(previewX, previewY, previewW, previewH, 8);
    this.drawItemPreview(x + cardW / 2, y + 8 + previewH / 2, item, type, previewW, previewH);

    fill(247, 232, 210);
    textAlign(CENTER, TOP);
    let titleY = y + 8 + previewH + 8;
    // Use wrapped text for title
    let nameH = this.drawWrappedText(item.name, x + 5, titleY, cardW - 10, 16, color(247, 232, 210));

    textSize(13);
    fill(234, 210, 175);
    let infoY = titleY + nameH + 8; // Adjust start based on title height
    
    if (type === 'vehicle') {
        text(`Speed: ${item.maxSpeed}`, x + cardW / 2, infoY);
        text(`HP: ${item.maxHp}`, x + cardW / 2, infoY + 18);
    } else if (type === 'weapon') {
        let info = this.getWeaponInfo(item);
        
        // Draw category
        let h1 = this.drawWrappedText(info.category, x + 5, infoY, cardW - 10, 11, color(234, 210, 175));
        infoY += h1 + 4;
        
        let h2 = this.drawWrappedText(info.damage, x + 5, infoY, cardW - 10, 11, color(234, 210, 175));
        infoY += h2 + 4;
        
        let h3 = this.drawWrappedText(info.attack, x + 5, infoY, cardW - 10, 11, color(234, 210, 175));
    } else {
        let val = 0;
        if (item.id === 'maxHp') val = player.maxHp;
        if (item.id === 'maxAmmo') val = player.maxAmmo;
        if (item.id === 'shieldDuration') val = (player.shieldDurationLevel || 0);
        text(`Current: ${val}`, x + cardW / 2, infoY);
    }

    let { btnX, btnY, btnW, btnH } = this.getButtonRect(x, y, cardW, cardH);
    let state = this.getItemState(item, type);
    let btnColor = this.colors.button;
    let btnText = "BUY";
    let btnTextColor = color(255);

    if (state === 'equipped') {
        btnColor = this.colors.success;
        btnText = "EQUIPPED";
    } else if (state === 'unlocked') {
        btnColor = this.colors.success;
        btnText = "UNLOCKED";
    } else if (state === 'owned') {
        btnColor = [122, 164, 220];
        btnText = "SELECT";
    } else if (state === 'too_expensive') {
        btnColor = this.colors.disabled;
        btnText = `$ ${item.price}`;
        btnTextColor = color(200);
    } else {
        btnText = `$ ${item.price}`;
    }

    if (type === 'upgrade') {
        btnText = `$ ${item.price}`;
        if (player.coins < item.price) {
             btnColor = this.colors.disabled;
        } else {
             btnColor = this.colors.accent;
        }
    }

    fill(btnColor);
    noStroke();
    rect(btnX, btnY, btnW, btnH, 8);

    fill(btnTextColor);
    textAlign(CENTER, CENTER);
    text(btnText, btnX + btnW/2, btnY + btnH/2);

    if (isHover && this.isMouseOver(btnX, btnY, btnW, btnH)) {
        noFill();
        stroke(255, 140);
        strokeWeight(2);
        rect(btnX, btnY, btnW, btnH, 8);
    }
  }
  
  drawItemPreview(x, y, item, type, previewW = 0, previewH = 0) {
      if (type === 'vehicle') {
          if (item.color) fill(item.color);
          else fill(200);
          rectMode(CENTER);
          rect(x, y, 26, 44, 4);
          fill(255, 255, 255, 100);
          rect(x, y - 8, 20, 9);
          rectMode(CORNER);
      } else if (type === 'weapon') {
          let weaponIcon = images && images.weaponShop ? images.weaponShop[item.id] : null;
          if (weaponIcon) {
              push();
              imageMode(CENTER);
              let maxW = max(20, previewW * 0.9);
              let maxH = max(20, previewH * 0.9);
              let ratio = min(maxW / weaponIcon.width, maxH / weaponIcon.height);
              let drawW = weaponIcon.width * ratio;
              let drawH = weaponIcon.height * ratio;
              image(weaponIcon, x, y, drawW, drawH);
              pop();
              return;
          }
          fill(200);
          if (item.id === 'laser') fill(255, 0, 0);
          if (item.id === 'pistol') fill(100);
          push();
          translate(x, y);
          rotate(-PI/4);
          rectMode(CENTER);
          rect(0, 0, 9, 26);
          rect(0, 9, 9, 9);
          pop();
      } else {
          fill(255, 215, 0);
          ellipse(x, y, 28, 28);
          fill(0);
          textAlign(CENTER, CENTER);
          textSize(18);
          text("+", x, y);
      }
  }

  getWeaponInfo(item) {
      let cfg = typeof WEAPON_CONFIG !== 'undefined' ? WEAPON_CONFIG[item.id] : null;
      let isBasic = item.type !== 'special';
      let category = isBasic ? "Type: Basic Weapon" : "Type: Drop Weapon";
      
      if (!isBasic && cfg && cfg.dropRateText) {
          category += ` (${cfg.dropRateText} Drop)`;
      }
      
      let damage = "Damage: --";
      let attack = "Attack: --";

      if (cfg) {
          if (item.id === WEAPON_TYPES.SHOTGUN) {
              damage = `Damage: ${cfg.damage} x${cfg.count} pellets`;
              attack = "Attack: Spread, close-range burst";
          } else if (item.id === WEAPON_TYPES.RIFLE) {
              damage = `Damage: ${cfg.damage} x${cfg.count} burst`;
              attack = "Attack: Burst fire, medium-long range";
          } else if (item.id === WEAPON_TYPES.LASER) {
              damage = `Damage: ${cfg.damage}`;
              attack = "Attack: Piercing beam, long range";
          } else if (item.id === WEAPON_TYPES.MOLOTOV) {
              damage = `Damage: ${cfg.damage}/tick, radius ${cfg.areaRadius}`;
              attack = "Attack: Throw + area fire burn";
          } else if (item.id === WEAPON_TYPES.DONGFENG) {
              damage = `Damage: ${cfg.damage}`;
              attack = "Attack: Targeted strike (map select)";
          } else if (item.id === WEAPON_TYPES.LOITERING) {
              damage = `Damage: ${cfg.damage}`;
              attack = "Attack: Guided drone strike";
          } else if (item.id === WEAPON_TYPES.ATOMIC) {
              damage = `Damage: ${cfg.damage}`;
              attack = "Attack: Massive area blast";
          } else {
              damage = `Damage: ${cfg.damage}`;
              attack = "Attack: Single shot, medium range";
          }
      }
      return { category, damage, attack };
  }
  
  getItemState(item, type) {
      if (type === 'vehicle') {
          if (player.carType === item.id) return 'equipped';
          if (player.ownedCars && player.ownedCars.includes(item.id)) return 'owned';
          if (item.price === 0) return 'owned';
          if (player.coins < item.price) return 'too_expensive';
          return 'buyable';
      }
      
      if (type === 'weapon') {
          // Special Weapons
          if (item.type === 'special') {
              if (player.unlockedSpecialWeapons && player.unlockedSpecialWeapons.includes(item.id)) return 'unlocked';
              if (player.coins < item.price) return 'too_expensive';
              return 'buyable_unlock';
          }
          
          // Basic Weapons
          if (player.currentWeapon === item.id) return 'equipped';
          if (player.ownedWeapons && player.ownedWeapons.includes(item.id)) return 'owned';
          if (item.id === WEAPON_TYPES.PISTOL) return 'owned';
          if (player.coins < item.price) return 'too_expensive';
          return 'buyable';
      }
      return 'upgrade';
  }

  isMouseOver(x, y, w, h) {
    let mx = mouseX - this.inputOffsetX;
    let my = mouseY - this.inputOffsetY;
    return mx >= x && mx <= x + w && my >= y && my <= y + h;
  }

  isPointInRect(px, py, x, y, w, h) {
    return px >= x && px <= x + w && py >= y && py <= y + h;
  }

  getCurrentScrollOffset() {
    return this.scrollOffsets[this.currentTab] || 0;
  }

  setCurrentScrollOffset(value) {
    this.scrollOffsets[this.currentTab] = max(0, value || 0);
  }

  handleWheel(delta) {
    if (!this.lastGrid) return false;
    if (this.lastGrid.maxScroll <= 0) return false;
    let mx = mouseX - this.inputOffsetX;
    let my = mouseY - this.inputOffsetY;
    let areaW = this.lastGrid.viewportW + this.scrollbarWidth + 12;
    if (!this.isPointInRect(mx, my, this.lastGrid.viewportX, this.lastGrid.viewportY, areaW, this.lastGrid.viewportH)) {
      return false;
    }
    let step = max(24, abs(delta) * 0.8);
    let next = this.getCurrentScrollOffset() + (delta > 0 ? step : -step);
    this.setCurrentScrollOffset(constrain(next, 0, this.lastGrid.maxScroll));
    return true;
  }

  handleMouseDragged() {
    if (!this.isDraggingScrollbar || !this.lastGrid || !this.lastScrollbar) return false;
    let my = mouseY - this.inputOffsetY;
    let maxThumbTravel = max(1, this.lastScrollbar.trackH - this.lastScrollbar.thumbH);
    let nextThumbTop = constrain(
      my - this.scrollDragOffsetY,
      this.lastScrollbar.trackY,
      this.lastScrollbar.trackY + this.lastScrollbar.trackH - this.lastScrollbar.thumbH
    );
    let ratio = (nextThumbTop - this.lastScrollbar.trackY) / maxThumbTravel;
    this.setCurrentScrollOffset(ratio * this.lastGrid.maxScroll);
    return true;
  }

  handleMouseReleased() {
    this.isDraggingScrollbar = false;
  }
  
  handleClick() {
      let mx = mouseX - this.inputOffsetX;
      let my = mouseY - this.inputOffsetY;
      if (this.closeButtonRect && this.isPointInRect(mx, my, this.closeButtonRect.x, this.closeButtonRect.y, this.closeButtonRect.w, this.closeButtonRect.h)) {
        this.closeShop();
        return;
      }
      let startY = this.panelY + 72;
      let tabH = 54;
      let tabX = this.panelX + 10;
      let tabW = this.sidebarWidth - 20;
      
      for (let i = 0; i < this.tabs.length; i++) {
        let ty = startY + i * (tabH + 10);
        if (this.isMouseOver(tabX, ty, tabW, tabH)) {
            this.currentTab = this.tabs[i];
            return;
        }
      }
      if (!this.lastGrid) return;
      if (this.lastScrollbar) {
        let { trackX, trackY, trackH, thumbY, thumbH } = this.lastScrollbar;
        if (this.isPointInRect(mx, my, trackX, trackY, this.scrollbarWidth, trackH)) {
          if (this.isPointInRect(mx, my, trackX, thumbY, this.scrollbarWidth, thumbH)) {
            this.isDraggingScrollbar = true;
            this.scrollDragOffsetY = my - thumbY;
          } else {
            let pageStep = this.lastGrid.viewportH * 0.8;
            let next = this.getCurrentScrollOffset() + (my < thumbY ? -pageStep : pageStep);
            this.setCurrentScrollOffset(constrain(next, 0, this.lastGrid.maxScroll));
          }
          return;
        }
      }
      if (!this.isPointInRect(mx, my, this.lastGrid.viewportX, this.lastGrid.viewportY, this.lastGrid.viewportW, this.lastGrid.viewportH)) {
        return;
      }
      let { sections, type, startX, viewportY, cols, cardW, cardH, gapX, gapY, titleH, sectionGap } = this.lastGrid;
      
      let currentY = viewportY - this.getCurrentScrollOffset();
      
      for (let section of sections) {
          if (section.title) {
              currentY += titleH;
          }
          
          let items = section.items;
          let rows = Math.ceil(items.length / cols);
          
          for (let i = 0; i < items.length; i++) {
              let item = items[i];
              let col = i % cols;
              let row = floor(i / cols);
              let cx = startX + col * (cardW + gapX);
              let cy = currentY + row * (cardH + gapY);
              
              // Check visibility
              if (cy + cardH < viewportY || cy > viewportY + this.lastGrid.viewportH) continue;
              
              let { btnX, btnY, btnW, btnH } = this.getButtonRect(cx, cy, cardW, cardH);

              if (this.isMouseOver(btnX, btnY, btnW, btnH)) {
                  let state = this.getItemState(item, type);
                  this.handleAction(item, type, state);
                  return;
              }
          }
          
          if (rows > 0) {
              currentY += rows * cardH + (rows - 1) * gapY;
          }
          currentY += sectionGap;
      }
  }

  closeShop() {
      if (typeof gameState !== 'undefined') {
          if (gameState === 'SHOP') {
              if (typeof closeShopFromUI === 'function') {
                  closeShopFromUI();
              } else {
                  gameState = 'PLAY';
                  if (typeof shopBuilding !== 'undefined') {
                      shopBuilding = null;
                  }
              }
              return;
          }
          else if (gameState === 'MENU_SHOP') gameState = 'MENU';
      }
      if (typeof shopBuilding !== 'undefined') {
          shopBuilding = null;
      }
  }
  
  async handleAction(item, type, state) {
      if (state === 'too_expensive' || state === 'unlocked' || state === 'equipped') return;
      if (typeof authUI === 'undefined' || !authUI || !authUI.token) return;
      if (this.catalogLoading) return;
      try {
          let url = `${authUI.apiBaseUrl}/api/shop/purchase`;
          let payload = {};
          if (type === 'vehicle' && state === 'owned') {
              url = `${authUI.apiBaseUrl}/api/shop/select`;
              payload = { selectType: 'vehicle', itemId: item.id };
          } else if (type === 'weapon' && state === 'owned') {
              url = `${authUI.apiBaseUrl}/api/shop/select`;
              payload = { selectType: 'weapon', itemId: item.id };
          } else {
              let category = 'upgrade';
              if (type === 'vehicle') category = 'vehicle';
              if (type === 'weapon') category = 'weapon';
              payload = { category, itemId: item.id };
          }

          let res = await fetch(url, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${authUI.token}`
              },
              body: JSON.stringify(payload)
          });
          let data = await res.json();
          if (!res.ok) {
              console.error(data.error || 'Shop action failed');
              return;
          }
          this.applyServerProgress(data.progress);
      } catch (error) {
          console.error('Shop action failed', error);
      }
  }
  
  applyUpgrade(id) {
      if (id === 'maxHp') {
          player.bonusMaxHp += 1;
          player.maxHp += 1;
          player.hp = min(player.hp, player.maxHp);
      } else if (id === 'maxAmmo') {
          player.bonusMaxAmmo += 10;
          player.maxAmmo += 10;
          player.ammo = min(player.ammo, player.maxAmmo);
      } else if (id === 'shieldDuration') {
          if (!player.shieldDurationLevel) player.shieldDurationLevel = 0;
          player.shieldDurationLevel += 1;
      }
  }
}
