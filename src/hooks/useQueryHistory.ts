import { useState, useCallback, useEffect } from 'react';
import {
  QueryHistoryItem,
  getQueryHistory,
  saveQueryHistory,
  getFavorites,
  saveFavorites,
  clearQueryHistory as clearStorageHistory,
  generateQueryId,
} from '../utils/storage';

const MAX_HISTORY_ITEMS = 50;

interface UseQueryHistoryResult {
  history: QueryHistoryItem[];
  favorites: QueryHistoryItem[];
  addQuery: (query: string, executionTime?: number, resultCount?: number) => void;
  toggleFavorite: (id: string) => void;
  clearHistory: () => void;
  removeQuery: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

/**
 * Custom hook for managing query history with localStorage persistence
 * Tracks last 50 queries with timestamps and favorite functionality
 */
export function useQueryHistory(): UseQueryHistoryResult {
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // Load history and favorites from localStorage on mount
  useEffect(() => {
    const loadedHistory = getQueryHistory();
    const loadedFavorites = getFavorites();
    setHistory(loadedHistory);
    setFavoriteIds(loadedFavorites);
  }, []);

  // Persist history to localStorage whenever it changes
  useEffect(() => {
    if (history.length > 0) {
      saveQueryHistory(history);
    }
  }, [history]);

  // Persist favorites to localStorage whenever they change
  useEffect(() => {
    if (favoriteIds.size > 0) {
      saveFavorites(favoriteIds);
    }
  }, [favoriteIds]);

  /**
   * Add a new query to history
   * Deduplicates consecutive identical queries and maintains max history size
   */
  const addQuery = useCallback((query: string, executionTime?: number, resultCount?: number) => {
    if (!query.trim()) return;

    setHistory((prevHistory) => {
      // Check if the last query is the same to avoid duplicates
      const lastQuery = prevHistory[0];
      if (lastQuery && lastQuery.query === query) {
        // Update the existing query with new execution data
        return [
          {
            ...lastQuery,
            timestamp: Date.now(),
            executionTime,
            resultCount,
          },
          ...prevHistory.slice(1),
        ];
      }

      // Create new query item
      const newItem: QueryHistoryItem = {
        id: generateQueryId(),
        query,
        timestamp: Date.now(),
        executionTime,
        resultCount,
      };

      // Add to beginning and limit to MAX_HISTORY_ITEMS
      return [newItem, ...prevHistory].slice(0, MAX_HISTORY_ITEMS);
    });
  }, []);

  /**
   * Toggle favorite status for a query
   */
  const toggleFavorite = useCallback((id: string) => {
    setFavoriteIds((prevFavorites) => {
      const newFavorites = new Set(prevFavorites);
      if (newFavorites.has(id)) {
        newFavorites.delete(id);
      } else {
        newFavorites.add(id);
      }
      saveFavorites(newFavorites);
      return newFavorites;
    });
  }, []);

  /**
   * Check if a query is favorited
   */
  const isFavorite = useCallback(
    (id: string): boolean => {
      return favoriteIds.has(id);
    },
    [favoriteIds]
  );

  /**
   * Clear all query history
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
    clearStorageHistory();
  }, []);

  /**
   * Remove a specific query from history
   */
  const removeQuery = useCallback((id: string) => {
    setHistory((prevHistory) => prevHistory.filter((item) => item.id !== id));
    setFavoriteIds((prevFavorites) => {
      const newFavorites = new Set(prevFavorites);
      newFavorites.delete(id);
      saveFavorites(newFavorites);
      return newFavorites;
    });
  }, []);

  /**
   * Get favorite queries
   */
  const favorites = history.filter((item) => favoriteIds.has(item.id));

  return {
    history,
    favorites,
    addQuery,
    toggleFavorite,
    clearHistory,
    removeQuery,
    isFavorite,
  };
}
