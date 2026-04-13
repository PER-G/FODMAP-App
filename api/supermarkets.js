// GET /api/supermarkets — Supermarket product suggestions
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
    const { category } = req.query || {};
    const storage = getStorage();
    const result = await storage.getSupermarketSuggestions(category);
    return res.status(200).json(result);
  } catch (err) {
    console.error('Supermarkets error:', err);
    return res.status(500).json({ error: 'Failed to load supermarket data' });
  }
}
