// POST /api/chat — Conversational FODMAP chat
import { verifyToken } from './auth.js';
import { validateChatMessages, isOnTopic } from './_lib/validators.js';
import { chat } from './_lib/claude-client.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!verifyToken(token)) return res.status(401).json({ error: 'Unauthorized' });

  try {
    const { messages, context = '', lang = 'de' } = req.body || {};
    const validation = validateChatMessages(messages);
    if (!validation.valid) return res.status(400).json({ error: validation.error });

    // Check if the latest user message is on-topic (save API costs)
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg && !isOnTopic(lastUserMsg.content)) {
      const offTopicReply = lang === 'de'
        ? 'Ich kann nur Fragen zu Lebensmitteln, Ernährung, FODMAP und Sport beantworten. Bitte stelle eine Frage zu diesen Themen.'
        : 'I can only answer questions about food, nutrition, FODMAP, and fitness. Please ask about these topics.';
      return res.status(200).json({
        success: true,
        chatResponse: offTopicReply,
        structured: null,
        _offTopic: true,
      });
    }

    const result = await chat(messages, lang, context);

    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch (err) {
    console.error('Chat error:', err);
    return res.status(500).json({ error: 'Chat failed. Please try again.' });
  }
}
