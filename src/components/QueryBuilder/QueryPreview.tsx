import { useState } from 'react';
import { getQueryDescription } from '../../utils/query-builder-utils';

interface QueryPreviewProps {
  query: string;
  onApply: () => void;
  isValid: boolean;
}

const QueryPreview = ({ query, onApply, isValid }: QueryPreviewProps) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success'>('idle');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(query);
      setCopyStatus('success');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const description = getQueryDescription(query);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Generated Query
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
            title="Copy query"
          >
            {copyStatus === 'success' ? 'Copied!' : 'Copy'}
          </button>
        </div>
      </div>

      {/* Query Display */}
      <div className="relative">
        <div
          className={`p-4 bg-gray-900 dark:bg-gray-950 rounded-lg font-mono text-sm overflow-x-auto ${
            isValid ? 'border-2 border-green-500' : 'border-2 border-yellow-500'
          }`}
        >
          <code className="text-green-400">{query || '$'}</code>
        </div>

        {/* Validity Indicator */}
        <div className="absolute top-2 right-2">
          {isValid ? (
            <div
              className="flex items-center space-x-1 px-2 py-1 bg-green-600 rounded text-xs text-white"
              title="Valid query"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Valid</span>
            </div>
          ) : (
            <div
              className="flex items-center space-x-1 px-2 py-1 bg-yellow-600 rounded text-xs text-white"
              title="Query may be incomplete"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Check</span>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 rounded-lg p-3">
        <div className="text-xs text-blue-800 dark:text-blue-300">
          <div className="font-semibold mb-1">Query Description:</div>
          <p>{description}</p>
        </div>
      </div>

      {/* Apply Button */}
      <button
        onClick={onApply}
        disabled={!isValid || !query}
        className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center space-x-2 shadow-lg"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14 5l7 7m0 0l-7 7m7-7H3"
          />
        </svg>
        <span>Apply Query</span>
      </button>

      {/* Query Syntax Help */}
      <details className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <summary className="text-xs font-semibold text-gray-600 dark:text-gray-400 cursor-pointer hover:text-gray-800 dark:hover:text-gray-200">
          JSONPath Syntax Reference
        </summary>
        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">$</code> Root
              object
            </div>
            <div>
              <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">@</code> Current
              object
            </div>
            <div>
              <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">.</code> Child
              operator
            </div>
            <div>
              <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">..</code>{' '}
              Recursive descent
            </div>
            <div>
              <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">*</code> Wildcard
            </div>
            <div>
              <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">[n]</code> Array
              index
            </div>
            <div>
              <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">[n:m]</code> Array
              slice
            </div>
            <div>
              <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">[?()]</code>{' '}
              Filter
            </div>
          </div>
        </div>
      </details>
    </div>
  );
};

export default QueryPreview;
