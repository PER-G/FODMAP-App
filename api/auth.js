// POST /api/auth — Login endpoint
// Validates credentials against environment variables and returns a simple token

import crypto from 'crypto';

const AUTH_USER = process.env.AUTH_USER;
const AUTH_PASSWORD = process.env.AUTH_PASSWORD;
const AUTH_SECRET = process.env.AUTH_SECRET || 'fodmap-default-secret';

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { user, password } = req.body || {};

    if (!user || !password) {
      return res.status(400).json({ error: 'User and password required' });
    }

    // Constant-time comparison to prevent timing attacks
    const userMatch = user.length === (AUTH_USER || '').length &&
      crypto.timingSafeEqual(Buffer.from(user), Buffer.from(AUTH_USER || ''));
    const passMatch = password.length === (AUTH_PASSWORD || '').length &&
      crypto.timingSafeEqual(Buffer.from(password), Buffer.from(AUTH_PASSWORD || ''));

    if (!userMatch || !passMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate token (HMAC-based, valid until secret changes)
    const payload = `${AUTH_USER}:${Date.now()}`;
    const token = generateToken(payload);

    return res.status(200).json({ token, user: AUTH_USER });
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

function generateToken(payload) {
  const hmac = crypto.createHmac('sha256', AUTH_SECRET);
  hmac.update(payload);
  const signature = hmac.digest('hex');
  const encoded = Buffer.from(payload).toString('base64url');
  return `${encoded}.${signature}`;
}

export function verifyToken(token) {
  try {
    if (!token) return false;
    const [encoded, signature] = token.split('.');
    if (!encoded || !signature) return false;

    const payload = Buffer.from(encoded, 'base64url').toString();
    const [user] = payload.split(':');

    // Verify signature
    const hmac = crypto.createHmac('sha256', AUTH_SECRET);
    hmac.update(payload);
    const expected = hmac.digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected)) && user === AUTH_USER;
  } catch {
    return false;
  }
}
