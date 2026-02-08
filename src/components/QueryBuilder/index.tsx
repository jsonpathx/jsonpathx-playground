import { useState, useEffect, useMemo } from 'react';
import { QueryBuilderState, FilterCondition, ArraySlice } from '../../types/query-builder';
import {
  analyzeSchema,
  buildJsonPathQuery,
  parseJsonPathQuery,
  isValidJsonPath,
} from '../../utils/query-builder-utils';
import FieldSelector from './FieldSelector';
import FilterBuilder from './FilterBuilder';
import QueryPreview from './QueryPreview';

interface QueryBuilderProps {
  data: unknown;
  currentQuery: string;
  onQueryChange: (query: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

const QueryBuilder = ({ data, currentQuery, onQueryChange, isOpen, onClose }: QueryBuilderProps) => {
  const [state, setState] = useState<QueryBuilderState>({
    mode: 'visual',
    rootPath: '$',
    filters: [],
    selectedPath: [],
    recursiveDescent: false,
  });

  const [textQuery, setTextQuery] = useState(currentQuery);

  // Analyze data schema
  const schema = useMemo(() => {
    if (!data) {
      return { fields: [], depth: 0, totalFields: 0 };
    }
    return analyzeSchema(data, 3);
  }, [data]);

  // Extract available field names for filter builder
  const availableFields = useMemo(() => {
    const fields: string[] = [];

    const extractFields = (node: typeof schema.fields[0]) => {
      fields.push(node.name);
      if (node.children) {
        node.children.forEach((child) => extractFields(child));
      }
    };

    schema.fields.forEach((field) => extractFields(field));
    return fields;
  }, [schema]);

  // Generate query from visual builder state
  const generatedQuery = useMemo(() => {
    return buildJsonPathQuery(
      state.rootPath,
      state.selectedPath,
      state.filters,
      state.arraySlice,
      state.recursiveDescent
    );
  }, [state]);

  // Validate generated query
  const isValid = useMemo(() => {
    return isValidJsonPath(generatedQuery);
  }, [generatedQuery]);

  // Sync with external query changes
  useEffect(() => {
    if (currentQuery !== generatedQuery && state.mode === 'visual') {
      setTextQuery(currentQuery);
      // Try to parse the current query to populate visual builder
      const parsed = parseJsonPathQuery(currentQuery);
      setState((prev) => ({
        ...prev,
        filters: parsed.filters,
        recursiveDescent: parsed.recursiveDescent,
      }));
    }
  }, [currentQuery]);

  // Update state handlers
  const handleFilterChange = (filters: FilterCondition[]) => {
    setState((prev) => ({ ...prev, filters }));
  };

  const handleFieldSelect = (path: string[]) => {
    setState((prev) => ({ ...prev, selectedPath: path }));
  };

  const handleArraySliceChange = (slice: ArraySlice | undefined) => {
    setState((prev) => ({ ...prev, arraySlice: slice }));
  };

  const handleRecursiveDescentToggle = () => {
    setState((prev) => ({ ...prev, recursiveDescent: !prev.recursiveDescent }));
  };

  const handleApplyQuery = () => {
    if (state.mode === 'visual') {
      onQueryChange(generatedQuery);
    } else {
      onQueryChange(textQuery);
    }
    onClose();
  };

  const handleClearAll = () => {
    setState({
      mode: 'visual',
      rootPath: '$',
      filters: [],
      selectedPath: [],
      recursiveDescent: false,
    });
  };

  const handleModeToggle = () => {
    setState((prev) => ({
      ...prev,
      mode: prev.mode === 'visual' ? 'text' : 'visual',
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="absolute right-0 top-0 h-full w-full max-w-4xl bg-white dark:bg-gray-800 shadow-2xl transform transition-transform">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Visual Query Builder</h2>
              <p className="text-blue-100 text-sm mt-1">
                Build JSONPath queries without memorizing syntax
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              title="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Mode Toggle */}
          <div className="mt-4 flex items-center space-x-2">
            <button
              onClick={handleModeToggle}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7h12M8 12h12M8 17h12M3 7h.01M3 12h.01M3 17h.01"
                />
              </svg>
              <span>Switch to {state.mode === 'visual' ? 'Text' : 'Visual'} Mode</span>
            </button>

            <button
              onClick={handleClearAll}
              className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="h-[calc(100vh-180px)] overflow-y-auto">
          {state.mode === 'visual' ? (
            <div className="p-6 space-y-6">
              {/* Schema Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-500/30 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                      Data Schema Analyzed
                    </div>
                    <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      {schema.totalFields} fields discovered, max depth: {schema.depth}
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={state.recursiveDescent}
                        onChange={handleRecursiveDescentToggle}
                        className="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-blue-900 dark:text-blue-100">
                        Recursive Search (..)
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Fields and Options */}
                <div className="space-y-6">
                  {/* Field Selector */}
                  <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <FieldSelector
                      fields={schema.fields}
                      selectedPath={state.selectedPath}
                      onFieldSelect={handleFieldSelect}
                    />
                  </div>

                  {/* Array Slice Builder */}
                  <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                      Array Slice
                    </h3>
                    <div className="space-y-3">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!state.arraySlice}
                          onChange={(e) =>
                            handleArraySliceChange(e.target.checked ? {} : undefined)
                          }
                          className="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Enable array slicing
                        </span>
                      </label>

                      {state.arraySlice && (
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                              Start
                            </label>
                            <input
                              type="number"
                              value={state.arraySlice.start ?? ''}
                              onChange={(e) =>
                                handleArraySliceChange({
                                  ...state.arraySlice!,
                                  start: e.target.value ? parseInt(e.target.value) : undefined,
                                })
                              }
                              placeholder="0"
                              className="w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                              End
                            </label>
                            <input
                              type="number"
                              value={state.arraySlice.end ?? ''}
                              onChange={(e) =>
                                handleArraySliceChange({
                                  ...state.arraySlice!,
                                  end: e.target.value ? parseInt(e.target.value) : undefined,
                                })
                              }
                              placeholder="10"
                              className="w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                              Step
                            </label>
                            <input
                              type="number"
                              value={state.arraySlice.step ?? ''}
                              onChange={(e) =>
                                handleArraySliceChange({
                                  ...state.arraySlice!,
                                  step: e.target.value ? parseInt(e.target.value) : undefined,
                                })
                              }
                              placeholder="1"
                              className="w-full px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column - Filters and Preview */}
                <div className="space-y-6">
                  {/* Filter Builder */}
                  <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <FilterBuilder
                      filters={state.filters}
                      onFiltersChange={handleFilterChange}
                      availableFields={availableFields}
                    />
                  </div>

                  {/* Query Preview */}
                  <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <QueryPreview
                      query={generatedQuery}
                      onApply={handleApplyQuery}
                      isValid={isValid}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* Text Mode */
            <div className="p-6">
              <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Text Editor
                </h3>
                <textarea
                  value={textQuery}
                  onChange={(e) => setTextQuery(e.target.value)}
                  className="w-full h-64 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Enter JSONPath query..."
                  spellCheck={false}
                />
                <div className="mt-4">
                  <button
                    onClick={handleApplyQuery}
                    className="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all"
                  >
                    Apply Query
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QueryBuilder;
