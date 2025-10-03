// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');

const fetch = require('node-fetch'); // node-fetch@2 bilan mos
const Twilio = require('twilio');

const app = express();

const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';
const DB_PATH = path.join(__dirname, 'db.json');

// --- Middleware ---
app.use(cors());
app.use(express.json());

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // umumiy cheklov
  standardHeaders: true,
  legacyHeaders: false
});
app.use(globalLimiter);

// --- Simple JSON DB helpers ---
async function readDB() {
  try {
    const raw = await fs.readFile(DB_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return { users: [] };
  }
}
async function writeDB(db) {
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

// --- In-memory verification codes (ephemeral) ---
/*
 Map struktura:
 verificationCodes.set(phone, { code, expires, name, attempts, lastSentAt })
*/
const verificationCodes = new Map();

function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function isValidUZPhone(phone) {
  return /^\+998[0-9]{9}$/.test(phone);
}

// --- SMS sender: Twilio or Eskiz (priority: TWILIO first, then ESKIZ) ---
async function sendSMS_via_twilio(to, message) {
  const sid = process.env.TWILIO_SID;
  const token = process.env.TWILIO_TOKEN;
  const from = process.env.TWILIO_FROM;
  if (!sid || !token || !from) throw new Error('Twilio credentials missing');
  const client = Twilio(sid, token);
  const res = await client.messages.create({ body: message, from, to });
  return !!res && !!res.sid;
}

async function sendSMS_via_eskiz(to, message) {
  const ESKIZ_API_KEY = process.env.ESKIZ_API_KEY;
  const ESKIZ_SENDER = process.env.ESKIZ_SENDER || 'E-EHSON';
  if (!ESKIZ_API_KEY) throw new Error('Eskiz API key missing');

  // NOTE: Eskiz API shape can vary — bu misol umumiy: /api/message/sms/send
  const url = 'https://notify.eskiz.uz/api/message/sms/send';
  const body = {
    mobile_phone: to,
    message,
    from: ESKIZ_SENDER
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${ESKIZ_API_KEY}`
    },
    body: JSON.stringify(body)
  });
  const data = await resp.json();
  // Eskizning rasmiy dokumentatsiyasiga qarab success tekshiring.
  // Ko'p holatda status kod 200 va data.success yoki data.status bilan qaytadi.
  return resp.ok;
}

async function sendSMS(phone, code) {
  const text = `Sizning tasdiqlash kodingiz: ${code}. Kod 5 daqiqa amal qiladi.`;
  // Prefer Twilio if configured, else Eskiz, else dev (console)
  try {
    if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN && process.env.TWILIO_FROM) {
      return await sendSMS_via_twilio(phone, text);
    }
    if (process.env.ESKIZ_API_KEY) {
      return await sendSMS_via_eskiz(phone, text);
    }
  } catch (e) {
    console.error('SMS provider error:', e.message || e);
    return false;
  }

  // Development fallback: console
  console.log(`(DEV SMS) -> ${phone}: ${text}`);
  return true;
}

// --- Simple per-phone send cooldown to avoid spam (60s) ---
function canSendCode(phone) {
  const rec = verificationCodes.get(phone);
  if (!rec) return true;
  const last = rec.lastSentAt || 0;
  return (Date.now() - last) > (60 * 1000); // 60 seconds
}

// --- Endpoints ---

// Health
app.get('/', (req, res) => res.json({ ok: true, msg: 'Auth server ishlamoqda' }));

// Register: send SMS code (if phone not registered)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { phone, name } = req.body;
    if (!phone || !name) return res.status(400).json({ success: false, message: 'phone va name kerak' });
    if (!isValidUZPhone(phone)) return res.status(400).json({ success: false, message: 'Telefon format: +998xxxxxxxxx' });

    const db = await readDB();
    if (db.users.find(u => u.phone === phone)) {
      return res.status(400).json({ success: false, message: 'Bu raqam ro\'yhatdan o\'tgan' });
    }

    if (!canSendCode(phone)) {
      return res.status(429).json({ success: false, message: 'Iltimos 60 soniya kuting va qayta urinib ko\'ring' });
    }

    const code = generateVerificationCode();
    const expires = Date.now() + (5 * 60 * 1000); // 5 min

    verificationCodes.set(phone, {
      code,
      expires,
      name,
      attempts: 0,
      lastSentAt: Date.now()
    });

    const sent = await sendSMS(phone, code);
    if (!sent) {
      return res.status(500).json({ success: false, message: 'SMS yuborilmadi (provider xatolik)' });
    }

    return res.json({ success: true, message: 'Tasdiqlash kodi yuborildi', phone });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: 'Server xato' });
  }
});

// Verify registration: create user and return JWT
app.post('/api/auth/verify', async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) return res.status(400).json({ success: false, message: 'phone va code kerak' });

    const record = verificationCodes.get(phone);
    if (!record) return res.status(400).json({ success: false, message: 'Kod topilmadi yoki muddati tugagan' });
    if (Date.now() > record.expires) {
      verificationCodes.delete(phone);
      return res.status(400).json({ success: false, message: 'Kod muddati tugagan' });
    }

    if (record.code !== code) {
      record.attempts = (record.attempts || 0) + 1;
      // agar 5 marta xato kiritilsa, kodni o'chiramiz
      if (record.attempts >= 5) {
        verificationCodes.delete(phone);
        return res.status(403).json({ success: false, message: 'Ko‘p marta noto‘g‘ri kod. Yangi kod so‘rang.' });
      }
      verificationCodes.set(phone, record);
      return res.status(400).json({ success: false, message: 'Kod noto\'g\'ri' });
    }

    const db = await readDB();
    if (db.users.find(u => u.phone === phone)) {
      verificationCodes.delete(phone);
      return res.status(400).json({ success: false, message: 'Bu raqam allaqachon ro\'yhatdan o\'tgan' });
    }

    const newUser = {
      id: db.users.length ? Math.max(...db.users.map(u => u.id)) + 1 : 1,
      phone,
      name: record.name,
      isVerified: true,
      createdAt: new Date().toISOString()
    };
    db.users.push(newUser);
    await writeDB(db);
    verificationCodes.delete(phone);

    const token = jwt.sign({ userId: newUser.id, phone: newUser.phone }, JWT_SECRET, { expiresIn: '30d' });

    return res.json({ success: true, message: 'Ro\'yhat muvaffaqiyatli', token, user: newUser });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: 'Server xato' });
  }
});

// Login: generate code for existing user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: 'phone kerak' });
    if (!isValidUZPhone(phone)) return res.status(400).json({ success: false, message: 'Telefon format: +998xxxxxxxxx' });

    const db = await readDB();
    const user = db.users.find(u => u.phone === phone);
    if (!user) return res.status(400).json({ success: false, message: 'Raqam ro\'yhatda emas' });

    if (!canSendCode(phone)) {
      return res.status(429).json({ success: false, message: 'Iltimos 60 soniya kuting va qayta urinib ko\'ring' });
    }

    const code = generateVerificationCode();
    const expires = Date.now() + (5 * 60 * 1000);
    verificationCodes.set(phone, { code, expires, attempts: 0, lastSentAt: Date.now() });

    const sent = await sendSMS(phone, code);
    if (!sent) return res.status(500).json({ success: false, message: 'SMS yuborilmadi (provider xatolik)' });

    return res.json({ success: true, message: 'Kod yuborildi', phone });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: 'Server xato' });
  }
});

// Login verify: return JWT
app.post('/api/auth/login-verify', async (req, res) => {
  try {
    const { phone, code } = req.body;
    if (!phone || !code) return res.status(400).json({ success: false, message: 'phone va code kerak' });

    const record = verificationCodes.get(phone);
    if (!record) return res.status(400).json({ success: false, message: 'Kod topilmadi yoki muddati tugagan' });
    if (Date.now() > record.expires) {
      verificationCodes.delete(phone);
      return res.status(400).json({ success: false, message: 'Kod muddati tugagan' });
    }

    if (record.code !== code) {
      record.attempts = (record.attempts || 0) + 1;
      if (record.attempts >= 5) {
        verificationCodes.delete(phone);
        return res.status(403).json({ success: false, message: 'Ko‘p marta noto‘g‘ri kod. Yangi kod so‘rang.' });
      }
      verificationCodes.set(phone, record);
      return res.status(400).json({ success: false, message: 'Kod noto\'g\'ri' });
    }

    const db = await readDB();
    const user = db.users.find(u => u.phone === phone);
    if (!user) {
      verificationCodes.delete(phone);
      return res.status(400).json({ success: false, message: 'Foydalanuvchi topilmadi' });
    }

    verificationCodes.delete(phone);
    const token = jwt.sign({ userId: user.id, phone: user.phone }, JWT_SECRET, { expiresIn: '30d' });

    return res.json({ success: true, message: 'Kirish muvaffaqiyatli', token, user });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: 'Server xato' });
  }
});

// Token middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, message: 'Token yo\'q' });

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) return res.status(403).json({ success: false, message: 'Token noto\'g\'ri' });
    req.user = payload;
    next();
  });
}

// /me
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const db = await readDB();
    const user = db.users.find(u => u.id === req.user.userId);
    if (!user) return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi' });
    return res.json({ success: true, user });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, message: 'Server xato' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Auth server ${PORT} portda ishlayapti`);
});

