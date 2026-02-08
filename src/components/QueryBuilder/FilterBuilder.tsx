import { FilterCondition, LogicalOperator } from '../../types/query-builder';
import { OperatorSelector, LogicalOperatorSelector } from './OperatorSelector';

interface FilterBuilderProps {
  filters: FilterCondition[];
  onFiltersChange: (filters: FilterCondition[]) => void;
  availableFields: string[];
}

const FilterBuilder = ({ filters, onFiltersChange, availableFields }: FilterBuilderProps) => {
  const addFilter = () => {
    const newFilter: FilterCondition = {
      id: Math.random().toString(36).substr(2, 9),
      property: availableFields[0] || '',
      operator: '==',
      value: '',
      logicalOperator: filters.length > 0 ? 'AND' : undefined,
    };
    onFiltersChange([...filters, newFilter]);
  };

  const removeFilter = (id: string) => {
    const newFilters = filters.filter((f) => f.id !== id);
    // Remove logical operator from first filter if it exists
    if (newFilters.length > 0 && newFilters[0].logicalOperator) {
      newFilters[0] = { ...newFilters[0], logicalOperator: undefined };
    }
    onFiltersChange(newFilters);
  };

  const updateFilter = (id: string, updates: Partial<FilterCondition>) => {
    onFiltersChange(
      filters.map((f) => (f.id === id ? { ...f, ...updates } : f))
    );
  };

  const updateLogicalOperator = (id: string, operator: LogicalOperator) => {
    updateFilter(id, { logicalOperator: operator });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Filter Conditions
        </h3>
        <button
          onClick={addFilter}
          disabled={availableFields.length === 0}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-xs font-medium rounded-lg transition-colors flex items-center space-x-1"
        >
          <span>+</span>
          <span>Add Filter</span>
        </button>
      </div>

      {filters.length === 0 ? (
        <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-6 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
          No filters added yet. Click "Add Filter" to start.
        </div>
      ) : (
        <div className="space-y-2">
          {filters.map((filter, index) => (
            <div key={filter.id} className="space-y-2">
              {/* Logical Operator (for filters after the first one) */}
              {index > 0 && filter.logicalOperator && (
                <div className="flex justify-center">
                  <LogicalOperatorSelector
                    value={filter.logicalOperator}
                    onChange={(op) => updateLogicalOperator(filter.id, op)}
                    className="w-24"
                  />
                </div>
              )}

              {/* Filter Condition */}
              <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                    Condition {index + 1}
                  </span>
                  <button
                    onClick={() => removeFilter(filter.id)}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs font-medium"
                    title="Remove filter"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-12 gap-2">
                  {/* Property Selection */}
                  <div className="col-span-4">
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Property
                    </label>
                    <select
                      value={filter.property}
                      onChange={(e) => updateFilter(filter.id, { property: e.target.value })}
                      className="w-full px-2 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      {availableFields.length === 0 ? (
                        <option>No fields</option>
                      ) : (
                        availableFields.map((field) => (
                          <option key={field} value={field}>
                            {field}
                          </option>
                        ))
                      )}
                    </select>
                  </div>

                  {/* Operator Selection */}
                  <div className="col-span-4">
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Operator
                    </label>
                    <OperatorSelector
                      value={filter.operator}
                      onChange={(op) => updateFilter(filter.id, { operator: op })}
                      className="w-full"
                    />
                  </div>

                  {/* Value Input */}
                  <div className="col-span-4">
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Value
                    </label>
                    <input
                      type="text"
                      value={filter.value}
                      onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                      disabled={filter.operator === 'exists'}
                      placeholder={filter.operator === 'exists' ? 'N/A' : 'Enter value...'}
                      className="w-full px-2 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Filter Preview */}
                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Preview:</span>{' '}
                    <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono">
                      @.{filter.property} {filter.operator}{' '}
                      {filter.operator !== 'exists' && `'${filter.value}'`}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Help Text */}
      {filters.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <div className="font-semibold mb-1">Tips:</div>
            <ul className="space-y-1 list-disc list-inside">
              <li>Use AND to match all conditions</li>
              <li>Use OR to match any condition</li>
              <li>String comparisons are case-sensitive (except 'contains')</li>
              <li>Use regex for complex pattern matching</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterBuilder;
