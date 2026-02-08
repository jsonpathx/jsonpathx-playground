/**
 * Custom hook for tracking and analyzing query performance metrics
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  QueryMetrics,
  PerformanceAnalytics,
  ExportFormat,
} from '../types/analytics';
import {
  calculateComplexityScore,
  calculateStats,
  generateInsights,
  calculateDistribution,
  exportAsJSON,
  exportAsCSV,
  downloadFile,
} from '../utils/analytics-utils';

const STORAGE_KEY = 'jsonpathx_performance_analytics';
const MAX_METRICS = 100; // Keep last 100 queries to prevent memory issues

interface UsePerformanceAnalyticsResult {
  analytics: PerformanceAnalytics;
  addMetric: (query: string, executionTime: number, resultCount: number) => void;
  clearAnalytics: () => void;
  exportData: (format: ExportFormat) => void;
  hasData: boolean;
  distribution: ReturnType<typeof calculateDistribution>;
}

/**
 * Load metrics from localStorage
 */
function loadMetrics(): QueryMetrics[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error loading performance analytics:', error);
    return [];
  }
}

/**
 * Save metrics to localStorage
 */
function saveMetrics(metrics: QueryMetrics[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(metrics));
  } catch (error) {
    console.error('Error saving performance analytics:', error);
  }
}

/**
 * Hook for managing performance analytics
 */
export function usePerformanceAnalytics(): UsePerformanceAnalyticsResult {
  const [metrics, setMetrics] = useState<QueryMetrics[]>(() => loadMetrics());

  // Persist metrics to localStorage whenever they change
  useEffect(() => {
    saveMetrics(metrics);
  }, [metrics]);

  /**
   * Add a new performance metric
   */
  const addMetric = useCallback((query: string, executionTime: number, resultCount: number) => {
    if (!query.trim() || executionTime < 0 || resultCount < 0) return;

    const newMetric: QueryMetrics = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      query,
      executionTime: Math.round(executionTime * 100) / 100,
      resultCount,
      timestamp: Date.now(),
      complexityScore: calculateComplexityScore(query),
    };

    setMetrics((prevMetrics) => {
      // Add to beginning and limit to MAX_METRICS
      const updatedMetrics = [newMetric, ...prevMetrics].slice(0, MAX_METRICS);
      return updatedMetrics;
    });
  }, []);

  /**
   * Clear all analytics data
   */
  const clearAnalytics = useCallback(() => {
    setMetrics([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing analytics:', error);
    }
  }, []);

  /**
   * Export analytics data
   */
  const exportData = useCallback(
    (format: ExportFormat) => {
      if (metrics.length === 0) {
        alert('No analytics data to export');
        return;
      }

      const timestamp = new Date().toISOString().split('T')[0];
      const stats = calculateStats(metrics);

      if (format === 'json') {
        const json = exportAsJSON(metrics, stats);
        downloadFile(json, `jsonpathx-analytics-${timestamp}.json`, 'application/json');
      } else if (format === 'csv') {
        const csv = exportAsCSV(metrics);
        downloadFile(csv, `jsonpathx-analytics-${timestamp}.csv`, 'text/csv');
      }
    },
    [metrics]
  );

  /**
   * Calculate comprehensive analytics
   */
  const analytics: PerformanceAnalytics = useMemo(() => {
    const stats = calculateStats(metrics);
    const insights = generateInsights(metrics, stats);

    // Calculate trends
    let trends = {
      improving: false,
      recentAverage: 0,
      overallAverage: stats.mean,
      percentChange: 0,
    };

    if (metrics.length >= 10) {
      const recentMetrics = metrics.slice(0, 10);
      const recentAverage = recentMetrics.reduce((sum, m) => sum + m.executionTime, 0) / recentMetrics.length;
      const percentChange = ((recentAverage - stats.mean) / stats.mean) * 100;

      trends = {
        improving: percentChange < 0,
        recentAverage: Math.round(recentAverage * 100) / 100,
        overallAverage: stats.mean,
        percentChange: Math.round(percentChange * 100) / 100,
      };
    }

    // Get top queries
    const sortedByTime = [...metrics].sort((a, b) => a.executionTime - b.executionTime);
    const sortedByComplexity = [...metrics].sort((a, b) => b.complexityScore - a.complexityScore);
    const sortedByResults = [...metrics].sort((a, b) => b.resultCount - a.resultCount);

    const topQueries = {
      fastest: sortedByTime.slice(0, 5),
      slowest: sortedByTime.slice(-5).reverse(),
      mostComplex: sortedByComplexity.slice(0, 5),
      mostResults: sortedByResults.slice(0, 5),
    };

    return {
      metrics,
      stats,
      trends,
      topQueries,
      insights,
    } as PerformanceAnalytics;
  }, [metrics]);

  const distribution = useMemo(() => calculateDistribution(metrics), [metrics]);

  return {
    analytics,
    addMetric,
    clearAnalytics,
    exportData,
    hasData: metrics.length > 0,
    distribution,
  };
}
