import { useState, useCallback, useRef } from "react";
import { query, type QueryOptions } from "@jsonpathx/jsonpathx";

const QUERY_OPTIONS: QueryOptions = { filterMode: "rfc" };

/** The last successful run: its query, time and result count, set together with the results. */
export interface QueryRun {
  query: string;
  executionTime: number;
  resultCount: number;
}

interface UseJsonPathResult {
  results: unknown[] | null;
  error: string | null;
  isExecuting: boolean;
  executionTime: number | null;
  lastRun: QueryRun | null;
  execute: (path: string) => void;
}

export function useJsonPath(data: unknown): UseJsonPathResult {
  const [results, setResults] = useState<unknown[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [lastRun, setLastRun] = useState<QueryRun | null>(null);

  // Use ref to track the latest execution to avoid race conditions
  const executionIdRef = useRef(0);

  const execute = useCallback(
    (path: string) => {
      if (!data) {
        setError("No data available");
        setResults(null);
        return;
      }

      // Increment execution ID to handle race conditions
      const currentExecutionId = ++executionIdRef.current;

      setIsExecuting(true);
      setError(null);

      // Use setTimeout to allow UI to update before heavy computation
      setTimeout(async () => {
        const startTime = performance.now();

        try {
          // Filters run in RFC 9535 mode, which evaluates them without
          // eval/new Function, so they work under the page's CSP
          // (script-src 'self'). It accepts both `[?@.a == 1]` and the
          // jsonpath-plus style `[?(@.a == 1)]`.
          const queryResults = await query(path, data, QUERY_OPTIONS);

          const endTime = performance.now();

          // Only update if this is still the latest execution
          if (currentExecutionId === executionIdRef.current) {
            // Handle different result types
            let normalizedResults: unknown[];

            if (queryResults === undefined || queryResults === null) {
              normalizedResults = [];
            } else if (Array.isArray(queryResults)) {
              normalizedResults = queryResults;
            } else {
              normalizedResults = [queryResults];
            }

            setResults(normalizedResults);
            setExecutionTime(endTime - startTime);
            setLastRun({ query: path, executionTime: endTime - startTime, resultCount: normalizedResults.length });
            setError(null);
            setIsExecuting(false);
          }
        } catch (err) {
          // Only update if this is still the latest execution
          if (currentExecutionId === executionIdRef.current) {
            const errorMessage =
              err instanceof Error ? err.message : "Unknown error occurred";
            setError(errorMessage);
            setResults(null);
            setExecutionTime(null);
            setIsExecuting(false);
          }
        }
      }, 0);
    },
    [data],
  );

  return {
    results,
    error,
    isExecuting,
    executionTime,
    lastRun,
    execute,
  };
}
