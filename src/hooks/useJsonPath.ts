import { useState, useCallback, useRef } from "react";
import { query } from "@jsonpathx/jsonpathx";

interface UseJsonPathResult {
  results: unknown[] | null;
  error: string | null;
  isExecuting: boolean;
  executionTime: number | null;
  execute: (path: string) => void;
}

export function useJsonPath(data: unknown): UseJsonPathResult {
  const [results, setResults] = useState<unknown[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionTime, setExecutionTime] = useState<number | null>(null);

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
          console.log("Executing query:", path);
          console.log(
            "Data type:",
            Array.isArray(data) ? "Array" : typeof data,
          );
          console.log(
            "Data length:",
            Array.isArray(data) ? data.length : "N/A",
          );

          const needsEval = path.includes("[?(");
          const queryResults = await query(
            path,
            data,
            needsEval ? { eval: "native" } : undefined,
          );

          const endTime = performance.now();

          console.log(
            "Query completed in",
            (endTime - startTime).toFixed(2),
            "ms",
          );
          console.log("Results:", queryResults);

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

            console.log("Normalized results count:", normalizedResults.length);

            setResults(normalizedResults);
            setExecutionTime(endTime - startTime);
            setError(null);
            setIsExecuting(false);
          }
        } catch (err) {
          // Only update if this is still the latest execution
          if (currentExecutionId === executionIdRef.current) {
            console.error("JSONPath execution error:", err);
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
    execute,
  };
}
