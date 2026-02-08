/**
 * Dataset Manager Hook
 * Manages multiple datasets, switching, and localStorage persistence
 */

import { useState, useEffect, useCallback } from 'react';
import { Dataset, DatasetMetadata } from '../types/dataset';
import {
  formatFileSize,
  shouldPersist,
  generateDatasetId,
  getItemCount,
  extractDataPreview,
} from '../utils/file-utils';

const STORAGE_KEY_PREFIX = 'jsonpathx_dataset_';
const METADATA_STORAGE_KEY = 'jsonpathx_datasets_metadata';
const CURRENT_DATASET_KEY = 'jsonpathx_current_dataset';

export interface UseDatasetManagerReturn {
  datasets: DatasetMetadata[];
  currentDataset: Dataset | null;
  isLoading: boolean;
  error: string | null;
  addDataset: (name: string, data: unknown, size: number) => Promise<void>;
  switchDataset: (id: string) => void;
  removeDataset: (id: string) => void;
  clearAllDatasets: () => void;
  loadDefaultDataset: () => Promise<void>;
  setCurrentData: (data: unknown) => void;
}

export const useDatasetManager = (): UseDatasetManagerReturn => {
  const [datasets, setDatasets] = useState<DatasetMetadata[]>([]);
  const [currentDataset, setCurrentDataset] = useState<Dataset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load metadata from localStorage
  const loadMetadata = useCallback((): DatasetMetadata[] => {
    try {
      const stored = localStorage.getItem(METADATA_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (err) {
      console.error('Failed to load metadata:', err);
    }
    return [];
  }, []);

  // Save metadata to localStorage
  const saveMetadata = useCallback((metadata: DatasetMetadata[]) => {
    try {
      localStorage.setItem(METADATA_STORAGE_KEY, JSON.stringify(metadata));
    } catch (err) {
      console.error('Failed to save metadata:', err);
    }
  }, []);

  // Load dataset data from localStorage
  const loadDatasetData = useCallback((id: string): unknown | null => {
    try {
      const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}${id}`);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (err) {
      console.error(`Failed to load dataset ${id}:`, err);
    }
    return null;
  }, []);

  // Save dataset data to localStorage
  const saveDatasetData = useCallback((id: string, data: unknown) => {
    try {
      localStorage.setItem(`${STORAGE_KEY_PREFIX}${id}`, JSON.stringify(data));
    } catch (err) {
      console.error(`Failed to save dataset ${id}:`, err);
      // If quota exceeded, we'll just not persist it
      if (err instanceof Error && err.name === 'QuotaExceededError') {
        console.warn('localStorage quota exceeded, dataset will not be persisted');
      }
      throw err;
    }
  }, []);

  // Remove dataset data from localStorage
  const removeDatasetData = useCallback((id: string) => {
    try {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${id}`);
    } catch (err) {
      console.error(`Failed to remove dataset ${id}:`, err);
    }
  }, []);

  // Load default cars.json dataset
  const loadDefaultDataset = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch('/cars.json');
      if (!response.ok) {
        throw new Error(`Failed to load data: ${response.statusText}`);
      }

      const text = await response.text();
      const sizeInBytes = new Blob([text]).size;
      const jsonData = JSON.parse(text);
      const carsData = jsonData.cars || jsonData;

      const defaultMeta: DatasetMetadata = {
        id: 'default',
        name: 'Cars Dataset (Default)',
        size: sizeInBytes,
        sizeFormatted: formatFileSize(sizeInBytes),
        itemCount: getItemCount(carsData),
        uploadedAt: Date.now(),
        isPersisted: false,
        isDefault: true,
        preview: extractDataPreview(carsData),
      };

      setCurrentDataset({
        metadata: defaultMeta,
        data: carsData,
      });

      // Update datasets list to include default
      setDatasets((prev) => {
        const withoutDefault = prev.filter((d) => !d.isDefault);
        return [defaultMeta, ...withoutDefault];
      });

      localStorage.setItem(CURRENT_DATASET_KEY, 'default');
    } catch (err) {
      console.error('Error loading default dataset:', err);
      setError(err instanceof Error ? err.message : 'Failed to load default dataset');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize: load datasets and restore current
  useEffect(() => {
    const init = async () => {
      const metadata = loadMetadata();
      setDatasets(metadata);

      // Try to restore last used dataset
      const lastDatasetId = localStorage.getItem(CURRENT_DATASET_KEY);

      if (lastDatasetId === 'default' || !lastDatasetId) {
        await loadDefaultDataset();
      } else {
        const meta = metadata.find((m) => m.id === lastDatasetId);
        if (meta && meta.isPersisted) {
          const data = loadDatasetData(meta.id);
          if (data) {
            setCurrentDataset({ metadata: meta, data });
            setIsLoading(false);
            return;
          }
        }
        // Fallback to default if restore failed
        await loadDefaultDataset();
      }
    };

    init();
  }, [loadMetadata, loadDatasetData, loadDefaultDataset]);

  // Add a new dataset
  const addDataset = useCallback(
    async (name: string, data: unknown, size: number) => {
      const id = generateDatasetId();
      const persist = shouldPersist(size);

      const metadata: DatasetMetadata = {
        id,
        name,
        size,
        sizeFormatted: formatFileSize(size),
        itemCount: getItemCount(data),
        uploadedAt: Date.now(),
        isPersisted: persist,
        isDefault: false,
        preview: extractDataPreview(data),
      };

      // Save data to localStorage if small enough
      if (persist) {
        try {
          saveDatasetData(id, data);
        } catch (err) {
          // If we can't save, mark as not persisted
          metadata.isPersisted = false;
          console.warn('Could not persist dataset to localStorage:', err);
        }
      }

      // Update metadata list
      const newMetadata = [...datasets.filter((d) => !d.isDefault), metadata];
      setDatasets((prev) => [...prev.filter((d) => d.isDefault), ...newMetadata]);
      saveMetadata(newMetadata.filter((m) => !m.isDefault));

      // Set as current dataset
      setCurrentDataset({ metadata, data });
      localStorage.setItem(CURRENT_DATASET_KEY, id);
    },
    [datasets, saveDatasetData, saveMetadata]
  );

  // Switch to a different dataset
  const switchDataset = useCallback(
    (id: string) => {
      if (id === 'default') {
        loadDefaultDataset();
        return;
      }

      const meta = datasets.find((d) => d.id === id);
      if (!meta) {
        console.error(`Dataset ${id} not found`);
        return;
      }

      if (meta.isPersisted) {
        const data = loadDatasetData(id);
        if (data) {
          setCurrentDataset({ metadata: meta, data });
          localStorage.setItem(CURRENT_DATASET_KEY, id);
        } else {
          console.error(`Failed to load dataset ${id}`);
        }
      } else {
        console.warn(`Dataset ${id} is not persisted and not available`);
        // Fallback to default
        loadDefaultDataset();
      }
    },
    [datasets, loadDatasetData, loadDefaultDataset]
  );

  // Remove a dataset
  const removeDataset = useCallback(
    (id: string) => {
      if (id === 'default') {
        console.warn('Cannot remove default dataset');
        return;
      }

      // Remove from storage
      removeDatasetData(id);

      // Update metadata
      const newMetadata = datasets.filter((d) => d.id !== id && !d.isDefault);
      setDatasets((prev) => [...prev.filter((d) => d.isDefault), ...newMetadata]);
      saveMetadata(newMetadata);

      // If we're removing the current dataset, switch to default
      if (currentDataset?.metadata.id === id) {
        loadDefaultDataset();
      }
    },
    [datasets, currentDataset, removeDatasetData, saveMetadata, loadDefaultDataset]
  );

  // Clear all uploaded datasets
  const clearAllDatasets = useCallback(() => {
    // Remove all non-default datasets
    datasets.forEach((meta) => {
      if (!meta.isDefault) {
        removeDatasetData(meta.id);
      }
    });

    // Clear metadata
    saveMetadata([]);
    setDatasets((prev) => prev.filter((d) => d.isDefault));

    // Switch to default
    loadDefaultDataset();
  }, [datasets, removeDatasetData, saveMetadata, loadDefaultDataset]);

  // Set current data (for in-memory datasets)
  const setCurrentData = useCallback((data: unknown) => {
    setCurrentDataset((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        data,
      };
    });
  }, []);

  return {
    datasets,
    currentDataset,
    isLoading,
    error,
    addDataset,
    switchDataset,
    removeDataset,
    clearAllDatasets,
    loadDefaultDataset,
    setCurrentData,
  };
};
