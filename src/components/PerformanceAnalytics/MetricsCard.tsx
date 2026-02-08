/**
 * Metrics Card Component - Displays a single performance metric
 */

import React from 'react';
import { formatExecutionTime } from '../../utils/analytics-utils';

interface MetricsCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  isTime?: boolean;
}

const variantStyles = {
  default: 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700',
  primary: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
  success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800',
  warning: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
  danger: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
};

const trendIcons = {
  up: (
    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
  ),
  down: (
    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
  ),
  neutral: (
    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
    </svg>
  ),
};

export const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  variant = 'default',
  isTime = false,
}) => {
  const displayValue = isTime && typeof value === 'number' ? formatExecutionTime(value) : value;

  return (
    <div
      className={`${variantStyles[variant]} border rounded-lg p-4 transition-all duration-300 hover:shadow-md`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {icon && <div className="text-gray-500 dark:text-gray-400">{icon}</div>}
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</h3>
          </div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{displayValue}</div>
          {subtitle && <p className="text-xs text-gray-500 dark:text-gray-500">{subtitle}</p>}
        </div>
        {trend && trendValue && (
          <div className="flex items-center gap-1 text-sm">
            {trendIcons[trend]}
            <span
              className={`font-medium ${
                trend === 'up'
                  ? 'text-red-600 dark:text-red-400'
                  : trend === 'down'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {trendValue}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
