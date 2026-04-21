const fs = require('fs');
const path = require('path');

const sourceDir = path.join('docs', 'scripts', 'src');
const distDir = path.join('docs', 'scripts', 'dist');

const files = [
  'utils.js',
  'WeaponConfig.js',
  'Particle.js',
  'Vehicle.js',
  'Player.js',
  'Enemy.js',
  'Projectile.js',
  'PowerUp.js',
  'Building.js',
  'AuthUI.js',
  'ShopUI.js',
  'TutorialSystem.js',
  'special_weapons.js',
  'sketch.js'
];

let bundleContent = '';
for (const file of files) {
  bundleContent += fs.readFileSync(path.join(sourceDir, file), 'utf8') + '\n';
}

fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(path.join(distDir, 'bundle.js'), bundleContent);
fs.writeFileSync(path.join(distDir, 'bundle.min.js'), bundleContent); // Just copy for now, or minified if needed

console.log('Bundle created successfully!');
