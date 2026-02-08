/**
 * Performance Analytics Dashboard Component
 * Comprehensive performance tracking and visualization
 */

import React, { useState } from 'react';
import { usePerformanceAnalytics } from '../../hooks/usePerformanceAnalytics';
import { MetricsCard } from './MetricsCard';
import { ExecutionTimeChart } from './ExecutionTimeChart';
import { QueryLeaderboard } from './QueryLeaderboard';
import { formatExecutionTime } from '../../utils/analytics-utils';

interface PerformanceAnalyticsProps {
  isOpen: boolean;
  onClose: () => void;
}

const insightIcons = {
  success: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

const insightColors = {
  success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
  warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200',
  info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
  error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
};

export const PerformanceAnalytics: React.FC<PerformanceAnalyticsProps> = ({ isOpen, onClose }) => {
  const { analytics, clearAnalytics, exportData, hasData, distribution } = usePerformanceAnalytics();
  const [showExportMenu, setShowExportMenu] = useState(false);

  const { stats, trends, topQueries, insights } = analytics;

  const handleClearData = () => {
    if (window.confirm('Are you sure you want to clear all analytics data? This cannot be undone.')) {
      clearAnalytics();
    }
  };

  const handleExport = (format: 'json' | 'csv') => {
    exportData(format);
    setShowExportMenu(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm">
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-7xl mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Performance Analytics</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Comprehensive query performance metrics and insights
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6 max-h-[calc(100vh-12rem)] overflow-y-auto">
            {!hasData ? (
              <div className="text-center py-12">
                <svg
                  className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No Analytics Data</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Execute some queries to start collecting performance metrics.
                </p>
              </div>
            ) : (
              <>
                {/* Metrics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <MetricsCard
                    title="Average Time"
                    value={stats.mean}
                    isTime
                    subtitle={`Across ${stats.count} queries`}
                    variant="primary"
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    }
                  />
                  <MetricsCard
                    title="Fastest Query"
                    value={stats.min}
                    isTime
                    variant="success"
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 10V3L4 14h7v7l9-11h-7z"
                        />
                      </svg>
                    }
                  />
                  <MetricsCard
                    title="Slowest Query"
                    value={stats.max}
                    isTime
                    variant="warning"
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    }
                  />
                  <MetricsCard
                    title="Median Time"
                    value={stats.median}
                    isTime
                    subtitle="50th percentile"
                    variant="default"
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                      </svg>
                    }
                  />
                </div>

                {/* Trends Card */}
                {trends.recentAverage > 0 && (
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-1">Performance Trend</h4>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Based on last 10 queries</p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center gap-2">
                          {trends.improving ? (
                            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                            </svg>
                          )}
                          <span
                            className={`text-lg font-bold ${
                              trends.improving ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                            }`}
                          >
                            {trends.improving ? '-' : '+'}
                            {Math.abs(trends.percentChange).toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                          Recent: {formatExecutionTime(trends.recentAverage)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Percentile Statistics */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Percentile Distribution</h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                      { label: 'P50', value: stats.p50 },
                      { label: 'P75', value: stats.p75 },
                      { label: 'P90', value: stats.p90 },
                      { label: 'P95', value: stats.p95 },
                      { label: 'P99', value: stats.p99 },
                    ].map((percentile) => (
                      <div key={percentile.label} className="text-center">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{percentile.label}</div>
                        <div className="text-lg font-semibold text-gray-900 dark:text-white">
                          {formatExecutionTime(percentile.value)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Execution Time Chart */}
                <ExecutionTimeChart metrics={analytics.metrics} limit={20} />

                {/* Distribution Histogram */}
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Distribution</h3>
                  {distribution.length > 0 ? (
                    <div className="space-y-2">
                      {distribution.map((bin, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="w-32 text-xs text-gray-600 dark:text-gray-400">{bin.range}</div>
                          <div className="flex-1">
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 dark:from-blue-400 dark:to-indigo-400 transition-all duration-500"
                                style={{ width: `${bin.percentage}%` }}
                              />
                            </div>
                          </div>
                          <div className="w-16 text-sm font-medium text-gray-900 dark:text-white text-right">
                            {bin.count} ({bin.percentage}%)
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400 py-4">No distribution data available</div>
                  )}
                </div>

                {/* Query Leaderboard */}
                <QueryLeaderboard
                  fastest={topQueries.fastest}
                  slowest={topQueries.slowest}
                  mostComplex={topQueries.mostComplex}
                  mostResults={topQueries.mostResults}
                />

                {/* Insights */}
                {insights.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Performance Insights</h3>
                    {insights.map((insight, index: number) => (
                      <div key={index} className={`border rounded-lg p-4 ${insightColors[insight.type as keyof typeof insightColors]}`}>
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">{insightIcons[insight.type as keyof typeof insightIcons]}</div>
                          <div className="flex-1">
                            <h4 className="font-semibold mb-1">{insight.title}</h4>
                            <p className="text-sm opacity-90">{insight.message}</p>
                            {insight.recommendation && (
                              <p className="text-sm mt-2 font-medium opacity-95">
                                💡 {insight.recommendation}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <button
                onClick={handleClearData}
                disabled={!hasData}
                className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-300 dark:border-red-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear Data
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={!hasData}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Export Data
                </button>
                {showExportMenu && (
                  <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[120px]">
                    <button
                      onClick={() => handleExport('json')}
                      className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Export as JSON
                    </button>
                    <button
                      onClick={() => handleExport('csv')}
                      className="w-full px-4 py-2 text-sm text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Export as CSV
                    </button>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
