/**
 * Query Leaderboard Component - Shows fastest/slowest queries
 */

import React, { useState } from 'react';
import { QueryMetrics } from '../../types/analytics';
import { formatExecutionTime } from '../../utils/analytics-utils';

interface QueryLeaderboardProps {
  fastest: QueryMetrics[];
  slowest: QueryMetrics[];
  mostComplex: QueryMetrics[];
  mostResults: QueryMetrics[];
}

type LeaderboardTab = 'fastest' | 'slowest' | 'complex' | 'results';

interface TabConfig {
  id: LeaderboardTab;
  label: string;
  icon: React.ReactNode;
}

const tabs: TabConfig[] = [
  {
    id: 'fastest',
    label: 'Fastest',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    id: 'slowest',
    label: 'Slowest',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    id: 'complex',
    label: 'Most Complex',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: 'results',
    label: 'Most Results',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
  },
];

export const QueryLeaderboard: React.FC<QueryLeaderboardProps> = ({
  fastest,
  slowest,
  mostComplex,
  mostResults,
}) => {
  const [activeTab, setActiveTab] = useState<LeaderboardTab>('fastest');

  const getQueries = (): QueryMetrics[] => {
    switch (activeTab) {
      case 'fastest':
        return fastest;
      case 'slowest':
        return slowest;
      case 'complex':
        return mostComplex;
      case 'results':
        return mostResults;
      default:
        return [];
    }
  };

  const queries = getQueries();
  const hasData = queries.length > 0;

  const getRankColor = (index: number): string => {
    if (index === 0) return 'text-yellow-600 dark:text-yellow-400';
    if (index === 1) return 'text-gray-400 dark:text-gray-500';
    if (index === 2) return 'text-orange-600 dark:text-orange-400';
    return 'text-gray-600 dark:text-gray-500';
  };

  const getRankBadge = (index: number): string => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Query Leaderboard</h3>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {!hasData ? (
        <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          No queries available for this category.
        </div>
      ) : (
        <div className="space-y-3">
          {queries.map((query, index) => (
            <div
              key={query.id}
              className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
            >
              {/* Rank */}
              <div className={`flex-shrink-0 text-xl font-bold ${getRankColor(index)} w-8`}>
                {getRankBadge(index)}
              </div>

              {/* Query Details */}
              <div className="flex-1 min-w-0">
                <code className="block text-sm text-gray-900 dark:text-white font-mono truncate mb-1">
                  {query.query}
                </code>
                <div className="flex flex-wrap gap-3 text-xs text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {formatExecutionTime(query.executionTime)}
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                      />
                    </svg>
                    {query.resultCount.toLocaleString()} results
                  </span>
                  <span className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                      />
                    </svg>
                    Complexity: {query.complexityScore}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
