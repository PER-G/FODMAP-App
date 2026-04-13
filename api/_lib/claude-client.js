// Anthropic Claude SDK wrapper
import Anthropic from '@anthropic-ai/sdk';
import { buildAnalysisPrompt, buildImagePrompt, buildChatPrompt, buildMealPrompt, buildRecipePrompt } from './prompts.js';

let client = null;

function getClient() {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 2048;

// Text-based FODMAP analysis
export async function analyzeText(query, lang = 'de', seedContext = '') {
  const systemPrompt = buildAnalysisPrompt(lang, seedContext);

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{ role: 'user', content: query }],
  });

  return parseClaudeResponse(response);
}

// Image-based analysis (Claude Vision)
export async function analyzeImage(imageBase64, mediaType, text = '', lang = 'de') {
  const systemPrompt = buildImagePrompt(lang);

  const content = [
    {
      type: 'image',
      source: { type: 'base64', media_type: mediaType, data: imageBase64 },
    },
  ];

  if (text) {
    content.push({ type: 'text', text });
  } else {
    content.push({
      type: 'text',
      text: lang === 'de'
        ? 'Analysiere dieses Bild im Hinblick auf FODMAP-Verträglichkeit. Erkenne Lebensmittel, Produkte oder Zutatenlisten.'
        : 'Analyze this image for FODMAP compatibility. Identify foods, products, or ingredient lists.',
    });
  }

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{ role: 'user', content }],
  });

  return parseClaudeResponse(response);
}

// Chat conversation
export async function chat(messages, lang = 'de', context = '') {
  const systemPrompt = buildChatPrompt(lang, context);

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages,
  });

  return parseClaudeResponse(response);
}

// Meal suggestion
export async function suggestMeal(mealType, filters, lang = 'de') {
  const systemPrompt = buildMealPrompt(lang);
  const filterStr = filters.length > 0 ? filters.join(', ') : 'keine besonderen Filter';

  const userMsg = lang === 'de'
    ? `Schlage ein FODMAP-geeignetes ${mealType || 'Gericht'} vor. Filter: ${filterStr}`
    : `Suggest a FODMAP-friendly ${mealType || 'meal'}. Filters: ${filterStr}`;

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMsg }],
  });

  return parseClaudeResponse(response);
}

// Recipe analysis
export async function analyzeRecipe(ingredients, lang = 'de') {
  const systemPrompt = buildRecipePrompt(lang);

  const userMsg = lang === 'de'
    ? `Analysiere folgendes Rezept auf FODMAP-Verträglichkeit:\n\n${ingredients}`
    : `Analyze this recipe for FODMAP compatibility:\n\n${ingredients}`;

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMsg }],
  });

  return parseClaudeResponse(response);
}

// Parse Claude response and extract structured JSON if present
function parseClaudeResponse(response) {
  const text = response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('\n');

  // Try to extract JSON from <json>...</json> tags
  const jsonMatch = text.match(/<json>([\s\S]*?)<\/json>/);
  if (jsonMatch) {
    try {
      const structured = JSON.parse(jsonMatch[1].trim());
      const chatText = text.replace(/<json>[\s\S]*?<\/json>/, '').trim();
      return {
        structured,
        chatResponse: chatText || structured.chat_response || '',
        raw: text,
        usage: response.usage,
      };
    } catch (e) {
      // JSON parse failed, return as text
    }
  }

  // Try raw JSON parse (in case Claude returned plain JSON)
  try {
    const structured = JSON.parse(text);
    return {
      structured,
      chatResponse: structured.chat_response || '',
      raw: text,
      usage: response.usage,
    };
  } catch {
    // Not JSON at all
  }

  // Fallback: return as plain text
  return {
    structured: null,
    chatResponse: text,
    raw: text,
    _noStructure: true,
    usage: response.usage,
  };
}
