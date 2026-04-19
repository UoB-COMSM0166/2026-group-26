function getMouseWorldPos() {
    let mx = mouseX - gameViewX + camX;
    let my = mouseY - statusHeight - gameViewY + camY;
    
    let dx = mx - mapOffsetX;
    let dy = my - mapOffsetY;
    
    let W = tileSize / 2;
    let H = tileSize / 4;
    
    let gridX = (dx / W + dy / H) / 2;
    let gridY = (dy / H - dx / W) / 2;
    
    return createVector(gridX * tileSize, gridY * tileSize);
}
