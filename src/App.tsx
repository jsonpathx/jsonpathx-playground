import { useState, useEffect, useCallback, useRef } from 'react';
import QueryEditor from './components/QueryEditor';
import ResultsDisplay from './components/ResultsDisplay';
import ExampleQueries from './components/ExampleQueries';
import QueryHistory from './components/QueryHistory';
import ThemeToggle from './components/ThemeToggle';
import KeyboardShortcutsHelp from './components/KeyboardShortcutsHelp';
import { PerformanceAnalytics } from './components/PerformanceAnalytics';
import FileUpload from './components/FileUpload';
import DatasetSelector from './components/DatasetSelector';
import DatasetManager from './components/DatasetManager';
import { useJsonPath } from './hooks/useJsonPath';
import { useUrlState } from './hooks/useUrlState';
import { useQueryHistory } from './hooks/useQueryHistory';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { usePerformanceAnalytics } from './hooks/usePerformanceAnalytics';
import { useTheme } from './hooks/useTheme';
import { useDatasetManager } from './hooks/useDatasetManager';
import { KeyboardShortcut } from './utils/keyboard-utils';

interface Car {
  [key: string]: unknown;
}

function App() {
  // Dataset management
  const {
    datasets,
    currentDataset,
    isLoading: datasetLoading,
    error: datasetError,
    addDataset,
    switchDataset,
    removeDataset,
    clearAllDatasets,
    loadDefaultDataset,
  } = useDatasetManager();

  const data = currentDataset?.data as Car[] | null;
  const loading = datasetLoading;
  const loadError = datasetError;

  // UI state for file upload and dataset management
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [showDatasetManager, setShowDatasetManager] = useState(false);

  // Use URL state for query persistence and sharing
  const { value: urlQuery, setValue: setUrlQuery, getShareableUrl } = useUrlState('$[0:10]');
  const [query, setQuery] = useState<string>('$[0:10]');

  const { results, error, isExecuting, executionTime, execute } = useJsonPath(data);

  // Query history management
  const queryHistory = useQueryHistory();
  const performanceAnalytics = usePerformanceAnalytics();

  // Theme management
  const { setTheme, resolvedTheme } = useTheme();

  // Keyboard shortcuts modal state
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  // History panel visibility state
  const [isHistoryVisible, setIsHistoryVisible] = useState(true);

  // Refs for scrolling to sections
  const examplesRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const queryEditorRef = useRef<HTMLDivElement>(null);

  // Sync URL query with local query state
  useEffect(() => {
    if (urlQuery !== null) {
      setQuery(urlQuery);
    }
  }, [urlQuery]);

  // Execute query when data or query changes
  useEffect(() => {
    if (data && query.trim()) {
      execute(query);
    }
  }, [data, query, execute]);

  // Add query to history after successful execution
  useEffect(() => {
    if (results !== null && !error && executionTime !== null && query.trim()) {
      const resultCount = Array.isArray(results) ? results.length : 1;
      queryHistory.addQuery(query, executionTime, resultCount);
      performanceAnalytics.addMetric(query, executionTime, resultCount);
    }
  }, [results, error, executionTime, query, queryHistory.addQuery, performanceAnalytics.addMetric]);

  const handleQueryChange = useCallback((newQuery: string) => {
    setQuery(newQuery);
    setUrlQuery(newQuery);
  }, [setUrlQuery]);

  const handleExampleClick = useCallback((exampleQuery: string) => {
    setQuery(exampleQuery);
    setUrlQuery(exampleQuery);
  }, [setUrlQuery]);

  const handleHistoryQuerySelect = useCallback((historyQuery: string) => {
    setQuery(historyQuery);
    setUrlQuery(historyQuery);
  }, [setUrlQuery]);

  // Dataset management handlers
  const handleFileLoaded = useCallback(async (name: string, fileData: unknown, size: number) => {
    await addDataset(name, fileData, size);
    setShowFileUpload(false);
  }, [addDataset]);

  const handleSwitchDataset = useCallback((id: string) => {
    switchDataset(id);
  }, [switchDataset]);

  const handleUploadClick = useCallback(() => {
    setShowFileUpload(true);
  }, []);

  const handleManageClick = useCallback(() => {
    setShowDatasetManager(true);
  }, []);

  // Keyboard shortcut handlers
  const handleExecuteQuery = useCallback(() => {
    if (data && query.trim()) {
      execute(query);
    }
  }, [data, query, execute]);

  const handleClearQuery = useCallback(() => {
    setQuery('');
    setUrlQuery('');
    const queryInput = document.getElementById('query-input') as HTMLTextAreaElement;
    if (queryInput) {
      queryInput.focus();
    }
  }, [setUrlQuery]);

  const handleFocusExamples = useCallback(() => {
    if (examplesRef.current) {
      examplesRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      const firstButton = examplesRef.current.querySelector('button');
      if (firstButton) {
        firstButton.focus();
      }
    }
  }, []);

  const handleToggleHistory = useCallback(() => {
    setIsHistoryVisible((prev) => !prev);
    if (!isHistoryVisible && historyRef.current) {
      setTimeout(() => {
        historyRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
  }, [isHistoryVisible]);

  const handleShowHelp = useCallback(() => {
    setShowShortcutsHelp(true);
  }, []);

  const handleShowAnalytics = useCallback(() => {
    setShowAnalytics(true);
  }, []);

  const handleCloseModals = useCallback(() => {
setShowShortcutsHelp(false);
    setShowAnalytics(false);
    setShowFileUpload(false);
    setShowDatasetManager(false);
  }, []);

  const handleToggleTheme = useCallback(() => {
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  }, [setTheme, resolvedTheme]);

  const handleOpenUpload = useCallback(() => {
    setShowFileUpload(true);
  }, []);

  // Define keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'Enter',
      description: 'Execute current query',
      requireModifier: true,
      action: handleExecuteQuery,
      category: 'Query Actions',
    },
    {
      key: 'k',
      description: 'Clear query input',
      requireModifier: true,
      action: handleClearQuery,
      category: 'Query Actions',
    },
    {
      key: 'e',
      description: 'Focus on example queries',
      requireModifier: true,
      action: handleFocusExamples,
      category: 'Navigation',
    },
    {
      key: 'h',
      description: 'Toggle query history',
      requireModifier: true,
      action: handleToggleHistory,
      category: 'Navigation',
    },
    {
      key: 'u',
      description: 'Upload custom dataset',
      requireModifier: true,
      action: handleOpenUpload,
      category: 'Data',
    },
    {
      key: '/',
      description: 'Show keyboard shortcuts help',
      requireModifier: true,
      action: handleShowHelp,
      category: 'Help',
    },
    {
      key: 'Escape',
      description: 'Close any open modals',
      requireModifier: false,
      action: handleCloseModals,
      category: 'Navigation',
    },
    {
      key: 'd',
      description: 'Toggle dark/light theme',
      requireModifier: true,
      action: handleToggleTheme,
      category: 'Appearance',
    },
    {
      key: 'p',
      description: 'Show performance analytics',
      requireModifier: true,
      action: handleShowAnalytics,
      category: 'Analytics',
    },
  ];

  // Register keyboard shortcuts
  useKeyboardShortcuts(shortcuts, {
    enabled: !loading && !loadError,
    preventDefault: true,
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 dark:from-gray-900 dark:via-blue-900 dark:to-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 transition-colors duration-300">Loading Dataset...</h2>
          <p className="text-gray-700 dark:text-gray-300 transition-colors duration-300">Please wait while we load the dataset</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50 to-gray-50 dark:from-gray-900 dark:via-red-900 dark:to-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
        <div className="bg-red-100 dark:bg-red-900/50 border border-red-400 dark:border-red-500 rounded-lg p-8 max-w-2xl transition-colors duration-300">
          <h2 className="text-2xl font-bold text-red-900 dark:text-white mb-4 transition-colors duration-300">Error Loading Data</h2>
          <p className="text-red-700 dark:text-red-200 mb-4 transition-colors duration-300">{loadError}</p>
          <p className="text-gray-700 dark:text-gray-300 text-sm transition-colors duration-300">
            Make sure the cars.json file is in the public directory or root of the project.
          </p>
          <button
            onClick={() => setShowFileUpload(true)}
            className="mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
          >
            Upload Your Own Dataset
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-50 dark:from-gray-900 dark:via-blue-900 dark:to-gray-900 transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/80 dark:bg-gray-900/50 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50 transition-colors duration-300">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1 transition-colors duration-300">
                JSONPathX <span className="text-blue-600 dark:text-blue-400 transition-colors duration-300">Interactive Demo</span>
              </h1>
              <p className="text-gray-700 dark:text-gray-300 text-sm transition-colors duration-300">
                Powerful JSONPath query engine for JavaScript
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {/* Dataset Selector */}
              <DatasetSelector
                datasets={datasets}
                currentDatasetId={currentDataset?.metadata.id}
                onSelectDataset={handleSwitchDataset}
                onUploadClick={handleUploadClick}
                onManageClick={handleManageClick}
              />

              <button
                onClick={() => setShowAnalytics(true)}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Performance Analytics (⌘+P)"
                aria-label="Show performance analytics"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setShowShortcutsHelp(true)}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Keyboard shortcuts (⌘+/)"
                aria-label="Show keyboard shortcuts"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Query Editor, Examples, and History */}
          <div className="lg:col-span-1 space-y-6">
            <div ref={queryEditorRef}>
              <QueryEditor
                query={query}
                onChange={handleQueryChange}
                isExecuting={isExecuting}
                executionTime={executionTime}
                error={error}
                getShareableUrl={getShareableUrl}
              />
            </div>
            {isHistoryVisible && (
              <div ref={historyRef}>
                <QueryHistory
                  history={queryHistory.history}
                  favorites={queryHistory.favorites}
                  onQuerySelect={handleHistoryQuerySelect}
                  onToggleFavorite={queryHistory.toggleFavorite}
                  onClearHistory={queryHistory.clearHistory}
                  onRemoveQuery={queryHistory.removeQuery}
                  isFavorite={queryHistory.isFavorite}
                  currentQuery={query}
                />
              </div>
            )}
            <div ref={examplesRef}>
              <ExampleQueries onExampleClick={handleExampleClick} currentQuery={query} />
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-2">
            <ResultsDisplay
              results={results}
              isExecuting={isExecuting}
              error={error}
              executionTime={executionTime}
              query={query}
              data={data}
            />
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <div className="text-center text-gray-600 dark:text-gray-400 text-sm transition-colors duration-300">
            <p className="mb-2">
              Built with{' '}
              <a
                href="https://github.com/afzal/jsonpathx"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                JSONPathX
              </a>
              {' '}— React + TypeScript + Vite
            </p>
            <p className="text-xs text-gray-500 transition-colors duration-300">
              Try different JSONPath queries to explore the dataset
            </p>
            <button
              onClick={() => setShowShortcutsHelp(true)}
              className="mt-3 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors underline"
            >
              View Keyboard Shortcuts
            </button>
          </div>
        </footer>
      </div>

      {/* Modals */}
      {showAnalytics && (
        <PerformanceAnalytics
          isOpen={showAnalytics}
          onClose={() => setShowAnalytics(false)}
        />
      )}

      {showShortcutsHelp && (
        <KeyboardShortcutsHelp
          isOpen={showShortcutsHelp}
          onClose={() => setShowShortcutsHelp(false)}
        />
      )}

      {showFileUpload && (
        <FileUpload
          onFileLoaded={handleFileLoaded}
          onCancel={() => setShowFileUpload(false)}
        />
      )}

      {showDatasetManager && (
        <DatasetManager
          datasets={datasets}
          currentDatasetId={currentDataset?.metadata.id}
          onRemoveDataset={removeDataset}
          onClearAll={clearAllDatasets}
          onClose={() => setShowDatasetManager(false)}
          onSwitchToDefault={loadDefaultDataset}
        />
      )}
    </div>
  );
}

export default App;
