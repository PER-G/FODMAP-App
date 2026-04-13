// Chat component — conversational FODMAP assistant
import { t, getLang } from '../i18n.js';
import { el, clearEl, escapeHtml } from '../utils/dom.js';
import { api } from '../api-client.js';
import { renderResultCard } from './result-card.js';

// Topics that are allowed (saves API cost by rejecting off-topic)
const ALLOWED_TOPICS = /\b(fodmap|lebensmittel|essen|food|diet|ernährung|nutrition|rezept|recipe|kochen|cook|zutat|ingredient|mahlzeit|meal|protein|kalorien|calorie|laktose|lactose|fruktose|fructose|gluten|sport|fitness|workout|training|muskel|muscle|abnehm|weight|diät|vegan|vegetar|bio|organic|supermarkt|einkauf|magen|darm|verdauung|digestion|bauch|intoleranz|unverträglich|allergi|milch|dairy|obst|fruit|gemüse|vegetable|getreide|grain|fleisch|meat|fisch|fish|ei|egg|nuss|nut|reis|rice|pasta|brot|bread|käse|cheese|joghurt|yogurt|skyr|hafer|oat|tofu|tempeh|soja|soy|ballaststoff|fiber|vitamin|mineral|zucker|sugar|fett|fat|kohlenhydrat|carb|snack|frühstück|breakfast|mittag|lunch|abend|dinner)\b/i;

let messages = [];

export function render(container, params = {}) {
  clearEl(container);
  messages = [];

  const wrapper = el('div', { className: 'chat-view' });

  // Messages area
  const messagesEl = el('div', { className: 'chat-messages', id: 'chat-messages' });

  // Welcome message
  const welcome = el('div', { className: 'chat-bubble chat-bubble-assistant' }, t('chatWelcome'));
  messagesEl.appendChild(welcome);

  wrapper.appendChild(messagesEl);

  // Input bar
  const inputBar = el('div', { className: 'chat-input-bar' });
  const chatInput = el('input', { type: 'text', placeholder: t('chatPlaceholder'), id: 'chat-input' });
  const sendBtn = el('button', { className: 'btn btn-primary' }, t('chatSend'));
  inputBar.appendChild(chatInput);
  inputBar.appendChild(sendBtn);
  wrapper.appendChild(inputBar);

  container.appendChild(wrapper);

  // Events
  const send = () => {
    const text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = '';
    handleSend(text, messagesEl);
  };

  sendBtn.addEventListener('click', send);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') send();
  });

  // Auto-fill from context
  if (params.context) {
    chatInput.value = params.context;
    chatInput.focus();
  }
}

async function handleSend(text, messagesEl) {
  // Check if on-topic (client-side filter to save API calls)
  if (!ALLOWED_TOPICS.test(text) && messages.length === 0) {
    const lang = getLang();
    addBubble(messagesEl, 'user', text);
    addBubble(messagesEl, 'assistant',
      lang === 'de'
        ? 'Ich kann nur Fragen zu Lebensmitteln, Ernährung, FODMAP und Sport beantworten. Bitte stelle eine Frage zu diesen Themen.'
        : 'I can only answer questions about food, nutrition, FODMAP, and fitness. Please ask about these topics.'
    );
    return;
  }

  // Add user message
  addBubble(messagesEl, 'user', text);
  messages.push({ role: 'user', content: text });

  // Show typing indicator
  const typing = el('div', { className: 'typing-indicator', id: 'typing' });
  typing.innerHTML = '<span></span><span></span><span></span>';
  messagesEl.appendChild(typing);
  scrollToBottom(messagesEl);

  try {
    const result = await api('chat', {
      method: 'POST',
      body: { messages, lang: getLang() },
      timeout: 30000,
    });

    // Remove typing
    typing.remove();

    // Add assistant response
    const responseText = result.chatResponse || result.raw || '';
    messages.push({ role: 'assistant', content: responseText });

    if (result.structured?.items?.length) {
      // Render structured result cards
      const cardContainer = el('div', { style: 'align-self:flex-start;max-width:90%;' });
      for (const item of result.structured.items) {
        renderResultCard(cardContainer, item);
      }
      messagesEl.appendChild(cardContainer);
    }

    if (responseText) {
      addBubble(messagesEl, 'assistant', responseText);
    }
  } catch (err) {
    typing.remove();
    addBubble(messagesEl, 'assistant', t('analyzeError'));
  }

  scrollToBottom(messagesEl);
}

function addBubble(container, role, text) {
  const bubble = el('div', { className: `chat-bubble chat-bubble-${role}` });
  bubble.textContent = text;
  container.appendChild(bubble);
  scrollToBottom(container);
}

function scrollToBottom(el) {
  el.scrollTop = el.scrollHeight;
}
