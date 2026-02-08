/**
 * Analytics utility functions for calculating performance statistics
 */

import {
  QueryMetrics,
  PerformanceStats,
  PerformanceInsight,
  PerformanceDistribution,
} from '../types/analytics';

/**
 * Calculate query complexity score based on various factors
 */
export function calculateComplexityScore(query: string): number {
  let score = 1;

  // Filter expressions add complexity
  const filterCount = (query.match(/\?\(/g) || []).length;
  score += filterCount * 3;

  // Recursive descent adds complexity
  if (query.includes('..')) score += 2;

  // Array slicing adds complexity
  const sliceCount = (query.match(/\[\d*:\d*:?\d*\]/g) || []).length;
  score += sliceCount * 2;

  // Wildcards add complexity
  const wildcardCount = (query.match(/\*/g) || []).length;
  score += wildcardCount * 1.5;

  // Union operations add complexity
  const unionCount = (query.match(/,/g) || []).length;
  score += unionCount * 1;

  // Script expressions add complexity
  const scriptCount = (query.match(/\(\)/g) || []).length;
  score += scriptCount * 2;

  // Length contributes to complexity
  score += query.length / 10;

  return Math.round(score * 10) / 10;
}

/**
 * Calculate percentile value from sorted array
 */
function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;

  const index = (percentile / 100) * (sortedValues.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  const weight = index - lower;

  if (lower === upper) {
    return sortedValues[lower];
  }

  return sortedValues[lower] * (1 - weight) + sortedValues[upper] * weight;
}

/**
 * Calculate standard deviation
 */
function calculateStandardDeviation(values: number[], mean: number): number {
  if (values.length === 0) return 0;

  const squaredDiffs = values.map((value) => Math.pow(value - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Calculate comprehensive performance statistics
 */
export function calculateStats(metrics: QueryMetrics[]): PerformanceStats {
  if (metrics.length === 0) {
    return {
      mean: 0,
      median: 0,
      min: 0,
      max: 0,
      p50: 0,
      p75: 0,
      p90: 0,
      p95: 0,
      p99: 0,
      standardDeviation: 0,
      total: 0,
      count: 0,
    };
  }

  const times = metrics.map((m) => m.executionTime);
  const sortedTimes = [...times].sort((a, b) => a - b);

  const sum = times.reduce((acc, time) => acc + time, 0);
  const mean = sum / times.length;

  return {
    mean: Math.round(mean * 100) / 100,
    median: Math.round(calculatePercentile(sortedTimes, 50) * 100) / 100,
    min: Math.round(sortedTimes[0] * 100) / 100,
    max: Math.round(sortedTimes[sortedTimes.length - 1] * 100) / 100,
    p50: Math.round(calculatePercentile(sortedTimes, 50) * 100) / 100,
    p75: Math.round(calculatePercentile(sortedTimes, 75) * 100) / 100,
    p90: Math.round(calculatePercentile(sortedTimes, 90) * 100) / 100,
    p95: Math.round(calculatePercentile(sortedTimes, 95) * 100) / 100,
    p99: Math.round(calculatePercentile(sortedTimes, 99) * 100) / 100,
    standardDeviation: Math.round(calculateStandardDeviation(times, mean) * 100) / 100,
    total: Math.round(sum * 100) / 100,
    count: metrics.length,
  };
}

/**
 * Generate performance insights based on metrics
 */
export function generateInsights(metrics: QueryMetrics[], stats: PerformanceStats): PerformanceInsight[] {
  const insights: PerformanceInsight[] = [];

  if (metrics.length === 0) {
    insights.push({
      type: 'info',
      title: 'No Data Available',
      message: 'Start executing queries to see performance insights.',
    });
    return insights;
  }

  // Performance consistency insight
  if (stats.standardDeviation > stats.mean * 0.5) {
    insights.push({
      type: 'warning',
      title: 'High Variability',
      message: `Query execution times vary significantly (SD: ${stats.standardDeviation}ms).`,
      recommendation: 'Consider optimizing slow queries or reviewing complex patterns.',
    });
  } else if (stats.standardDeviation < stats.mean * 0.2) {
    insights.push({
      type: 'success',
      title: 'Consistent Performance',
      message: 'Query execution times are very consistent.',
    });
  }

  // Recent performance trend
  if (metrics.length >= 10) {
    const recentMetrics = metrics.slice(0, 10);
    const recentAvg = recentMetrics.reduce((sum, m) => sum + m.executionTime, 0) / recentMetrics.length;
    const percentChange = ((recentAvg - stats.mean) / stats.mean) * 100;

    if (percentChange < -10) {
      insights.push({
        type: 'success',
        title: 'Performance Improving',
        message: `Recent queries are ${Math.abs(Math.round(percentChange))}% faster than average.`,
      });
    } else if (percentChange > 10) {
      insights.push({
        type: 'warning',
        title: 'Performance Degrading',
        message: `Recent queries are ${Math.round(percentChange)}% slower than average.`,
        recommendation: 'Review recent query patterns for optimization opportunities.',
      });
    }
  }

  // Complexity insights
  const avgComplexity = metrics.reduce((sum, m) => sum + m.complexityScore, 0) / metrics.length;
  const highComplexityCount = metrics.filter((m) => m.complexityScore > avgComplexity * 1.5).length;

  if (highComplexityCount > metrics.length * 0.3) {
    insights.push({
      type: 'info',
      title: 'Complex Query Usage',
      message: `${Math.round((highComplexityCount / metrics.length) * 100)}% of queries are highly complex.`,
      recommendation: 'Consider caching results for complex queries or simplifying patterns.',
    });
  }

  // Speed insights
  if (stats.mean < 10) {
    insights.push({
      type: 'success',
      title: 'Excellent Performance',
      message: `Average query time is ${stats.mean}ms - very fast!`,
    });
  } else if (stats.mean > 100) {
    insights.push({
      type: 'warning',
      title: 'Slow Average Performance',
      message: `Average query time is ${stats.mean}ms.`,
      recommendation: 'Review query patterns and consider optimizations.',
    });
  }

  // Large result sets
  const avgResults = metrics.reduce((sum, m) => sum + m.resultCount, 0) / metrics.length;
  if (avgResults > 1000) {
    insights.push({
      type: 'info',
      title: 'Large Result Sets',
      message: `Queries return an average of ${Math.round(avgResults)} results.`,
      recommendation: 'Consider using more specific queries or pagination.',
    });
  }

  return insights;
}

/**
 * Calculate performance distribution for histogram
 */
export function calculateDistribution(metrics: QueryMetrics[]): PerformanceDistribution[] {
  if (metrics.length === 0) return [];

  const times = metrics.map((m) => m.executionTime);
  const max = Math.max(...times);
  const min = Math.min(...times);

  // Create 10 bins
  const binCount = 10;
  const binSize = (max - min) / binCount || 1;
  const bins: PerformanceDistribution[] = [];

  for (let i = 0; i < binCount; i++) {
    const rangeStart = min + i * binSize;
    const rangeEnd = min + (i + 1) * binSize;
    const count = times.filter((t) => t >= rangeStart && (i === binCount - 1 ? t <= rangeEnd : t < rangeEnd)).length;

    bins.push({
      range: `${rangeStart.toFixed(1)}-${rangeEnd.toFixed(1)}ms`,
      count,
      percentage: Math.round((count / metrics.length) * 100),
    });
  }

  return bins;
}

/**
 * Format execution time with appropriate unit
 */
export function formatExecutionTime(ms: number): string {
  if (ms < 1) {
    return `${(ms * 1000).toFixed(0)}μs`;
  } else if (ms < 1000) {
    return `${ms.toFixed(2)}ms`;
  } else {
    return `${(ms / 1000).toFixed(2)}s`;
  }
}

/**
 * Export analytics data as JSON
 */
export function exportAsJSON(metrics: QueryMetrics[], stats: PerformanceStats): string {
  const exportData = {
    exportDate: new Date().toISOString(),
    summary: stats,
    queries: metrics.map((m) => ({
      query: m.query,
      executionTime: m.executionTime,
      resultCount: m.resultCount,
      complexityScore: m.complexityScore,
      timestamp: new Date(m.timestamp).toISOString(),
    })),
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Export analytics data as CSV
 */
export function exportAsCSV(metrics: QueryMetrics[]): string {
  const headers = ['Timestamp', 'Query', 'Execution Time (ms)', 'Result Count', 'Complexity Score'];
  const rows = metrics.map((m) => [
    new Date(m.timestamp).toISOString(),
    `"${m.query.replace(/"/g, '""')}"`,
    m.executionTime.toFixed(2),
    m.resultCount,
    m.complexityScore,
  ]);

  return [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
}

/**
 * Download data as file
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
