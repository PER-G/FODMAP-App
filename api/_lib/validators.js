// Input validation utilities

const MAX_TEXT_LENGTH = 2000;
const MAX_IMAGE_SIZE = 500_000; // ~500KB base64
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export function validateTextInput(text) {
  if (!text || typeof text !== 'string') {
    return { valid: false, error: 'Text input required' };
  }
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Text must not be empty' };
  }
  if (trimmed.length > MAX_TEXT_LENGTH) {
    return { valid: false, error: `Text too long (max ${MAX_TEXT_LENGTH} characters)` };
  }
  return { valid: true, text: trimmed };
}

export function validateImageInput(image, mediaType) {
  if (!image || typeof image !== 'string') {
    return { valid: false, error: 'Image data required' };
  }
  if (!ALLOWED_IMAGE_TYPES.includes(mediaType)) {
    return { valid: false, error: `Invalid image type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}` };
  }
  if (image.length > MAX_IMAGE_SIZE) {
    return { valid: false, error: 'Image too large. Please resize before uploading.' };
  }
  return { valid: true };
}

export function validateChatMessages(messages) {
  if (!Array.isArray(messages)) {
    return { valid: false, error: 'Messages must be an array' };
  }
  if (messages.length > 50) {
    return { valid: false, error: 'Too many messages (max 50)' };
  }
  for (const msg of messages) {
    if (!msg.role || !msg.content) {
      return { valid: false, error: 'Each message needs role and content' };
    }
    if (!['user', 'assistant'].includes(msg.role)) {
      return { valid: false, error: 'Invalid message role' };
    }
    if (typeof msg.content === 'string' && msg.content.length > MAX_TEXT_LENGTH) {
      return { valid: false, error: 'Message too long' };
    }
  }
  return { valid: true };
}

export function validateMealRequest(body) {
  const { mealType, filters } = body || {};
  const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  const validFilters = ['highProtein', 'lowCalorie', 'vegetarian', 'vegan', 'budget', 'fewIngredients', 'quick', 'mealPrep'];

  if (mealType && !validMealTypes.includes(mealType)) {
    return { valid: false, error: 'Invalid meal type' };
  }
  if (filters && !Array.isArray(filters)) {
    return { valid: false, error: 'Filters must be an array' };
  }
  if (filters) {
    for (const f of filters) {
      if (!validFilters.includes(f)) {
        return { valid: false, error: `Invalid filter: ${f}` };
      }
    }
  }
  return { valid: true };
}

// Topic filter — reject off-topic queries to save API costs
const ALLOWED_TOPIC_PATTERN = /\b(fodmap|lebensmittel|essen|food|diet|ernährung|nutrition|rezept|recipe|kochen|cook|zutat|ingredient|mahlzeit|meal|protein|kalorien|calorie|laktose|lactose|fruktose|fructose|gluten|sport|fitness|workout|training|muskel|muscle|abnehm|weight|diät|vegan|vegetar|bio|organic|supermarkt|einkauf|magen|darm|verdauung|digestion|bauch|belly|intoleranz|unverträglich|allergi|milch|dairy|obst|fruit|gemüse|vegetable|getreide|grain|fleisch|meat|fisch|fish|ei|egg|nuss|nut|reis|rice|pasta|brot|bread|käse|cheese|joghurt|yogurt|skyr|hafer|oat|tofu|tempeh|soja|soy|ballaststoff|fiber|vitamin|mineral|zucker|sugar|fett|fat|kohlenhydrat|carb|snack|frühstück|breakfast|mittag|lunch|abend|dinner|gesund|health|verträglich|portio|keto|paleo|low.?carb|high.?protein|kalorienarm|nährwert|nutrient)\b/i;

export function isOnTopic(text) {
  return ALLOWED_TOPIC_PATTERN.test(text);
}

export function sanitizeText(text) {
  return text.replace(/[<>"'&]/g, c => ({
    '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#x27;', '&': '&amp;'
  })[c] || c);
}
