// Storage abstraction factory
// V1: JSON file adapter. V2: swap to DB adapter.
import { JsonStorage } from './storage-json.js';

let instance = null;

export function getStorage() {
  if (!instance) {
    instance = new JsonStorage();
  }
  return instance;
}
