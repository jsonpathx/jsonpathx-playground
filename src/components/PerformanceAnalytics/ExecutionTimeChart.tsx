/**
 * Execution Time Chart Component - Line chart showing query performance over time
 */

import React, { useMemo } from 'react';
import { QueryMetrics } from '../../types/analytics';
import { formatExecutionTime } from '../../utils/analytics-utils';

interface ExecutionTimeChartProps {
  metrics: QueryMetrics[];
  limit?: number;
}

export const ExecutionTimeChart: React.FC<ExecutionTimeChartProps> = ({ metrics, limit = 20 }) => {
  const chartData = useMemo(() => {
    const limitedMetrics = metrics.slice(0, limit).reverse(); // Most recent on right
    if (limitedMetrics.length === 0) return null;

    const maxTime = Math.max(...limitedMetrics.map((m) => m.executionTime));
    const minTime = Math.min(...limitedMetrics.map((m) => m.executionTime));
    const range = maxTime - minTime;

    return {
      metrics: limitedMetrics,
      maxTime,
      minTime,
      range: range || 1, // Avoid division by zero
    };
  }, [metrics, limit]);

  if (!chartData || chartData.metrics.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Execution Time Trend</h3>
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          No data available. Execute queries to see the trend.
        </div>
      </div>
    );
  }

  const { metrics: limitedMetrics, maxTime, minTime, range } = chartData;
  const avgTime = limitedMetrics.reduce((sum, m) => sum + m.executionTime, 0) / limitedMetrics.length;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Execution Time Trend</h3>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Last {limitedMetrics.length} queries
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative h-64 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between text-xs text-gray-600 dark:text-gray-400 pr-2">
          <span>{formatExecutionTime(maxTime)}</span>
          <span>{formatExecutionTime((maxTime + minTime) / 2)}</span>
          <span>{formatExecutionTime(minTime)}</span>
        </div>

        {/* Chart area */}
        <div className="ml-16 h-full relative">
          {/* Average line */}
          <div
            className="absolute left-0 right-0 border-t-2 border-dashed border-blue-300 dark:border-blue-700"
            style={{
              bottom: `${((avgTime - minTime) / range) * 100}%`,
            }}
          >
            <span className="absolute right-0 -top-4 text-xs text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-800 px-1 rounded">
              Avg
            </span>
          </div>

          {/* Line chart */}
          <svg className="w-full h-full" preserveAspectRatio="none">
            {/* Grid lines */}
            <line
              x1="0"
              y1="0%"
              x2="100%"
              y2="0%"
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-700"
              strokeWidth="1"
            />
            <line
              x1="0"
              y1="50%"
              x2="100%"
              y2="50%"
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-700"
              strokeWidth="1"
            />
            <line
              x1="0"
              y1="100%"
              x2="100%"
              y2="100%"
              stroke="currentColor"
              className="text-gray-300 dark:text-gray-700"
              strokeWidth="1"
            />

            {/* Line path */}
            <polyline
              points={limitedMetrics
                .map((metric, index) => {
                  const x = (index / (limitedMetrics.length - 1)) * 100;
                  const y = 100 - ((metric.executionTime - minTime) / range) * 100;
                  return `${x},${y}`;
                })
                .join(' ')}
              fill="none"
              stroke="currentColor"
              className="text-blue-500 dark:text-blue-400"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Area fill */}
            <polygon
              points={`0,100 ${limitedMetrics
                .map((metric, index) => {
                  const x = (index / (limitedMetrics.length - 1)) * 100;
                  const y = 100 - ((metric.executionTime - minTime) / range) * 100;
                  return `${x},${y}`;
                })
                .join(' ')} 100,100`}
              fill="currentColor"
              className="text-blue-500/10 dark:text-blue-400/10"
            />

            {/* Data points */}
            {limitedMetrics.map((metric, index) => {
              const x = (index / (limitedMetrics.length - 1)) * 100;
              const y = 100 - ((metric.executionTime - minTime) / range) * 100;
              return (
                <g key={metric.id}>
                  <circle
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="4"
                    fill="white"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="dark:fill-gray-800 text-blue-500 dark:text-blue-400"
                  />
                  <title>
                    {metric.query}
                    {'\n'}
                    {formatExecutionTime(metric.executionTime)}
                    {'\n'}
                    {new Date(metric.timestamp).toLocaleTimeString()}
                  </title>
                </g>
              );
            })}
          </svg>
        </div>

        {/* X-axis labels */}
        <div className="ml-16 mt-2 flex justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>Oldest</span>
          <span>Latest</span>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 bg-blue-500 dark:bg-blue-400"></div>
          <span className="text-gray-600 dark:text-gray-400">Execution Time</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-0.5 border-t-2 border-dashed border-blue-300 dark:border-blue-700"></div>
          <span className="text-gray-600 dark:text-gray-400">Average</span>
        </div>
      </div>
    </div>
  );
};
