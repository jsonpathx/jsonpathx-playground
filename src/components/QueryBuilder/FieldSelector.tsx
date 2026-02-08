import { useState } from 'react';
import { FieldNode } from '../../types/query-builder';

interface FieldSelectorProps {
  fields: FieldNode[];
  selectedPath: string[];
  onFieldSelect: (path: string[]) => void;
}

const FieldSelector = ({ fields, selectedPath, onFieldSelect }: FieldSelectorProps) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));

  const toggleExpand = (path: string) => {
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleFieldClick = (field: FieldNode) => {
    // Extract path components from the field path
    const pathParts = field.path
      .replace(/^\$\.?/, '') // Remove root $
      .replace(/\[\*\]/g, '') // Remove array wildcards
      .replace(/\.$/, '') // Remove trailing dot
      .split('.');

    onFieldSelect(pathParts.filter(Boolean));
  };

  const isSelected = (field: FieldNode) => {
    const pathParts = field.path
      .replace(/^\$\.?/, '')
      .replace(/\[\*\]/g, '')
      .replace(/\.$/, '')
      .split('.');
    return JSON.stringify(pathParts.filter(Boolean)) === JSON.stringify(selectedPath);
  };

  const getTypeIcon = (type: FieldNode['type'], isArray?: boolean) => {
    if (isArray) return '[]';
    switch (type) {
      case 'object':
        return '{}';
      case 'array':
        return '[]';
      case 'string':
        return '"';
      case 'number':
        return '#';
      case 'boolean':
        return 'T/F';
      case 'null':
        return 'null';
      default:
        return '?';
    }
  };

  const getTypeColor = (type: FieldNode['type'], isArray?: boolean) => {
    if (isArray) return 'text-purple-600 dark:text-purple-400';
    switch (type) {
      case 'object':
        return 'text-blue-600 dark:text-blue-400';
      case 'array':
        return 'text-purple-600 dark:text-purple-400';
      case 'string':
        return 'text-green-600 dark:text-green-400';
      case 'number':
        return 'text-orange-600 dark:text-orange-400';
      case 'boolean':
        return 'text-pink-600 dark:text-pink-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const renderField = (field: FieldNode, depth: number = 0) => {
    const hasChildren = field.children && field.children.length > 0;
    const isExpanded = expandedNodes.has(field.path);
    const selected = isSelected(field);

    return (
      <div key={field.path} className="select-none">
        <div
          className={`flex items-center py-1.5 px-2 rounded cursor-pointer transition-colors group ${
            selected
              ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100'
              : 'hover:bg-gray-100 dark:hover:bg-gray-700/50'
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => handleFieldClick(field)}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(field.path);
              }}
              className="mr-1 flex-shrink-0 w-4 h-4 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              {isExpanded ? '▼' : '▶'}
            </button>
          )}
          {!hasChildren && <span className="w-4 mr-1" />}

          <span
            className={`text-xs font-mono mr-2 flex-shrink-0 ${getTypeColor(
              field.type,
              field.isArray
            )}`}
            title={field.isArray ? `Array of ${field.arrayItemType}` : field.type}
          >
            {getTypeIcon(field.type, field.isArray)}
          </span>

          <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {field.name}
          </span>

          {field.isArray && (
            <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
              [{field.arrayItemType}]
            </span>
          )}
        </div>

        {hasChildren && isExpanded && (
          <div>
            {field.children!.map((child) => renderField(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Available Fields
        </h3>
        <button
          onClick={() => setExpandedNodes(new Set(['root']))}
          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
        >
          Collapse All
        </button>
      </div>

      <div className="max-h-96 overflow-y-auto space-y-0.5 pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
        {fields.length === 0 ? (
          <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            No fields available. Load data first.
          </div>
        ) : (
          fields.map((field) => renderField(field, 0))
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-blue-600 dark:text-blue-400 font-mono">{'{}'}</span>
            <span>Object</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-purple-600 dark:text-purple-400 font-mono">[]</span>
            <span>Array</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-green-600 dark:text-green-400 font-mono">"</span>
            <span>String</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-orange-600 dark:text-orange-400 font-mono">#</span>
            <span>Number</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldSelector;
