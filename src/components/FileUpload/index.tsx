/**
 * FileUpload Component
 * Main file upload component with validation and progress
 */

import { useState, useCallback } from 'react';
import DropZone from './DropZone';
import { validateFile, parseJSONFile, formatFileSize } from '../../utils/file-utils';
import { FileValidationResult, UploadProgress } from '../../types/dataset';

interface FileUploadProps {
  onFileLoaded: (name: string, data: unknown, size: number) => void;
  onCancel: () => void;
}

export default function FileUpload({ onFileLoaded, onCancel }: FileUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<FileValidationResult | null>(null);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = useCallback(async (file: File) => {
    // Validate file first
    const validation = validateFile(file);
    if (!validation.valid) {
      setValidationResult({
        valid: false,
        error: validation.error,
      });
      return;
    }

    setSelectedFile(file);
    setIsProcessing(true);
    setValidationResult(null);

    // Parse and validate JSON
    const result = await parseJSONFile(file, (percentage, message) => {
      setProgress({
        stage: percentage < 50 ? 'reading' : percentage < 80 ? 'parsing' : 'validating',
        percentage,
        message,
      });
    });

    setProgress(null);
    setIsProcessing(false);
    setValidationResult(result);
  }, []);

  const handleConfirmUpload = useCallback(async () => {
    if (!selectedFile || !validationResult?.valid || !validationResult.metadata) return;

    setIsProcessing(true);
    try {
      const text = await selectedFile.text();
      const data = JSON.parse(text);

      onFileLoaded(
        selectedFile.name.replace('.json', ''),
        data,
        validationResult.metadata.size
      );
    } catch (error) {
      console.error('Failed to load file:', error);
      setValidationResult({
        valid: false,
        error: 'Failed to load file data',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [selectedFile, validationResult, onFileLoaded]);

  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setValidationResult(null);
    setProgress(null);
    setIsProcessing(false);
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Upload Custom Dataset
          </h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            disabled={isProcessing}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {!selectedFile ? (
            <>
              <DropZone
                onFileSelect={handleFileSelect}
                maxSize={100 * 1024 * 1024}
                disabled={isProcessing}
              />

              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <p className="font-medium">Requirements:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>File must be valid JSON format</li>
                  <li>Maximum file size: 100 MB</li>
                  <li>Files larger than 5 MB won't be saved to browser storage</li>
                  <li>Files larger than 50 MB may impact performance</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              {/* File Info */}
              <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">{selectedFile.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <button
                    onClick={handleReset}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    disabled={isProcessing}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Progress */}
              {progress && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{progress.message}</span>
                    <span className="text-gray-900 dark:text-white font-medium">{progress.percentage}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Validation Result */}
              {validationResult && (
                <div className="space-y-4">
                  {validationResult.valid ? (
                    <>
                      {/* Success */}
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <div className="flex-1">
                            <p className="font-medium text-green-900 dark:text-green-100">
                              Valid JSON file
                            </p>
                            {validationResult.metadata && (
                              <div className="mt-2 text-sm text-green-800 dark:text-green-200 space-y-1">
                                <p>Items: {validationResult.metadata.itemCount.toLocaleString()}</p>
                                <p>Size: {formatFileSize(validationResult.metadata.size)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Warnings */}
                      {validationResult.warnings && validationResult.warnings.length > 0 && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                          <div className="flex items-start space-x-3">
                            <svg className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div className="flex-1">
                              <p className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                                Warnings
                              </p>
                              <ul className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1">
                                {validationResult.warnings.map((warning, i) => (
                                  <li key={i}>{warning}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Preview */}
                      {validationResult.metadata?.preview && (
                        <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Data Preview:
                          </p>
                          <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-48 overflow-y-auto">
                            {JSON.stringify(validationResult.metadata.preview, null, 2)}
                          </pre>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {/* Error */}
                      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <svg className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="flex-1">
                            <p className="font-medium text-red-900 dark:text-red-100">
                              Validation Failed
                            </p>
                            <p className="mt-1 text-sm text-red-800 dark:text-red-200">
                              {validationResult.error}
                            </p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={isProcessing}
          >
            Cancel
          </button>
          {selectedFile && validationResult?.valid && (
            <button
              onClick={handleConfirmUpload}
              disabled={isProcessing}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isProcessing ? 'Loading...' : 'Use This Dataset'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
