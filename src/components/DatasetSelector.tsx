/**
 * DatasetSelector Component
 * Dropdown to switch between datasets
 */

import { useState, useRef, useEffect } from 'react';
import { DatasetMetadata } from '../types/dataset';

interface DatasetSelectorProps {
  datasets: DatasetMetadata[];
  currentDatasetId: string | undefined;
  onSelectDataset: (id: string) => void;
  onUploadClick: () => void;
  onManageClick: () => void;
}

export default function DatasetSelector({
  datasets,
  currentDatasetId,
  onSelectDataset,
  onUploadClick,
  onManageClick,
}: DatasetSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentDataset = datasets.find((d) => d.id === currentDatasetId);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (id: string) => {
    onSelectDataset(id);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        <svg
          className="w-5 h-5 text-gray-600 dark:text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
          />
        </svg>
        <div className="text-left">
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            {currentDataset?.name || 'Select Dataset'}
          </div>
          {currentDataset && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {currentDataset.itemCount.toLocaleString()} items · {currentDataset.sizeFormatted}
            </div>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto">
          {/* Datasets List */}
          <div className="py-2">
            {datasets.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                No datasets available
              </div>
            ) : (
              datasets.map((dataset) => (
                <button
                  key={dataset.id}
                  onClick={() => handleSelect(dataset.id)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    dataset.id === currentDatasetId
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <div className="font-medium text-gray-900 dark:text-white truncate">
                          {dataset.name}
                        </div>
                        {dataset.isDefault && (
                          <span className="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                            Default
                          </span>
                        )}
                        {!dataset.isPersisted && !dataset.isDefault && (
                          <span className="text-xs px-2 py-0.5 bg-yellow-200 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 rounded">
                            Session Only
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {dataset.itemCount.toLocaleString()} items · {dataset.sizeFormatted}
                      </div>
                      {!dataset.isDefault && (
                        <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                          Uploaded {new Date(dataset.uploadedAt).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    {dataset.id === currentDatasetId && (
                      <svg
                        className="w-5 h-5 text-blue-500 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-gray-200 dark:border-gray-700 py-2">
            <button
              onClick={() => {
                onUploadClick();
                setIsOpen(false);
              }}
              className="w-full px-4 py-2 text-left text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
              <span>Upload New Dataset</span>
            </button>

            {datasets.some((d) => !d.isDefault) && (
              <button
                onClick={() => {
                  onManageClick();
                  setIsOpen(false);
                }}
                className="w-full px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span>Manage Datasets</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
