import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { exportResultsToCsv } from '../utils/csvExport';
import { filterResults, debounce, highlightJsonText } from '../utils/search-utils';
import CodeGenerator from './CodeGenerator';

interface ResultsDisplayProps {
  results: unknown[] | null;
  isExecuting: boolean;
  error: string | null;
  executionTime: number | null;
  query: string;
  data?: unknown;
}

const ResultsDisplay = ({ results, isExecuting, error, executionTime, query, data }: ResultsDisplayProps) => {
  const [viewMode, setViewMode] = useState<'pretty' | 'compact'>('pretty');
  const [maxResults, setMaxResults] = useState(100);
  const [showCodeGenerator, setShowCodeGenerator] = useState(false);

  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Debounced search handler
  const debouncedSearch = useMemo(
    () =>
      debounce((term: string) => {
        setDebouncedSearchTerm(term);
        setIsSearching(false);
      }, 300),
    []
  );

  // Handle search term changes with debouncing
  useEffect(() => {
    if (searchTerm) {
      setIsSearching(true);
      debouncedSearch(searchTerm);
    } else {
      setDebouncedSearchTerm('');
      setIsSearching(false);
    }
  }, [searchTerm, debouncedSearch]);

  // Clear search when results change
  useEffect(() => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
  }, [results]);

  // Filter results based on search
  const filteredResults = useMemo(() => {
    if (!results || !debouncedSearchTerm) {
      return results;
    }

    return filterResults(results, debouncedSearchTerm, caseSensitive);
  }, [results, debouncedSearchTerm, caseSensitive]);

  // Format results with highlighting
  const formattedResults = useMemo(() => {
    if (!filteredResults) return '';

    const displayResults = filteredResults.slice(0, maxResults);
    const indent = viewMode === 'pretty' ? 2 : 0;
    const jsonText = JSON.stringify(displayResults, null, indent);

    // Apply highlighting if there's a search term
    if (debouncedSearchTerm) {
      return highlightJsonText(jsonText, debouncedSearchTerm, caseSensitive);
    }

    return jsonText;
  }, [filteredResults, viewMode, maxResults, debouncedSearchTerm, caseSensitive]);

  const resultStats = useMemo(() => {
    if (!results) return null;

    const total = results.length;
    const filtered = filteredResults?.length || 0;
    const displayed = Math.min(filtered, maxResults);
    const types = new Map<string, number>();

    const resultsToAnalyze = filteredResults || results;
    resultsToAnalyze.slice(0, maxResults).forEach((item) => {
      const type = Array.isArray(item) ? 'array' : typeof item;
      types.set(type, (types.get(type) || 0) + 1);
    });

    return { total, filtered, displayed, types, isFiltered: debouncedSearchTerm !== '' };
  }, [results, filteredResults, maxResults, debouncedSearchTerm]);

  const copyToClipboard = async () => {
    try {
      const textToCopy = filteredResults
        ? JSON.stringify(
            filteredResults.slice(0, maxResults),
            null,
            viewMode === 'pretty' ? 2 : 0
          )
        : formattedResults;
      await navigator.clipboard.writeText(textToCopy);
      console.log('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadResults = () => {
    const dataToDownload = filteredResults || results;
    const jsonText = JSON.stringify(
      dataToDownload?.slice(0, maxResults),
      null,
      viewMode === 'pretty' ? 2 : 0
    );
    const blob = new Blob([jsonText], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jsonpathx-results-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    const dataToExport = filteredResults || results;
    if (!dataToExport || dataToExport.length === 0) {
      console.warn('No results to export');
      return;
    }

    try {
      exportResultsToCsv(dataToExport, {
        filename: `jsonpathx-results-${Date.now()}.csv`,
        maxDepth: 5,
        includeRowNumbers: true,
      });
    } catch (err) {
      console.error('Failed to export CSV:', err);
    }
  };

  const handleClearSearch = useCallback(() => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);

  const toggleCaseSensitive = useCallback(() => {
    setCaseSensitive((prev) => !prev);
  }, []);

  return (
    <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-300 dark:border-gray-700 shadow-xl transition-colors duration-300">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 p-4 transition-colors duration-300">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center transition-colors duration-300">
            <span className="mr-2">📊</span>
            Query Results
          </h2>

          {/* Controls */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode(viewMode === 'pretty' ? 'compact' : 'pretty')}
              className="px-3 py-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white text-xs rounded transition-colors"
              title={viewMode === 'pretty' ? 'Switch to compact view' : 'Switch to pretty view'}
            >
              {viewMode === 'pretty' ? '{ }' : '≡'}
            </button>
            <button
              onClick={copyToClipboard}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors"
              title="Copy to clipboard"
              disabled={!results || results.length === 0}
            >
              📋 Copy
            </button>
            <button
              onClick={downloadResults}
              className="px-3 py-1 bg-green-600 hover:bg-green-500 text-white text-xs rounded transition-colors"
              title="Download as JSON"
              disabled={!results || results.length === 0}
            >
              ⬇️ JSON
            </button>
            <button
              onClick={exportCsv}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-xs rounded transition-colors"
              title="Export as CSV"
              disabled={!results || results.length === 0}
            >
              📊 CSV
            </button>
            <button
              onClick={() => setShowCodeGenerator(true)}
              className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded transition-colors"
              title="Generate code in multiple languages"
              disabled={!results || results.length === 0}
            >
              💻 Code
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {results && results.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Search within results... (recursive full-text search)"
                  className="w-full px-3 py-2 pl-10 pr-10 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-sm rounded border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 dark:placeholder-gray-400 transition-colors duration-300"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 transition-colors duration-300">
                  {isSearching ? (
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  ) : (
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
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  )}
                </div>
                {searchTerm && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                    title="Clear search"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* Case Sensitive Toggle */}
              <button
                onClick={toggleCaseSensitive}
                className={`px-3 py-2 text-xs font-mono rounded transition-colors ${
                  caseSensitive
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
                title={caseSensitive ? 'Case sensitive ON' : 'Case sensitive OFF'}
              >
                Aa
              </button>
            </div>

            {/* Search Results Counter */}
            {debouncedSearchTerm && resultStats && (
              <div className="mt-2 flex items-center text-xs">
                <span className="text-gray-600 dark:text-gray-400 transition-colors duration-300">Search Results:</span>
                <span className="ml-2 font-semibold text-blue-600 dark:text-blue-400 transition-colors duration-300">
                  {resultStats.filtered} of {resultStats.total}
                </span>
                {resultStats.filtered === 0 && (
                  <span className="ml-2 text-yellow-600 dark:text-yellow-400 transition-colors duration-300">No matches found</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        {resultStats && (
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center">
              <span className="text-gray-600 dark:text-gray-400 mr-2 transition-colors duration-300">
                {resultStats.isFiltered ? 'Filtered:' : 'Total Results:'}
              </span>
              <span className="font-semibold text-blue-600 dark:text-blue-400 transition-colors duration-300">
                {resultStats.isFiltered
                  ? `${resultStats.filtered.toLocaleString()} / ${resultStats.total.toLocaleString()}`
                  : resultStats.total.toLocaleString()}
              </span>
            </div>
            {resultStats.filtered > maxResults && (
              <div className="flex items-center">
                <span className="text-gray-600 dark:text-gray-400 mr-2 transition-colors duration-300">Showing:</span>
                <span className="font-semibold text-yellow-600 dark:text-yellow-400 transition-colors duration-300">
                  {resultStats.displayed.toLocaleString()}
                </span>
              </div>
            )}
            {executionTime !== null && (
              <div className="flex items-center">
                <span className="text-gray-600 dark:text-gray-400 mr-2 transition-colors duration-300">Time:</span>
                <span className="font-semibold text-green-600 dark:text-green-400 transition-colors duration-300">{executionTime.toFixed(2)}ms</span>
              </div>
            )}
          </div>
        )}

        {/* Type Distribution */}
        {resultStats && resultStats.types.size > 0 && (
          <div className="mt-2 flex items-center space-x-4 text-xs">
            <span className="text-gray-600 dark:text-gray-400 transition-colors duration-300">Types:</span>
            {Array.from(resultStats.types.entries()).map(([type, count]) => (
              <span key={type} className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded transition-colors duration-300">
                <span className="text-gray-700 dark:text-gray-300 transition-colors duration-300">{type}</span>
                <span className="text-gray-500 ml-1">({count})</span>
              </span>
            ))}
          </div>
        )}

        {/* Max Results Selector */}
        {results && results.length > 100 && (
          <div className="mt-3 flex items-center space-x-2">
            <label className="text-xs text-gray-600 dark:text-gray-400 transition-colors duration-300">Display limit:</label>
            <select
              value={maxResults}
              onChange={(e) => setMaxResults(Number(e.target.value))}
              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white text-xs rounded border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-300"
            >
              <option value={10}>10</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={500}>500</option>
              <option value={1000}>1,000</option>
              <option value={5000}>5,000</option>
            </select>
          </div>
        )}
      </div>

      {/* Results Container */}
      <div className="p-4">
        {isExecuting ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-600 dark:text-gray-400 transition-colors duration-300">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
            <p className="text-sm">Executing query...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-500/50 rounded-lg p-6 text-center transition-colors duration-300">
            <div className="text-4xl mb-3">⚠️</div>
            <div className="text-red-700 dark:text-red-400 font-semibold mb-2 transition-colors duration-300">Query Error</div>
            <div className="text-red-600 dark:text-red-300 text-sm font-mono transition-colors duration-300">{error}</div>
          </div>
        ) : !results ? (
          <div className="text-center py-16 text-gray-600 dark:text-gray-400 transition-colors duration-300">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-sm">Enter a JSONPath query to see results</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16 text-gray-600 dark:text-gray-400 transition-colors duration-300">
            <div className="text-4xl mb-3">∅</div>
            <p className="text-sm">No results found for query:</p>
            <code className="text-xs bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded mt-2 inline-block font-mono transition-colors duration-300">
              {query}
            </code>
          </div>
        ) : filteredResults && filteredResults.length === 0 ? (
          <div className="text-center py-16 text-gray-600 dark:text-gray-400 transition-colors duration-300">
            <div className="text-4xl mb-3">🔎</div>
            <p className="text-sm">No results match your search:</p>
            <code className="text-xs bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded mt-2 inline-block font-mono transition-colors duration-300">
              {debouncedSearchTerm}
            </code>
            <button
              onClick={handleClearSearch}
              className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="relative">
            <style>
              {`
                .search-highlight {
                  background-color: rgb(250, 204, 21);
                  color: rgb(17, 24, 39);
                  font-weight: 600;
                  padding: 0 2px;
                  border-radius: 2px;
                }
                .dark .search-highlight {
                  background-color: rgb(250, 204, 21);
                  color: rgb(17, 24, 39);
                }
              `}
            </style>
            <pre className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 overflow-x-auto text-sm text-gray-900 dark:text-gray-300 font-mono max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-700 scrollbar-track-gray-200 dark:scrollbar-track-gray-900 transition-colors duration-300">
              {debouncedSearchTerm ? (
                <code dangerouslySetInnerHTML={{ __html: formattedResults }} />
              ) : (
                <code>{formattedResults}</code>
              )}
            </pre>

            {filteredResults && filteredResults.length > maxResults && (
              <div className="mt-4 p-3 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-400 dark:border-yellow-500/30 rounded-lg text-center transition-colors duration-300">
                <span className="text-yellow-800 dark:text-yellow-400 text-sm transition-colors duration-300">
                  ⚠️ Showing {maxResults.toLocaleString()} of{' '}
                  {filteredResults.length.toLocaleString()} results. Increase the display limit to
                  see more.
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Code Generator Modal */}
      {showCodeGenerator && data !== null && data !== undefined && (
        <CodeGenerator
          query={query}
          data={data}
          results={results}
          onClose={() => setShowCodeGenerator(false)}
        />
      )}
    </div>
  );
};

export default ResultsDisplay;
