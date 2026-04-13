// JSON file-based storage adapter (V1)
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', '..', 'data');

// Cache loaded data in module scope (persists within a warm function)
const cache = new Map();

function loadJSON(filename) {
  if (cache.has(filename)) return cache.get(filename);
  try {
    const data = JSON.parse(readFileSync(join(DATA_DIR, filename), 'utf-8'));
    cache.set(filename, data);
    return data;
  } catch (e) {
    console.warn(`Failed to load ${filename}:`, e.message);
    return null;
  }
}

export class JsonStorage {
  async getFoods({ query, category, rating, limit = 50, offset = 0 } = {}) {
    let foods = loadJSON('foods.json') || [];

    if (query) {
      const q = query.toLowerCase();
      foods = foods.filter(f =>
        f.name.toLowerCase().includes(q) ||
        (f.nameEn || '').toLowerCase().includes(q) ||
        (f.aliases || []).some(a => a.toLowerCase().includes(q)) ||
        (f.category || '').toLowerCase().includes(q)
      );
    }
    if (category) {
      foods = foods.filter(f => f.category === category);
    }
    if (rating) {
      foods = foods.filter(f => f.fodmapRating === rating);
    }

    const total = foods.length;
    const items = foods.slice(offset, offset + limit);
    return { items, total };
  }

  async getFood(id) {
    const foods = loadJSON('foods.json') || [];
    return foods.find(f => f.id === id) || null;
  }

  async searchFoods(query) {
    const { items } = await this.getFoods({ query, limit: 20 });
    return items;
  }

  async getRecipes({ query, category, limit = 30, offset = 0 } = {}) {
    let recipes = loadJSON('recipes.json') || [];

    if (query) {
      const q = query.toLowerCase();
      recipes = recipes.filter(r =>
        r.name.toLowerCase().includes(q) ||
        (r.tags || []).some(t => t.toLowerCase().includes(q))
      );
    }
    if (category) {
      recipes = recipes.filter(r => r.mealType === category);
    }

    const total = recipes.length;
    const items = recipes.slice(offset, offset + limit);
    return { items, total };
  }

  async getRecipe(id) {
    const recipes = loadJSON('recipes.json') || [];
    return recipes.find(r => r.id === id) || null;
  }

  async getSupermarketSuggestions(category) {
    const data = loadJSON('supermarkets.json') || {};
    if (!category) return data;
    return data.chains || [];
  }

  async getCategories() {
    return loadJSON('categories.json') || {};
  }

  // Build context string from seed data for Claude prompt enrichment
  async buildSeedContext(query) {
    const matches = await this.searchFoods(query);
    if (matches.length === 0) return '';

    return matches.slice(0, 5).map(f => {
      return `[${f.name}] Status: ${f.fodmapRating}, Kategorie: ${f.category}, Hinweis: ${f.portionNote || '-'}, Alternativen: ${(f.alternatives || []).join(', ') || '-'}`;
    }).join('\n');
  }

  // Growth system: log candidate (V1: console only)
  async addCandidate(candidate) {
    console.log('[CANDIDATE]', JSON.stringify(candidate));
    return { id: crypto.randomUUID(), ...candidate, status: 'pending' };
  }
}
