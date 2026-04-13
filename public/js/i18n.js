// i18n — Sprach-System (DE/EN)
import { de } from './i18n/de.js';
import { en } from './i18n/en.js';

const translations = { de, en };
let currentLang = localStorage.getItem('fodmap-lang') || 'de';
const listeners = new Set();

export function t(key) {
  const val = translations[currentLang]?.[key] ?? translations.de[key] ?? key;
  return val;
}

export function getLang() {
  return currentLang;
}

export function setLang(lang) {
  if (!translations[lang]) return;
  currentLang = lang;
  localStorage.setItem('fodmap-lang', lang);
  document.documentElement.lang = lang;
  updateDom();
  listeners.forEach(fn => fn(lang));
}

export function toggleLang() {
  setLang(currentLang === 'de' ? 'en' : 'de');
}

export function onLangChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function updateDom() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const text = t(key);
    if (el.placeholder !== undefined && el.tagName === 'INPUT') {
      el.placeholder = text;
    } else {
      el.textContent = text;
    }
  });
  // Update lang toggle label
  const langLabel = document.getElementById('lang-label');
  if (langLabel) {
    langLabel.textContent = currentLang === 'de' ? 'EN' : 'DE';
  }
}
