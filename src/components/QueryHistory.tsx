import { useState, useMemo } from 'react';
import { QueryHistoryItem } from '../utils/storage';

interface QueryHistoryProps {
  history: QueryHistoryItem[];
  favorites: QueryHistoryItem[];
  onQuerySelect: (query: string) => void;
  onToggleFavorite: (id: string) => void;
  onClearHistory: () => void;
  onRemoveQuery: (id: string) => void;
  isFavorite: (id: string) => boolean;
  currentQuery: string;
}

/**
 * Format timestamp as time ago (e.g., "2 minutes ago")
 */
function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
  }
  if (seconds < 86400) {
    const hours = Math.floor(seconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  }
  const days = Math.floor(seconds / 86400);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
}

const QueryHistory = ({
  history,
  favorites,
  onQuerySelect,
  onToggleFavorite,
  onClearHistory,
  onRemoveQuery,
  isFavorite,
  currentQuery,
}: QueryHistoryProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');

  // Filter history based on search term
  const filteredHistory = useMemo(() => {
    const items = activeTab === 'all' ? history : favorites;

    if (!searchTerm.trim()) return items;

    const lowerSearch = searchTerm.toLowerCase();
    return items.filter((item) => item.query.toLowerCase().includes(lowerSearch));
  }, [history, favorites, searchTerm, activeTab]);

  const handleClearHistory = () => {
    if (window.confirm('Are you sure you want to clear all query history?')) {
      onClearHistory();
      setSearchTerm('');
    }
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-300 dark:border-gray-700 p-6 shadow-xl transition-colors duration-300">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center transition-colors duration-300">
          <span className="mr-2">⏱️</span>
          Query History
        </h2>
        {history.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="text-xs text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors px-2 py-1 rounded hover:bg-red-100 dark:hover:bg-red-900/20"
            title="Clear all history"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 mb-4">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          All ({history.length})
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'favorites'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-200 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
          }`}
        >
          Favorites ({favorites.length})
        </button>
      </div>

      {/* Search Input */}
      <div className="mb-4">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search queries..."
            className="w-full px-4 py-2 pl-10 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-300"
          />
          <svg
            className="absolute left-3 top-2.5 h-5 w-5 text-gray-500 dark:text-gray-400 transition-colors duration-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-gray-600 dark:text-gray-400 transition-colors duration-300">
            {searchTerm ? (
              <div>
                <div className="text-2xl mb-2">🔍</div>
                <p>No queries match your search</p>
              </div>
            ) : activeTab === 'favorites' ? (
              <div>
                <div className="text-2xl mb-2">⭐</div>
                <p>No favorite queries yet</p>
                <p className="text-xs mt-1">Star queries to save them here</p>
              </div>
            ) : (
              <div>
                <div className="text-2xl mb-2">📝</div>
                <p>No query history yet</p>
                <p className="text-xs mt-1">Execute a query to start tracking</p>
              </div>
            )}
          </div>
        ) : (
          filteredHistory.map((item) => {
            const isActive = currentQuery === item.query;
            const isFav = isFavorite(item.id);

            return (
              <div
                key={item.id}
                className={`group relative p-3 rounded-lg border transition-all ${
                  isActive
                    ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-400 dark:border-blue-500/50'
                    : 'bg-gray-100 dark:bg-gray-700/30 border-gray-300 dark:border-gray-600/50 hover:bg-gray-200 dark:hover:bg-gray-700/50'
                }`}
              >
                {/* Query Text */}
                <div className="flex items-start justify-between mb-2">
                  <button
                    onClick={() => onQuerySelect(item.query)}
                    className="flex-1 text-left"
                    title="Click to use this query"
                  >
                    <code className="text-sm font-mono text-blue-700 dark:text-blue-300 break-all transition-colors duration-300">
                      {item.query}
                    </code>
                  </button>

                  {/* Favorite Toggle */}
                  <button
                    onClick={() => onToggleFavorite(item.id)}
                    className={`ml-2 flex-shrink-0 transition-colors ${
                      isFav
                        ? 'text-yellow-500 dark:text-yellow-400 hover:text-yellow-600 dark:hover:text-yellow-300'
                        : 'text-gray-400 dark:text-gray-500 hover:text-yellow-500 dark:hover:text-yellow-400'
                    }`}
                    title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {isFav ? '⭐' : '☆'}
                  </button>
                </div>

                {/* Metadata */}
                <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 transition-colors duration-300">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center">
                      <svg
                        className="w-3 h-3 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {formatTimeAgo(item.timestamp)}
                    </span>

                    {item.executionTime !== undefined && (
                      <span className="text-green-600 dark:text-green-400 transition-colors duration-300">
                        {item.executionTime.toFixed(2)}ms
                      </span>
                    )}

                    {item.resultCount !== undefined && (
                      <span className="text-blue-600 dark:text-blue-400 transition-colors duration-300">
                        {item.resultCount} result{item.resultCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onQuerySelect(item.query)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                      title="Run this query"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </button>

                    <button
                      onClick={() => onRemoveQuery(item.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                      title="Remove from history"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute top-3 right-3">
                    <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                      Active
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Help Text */}
      {history.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <div className="text-xs text-gray-600 dark:text-gray-400 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <span>
                Showing {filteredHistory.length} of {activeTab === 'all' ? history.length : favorites.length}
              </span>
              <span className="text-gray-500 transition-colors duration-300">
                Max {history.length >= 50 ? '50' : history.length}/50 queries stored
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueryHistory;
