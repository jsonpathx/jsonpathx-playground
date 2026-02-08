/**
 * Local storage utility functions with type safety and error handling
 */

const STORAGE_KEYS = {
  QUERY_HISTORY: 'jsonpathx_query_history',
  FAVORITES: 'jsonpathx_favorites',
} as const;

export interface QueryHistoryItem {
  id: string;
  query: string;
  timestamp: number;
  executionTime?: number;
  resultCount?: number;
  isFavorite?: boolean;
}

/**
 * Get query history from localStorage
 */
export function getQueryHistory(): QueryHistoryItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.QUERY_HISTORY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error reading query history from localStorage:', error);
    return [];
  }
}

/**
 * Save query history to localStorage
 */
export function saveQueryHistory(history: QueryHistoryItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.QUERY_HISTORY, JSON.stringify(history));
  } catch (error) {
    console.error('Error saving query history to localStorage:', error);
  }
}

/**
 * Get favorite query IDs from localStorage
 */
export function getFavorites(): Set<string> {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.FAVORITES);
    if (!stored) return new Set();

    const parsed = JSON.parse(stored);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch (error) {
    console.error('Error reading favorites from localStorage:', error);
    return new Set();
  }
}

/**
 * Save favorite query IDs to localStorage
 */
export function saveFavorites(favorites: Set<string>): void {
  try {
    localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(Array.from(favorites)));
  } catch (error) {
    console.error('Error saving favorites to localStorage:', error);
  }
}

/**
 * Clear all query history
 */
export function clearQueryHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.QUERY_HISTORY);
  } catch (error) {
    console.error('Error clearing query history:', error);
  }
}

/**
 * Clear all favorites
 */
export function clearFavorites(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.FAVORITES);
  } catch (error) {
    console.error('Error clearing favorites:', error);
  }
}

/**
 * Generate a unique ID for a query history item
 */
export function generateQueryId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
