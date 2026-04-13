// POST /api/recipe-analyze — Analyze recipe ingredients for FODMAP
import { verifyToken } from './auth.js';
import { validateTextInput } from './_lib/validators.js';
import { analyzeRecipe } from './_lib/claude-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!verifyToken(token)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { ingredients, lang = 'de' } = req.body || {};
    const validation = validateTextInput(ingredients);
    if (!validation.valid) return res.status(400).json({ error: validation.error });

    const result = await analyzeRecipe(validation.text, lang);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error('Recipe analyze error:', err);
    return res.status(500).json({ error: 'Recipe analysis failed. Please try again.' });
  }
}
