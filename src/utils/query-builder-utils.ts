import { FieldNode, SchemaAnalysis, FilterCondition, ArraySlice } from '../types/query-builder';

/**
 * Extracts the schema structure from JSON data
 */
export function analyzeSchema(data: unknown, maxDepth: number = 3): SchemaAnalysis {
  const fields: FieldNode[] = [];
  let totalFields = 0;
  let maxDepthReached = 0;

  function getType(value: unknown): FieldNode['type'] {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value as FieldNode['type'];
  }

  function analyzeValue(
    value: unknown,
    name: string,
    path: string,
    depth: number
  ): FieldNode | null {
    if (depth > maxDepth) return null;

    totalFields++;
    maxDepthReached = Math.max(maxDepthReached, depth);

    const type = getType(value);
    const node: FieldNode = {
      name,
      path,
      type,
    };

    if (Array.isArray(value)) {
      node.isArray = true;
      if (value.length > 0) {
        const firstItem = value[0];
        node.arrayItemType = getType(firstItem);

        // Analyze the structure of array items (use first item as template)
        if (typeof firstItem === 'object' && firstItem !== null) {
          const children: FieldNode[] = [];
          Object.keys(firstItem).forEach((key) => {
            const childNode = analyzeValue(
              (firstItem as Record<string, unknown>)[key],
              key,
              `${path}[*].${key}`,
              depth + 1
            );
            if (childNode) children.push(childNode);
          });
          node.children = children;
        }
      }
    } else if (typeof value === 'object' && value !== null) {
      const children: FieldNode[] = [];
      Object.keys(value).forEach((key) => {
        const childNode = analyzeValue(
          (value as Record<string, unknown>)[key],
          key,
          path ? `${path}.${key}` : key,
          depth + 1
        );
        if (childNode) children.push(childNode);
      });
      node.children = children;
    }

    return node;
  }

  // Handle root array
  if (Array.isArray(data)) {
    const rootNode = analyzeValue(data, 'root', '$', 0);
    if (rootNode && rootNode.children) {
      fields.push(...rootNode.children);
    }
  } else if (typeof data === 'object' && data !== null) {
    Object.keys(data).forEach((key) => {
      const node = analyzeValue(
        (data as Record<string, unknown>)[key],
        key,
        `$.${key}`,
        0
      );
      if (node) fields.push(node);
    });
  }

  return {
    fields,
    depth: maxDepthReached,
    totalFields,
  };
}

/**
 * Generates a JSONPath query from filter conditions
 */
export function generateFilterExpression(filters: FilterCondition[]): string {
  if (filters.length === 0) return '';

  const conditions = filters.map((filter, index) => {
    let condition = '';

    // Add logical operator (except for first condition)
    if (index > 0 && filter.logicalOperator) {
      condition = filter.logicalOperator === 'AND' ? ' && ' : ' || ';
    }

    // Generate the filter expression based on operator
    const prop = `@.${filter.property}`;
    const value = isNaN(Number(filter.value)) ? `'${filter.value}'` : filter.value;

    switch (filter.operator) {
      case '==':
        condition += `${prop} == ${value}`;
        break;
      case '!=':
        condition += `${prop} != ${value}`;
        break;
      case '<':
        condition += `${prop} < ${value}`;
        break;
      case '>':
        condition += `${prop} > ${value}`;
        break;
      case '<=':
        condition += `${prop} <= ${value}`;
        break;
      case '>=':
        condition += `${prop} >= ${value}`;
        break;
      case 'contains':
        condition += `${prop} =~ /${filter.value}/i`;
        break;
      case 'regex':
        condition += `${prop} =~ /${filter.value}/`;
        break;
      case 'exists':
        condition += prop;
        break;
      default:
        condition += `${prop} == ${value}`;
    }

    return condition;
  }).join('');

  return `[?(${conditions})]`;
}

/**
 * Generates array slice notation
 */
export function generateArraySlice(slice: ArraySlice): string {
  const start = slice.start ?? '';
  const end = slice.end ?? '';
  const step = slice.step;

  if (step) {
    return `[${start}:${end}:${step}]`;
  }

  if (start !== '' || end !== '') {
    return `[${start}:${end}]`;
  }

  return '[*]';
}

/**
 * Builds complete JSONPath query from components
 */
export function buildJsonPathQuery(
  rootPath: string,
  selectedPath: string[],
  filters: FilterCondition[],
  arraySlice?: ArraySlice,
  recursiveDescent: boolean = false
): string {
  let query = rootPath || '$';

  // Add recursive descent if enabled
  if (recursiveDescent && selectedPath.length > 0) {
    query += '..';
  }

  // Add selected path
  if (selectedPath.length > 0) {
    const pathStr = selectedPath.join('.');
    if (query.endsWith('$')) {
      query += `.${pathStr}`;
    } else if (!query.endsWith('..')) {
      query += `.${pathStr}`;
    } else {
      query += pathStr;
    }
  }

  // Add array slice or wildcard
  if (arraySlice) {
    query += generateArraySlice(arraySlice);
  }

  // Add filters
  if (filters.length > 0) {
    const filterExpr = generateFilterExpression(filters);
    query += filterExpr;
  }

  return query;
}

/**
 * Parses a JSONPath query into components (basic parsing)
 */
export function parseJsonPathQuery(query: string): {
  rootPath: string;
  filters: FilterCondition[];
  hasArraySlice: boolean;
  recursiveDescent: boolean;
} {
  const filters: FilterCondition[] = [];
  let hasArraySlice = false;
  let recursiveDescent = false;
  let rootPath = '$';

  // Check for recursive descent
  if (query.includes('..')) {
    recursiveDescent = true;
  }

  // Check for array slice
  if (/\[\d*:\d*(:\d+)?\]/.test(query)) {
    hasArraySlice = true;
  }

  // Extract filters (basic regex pattern)
  const filterMatch = query.match(/\[\?\((.*?)\)\]/);
  if (filterMatch) {
    const filterStr = filterMatch[1];

    // Split by && or || (basic parsing)
    const conditions = filterStr.split(/(\s*&&\s*|\s*\|\|\s*)/);
    let currentLogical: 'AND' | 'OR' | undefined;

    conditions.forEach((cond) => {
      const trimmed = cond.trim();

      if (trimmed === '&&') {
        currentLogical = 'AND';
      } else if (trimmed === '||') {
        currentLogical = 'OR';
      } else if (trimmed) {
        // Parse individual condition
        const match = trimmed.match(/@\.(\w+)\s*(==|!=|<=?|>=?|=~)\s*(.+)/);
        if (match) {
          const [, property, operator, value] = match;
          filters.push({
            id: Math.random().toString(36).substr(2, 9),
            property,
            operator: operator as FilterCondition['operator'],
            value: value.replace(/['"]/g, ''),
            logicalOperator: currentLogical,
          });
          currentLogical = undefined;
        }
      }
    });
  }

  return {
    rootPath,
    filters,
    hasArraySlice,
    recursiveDescent,
  };
}

/**
 * Gets human-readable description of a query
 */
export function getQueryDescription(query: string): string {
  if (!query || query === '$') {
    return 'Root object';
  }

  const parts: string[] = [];

  if (query.includes('..')) {
    parts.push('Recursive search');
  }

  if (query.includes('[*]')) {
    parts.push('All array items');
  }

  const sliceMatch = query.match(/\[(\d+):(\d+)\]/);
  if (sliceMatch) {
    parts.push(`Items ${sliceMatch[1]} to ${sliceMatch[2]}`);
  }

  const filterMatch = query.match(/\[\?\((.*?)\)\]/);
  if (filterMatch) {
    parts.push('with filters');
  }

  if (parts.length === 0) {
    return 'Property selection';
  }

  return parts.join(', ');
}

/**
 * Validates if a JSONPath query is syntactically valid
 */
export function isValidJsonPath(query: string): boolean {
  if (!query) return false;

  // Must start with $ or @
  if (!query.startsWith('$') && !query.startsWith('@')) {
    return false;
  }

  // Check for balanced brackets
  const brackets = query.match(/[\[\]()]/g) || [];
  let depth = 0;
  for (const bracket of brackets) {
    if (bracket === '[' || bracket === '(') depth++;
    if (bracket === ']' || bracket === ')') depth--;
    if (depth < 0) return false;
  }

  return depth === 0;
}

/**
 * Suggests completions for a partial query
 */
export function suggestCompletions(
  partialQuery: string,
  schema: SchemaAnalysis
): string[] {
  const suggestions: string[] = [];

  // If query is empty or just '$', suggest root fields
  if (!partialQuery || partialQuery === '$') {
    schema.fields.forEach((field) => {
      suggestions.push(`$.${field.name}`);
    });
  }

  return suggestions;
}
