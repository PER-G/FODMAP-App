// POST /api/suggest-meal — Generate FODMAP-friendly meal suggestion
import { verifyToken } from './auth.js';
import { validateMealRequest } from './_lib/validators.js';
import { suggestMeal } from './_lib/claude-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!verifyToken(token)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { mealType, filters = [], lang = 'de' } = req.body || {};
    const validation = validateMealRequest(req.body);
    if (!validation.valid) return res.status(400).json({ error: validation.error });

    const result = await suggestMeal(mealType, filters, lang);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error('Meal suggest error:', err);
    return res.status(500).json({ error: 'Meal suggestion failed. Please try again.' });
  }
}
