import { useState, useMemo, useCallback } from 'react';
import { SupportedLanguage, CodeGenerationOptions } from '../../types/code-generator';
import { generateCode } from '../../utils/code-generator';
import { downloadCode } from '../../utils/code-generator';
import { LANGUAGE_TEMPLATES } from '../../utils/code-templates';
import LanguageSelector from './LanguageSelector';
import CodePreview from './CodePreview';
import InstallationInstructions from './InstallationInstructions';

interface CodeGeneratorProps {
  query: string;
  data: unknown;
  results: unknown;
  onClose: () => void;
}

const CodeGenerator = ({ query, data, results, onClose }: CodeGeneratorProps) => {
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>('javascript');
  const [includeData, setIncludeData] = useState(true);
  const [useAsync, setUseAsync] = useState(true);
  const [includeErrorHandling, setIncludeErrorHandling] = useState(true);
  const [includeComments, setIncludeComments] = useState(true);
  const [maxDataPreview, setMaxDataPreview] = useState(3);

  // Generate code based on current options
  const generatedCode = useMemo(() => {
    const options: CodeGenerationOptions = {
      query,
      data,
      includeData,
      useAsync,
      includeErrorHandling,
      includeComments,
      maxDataPreview,
    };

    try {
      return generateCode(selectedLanguage, options);
    } catch (error) {
      console.error('Error generating code:', error);
      return null;
    }
  }, [
    selectedLanguage,
    query,
    data,
    includeData,
    useAsync,
    includeErrorHandling,
    includeComments,
    maxDataPreview,
  ]);

  const handleDownload = useCallback(() => {
    if (generatedCode) {
      downloadCode(generatedCode.code, generatedCode.filename);
    }
  }, [generatedCode]);

  const handleLanguageChange = useCallback((language: SupportedLanguage) => {
    setSelectedLanguage(language);

    // Reset async option if language doesn't support it
    const template = LANGUAGE_TEMPLATES[language];
    if (template && !template.supportsAsync) {
      setUseAsync(false);
    }
  }, []);

  // Check if current language supports async
  const supportsAsync = useMemo(() => {
    const template = LANGUAGE_TEMPLATES[selectedLanguage];
    return template?.supportsAsync || false;
  }, [selectedLanguage]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col transition-colors duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center space-x-2">
              <span>Code Generator</span>
            </h2>
            <p className="text-blue-100 text-sm mt-1">
              Generate ready-to-use code in multiple languages
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors duration-200"
            title="Close"
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Language Selector */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
              Select Language:
            </label>
            <LanguageSelector
              selectedLanguage={selectedLanguage}
              onChange={handleLanguageChange}
            />
          </div>

          {/* Options */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3 transition-colors duration-300">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 transition-colors duration-300">
              Code Generation Options:
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Include Data */}
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeData}
                  onChange={(e) => setIncludeData(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300">
                    Include sample data
                  </span>
                  <p className="text-xs text-gray-600 dark:text-gray-400 transition-colors duration-300">
                    Embed data in code (vs. loading from file)
                  </p>
                </div>
              </label>

              {/* Use Async */}
              <label
                className={`flex items-center space-x-3 ${
                  supportsAsync ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'
                }`}
              >
                <input
                  type="checkbox"
                  checked={useAsync}
                  onChange={(e) => setUseAsync(e.target.checked)}
                  disabled={!supportsAsync}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300">
                    Use async/await
                  </span>
                  <p className="text-xs text-gray-600 dark:text-gray-400 transition-colors duration-300">
                    {supportsAsync ? 'Asynchronous execution pattern' : 'Not supported'}
                  </p>
                </div>
              </label>

              {/* Error Handling */}
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeErrorHandling}
                  onChange={(e) => setIncludeErrorHandling(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300">
                    Include error handling
                  </span>
                  <p className="text-xs text-gray-600 dark:text-gray-400 transition-colors duration-300">
                    Add try-catch blocks
                  </p>
                </div>
              </label>

              {/* Comments */}
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeComments}
                  onChange={(e) => setIncludeComments(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-300">
                    Include comments
                  </span>
                  <p className="text-xs text-gray-600 dark:text-gray-400 transition-colors duration-300">
                    Add explanatory comments
                  </p>
                </div>
              </label>
            </div>

            {/* Data Preview Limit */}
            {includeData && Array.isArray(data) && data.length > 3 && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2 transition-colors duration-300">
                  Data preview items: {maxDataPreview}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={maxDataPreview}
                  onChange={(e) => setMaxDataPreview(Number(e.target.value))}
                  className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 transition-colors duration-300">
                  Total items: {Array.isArray(data) ? data.length : 1}
                </p>
              </div>
            )}
          </div>

          {/* Current Query Info */}
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4 transition-colors duration-300">
            <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2 transition-colors duration-300">
              Current Query:
            </h3>
            <code className="block bg-purple-100 dark:bg-purple-900/50 text-purple-900 dark:text-purple-200 px-3 py-2 rounded text-sm font-mono transition-colors duration-300">
              {query}
            </code>
            {results !== null && results !== undefined && (
              <p className="text-xs text-purple-700 dark:text-purple-300 mt-2 transition-colors duration-300">
                Results: {Array.isArray(results) ? results.length : 1} item(s)
              </p>
            )}
          </div>

          {/* Installation Instructions */}
          <InstallationInstructions language={selectedLanguage} />

          {/* Code Preview */}
          {generatedCode && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 dark:text-white mb-3 transition-colors duration-300">
                Generated Code:
              </label>
              <CodePreview
                code={generatedCode.code}
                language={generatedCode.language}
                filename={generatedCode.filename}
                onDownload={handleDownload}
              />
            </div>
          )}

          {!generatedCode && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-center transition-colors duration-300">
              <p className="text-red-700 dark:text-red-300 transition-colors duration-300">
                Failed to generate code. Please try again.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-100 dark:bg-gray-900 border-t border-gray-300 dark:border-gray-700 px-6 py-4 flex items-center justify-between transition-colors duration-300">
          <p className="text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
            All generated code is production-ready and can be copied directly.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg transition-colors duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CodeGenerator;
