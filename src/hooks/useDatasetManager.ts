/**
 * Dataset Manager Hook
 * Manages multiple datasets, switching, and localStorage persistence
 */

import { useState, useEffect, useCallback } from 'react';
import type { Dataset, DatasetMetadata } from '../types/dataset';
import {
  formatFileSize,
  shouldPersist,
  generateDatasetId,
  getItemCount,
  extractDataPreview,
} from '../utils/file-utils';

const STORAGE_KEY_PREFIX = 'jsonpathx_dataset_';

/**
 * Built-in datasets, served from public/. The 500-car sample loads at startup;
 * the full file (28,488 cars, about 49 MB) is only fetched when it is chosen.
 */
interface BuiltinDataset {
  id: string;
  name: string;
  url: string;
  /** Known size and count, shown before the file is fetched. */
  size: number;
  itemCount: number;
}

export const SAMPLE_DATASET_ID = 'default';
export const FULL_DATASET_ID = 'cars-full';

export const BUILTIN_DATASETS: readonly BuiltinDataset[] = [
  { id: SAMPLE_DATASET_ID, name: 'Cars sample (500 cars)', url: '/cars-sample.json', size: 657_018, itemCount: 500 },
  { id: FULL_DATASET_ID, name: 'Cars, full dataset (loads on demand)', url: '/cars.json', size: 49_281_639, itemCount: 28_488 },
];

function builtinMetadata(builtin: BuiltinDataset, overrides: Partial<DatasetMetadata> = {}): DatasetMetadata {
  return {
    id: builtin.id,
    name: builtin.name,
    size: builtin.size,
    sizeFormatted: formatFileSize(builtin.size),
    itemCount: builtin.itemCount,
    uploadedAt: 0,
    isPersisted: false,
    isDefault: true,
    ...overrides,
  };
}

const BUILTIN_METADATA: DatasetMetadata[] = BUILTIN_DATASETS.map((b) => builtinMetadata(b));
const isBuiltin = (id: string) => BUILTIN_DATASETS.some((b) => b.id === id);
const METADATA_STORAGE_KEY = 'jsonpathx_datasets_metadata';
const CURRENT_DATASET_KEY = 'jsonpathx_current_dataset';

export interface UseDatasetManagerReturn {
  datasets: DatasetMetadata[];
  currentDataset: Dataset | null;
  isLoading: boolean;
  /** Name of the dataset being fetched, while `isLoading`. */
  loadingName: string | null;
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
  const [loadingName, setLoadingName] = useState<string | null>(null);

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

  // Fetch a built-in dataset (the sample, or the full file on demand)
  const loadBuiltinDataset = useCallback(async (id: string) => {
    const builtin = BUILTIN_DATASETS.find((b) => b.id === id) ?? BUILTIN_DATASETS[0]!;
    try {
      setIsLoading(true);
      setLoadingName(builtin.name);
      setError(null);

      const response = await fetch(builtin.url);
      if (!response.ok) {
        throw new Error(`Failed to load data: ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      const sizeInBytes = new Blob([text]).size;
      const jsonData = JSON.parse(text);
      const carsData = jsonData.cars || jsonData;

      const meta = builtinMetadata(builtin, {
        size: sizeInBytes,
        sizeFormatted: formatFileSize(sizeInBytes),
        itemCount: getItemCount(carsData),
        uploadedAt: Date.now(),
        preview: extractDataPreview(carsData),
      });

      setCurrentDataset({ metadata: meta, data: carsData });
      setDatasets((prev) => [...BUILTIN_METADATA.map((m) => (m.id === meta.id ? meta : m)), ...prev.filter((d) => !d.isDefault)]);

      try {
        localStorage.setItem(CURRENT_DATASET_KEY, builtin.id);
      } catch {
        // Not remembered across visits; nothing else depends on it.
      }
    } catch (err) {
      console.error('Error loading dataset:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dataset');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadDefaultDataset = useCallback(() => loadBuiltinDataset(SAMPLE_DATASET_ID), [loadBuiltinDataset]);

  // Initialize: load datasets and restore current
  useEffect(() => {
    const init = async () => {
      const metadata = loadMetadata();
      setDatasets([...BUILTIN_METADATA, ...metadata]);

      // Try to restore last used dataset. Built-ins start with the sample:
      // the full file is only fetched when someone picks it.
      const lastDatasetId = localStorage.getItem(CURRENT_DATASET_KEY);

      if (!lastDatasetId || isBuiltin(lastDatasetId)) {
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
      if (isBuiltin(id)) {
        loadBuiltinDataset(id);
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
    [datasets, loadDatasetData, loadDefaultDataset, loadBuiltinDataset]
  );

  // Remove a dataset
  const removeDataset = useCallback(
    (id: string) => {
      if (isBuiltin(id)) {
        console.warn('Cannot remove a built-in dataset');
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
    loadingName,
    error,
    addDataset,
    switchDataset,
    removeDataset,
    clearAllDatasets,
    loadDefaultDataset,
    setCurrentData,
  };
};
