/**
 * Dataset Types
 * Type definitions for dataset management
 */

export interface DatasetMetadata {
  id: string;
  name: string;
  size: number; // in bytes
  sizeFormatted: string;
  itemCount: number;
  uploadedAt: number;
  isPersisted: boolean; // whether it's stored in localStorage
  isDefault: boolean;
  preview?: unknown; // first few items for preview
}

export interface Dataset {
  metadata: DatasetMetadata;
  data: unknown;
}

export interface FileValidationResult {
  valid: boolean;
  error?: string;
  warnings?: string[];
  metadata?: {
    size: number;
    itemCount: number;
    preview: unknown;
  };
}

export interface UploadProgress {
  stage: 'reading' | 'parsing' | 'validating' | 'complete';
  percentage: number;
  message: string;
}
