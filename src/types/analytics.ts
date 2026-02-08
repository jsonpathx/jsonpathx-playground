/**
 * Performance analytics types for tracking query execution metrics
 */

export interface QueryMetrics {
  id: string;
  query: string;
  executionTime: number;
  resultCount: number;
  timestamp: number;
  complexityScore: number;
  memoryUsage?: number;
}

export interface PerformanceStats {
  mean: number;
  median: number;
  min: number;
  max: number;
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  standardDeviation: number;
  total: number;
  count: number;
}

export interface PerformanceAnalytics {
  metrics: QueryMetrics[];
  stats: PerformanceStats;
  trends: {
    improving: boolean;
    recentAverage: number;
    overallAverage: number;
    percentChange: number;
  };
  topQueries: {
    fastest: QueryMetrics[];
    slowest: QueryMetrics[];
    mostComplex: QueryMetrics[];
    mostResults: QueryMetrics[];
  };
  insights: PerformanceInsight[];
}

export interface PerformanceInsight {
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  recommendation?: string;
}

export type ExportFormat = 'json' | 'csv';

export interface ChartDataPoint {
  x: number;
  y: number;
  label: string;
  query: string;
}

export interface PerformanceDistribution {
  range: string;
  count: number;
  percentage: number;
}
