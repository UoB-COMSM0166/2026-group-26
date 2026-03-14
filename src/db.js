const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'game.sqlite');
const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) {
        reject(err);
        return;
      }
      resolve(this);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows);
    });
  });
}

async function ensureColumn(tableName, columnName, columnDef) {
  const columns = await all(`PRAGMA table_info(${tableName})`);
  const exists = columns.some((col) => col.name === columnName);
  if (!exists) {
    await run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDef}`);
  }
}

async function initDb() {
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      username TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      email_verified INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS email_tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS player_progress (
      user_id INTEGER PRIMARY KEY,
      coins INTEGER NOT NULL DEFAULT 0,
      unlocked_weapons TEXT NOT NULL DEFAULT '["pistol"]',
      upgrade_state TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  await ensureColumn('player_progress', 'owned_weapons', `TEXT NOT NULL DEFAULT '["pistol"]'`);
  await ensureColumn('player_progress', 'owned_cars', `TEXT NOT NULL DEFAULT '["starter"]'`);
  await ensureColumn('player_progress', 'current_weapon', `TEXT NOT NULL DEFAULT 'pistol'`);
  await ensureColumn('player_progress', 'car_type', `TEXT NOT NULL DEFAULT 'starter'`);
  await ensureColumn('player_progress', 'unlocked_special_weapons', `TEXT NOT NULL DEFAULT '[]'`);

  await run(`
    CREATE TABLE IF NOT EXISTS shop_catalog (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      sub_type TEXT,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0
    )
  `);

  const shopSeeds = [
    ['pistol', 'weapon', 'basic', 'Pistol', 0, 1],
    ['shotgun', 'weapon', 'basic', 'Shotgun', 80, 2],
    ['rifle', 'weapon', 'basic', 'Assault Rifle', 120, 3],
    ['laser', 'weapon', 'basic', 'Laser Gun', 140, 4],
    ['molotov', 'weapon', 'basic', 'Molotov', 100, 5],
    ['dongfeng', 'weapon', 'special', 'Dongfeng (Unlock)', 500, 6],
    ['loitering', 'weapon', 'special', 'Drone (Unlock)', 300, 7],
    ['atomic', 'weapon', 'special', 'Nuke (Unlock)', 1000, 8],
    ['starter', 'vehicle', 'car', 'Starter', 0, 20],
    ['speedster', 'vehicle', 'car', 'Speedster', 120, 21],
    ['tank', 'vehicle', 'car', 'Tank', 150, 22],
    ['drifter', 'vehicle', 'car', 'Drifter', 110, 23],
    ['maxHp', 'upgrade', 'stat', 'Max HP +1', 60, 30],
    ['maxAmmo', 'upgrade', 'stat', 'Max Ammo +10', 50, 31],
    ['shieldDuration', 'upgrade', 'stat', 'Buff Duration', 100, 32]
  ];

  for (const item of shopSeeds) {
    await run(
      'INSERT INTO shop_catalog (id, category, sub_type, name, price, sort_order) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET category = excluded.category, sub_type = excluded.sub_type, name = excluded.name, price = excluded.price, sort_order = excluded.sort_order',
      item
    );
  }
}

module.exports = {
  db,
  run,
  get,
  all,
  initDb
};
