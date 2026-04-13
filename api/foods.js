// GET /api/foods — Search and browse food database
import { verifyToken } from './auth.js';
import { getStorage } from './_lib/storage.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!verifyToken(token)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { q, category, rating, limit, offset } = req.query || {};
    const storage = getStorage();
    const result = await storage.getFoods({
      query: q,
      category,
      rating,
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error('Foods error:', err);
    return res.status(500).json({ error: 'Failed to load foods' });
  }
}
