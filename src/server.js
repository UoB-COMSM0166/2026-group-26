const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const { initDb, run, get, all } = require('./db');
const { createMailer } = require('./mailer');
const {
  createToken,
  hashPassword,
  verifyPassword,
  createJwt,
  verifyJwt
} = require('./security');

dotenv.config();

const config = {
  port: Number(process.env.PORT || 3000),
  jwtSecret: process.env.JWT_SECRET || 'dev-only-change-me',
  qqUser: process.env.QQ_MAIL_USER || '',
  qqAuthCode: process.env.QQ_MAIL_AUTH_CODE || '',
  mailFrom: process.env.MAIL_FROM || process.env.QQ_MAIL_USER || '',
  appBaseUrl: process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 3000}`
};

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

let mailer = null;
if (config.qqUser && config.qqAuthCode && config.mailFrom) {
  mailer = createMailer(config);
}

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) {
    res.status(401).json({ error: '未登录' });
    return;
  }
  try {
    const decoded = verifyJwt(token, config.jwtSecret);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: '登录状态已失效' });
  }
}

function normalizeProgress(payload, existingRow = null) {
  const existingProgress = existingRow ? progressToClient(existingRow) : null;
  const coins = Number.isInteger(payload.coins) && payload.coins >= 0
    ? payload.coins
    : (existingProgress ? existingProgress.coins : 0);
  const unlockedWeapons = Array.isArray(payload.unlockedWeapons)
    ? payload.unlockedWeapons
    : (existingProgress ? existingProgress.unlockedWeapons : ['pistol']);
  const unlockedSpecialWeapons = Array.isArray(payload.unlockedSpecialWeapons)
    ? payload.unlockedSpecialWeapons
    : (existingProgress ? existingProgress.unlockedSpecialWeapons : []);
  const upgradeStateRaw = payload.upgradeState && typeof payload.upgradeState === 'object'
    ? payload.upgradeState
    : (existingProgress ? existingProgress.upgradeState : {});
  const upgradeState = {
    maxHp: Math.max(0, Math.min(2, Number(upgradeStateRaw.maxHp) || 0)),
    maxAmmo: Math.max(0, Math.min(5, Number(upgradeStateRaw.maxAmmo) || 0)),
    topSpeed: Math.max(0, Math.min(5, Number(upgradeStateRaw.topSpeed) || 0)),
    acceleration: Math.max(0, Math.min(5, Number(upgradeStateRaw.acceleration) || 0))
  };
  return {
    coins,
    unlockedWeapons,
    unlockedSpecialWeapons,
    upgradeState
  };
}

function generateVerificationCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function safeParseArray(value, fallback = []) {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch (error) {
    return fallback;
  }
}

function safeParseObject(value, fallback = {}) {
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === 'object' ? parsed : fallback;
  } catch (error) {
    return fallback;
  }
}

function progressToClient(row) {
  const rawUpgrade = safeParseObject(row.upgrade_state, {});
  const upgradeState = {
    maxHp: Math.max(0, Math.min(2, Number(rawUpgrade.maxHp) || 0)),
    maxAmmo: Math.max(0, Math.min(5, Number(rawUpgrade.maxAmmo) || 0)),
    topSpeed: Math.max(0, Math.min(5, Number(rawUpgrade.topSpeed) || 0)),
    acceleration: Math.max(0, Math.min(5, Number(rawUpgrade.acceleration) || 0))
  };
  return {
    coins: row.coins,
    unlockedWeapons: safeParseArray(row.unlocked_weapons, ['pistol']),
    upgradeState,
    ownedWeapons: safeParseArray(row.owned_weapons, ['pistol']),
    ownedCars: safeParseArray(row.owned_cars, ['starter']),
    currentWeapon: row.current_weapon || 'pistol',
    carType: row.car_type || 'starter',
    unlockedSpecialWeapons: safeParseArray(row.unlocked_special_weapons, []),
    updatedAt: row.updated_at
  };
}

async function getUserProgressRow(userId) {
  return get(
    'SELECT user_id, coins, unlocked_weapons, upgrade_state, owned_weapons, owned_cars, current_weapon, car_type, unlocked_special_weapons, updated_at FROM player_progress WHERE user_id = ?',
    [userId]
  );
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, username, password } = req.body || {};
    if (!email || !username || !password) {
      res.status(400).json({ error: 'email、username、password 不能为空' });
      return;
    }

    const existing = await get('SELECT id FROM users WHERE email = ?', [email]);
    if (existing) {
      res.status(409).json({ error: '该邮箱已注册' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const result = await run(
      'INSERT INTO users (email, username, password_hash) VALUES (?, ?, ?)',
      [email, username, passwordHash]
    );

    await run(
      "INSERT INTO player_progress (user_id, coins, unlocked_weapons, upgrade_state, owned_weapons, owned_cars, current_weapon, car_type, unlocked_special_weapons) VALUES (?, 0, '[\"pistol\"]', '{}', '[\"pistol\"]', '[\"starter\"]', 'pistol', 'starter', '[]')",
      [result.lastID]
    );

    const verifyCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    await run("DELETE FROM email_tokens WHERE user_id = ? AND type = 'verify_code' AND used_at IS NULL", [result.lastID]);
    await run(
      'INSERT INTO email_tokens (user_id, token, type, expires_at) VALUES (?, ?, ?, ?)',
      [result.lastID, verifyCode, 'verify_code', expiresAt]
    );

    if (mailer) {
      await mailer.sendVerifyCodeEmail(email, verifyCode);
    }

    res.status(201).json({
      message: mailer
        ? '注册成功，请输入邮箱验证码完成验证'
        : '注册成功，但未配置SMTP，暂未发送验证码',
      needEmailVerification: true
    });
  } catch (error) {
    res.status(500).json({ error: '注册失败' });
  }
});

app.post('/api/auth/resend-verification-code', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      res.status(400).json({ error: 'email 不能为空' });
      return;
    }

    const user = await get('SELECT id, email_verified FROM users WHERE email = ?', [email]);
    if (!user) {
      res.status(404).json({ error: '该邮箱未注册' });
      return;
    }
    if (user.email_verified) {
      res.json({ message: '该邮箱已完成验证' });
      return;
    }

    const verifyCode = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    await run("DELETE FROM email_tokens WHERE user_id = ? AND type = 'verify_code' AND used_at IS NULL", [user.id]);
    await run(
      'INSERT INTO email_tokens (user_id, token, type, expires_at) VALUES (?, ?, ?, ?)',
      [user.id, verifyCode, 'verify_code', expiresAt]
    );
    if (mailer) {
      await mailer.sendVerifyCodeEmail(email, verifyCode);
    }
    res.json({ message: mailer ? '验证码已发送' : '未配置SMTP，无法发送验证码' });
  } catch (error) {
    res.status(500).json({ error: '发送验证码失败' });
  }
});

app.post('/api/auth/verify-email-code', async (req, res) => {
  try {
    const { email, code } = req.body || {};
    if (!email || !code) {
      res.status(400).json({ error: 'email、code 不能为空' });
      return;
    }

    const user = await get('SELECT id, email_verified FROM users WHERE email = ?', [email]);
    if (!user) {
      res.status(404).json({ error: '该邮箱未注册' });
      return;
    }
    if (user.email_verified) {
      res.json({ message: '邮箱已验证' });
      return;
    }

    const tokenRow = await get(
      "SELECT id, user_id, expires_at, used_at FROM email_tokens WHERE user_id = ? AND token = ? AND type = 'verify_code' ORDER BY id DESC LIMIT 1",
      [user.id, String(code).trim()]
    );
    if (!tokenRow || tokenRow.used_at) {
      res.status(400).json({ error: '验证码无效' });
      return;
    }
    if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
      res.status(400).json({ error: '验证码已过期' });
      return;
    }

    await run('UPDATE users SET email_verified = 1 WHERE id = ?', [tokenRow.user_id]);
    await run("UPDATE email_tokens SET used_at = datetime('now') WHERE id = ?", [tokenRow.id]);
    res.json({ message: '邮箱验证成功' });
  } catch (error) {
    res.status(500).json({ error: '验证失败' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      res.status(400).json({ error: 'email、password 不能为空' });
      return;
    }

    const user = await get(
      'SELECT id, email, username, password_hash, email_verified FROM users WHERE email = ?',
      [email]
    );
    if (!user) {
      res.status(401).json({ error: '邮箱或密码错误' });
      return;
    }

    const match = await verifyPassword(password, user.password_hash);
    if (!match) {
      res.status(401).json({ error: '邮箱或密码错误' });
      return;
    }
    if (!user.email_verified) {
      res.status(403).json({ error: '请先完成邮箱验证码验证' });
      return;
    }

    const token = createJwt(
      { userId: user.id, email: user.email, username: user.username },
      config.jwtSecret
    );
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        emailVerified: Boolean(user.email_verified)
      }
    });
  } catch (error) {
    res.status(500).json({ error: '登录失败' });
  }
});

app.get('/api/shop/catalog', authMiddleware, async (req, res) => {
  try {
    const rows = await all(
      'SELECT id, category, sub_type, name, price FROM shop_catalog ORDER BY sort_order ASC'
    );
    const catalog = {
      weaponsBasic: [],
      weaponsSpecial: [],
      vehicles: [],
      upgrades: []
    };

    for (const row of rows) {
      const item = {
        id: row.id,
        name: row.name,
        price: row.price
      };
      if (row.category === 'weapon' && row.sub_type === 'basic') {
        catalog.weaponsBasic.push({ ...item, type: 'basic' });
      } else if (row.category === 'weapon' && row.sub_type === 'special') {
        catalog.weaponsSpecial.push({ ...item, type: 'special' });
      } else if (row.category === 'vehicle') {
        catalog.vehicles.push(item);
      } else if (row.category === 'upgrade') {
        catalog.upgrades.push(item);
      }
    }

    res.json(catalog);
  } catch (error) {
    res.status(500).json({ error: '读取商店目录失败' });
  }
});

app.post('/api/shop/select', authMiddleware, async (req, res) => {
  try {
    const { selectType, itemId } = req.body || {};
    if (!selectType || !itemId) {
      res.status(400).json({ error: 'selectType、itemId 不能为空' });
      return;
    }
    const row = await getUserProgressRow(req.user.userId);
    if (!row) {
      res.status(404).json({ error: '未找到进度' });
      return;
    }

    const ownedWeapons = safeParseArray(row.owned_weapons, ['pistol']);
    const ownedCars = safeParseArray(row.owned_cars, ['starter']);
    let currentWeapon = row.current_weapon || 'pistol';
    let carType = row.car_type || 'starter';

    if (selectType === 'weapon') {
      if (!ownedWeapons.includes(itemId)) {
        res.status(400).json({ error: '该武器尚未拥有' });
        return;
      }
      currentWeapon = itemId;
    } else if (selectType === 'vehicle') {
      if (!ownedCars.includes(itemId)) {
        res.status(400).json({ error: '该车辆尚未拥有' });
        return;
      }
      carType = itemId;
    } else {
      res.status(400).json({ error: '不支持的选择类型' });
      return;
    }

    await run(
      "UPDATE player_progress SET current_weapon = ?, car_type = ?, updated_at = datetime('now') WHERE user_id = ?",
      [currentWeapon, carType, req.user.userId]
    );

    const updated = await getUserProgressRow(req.user.userId);
    res.json({ message: '选择成功', progress: progressToClient(updated) });
  } catch (error) {
    res.status(500).json({ error: '选择失败' });
  }
});

app.post('/api/shop/purchase', authMiddleware, async (req, res) => {
  try {
    const { category, itemId } = req.body || {};
    if (!category || !itemId) {
      res.status(400).json({ error: 'category、itemId 不能为空' });
      return;
    }

    const catalogItem = await get(
      'SELECT id, category, sub_type, price FROM shop_catalog WHERE id = ?',
      [itemId]
    );
    if (!catalogItem || catalogItem.category !== category) {
      res.status(404).json({ error: '商品不存在' });
      return;
    }

    const row = await getUserProgressRow(req.user.userId);
    if (!row) {
      res.status(404).json({ error: '未找到进度' });
      return;
    }

    let coins = row.coins;
    const upgradeState = safeParseObject(row.upgrade_state, {});
    const ownedWeapons = safeParseArray(row.owned_weapons, ['pistol']);
    const ownedCars = safeParseArray(row.owned_cars, ['starter']);
    const unlockedSpecialWeapons = safeParseArray(row.unlocked_special_weapons, []);
    let currentWeapon = row.current_weapon || 'pistol';
    let carType = row.car_type || 'starter';
    let charge = 0;

    if (category === 'weapon') {
      if (catalogItem.sub_type === 'basic') {
        if (ownedWeapons.includes(itemId)) {
          currentWeapon = itemId;
        } else {
          charge = catalogItem.price;
          if (coins < charge) {
            res.status(400).json({ error: '金币不足' });
            return;
          }
          coins -= charge;
          ownedWeapons.push(itemId);
          currentWeapon = itemId;
        }
      } else if (catalogItem.sub_type === 'special') {
        if (!unlockedSpecialWeapons.includes(itemId)) {
          charge = catalogItem.price;
          if (coins < charge) {
            res.status(400).json({ error: '金币不足' });
            return;
          }
          coins -= charge;
          unlockedSpecialWeapons.push(itemId);
        }
      }
    } else if (category === 'vehicle') {
      if (ownedCars.includes(itemId)) {
        carType = itemId;
      } else {
        charge = catalogItem.price;
        if (coins < charge) {
          res.status(400).json({ error: '金币不足' });
          return;
        }
        coins -= charge;
        ownedCars.push(itemId);
        carType = itemId;
      }
    } else if (category === 'upgrade') {
      charge = catalogItem.price;
      if (coins < charge) {
        res.status(400).json({ error: '金币不足' });
        return;
      }
      
      const key = catalogItem.id;
      const current = Number(upgradeState[key] || 0);
      
      // Upgrade caps
      if (key === 'maxHp' && current >= 2) return res.status(400).json({ error: '已达到最高等级' });
      if (key === 'maxAmmo' && current >= 5) return res.status(400).json({ error: '已达到最高等级' });
      if (key === 'topSpeed' && current >= 5) return res.status(400).json({ error: '已达到最高等级' });
      if (key === 'acceleration' && current >= 5) return res.status(400).json({ error: '已达到最高等级' });
      if (!['maxHp', 'maxAmmo', 'topSpeed', 'acceleration'].includes(key)) {
        res.status(400).json({ error: '不支持的升级类型' });
        return;
      }

      coins -= charge;
      upgradeState[key] = current + 1;
    } else {
      res.status(400).json({ error: '不支持的商品类型' });
      return;
    }

    await run(
      "UPDATE player_progress SET coins = ?, upgrade_state = ?, owned_weapons = ?, owned_cars = ?, current_weapon = ?, car_type = ?, unlocked_special_weapons = ?, unlocked_weapons = ?, updated_at = datetime('now') WHERE user_id = ?",
      [
        coins,
        JSON.stringify(upgradeState),
        JSON.stringify(ownedWeapons),
        JSON.stringify(ownedCars),
        currentWeapon,
        carType,
        JSON.stringify(unlockedSpecialWeapons),
        JSON.stringify(ownedWeapons),
        req.user.userId
      ]
    );

    const updated = await getUserProgressRow(req.user.userId);
    res.json({
      message: '购买成功',
      charged: charge,
      progress: progressToClient(updated)
    });
  } catch (error) {
    res.status(500).json({ error: '购买失败' });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      res.status(400).json({ error: 'email 不能为空' });
      return;
    }

    const user = await get('SELECT id FROM users WHERE email = ?', [email]);
    if (!user) {
      res.json({ message: '如果邮箱存在，将收到重置邮件' });
      return;
    }

    const resetToken = createToken();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    await run(
      'INSERT INTO email_tokens (user_id, token, type, expires_at) VALUES (?, ?, ?, ?)',
      [user.id, resetToken, 'reset', expiresAt]
    );

    if (mailer) {
      const resetUrl = `${config.appBaseUrl}/reset-password?token=${resetToken}`;
      await mailer.sendResetEmail(email, resetUrl);
    }

    res.json({
      message: mailer
        ? '如果邮箱存在，将收到重置邮件'
        : '未配置SMTP，无法发送重置邮件'
    });
  } catch (error) {
    res.status(500).json({ error: '处理失败' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body || {};
    if (!token || !newPassword) {
      res.status(400).json({ error: 'token、newPassword 不能为空' });
      return;
    }

    const tokenRow = await get(
      "SELECT id, user_id, expires_at, used_at FROM email_tokens WHERE token = ? AND type = 'reset'",
      [token]
    );
    if (!tokenRow || tokenRow.used_at) {
      res.status(400).json({ error: '无效或已使用的重置链接' });
      return;
    }

    if (new Date(tokenRow.expires_at).getTime() < Date.now()) {
      res.status(400).json({ error: '重置链接已过期' });
      return;
    }

    const passwordHash = await hashPassword(newPassword);
    await run('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, tokenRow.user_id]);
    await run("UPDATE email_tokens SET used_at = datetime('now') WHERE id = ?", [tokenRow.id]);
    res.json({ message: '密码重置成功' });
  } catch (error) {
    res.status(500).json({ error: '重置失败' });
  }
});

app.get('/api/progress', authMiddleware, async (req, res) => {
  try {
    const row = await getUserProgressRow(req.user.userId);
    if (!row) {
      res.status(404).json({ error: '未找到进度' });
      return;
    }
    res.json(progressToClient(row));
  } catch (error) {
    res.status(500).json({ error: '读取进度失败' });
  }
});

app.put('/api/progress', authMiddleware, async (req, res) => {
  try {
    const existingRow = await getUserProgressRow(req.user.userId);
    if (!existingRow) {
      res.status(404).json({ error: '未找到进度' });
      return;
    }
    const normalized = normalizeProgress(req.body || {}, existingRow);
    await run(
      "UPDATE player_progress SET coins = ?, unlocked_weapons = ?, unlocked_special_weapons = ?, upgrade_state = ?, updated_at = datetime('now') WHERE user_id = ?",
      [
        normalized.coins,
        JSON.stringify(normalized.unlockedWeapons),
        JSON.stringify(normalized.unlockedSpecialWeapons),
        JSON.stringify(normalized.upgradeState),
        req.user.userId
      ]
    );
    res.json({ message: '进度已保存' });
  } catch (error) {
    res.status(500).json({ error: '保存进度失败' });
  }
});

app.use(express.static(path.join(__dirname, '..', 'docs')));

async function start() {
  await initDb();
  app.listen(config.port, '127.0.0.1', () => {
    process.stdout.write(`Backend started: http://localhost:${config.port}\n`);
  });
}

start().catch((error) => {
  process.stderr.write(`Backend failed: ${error.message}\n`);
  process.exit(1);
});
