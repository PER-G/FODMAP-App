// POST /api/analyze — Text-based FODMAP analysis
import { verifyToken } from './auth.js';
import { validateTextInput } from './_lib/validators.js';
import { analyzeText } from './_lib/claude-client.js';
import { getStorage } from './_lib/storage.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Auth check
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!verifyToken(token)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { text, lang = 'de' } = req.body || {};
    const validation = validateTextInput(text);
    if (!validation.valid) return res.status(400).json({ error: validation.error });

    // Enrich with seed data context
    const storage = getStorage();
    const seedContext = await storage.buildSeedContext(validation.text);

    // Call Claude
    const result = await analyzeText(validation.text, lang, seedContext);

    // Log candidate if unknown
    if (result.structured?.confidence === 'low' || result._noStructure) {
      storage.addCandidate({
        type: 'food',
        name: validation.text,
        source: 'user_search',
        claudeAnalysis: result.structured || null,
      }).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      query: validation.text,
      ...result,
    });
  } catch (err) {
    console.error('Analyze error:', err);
    return res.status(500).json({ error: 'Analysis failed. Please try again.' });
  }
}
