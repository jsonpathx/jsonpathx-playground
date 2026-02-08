import { useMemo, useState } from 'react';
import { SupportedLanguage } from '../../types/code-generator';
import { getInstallationInstructions } from '../../utils/code-generator';
import CopyButton from './CopyButton';

interface InstallationInstructionsProps {
  language: SupportedLanguage;
}

const InstallationInstructions = ({ language }: InstallationInstructionsProps) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const instructions = useMemo(() => {
    return getInstallationInstructions(language);
  }, [language]);

  // Extract code blocks from markdown
  const renderInstructions = useMemo(() => {
    const lines = instructions.split('\n');
    const elements: JSX.Element[] = [];
    let currentCodeBlock: string[] = [];
    let inCodeBlock = false;
    let key = 0;

    lines.forEach((line) => {
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          // End code block
          const code = currentCodeBlock.join('\n');
          elements.push(
            <div key={key++} className="relative mb-3">
              <pre className="bg-gray-900 text-gray-100 dark:bg-gray-950 dark:text-gray-200 p-4 rounded-lg text-sm font-mono overflow-x-auto transition-colors duration-300">
                <code>{code}</code>
              </pre>
              <div className="absolute top-2 right-2">
                <CopyButton text={code} className="bg-gray-700 hover:bg-gray-600" />
              </div>
            </div>
          );
          currentCodeBlock = [];
          inCodeBlock = false;
        } else {
          // Start code block
          inCodeBlock = true;
        }
      } else if (inCodeBlock) {
        currentCodeBlock.push(line);
      } else if (line.startsWith('**')) {
        // Bold text
        const text = line.replace(/\*\*/g, '');
        elements.push(
          <p key={key++} className="font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
            {text}
          </p>
        );
      } else if (line.trim() === '') {
        // Empty line
        elements.push(<div key={key++} className="h-2" />);
      } else if (line.startsWith('# ')) {
        // Comment in code block context
        elements.push(
          <p key={key++} className="text-sm text-gray-600 dark:text-gray-400 mb-1 transition-colors duration-300">
            {line}
          </p>
        );
      } else {
        // Regular text
        elements.push(
          <p key={key++} className="text-sm text-gray-700 dark:text-gray-300 mb-1 transition-colors duration-300">
            {line}
          </p>
        );
      }
    });

    return elements;
  }, [instructions]);

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg overflow-hidden transition-colors duration-300">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200"
      >
        <div className="flex items-center space-x-2">
          <svg
            className="w-5 h-5 text-blue-600 dark:text-blue-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="font-semibold text-blue-900 dark:text-blue-100 transition-colors duration-300">
            Installation & Setup Instructions
          </span>
        </div>
        <svg
          className={`w-5 h-5 text-blue-600 dark:text-blue-400 transition-transform duration-200 ${
            isExpanded ? 'transform rotate-180' : ''
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 py-3 border-t border-blue-200 dark:border-blue-800 transition-colors duration-300">
          {renderInstructions}
        </div>
      )}
    </div>
  );
};

export default InstallationInstructions;
