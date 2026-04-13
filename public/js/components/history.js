// History component
import { t } from '../i18n.js';
import { el, clearEl, formatDate, debounce, showToast } from '../utils/dom.js';
import { getHistory, removeHistory, clearHistory, searchHistory } from '../storage.js';
import { navigate } from '../router.js';

export function render(container) {
  clearEl(container);
  const wrapper = el('div');

  wrapper.appendChild(el('h2', { className: 'section-title mb-md', style: 'text-transform:none;font-size:1.1rem;' }, t('historyTitle')));

  // Search
  const searchInput = el('input', { type: 'search', placeholder: t('historySearch'), className: 'mb-md' });
  wrapper.appendChild(searchInput);

  // Filter tabs
  const tabs = el('div', { className: 'tabs' });
  const filters = [
    { key: 'historyAll', value: null },
    { key: 'historyFoods', value: 'food' },
    { key: 'historyRecipes', value: 'recipe' },
    { key: 'historyImages', value: 'image' },
  ];

  let activeFilter = null;
  for (const f of filters) {
    const tab = el('button', { className: `tab ${f.value === null ? 'active' : ''}` }, t(f.key));
    tab.addEventListener('click', () => {
      activeFilter = f.value;
      tabs.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderList();
    });
    tabs.appendChild(tab);
  }
  wrapper.appendChild(tabs);

  // List container
  const listEl = el('div', { id: 'history-list' });
  wrapper.appendChild(listEl);

  // Clear button
  const clearBtn = el('button', { className: 'btn btn-ghost btn-sm mt-lg', style: 'color:var(--error);' }, t('historyClear'));
  clearBtn.addEventListener('click', () => {
    if (confirm(t('historyClearConfirm'))) {
      clearHistory();
      renderList();
      showToast(t('deleted'), 'info');
    }
  });
  wrapper.appendChild(clearBtn);

  container.appendChild(wrapper);

  // Render list
  function renderList() {
    clearEl(listEl);
    let items = searchInput.value.trim() ? searchHistory(searchInput.value.trim()) : getHistory();
    if (activeFilter) items = items.filter(e => e.type === activeFilter);

    if (items.length === 0) {
      listEl.appendChild(el('div', { className: 'empty-state' },
        el('p', { className: 'empty-state-title' }, t('historyEmpty')),
        el('p', { className: 'empty-state-text' }, t('historyEmptyText'))
      ));
      return;
    }

    for (const entry of items) {
      const statusColor = entry.status === 'green' ? 'badge-dot-green' : entry.status === 'yellow' ? 'badge-dot-yellow' : entry.status === 'red' ? 'badge-dot-red' : '';
      const item = el('div', { className: 'history-item' });
      if (statusColor) item.appendChild(el('span', { className: `badge-dot ${statusColor}`, style: 'flex-shrink:0;' }));

      const content = el('div', { className: 'history-item-content' });
      content.appendChild(el('div', { className: 'history-item-title' }, entry.title || entry.query));
      content.appendChild(el('div', { className: 'history-item-meta' }, `${entry.type || '—'} · ${formatDate(entry.timestamp)}`));
      item.appendChild(content);

      const delBtn = el('button', { className: 'btn-icon', title: t('delete') });
      delBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeHistory(entry.id);
        renderList();
      });
      item.appendChild(delBtn);

      item.addEventListener('click', () => navigate('analyze', { q: entry.query }));
      listEl.appendChild(item);
    }
  }

  searchInput.addEventListener('input', debounce(renderList, 200));
  renderList();
}
