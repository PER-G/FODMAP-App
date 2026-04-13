// Result Card component — renders structured FODMAP analysis result
import { t, getLang } from '../i18n.js';
import { el } from '../utils/dom.js';
import { addFavorite, removeFavorite, isFavorite } from '../storage.js';
import { showToast } from '../utils/dom.js';
import { navigate } from '../router.js';

const STATUS_MAP = {
  green: { label: 'fodmapGreen', class: 'badge-green', dotClass: 'badge-dot-green' },
  yellow: { label: 'fodmapYellow', class: 'badge-yellow', dotClass: 'badge-dot-yellow' },
  red: { label: 'fodmapRed', class: 'badge-red', dotClass: 'badge-dot-red' },
  unknown: { label: 'fodmapUnknown', class: 'badge-unknown', dotClass: '' },
};

const FODMAP_KEYS = ['fructose', 'lactose', 'fructans', 'galactans', 'polyols'];

export function renderResultCard(container, item, options = {}) {
  const status = STATUS_MAP[item.overall_status] || STATUS_MAP.unknown;
  const card = el('div', { className: 'result-card' });

  // Status bar
  card.appendChild(el('div', { className: `result-card-status ${item.overall_status || 'unknown'}` }));

  const content = el('div', { className: 'result-card-content' });

  // Header: title + badge + actions
  const header = el('div', { className: 'result-card-header' });
  const titleWrap = el('div');
  titleWrap.appendChild(el('div', { className: 'result-card-title' }, item.name || item.query || '?'));
  if (item.name_en && getLang() === 'de') {
    titleWrap.appendChild(el('div', { className: 'card-subtitle text-muted' }, item.name_en));
  }
  header.appendChild(titleWrap);

  const badgeRow = el('div', { className: 'flex items-center gap-sm' });
  badgeRow.appendChild(el('span', { className: `badge ${status.class}` },
    el('span', { className: `badge-dot ${status.dotClass}` }),
    t(status.label)
  ));
  header.appendChild(badgeRow);
  content.appendChild(header);

  // Summary
  if (item.explanation || item.summary) {
    content.appendChild(el('div', { className: 'result-summary' }, item.explanation || item.summary));
  }

  // Nutrients
  if (item.nutrients_per_100g) {
    const n = item.nutrients_per_100g;
    const nutrientBar = el('div', { className: 'nutrients-bar' });
    nutrientBar.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;';
    const nutrientItems = [
      { label: 'kcal', value: n.calories },
      { label: 'Protein', value: n.protein, unit: 'g' },
      { label: 'Carbs', value: n.carbs, unit: 'g' },
      { label: 'Fett', value: n.fat, unit: 'g' },
      { label: 'Ballaststoffe', value: n.fiber, unit: 'g' },
    ];
    for (const ni of nutrientItems) {
      if (ni.value == null) continue;
      const chip = el('span', { className: 'chip' });
      chip.style.cssText = 'cursor:default;font-size:0.7rem;padding:3px 8px;';
      chip.textContent = `${ni.value}${ni.unit || ''} ${ni.label}`;
      nutrientBar.appendChild(chip);
    }
    content.appendChild(nutrientBar);
  }

  // FODMAP detail grid
  if (item.fodmap_detail) {
    const grid = el('div', { className: 'fodmap-detail' });
    for (const key of FODMAP_KEYS) {
      const level = item.fodmap_detail[key] || 'none';
      const dot = level === 'none' ? '' : level === 'low' ? 'badge-dot-green' : level === 'medium' ? 'badge-dot-yellow' : 'badge-dot-red';
      const levelLabel = level === 'none' ? '—' : level === 'low' ? '●' : level === 'medium' ? '●●' : '●●●';
      const detailItem = el('div', { className: 'fodmap-detail-item' });
      if (dot) {
        const dotEl = el('span', { className: `badge-dot ${dot}` });
        detailItem.appendChild(dotEl);
      } else {
        detailItem.appendChild(el('span', { className: 'text-muted' }, '—'));
      }
      detailItem.appendChild(el('span', { className: 'fodmap-detail-label' }, t(key)));
      grid.appendChild(detailItem);
    }
    content.appendChild(grid);
  }

  // Portion guidance
  if (item.portion_guidance) {
    const box = el('div', { className: 'portion-box' });
    box.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    box.appendChild(el('span', {}, `${t('portionGuidance')}: ${item.portion_guidance}`));
    content.appendChild(box);
  }

  // Confidence warning
  if (item.confidence === 'low') {
    content.appendChild(el('div', { className: 'confidence-bar low' }, t('confidenceLow')));
  } else if (item.confidence === 'medium') {
    content.appendChild(el('div', { className: 'confidence-bar medium' }, t('confidenceMedium')));
  }

  // Alternatives sections
  renderAlternatives(content, t('safeAlternatives'), item.safe_alternatives);
  renderAlternatives(content, t('highProteinAlts'), item.high_protein_alternatives);
  renderAlternatives(content, t('lowCalAlts'), item.low_calorie_alternatives);

  // Recipe swaps
  if (item.recipe_swaps?.length > 0) {
    const section = el('div', { className: 'alternatives-section' });
    section.appendChild(el('div', { className: 'alternatives-title' }, t('recipeSwaps')));
    const list = el('div', { className: 'supermarket-list' });
    for (const swap of item.recipe_swaps) {
      const swapItem = el('div', { className: 'supermarket-item' });
      swapItem.appendChild(el('span', { className: 'supermarket-name' }, `${swap.original} → ${swap.swap}`));
      if (swap.note) swapItem.appendChild(el('span', { className: 'supermarket-reason' }, swap.note));
      list.appendChild(swapItem);
    }
    section.appendChild(list);
    content.appendChild(section);
  }

  // Supermarket suggestions
  if (item.supermarket_suggestions?.length > 0) {
    const section = el('div', { className: 'expandable' });
    const toggle = el('button', { className: 'expandable-toggle' });
    toggle.innerHTML = `${t('supermarketTips')} <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>`;
    const expandContent = el('div', { className: 'expandable-content hidden' });

    const list = el('div', { className: 'supermarket-list' });
    for (const sm of item.supermarket_suggestions) {
      const smItem = el('div', { className: 'supermarket-item' });
      smItem.appendChild(el('span', { className: 'supermarket-name' }, sm.store));
      const details = sm.products || sm.reason || '';
      if (details) smItem.appendChild(el('span', { className: 'supermarket-reason' }, details));
      list.appendChild(smItem);
    }
    expandContent.appendChild(list);
    section.appendChild(toggle);
    section.appendChild(expandContent);

    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      expandContent.classList.toggle('hidden');
    });

    content.appendChild(section);
  }

  // Disclaimer
  if (item.disclaimer) {
    content.appendChild(el('div', { className: 'result-disclaimer' }, item.disclaimer));
  }

  // Action buttons
  const footer = el('div', { className: 'card-footer' });
  const favId = item.id || item.name || crypto.randomUUID();
  const isFav = isFavorite(favId);

  const favBtn = el('button', { className: `btn btn-sm ${isFav ? 'btn-primary' : 'btn-secondary'}` },
    isFav ? t('removeFavorite') : t('addFavorite')
  );
  favBtn.addEventListener('click', () => {
    if (isFavorite(favId)) {
      removeFavorite(favId);
      favBtn.textContent = t('addFavorite');
      favBtn.className = 'btn btn-sm btn-secondary';
      showToast(t('deleted'), 'info');
    } else {
      addFavorite({ id: favId, ...item, savedAt: Date.now() });
      favBtn.textContent = t('removeFavorite');
      favBtn.className = 'btn btn-sm btn-primary';
      showToast(t('saved'), 'success');
    }
  });

  const chatBtn = el('button', { className: 'btn btn-sm btn-ghost' }, t('askInChat'));
  chatBtn.addEventListener('click', () => {
    navigate('chat', { context: item.name || item.query || '' });
  });

  const copyBtn = el('button', { className: 'btn btn-sm btn-ghost' }, t('copyResult'));
  copyBtn.addEventListener('click', () => {
    const text = `${item.name}: ${item.explanation || item.summary || ''}`;
    navigator.clipboard.writeText(text).then(() => showToast(t('copied'), 'success'));
  });

  footer.appendChild(favBtn);
  footer.appendChild(chatBtn);
  footer.appendChild(copyBtn);
  content.appendChild(footer);

  card.appendChild(content);
  container.appendChild(card);
  return card;
}

function renderAlternatives(container, title, alternatives) {
  if (!alternatives?.length) return;
  const section = el('div', { className: 'alternatives-section' });
  section.appendChild(el('div', { className: 'alternatives-title' }, title));
  const list = el('div', { className: 'alternatives-list' });
  for (const alt of alternatives) {
    const name = typeof alt === 'string' ? alt : alt.name;
    const status = typeof alt === 'string' ? 'green' : alt.status || 'green';
    const dotClass = status === 'green' ? 'badge-dot-green' : status === 'yellow' ? 'badge-dot-yellow' : 'badge-dot-red';
    const chip = el('span', { className: 'alt-chip' },
      el('span', { className: `badge-dot ${dotClass}` }),
      name
    );
    chip.addEventListener('click', () => {
      navigate('analyze', { q: name });
    });
    list.appendChild(chip);
  }
  section.appendChild(list);
  container.appendChild(section);
}

// Render full analysis result (potentially multiple items)
export function renderAnalysisResult(container, data) {
  container.textContent = '';

  if (!data) return;

  // If structured data with items array
  if (data.structured?.items?.length) {
    for (const item of data.structured.items) {
      renderResultCard(container, item);
    }
    return;
  }

  // If structured data as single item
  if (data.structured) {
    renderResultCard(container, data.structured);
    return;
  }

  // Fallback: chat response as text
  if (data.chatResponse) {
    const bubble = el('div', { className: 'chat-bubble chat-bubble-assistant' });
    bubble.textContent = data.chatResponse;
    container.appendChild(bubble);
  }
}
