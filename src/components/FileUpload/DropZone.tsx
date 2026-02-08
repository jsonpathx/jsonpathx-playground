/**
 * DropZone Component
 * Drag-and-drop zone for file uploads
 */

import { useState, useCallback, DragEvent, ChangeEvent, useRef } from 'react';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
}

export default function DropZone({
  onFileSelect,
  accept = '.json',
  maxSize,
  disabled = false,
}: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): boolean => {
      setDragError(null);

      if (!file.name.endsWith('.json')) {
        setDragError('Only .json files are supported');
        return false;
      }

      if (maxSize && file.size > maxSize) {
        setDragError(`File is too large (max ${Math.round(maxSize / 1024 / 1024)}MB)`);
        return false;
      }

      return true;
    },
    [maxSize]
  );

  const handleDragEnter = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      if (!disabled) {
        setIsDragging(true);
        setDragError(null);
      }
    },
    [disabled]
  );

  const handleDragLeave = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      // Only set dragging to false if we're leaving the dropzone itself
      if (e.currentTarget === e.target) {
        setIsDragging(false);
        setDragError(null);
      }
    },
    []
  );

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      if (disabled) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      const file = files[0]; // Take first file
      if (validateFile(file)) {
        onFileSelect(file);
      }
    },
    [disabled, validateFile, onFileSelect]
  );

  const handleFileInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      const file = files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [validateFile, onFileSelect]
  );

  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  return (
    <div
      className={`
        relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
        ${
          isDragging
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 scale-105'
            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50'}
        ${dragError ? 'border-red-400 bg-red-50 dark:bg-red-900/20' : ''}
      `}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      <div className="flex flex-col items-center space-y-4">
        {/* Upload Icon */}
        <svg
          className={`w-16 h-16 transition-colors ${
            isDragging
              ? 'text-blue-500'
              : dragError
              ? 'text-red-500'
              : 'text-gray-400 dark:text-gray-500'
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>

        {/* Text */}
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
            {isDragging ? 'Drop your JSON file here' : 'Drag & drop your JSON file here'}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            or click to browse
          </p>
        </div>

        {/* Error Message */}
        {dragError && (
          <div className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">
            {dragError}
          </div>
        )}

        {/* Supported formats */}
        <div className="text-xs text-gray-400 dark:text-gray-500">
          Supports: .json files {maxSize && `(max ${Math.round(maxSize / 1024 / 1024)}MB)`}
        </div>
      </div>
    </div>
  );
}
