import { useMemo } from 'react';
import { SupportedLanguage } from '../../types/code-generator';
import { highlightCode } from '../../utils/syntax-highlight';
import CopyButton from './CopyButton';

interface CodePreviewProps {
  code: string;
  language: SupportedLanguage;
  filename: string;
  onDownload: () => void;
}

const CodePreview = ({ code, language, filename, onDownload }: CodePreviewProps) => {
  const highlightedCode = useMemo(() => {
    return highlightCode(code, language);
  }, [code, language]);

  const lineCount = code.split('\n').length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-700 shadow-lg overflow-hidden transition-colors duration-300">
      {/* Header */}
      <div className="bg-gray-100 dark:bg-gray-900 border-b border-gray-300 dark:border-gray-700 px-4 py-3 flex items-center justify-between transition-colors duration-300">
        <div className="flex items-center space-x-3">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <span className="text-sm font-mono text-gray-700 dark:text-gray-300 transition-colors duration-300">
            {filename}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-600 dark:text-gray-400 transition-colors duration-300">
            {lineCount} lines
          </span>
          <CopyButton text={code} />
          <button
            onClick={onDownload}
            className="px-3 py-1.5 rounded text-sm font-medium bg-green-600 hover:bg-green-500 text-white transition-colors duration-200"
            title="Download file"
          >
            <svg
              className="w-4 h-4 inline-block mr-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Download
          </button>
        </div>
      </div>

      {/* Code Content */}
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <pre className="p-4 text-sm font-mono leading-relaxed">
          <code dangerouslySetInnerHTML={{ __html: highlightedCode }} />
        </pre>
      </div>

      {/* Footer */}
      <div className="bg-gray-100 dark:bg-gray-900 border-t border-gray-300 dark:border-gray-700 px-4 py-2 transition-colors duration-300">
        <div className="text-xs text-gray-600 dark:text-gray-400 transition-colors duration-300">
          Ready to copy and run. No modifications needed.
        </div>
      </div>
    </div>
  );
};

export default CodePreview;
