// Recipes component — recipe analysis + browse
import { t, getLang } from '../i18n.js';
import { el, clearEl, renderSkeleton, showToast } from '../utils/dom.js';
import { api } from '../api-client.js';
import { renderAnalysisResult } from './result-card.js';
import { navigate } from '../router.js';

export function render(container) {
  clearEl(container);
  const wrapper = el('div');

  wrapper.appendChild(el('h2', { className: 'section-title mb-md', style: 'text-transform:none;font-size:1.1rem;' }, t('recipesTitle')));

  // Tabs
  const tabs = el('div', { className: 'tabs' });
  const analyzeTab = el('button', { className: 'tab active' }, t('recipeAnalyze'));
  const genTab = el('button', { className: 'tab' }, t('recipeGenerate'));
  tabs.appendChild(analyzeTab);
  tabs.appendChild(genTab);
  wrapper.appendChild(tabs);

  const content = el('div', { className: 'mt-md' });
  wrapper.appendChild(content);
  container.appendChild(wrapper);

  analyzeTab.addEventListener('click', () => {
    analyzeTab.classList.add('active');
    genTab.classList.remove('active');
    renderAnalyzeView(content);
  });

  genTab.addEventListener('click', () => {
    genTab.classList.add('active');
    analyzeTab.classList.remove('active');
    navigate('mealgen');
  });

  renderAnalyzeView(content);
}

function renderAnalyzeView(container) {
  clearEl(container);

  const textarea = el('textarea', {
    placeholder: t('recipeAnalyzePlaceholder'),
    rows: '6',
    style: 'resize:vertical;',
    id: 'recipe-input',
  });
  container.appendChild(textarea);

  const btn = el('button', { className: 'btn btn-primary btn-full mt-md' }, t('recipeCheck'));
  container.appendChild(btn);

  const results = el('div', { className: 'mt-md', id: 'recipe-results' });
  container.appendChild(results);

  btn.addEventListener('click', async () => {
    const text = textarea.value.trim();
    if (!text) return;

    clearEl(results);
    renderSkeleton(results, 2);
    btn.disabled = true;

    try {
      const result = await api('recipe-analyze', {
        method: 'POST',
        body: { ingredients: text, lang: getLang() },
        timeout: 30000,
      });
      clearEl(results);
      renderAnalysisResult(results, result);
    } catch (err) {
      clearEl(results);
      results.appendChild(el('p', { className: 'text-sm', style: 'color:var(--error);' }, t('analyzeError')));
    } finally {
      btn.disabled = false;
    }
  });
}
