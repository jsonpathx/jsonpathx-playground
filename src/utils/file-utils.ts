/**
 * File Utilities
 * Utilities for file upload, validation, and processing
 */

import { FileValidationResult } from '../types/dataset';

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB hard limit
const LARGE_FILE_WARNING = 50 * 1024 * 1024; // 50MB warning threshold
const PERSIST_THRESHOLD = 5 * 1024 * 1024; // 5MB localStorage threshold

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

export const validateFile = (file: File): { valid: boolean; error?: string } => {
  // Check file extension
  if (!file.name.endsWith('.json')) {
    return {
      valid: false,
      error: 'Only .json files are supported',
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File is too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}`,
    };
  }

  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty',
    };
  }

  return { valid: true };
};

export const shouldPersist = (size: number): boolean => {
  return size < PERSIST_THRESHOLD;
};

export const shouldWarnSize = (size: number): boolean => {
  return size > LARGE_FILE_WARNING;
};

export const parseJSONFile = async (
  file: File,
  onProgress?: (percentage: number, message: string) => void
): Promise<FileValidationResult> => {
  try {
    // Stage 1: Reading file
    onProgress?.(20, 'Reading file...');

    const text = await file.text();
    const sizeInBytes = new Blob([text]).size;

    // Stage 2: Parsing JSON
    onProgress?.(50, 'Parsing JSON...');

    let jsonData: unknown;
    try {
      jsonData = JSON.parse(text);
    } catch (parseError) {
      return {
        valid: false,
        error: `Invalid JSON: ${parseError instanceof Error ? parseError.message : 'Parse error'}`,
      };
    }

    // Stage 3: Validating structure
    onProgress?.(80, 'Validating structure...');

    // Calculate item count
    let itemCount = 1;
    let preview: unknown = jsonData;

    if (Array.isArray(jsonData)) {
      itemCount = jsonData.length;
      // Get first 3 items for preview
      preview = jsonData.slice(0, 3);
    } else if (typeof jsonData === 'object' && jsonData !== null) {
      // If it's an object, count top-level keys
      itemCount = Object.keys(jsonData).length;
      // Preview first 3 key-value pairs
      const keys = Object.keys(jsonData).slice(0, 3);
      preview = keys.reduce((acc, key) => {
        acc[key] = (jsonData as Record<string, unknown>)[key];
        return acc;
      }, {} as Record<string, unknown>);
    }

    // Stage 4: Complete
    onProgress?.(100, 'Complete!');

    const warnings: string[] = [];
    if (shouldWarnSize(sizeInBytes)) {
      warnings.push(
        `Large file detected (${formatFileSize(sizeInBytes)}). This may impact performance.`
      );
    }

    if (!shouldPersist(sizeInBytes)) {
      warnings.push(
        `File is too large to persist in localStorage (>${formatFileSize(PERSIST_THRESHOLD)}). It will only be available in this session.`
      );
    }

    return {
      valid: true,
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata: {
        size: sizeInBytes,
        itemCount,
        preview,
      },
    };
  } catch (error) {
    return {
      valid: false,
      error: `Failed to process file: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
};

export const generateDatasetId = (): string => {
  return `dataset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const getItemCount = (data: unknown): number => {
  if (Array.isArray(data)) {
    return data.length;
  } else if (typeof data === 'object' && data !== null) {
    return Object.keys(data).length;
  }
  return 1;
};

export const extractDataPreview = (data: unknown, limit = 3): unknown => {
  if (Array.isArray(data)) {
    return data.slice(0, limit);
  } else if (typeof data === 'object' && data !== null) {
    const keys = Object.keys(data).slice(0, limit);
    return keys.reduce((acc, key) => {
      acc[key] = (data as Record<string, unknown>)[key];
      return acc;
    }, {} as Record<string, unknown>);
  }
  return data;
};
