// POST /api/analyze-image — Image-based FODMAP analysis (Claude Vision)
import { verifyToken } from './auth.js';
import { validateImageInput, validateTextInput } from './_lib/validators.js';
import { analyzeImage } from './_lib/claude-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!verifyToken(token)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { image, mediaType, text, lang = 'de' } = req.body || {};

    const imgValidation = validateImageInput(image, mediaType);
    if (!imgValidation.valid) return res.status(400).json({ error: imgValidation.error });

    let userText = '';
    if (text) {
      const textValidation = validateTextInput(text);
      if (textValidation.valid) userText = textValidation.text;
    }

    const result = await analyzeImage(image, mediaType, userText, lang);

    return res.status(200).json({
      success: true,
      query_type: 'image',
      ...result,
    });
  } catch (err) {
    console.error('Image analyze error:', err);
    return res.status(500).json({ error: 'Image analysis failed. Please try again.' });
  }
}
