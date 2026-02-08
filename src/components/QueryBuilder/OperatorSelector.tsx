import { OperatorType, LogicalOperator } from '../../types/query-builder';

interface OperatorSelectorProps {
  value: OperatorType;
  onChange: (operator: OperatorType) => void;
  className?: string;
}

interface LogicalOperatorSelectorProps {
  value: LogicalOperator;
  onChange: (operator: LogicalOperator) => void;
  className?: string;
}

const operators: { value: OperatorType; label: string; description: string }[] = [
  { value: '==', label: 'Equals (==)', description: 'Exact match' },
  { value: '!=', label: 'Not Equals (!=)', description: 'Does not match' },
  { value: '<', label: 'Less Than (<)', description: 'Numeric comparison' },
  { value: '>', label: 'Greater Than (>)', description: 'Numeric comparison' },
  { value: '<=', label: 'Less or Equal (<=)', description: 'Numeric comparison' },
  { value: '>=', label: 'Greater or Equal (>=)', description: 'Numeric comparison' },
  { value: 'contains', label: 'Contains', description: 'String contains (case-insensitive)' },
  { value: 'regex', label: 'Regex Match', description: 'Regular expression pattern' },
  { value: 'exists', label: 'Exists', description: 'Property exists' },
];

export const OperatorSelector = ({ value, onChange, className = '' }: OperatorSelectorProps) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as OperatorType)}
      className={`px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${className}`}
      title={operators.find((op) => op.value === value)?.description}
    >
      {operators.map((op) => (
        <option key={op.value} value={op.value}>
          {op.label}
        </option>
      ))}
    </select>
  );
};

export const LogicalOperatorSelector = ({
  value,
  onChange,
  className = '',
}: LogicalOperatorSelectorProps) => {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as LogicalOperator)}
      className={`px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-semibold text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${className}`}
    >
      <option value="AND">AND</option>
      <option value="OR">OR</option>
    </select>
  );
};

export default OperatorSelector;
