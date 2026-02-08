import { useRef, useEffect, useState } from 'react';
import { getModifierKeyDisplay } from '../utils/keyboard-utils';

interface QueryEditorProps {
  query: string;
  onChange: (query: string) => void;
  isExecuting: boolean;
  executionTime: number | null;
  error: string | null;
  getShareableUrl: () => string;
  onOpenQueryBuilder?: () => void;
}

const QueryEditor = ({ query, onChange, isExecuting, executionTime, error, getShareableUrl, onOpenQueryBuilder }: QueryEditorProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'success' | 'error'>('idle');
  const modifierKey = getModifierKeyDisplay();

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [query]);

  // Handle share button click
  const handleShare = async () => {
    setCopyStatus('copying');

    try {
      const shareableUrl = getShareableUrl();
      await navigator.clipboard.writeText(shareableUrl);
      setCopyStatus('success');

      // Reset status after 2 seconds
      setTimeout(() => {
        setCopyStatus('idle');
      }, 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      setCopyStatus('error');

      // Reset status after 2 seconds
      setTimeout(() => {
        setCopyStatus('idle');
      }, 2000);
    }
  };

  // Get button text based on copy status
  const getShareButtonContent = () => {
    switch (copyStatus) {
      case 'copying':
        return (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
            <span>Copying...</span>
          </>
        );
      case 'success':
        return (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Copied!</span>
          </>
        );
      case 'error':
        return (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Failed</span>
          </>
        );
      default:
        return (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            <span>Share</span>
          </>
        );
    }
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg border border-gray-300 dark:border-gray-700 p-6 shadow-xl transition-colors duration-300">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center transition-colors duration-300">
          <span className="mr-2">🔍</span>
          Query Editor
        </h2>
        {isExecuting && (
          <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm transition-colors duration-300">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 dark:border-blue-400 border-t-transparent mr-2"></div>
            Executing...
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="query-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors duration-300">
              JSONPath Expression
            </label>
            <div className="flex items-center space-x-2">
              {onOpenQueryBuilder && (
                <button
                  onClick={onOpenQueryBuilder}
                  className="flex items-center space-x-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-all"
                  title="Open visual query builder (⌘+B)"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                  </svg>
                  <span>Builder</span>
                </button>
              )}
              <button
                onClick={handleShare}
                disabled={copyStatus === 'copying'}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  copyStatus === 'success'
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : copyStatus === 'error'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title="Copy shareable URL to clipboard"
              >
                {getShareButtonContent()}
              </button>
            </div>
          </div>
          <div className="relative">
            <textarea
              ref={textareaRef}
              id="query-input"
              value={query}
              onChange={(e) => onChange(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-300"
              placeholder="Enter JSONPath query... e.g., $.store.book[*].author"
              rows={3}
              spellCheck={false}
            />
            <div className="absolute bottom-2 right-2 flex items-center space-x-2 pointer-events-none">
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-sm">
                {modifierKey}+K
              </kbd>
              <span className="text-xs text-gray-500 dark:text-gray-500">to clear</span>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700 transition-colors duration-300">
          <div className="flex items-center space-x-4">
            {executionTime !== null && (
              <div className="text-xs text-gray-600 dark:text-gray-400 transition-colors duration-300">
                <span className="font-semibold text-green-600 dark:text-green-400">{executionTime.toFixed(2)}ms</span>
                {' '}execution time
              </div>
            )}
            <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-500">
              <span>Press</span>
              <kbd className="px-2 py-0.5 text-xs font-semibold text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">
                {modifierKey}+Enter
              </kbd>
              <span>to execute</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className={`h-2 w-2 rounded-full ${error ? 'bg-red-500' : 'bg-green-500'}`}></div>
            <span className="text-xs text-gray-600 dark:text-gray-400 transition-colors duration-300">
              {error ? 'Error' : 'Ready'}
            </span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-500/50 rounded-lg p-3 transition-colors duration-300">
            <div className="flex items-start">
              <span className="text-red-600 dark:text-red-400 mr-2">⚠️</span>
              <div>
                <div className="text-sm font-semibold text-red-700 dark:text-red-400 mb-1 transition-colors duration-300">Query Error</div>
                <div className="text-xs text-red-600 dark:text-red-300 font-mono transition-colors duration-300">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Help Text */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 rounded-lg p-3 transition-colors duration-300">
          <div className="text-xs text-blue-800 dark:text-blue-300 transition-colors duration-300">
            <div className="font-semibold mb-2">💡 Quick Tips:</div>
            <ul className="space-y-1 list-disc list-inside">
              <li>Use <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">$</code> for root</li>
              <li>Use <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">[*]</code> for all items</li>
              <li>Use <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">[?(@.price &lt; 10)]</code> for filters</li>
              <li>Use <code className="bg-blue-100 dark:bg-blue-900/40 px-1 rounded">..</code> for recursive descent</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QueryEditor;
