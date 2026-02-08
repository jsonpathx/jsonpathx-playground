/**
 * DatasetManager Component
 * Manage uploaded datasets (list, delete, clear all)
 */

import { DatasetMetadata } from '../types/dataset';

interface DatasetManagerProps {
  datasets: DatasetMetadata[];
  currentDatasetId: string | undefined;
  onRemoveDataset: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
  onSwitchToDefault: () => void;
}

export default function DatasetManager({
  datasets,
  currentDatasetId,
  onRemoveDataset,
  onClearAll,
  onClose,
  onSwitchToDefault,
}: DatasetManagerProps) {
  const uploadedDatasets = datasets.filter((d) => !d.isDefault);
  const totalSize = uploadedDatasets.reduce((sum, d) => sum + d.size, 0);
  const persistedCount = uploadedDatasets.filter((d) => d.isPersisted).length;

  const handleRemove = (id: string) => {
    if (confirm('Are you sure you want to delete this dataset?')) {
      onRemoveDataset(id);
    }
  };

  const handleClearAll = () => {
    if (
      confirm(
        `Are you sure you want to delete all ${uploadedDatasets.length} uploaded dataset(s)? This action cannot be undone.`
      )
    ) {
      onClearAll();
      onSwitchToDefault();
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Manage Datasets
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {uploadedDatasets.length} uploaded · {persistedCount} saved · {formatBytes(totalSize)} total
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {uploadedDatasets.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                No uploaded datasets
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">
                Upload a custom JSON file to get started
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {uploadedDatasets.map((dataset) => (
                <div
                  key={dataset.id}
                  className={`border rounded-lg p-4 transition-all ${
                    dataset.id === currentDatasetId
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Name and badges */}
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {dataset.name}
                        </h3>
                        {dataset.id === currentDatasetId && (
                          <span className="text-xs px-2 py-0.5 bg-blue-500 text-white rounded">
                            Active
                          </span>
                        )}
                        {!dataset.isPersisted && (
                          <span className="text-xs px-2 py-0.5 bg-yellow-200 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded">
                            Session Only
                          </span>
                        )}
                      </div>

                      {/* Metadata */}
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                            />
                          </svg>
                          <span>{dataset.sizeFormatted}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                            />
                          </svg>
                          <span>{dataset.itemCount.toLocaleString()} items</span>
                        </div>
                        <div className="flex items-center space-x-1 col-span-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span>
                            Uploaded {new Date(dataset.uploadedAt).toLocaleDateString()} at{' '}
                            {new Date(dataset.uploadedAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>

                      {/* Storage info */}
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-500">
                        {dataset.isPersisted ? (
                          <span className="flex items-center space-x-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                            <span>Saved to browser storage</span>
                          </span>
                        ) : (
                          <span className="flex items-center space-x-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                              />
                            </svg>
                            <span>Too large for storage - available in this session only</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Delete button */}
                    <button
                      onClick={() => handleRemove(dataset.id)}
                      className="ml-4 p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                      title="Delete dataset"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {uploadedDatasets.length > 0 && (
          <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleClearAll}
              className="px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium"
            >
              Clear All Datasets
            </button>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
