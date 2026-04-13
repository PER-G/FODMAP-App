// POST /api/candidates — Submit knowledge candidate
import { verifyToken } from './auth.js';
import { getStorage } from './_lib/storage.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!verifyToken(token)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { type, name, claudeAnalysis } = req.body || {};
    if (!name) return res.status(400).json({ error: 'Name required' });

    const storage = getStorage();
    const result = await storage.addCandidate({ type, name, claudeAnalysis, submittedAt: new Date().toISOString() });
    return res.status(200).json(result);
  } catch (err) {
    console.error('Candidate error:', err);
    return res.status(500).json({ error: 'Failed to save candidate' });
  }
}
