export type OperatorType = '==' | '!=' | '<' | '>' | '<=' | '>=' | 'contains' | 'regex' | 'exists';
export type LogicalOperator = 'AND' | 'OR';

export interface FilterCondition {
  id: string;
  property: string;
  operator: OperatorType;
  value: string;
  logicalOperator?: LogicalOperator;
}

export interface ArraySlice {
  start?: number;
  end?: number;
  step?: number;
}

export interface QueryBuilderState {
  mode: 'visual' | 'text';
  rootPath: string;
  filters: FilterCondition[];
  arraySlice?: ArraySlice;
  recursiveDescent: boolean;
  selectedPath: string[];
}

export interface FieldNode {
  name: string;
  path: string;
  type: 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null';
  children?: FieldNode[];
  isArray?: boolean;
  arrayItemType?: string;
}

export interface SchemaAnalysis {
  fields: FieldNode[];
  depth: number;
  totalFields: number;
}

export interface QueryBuilderProps {
  data: unknown;
  currentQuery: string;
  onQueryChange: (query: string) => void;
}
