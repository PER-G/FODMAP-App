// Settings component
import { t, getLang, setLang } from '../i18n.js';
import { el, clearEl, showToast } from '../utils/dom.js';
import { exportHistoryAsJSON } from '../storage.js';

export function render(container) {
  clearEl(container);
  const wrapper = el('div');

  wrapper.appendChild(el('h2', { className: 'section-title mb-lg', style: 'text-transform:none;font-size:1.1rem;' }, t('settingsTitle')));

  // Language
  const langCard = el('div', { className: 'card mb-md' });
  langCard.appendChild(el('div', { className: 'card-title mb-sm' }, t('settingsLanguage')));
  const langRow = el('div', { className: 'flex gap-sm' });

  const deBtn = el('button', { className: `btn btn-sm ${getLang() === 'de' ? 'btn-primary' : 'btn-secondary'}` }, 'Deutsch');
  const enBtn = el('button', { className: `btn btn-sm ${getLang() === 'en' ? 'btn-primary' : 'btn-secondary'}` }, 'English');

  deBtn.addEventListener('click', () => {
    setLang('de');
    render(container);
  });
  enBtn.addEventListener('click', () => {
    setLang('en');
    render(container);
  });

  langRow.appendChild(deBtn);
  langRow.appendChild(enBtn);
  langCard.appendChild(langRow);
  wrapper.appendChild(langCard);

  // Export
  const exportCard = el('div', { className: 'card mb-md' });
  exportCard.appendChild(el('div', { className: 'card-title mb-sm' }, t('settingsExport')));
  const exportBtn = el('button', { className: 'btn btn-secondary btn-sm' }, t('settingsExportHistory'));
  exportBtn.addEventListener('click', () => {
    exportHistoryAsJSON();
    showToast(t('saved'), 'success');
  });
  exportCard.appendChild(exportBtn);
  wrapper.appendChild(exportCard);

  container.appendChild(wrapper);
}
