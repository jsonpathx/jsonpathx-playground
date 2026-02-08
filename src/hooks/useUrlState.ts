import { useState, useEffect, useCallback } from 'react';

interface UrlStateOptions {
  paramName?: string;
  compress?: boolean;
}

interface UrlStateResult {
  value: string | null;
  setValue: (newValue: string) => void;
  getShareableUrl: () => string;
}

/**
 * Custom hook to manage state synchronized with URL parameters
 * Supports base64 encoding for safe URL transmission
 */
export function useUrlState(
  defaultValue: string,
  options: UrlStateOptions = {}
): UrlStateResult {
  const { paramName = 'q', compress = true } = options;

  const [value, setValueState] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Encode value to base64 URL-safe format
  const encodeValue = useCallback((val: string): string => {
    if (!compress) {
      return encodeURIComponent(val);
    }

    try {
      // Convert to base64 and make it URL-safe
      const base64 = btoa(val);
      return base64
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, ''); // Remove padding
    } catch (error) {
      console.error('Error encoding value:', error);
      return encodeURIComponent(val);
    }
  }, [compress]);

  // Decode value from base64 URL-safe format
  const decodeValue = useCallback((encoded: string): string => {
    if (!compress) {
      return decodeURIComponent(encoded);
    }

    try {
      // Restore base64 padding and standard characters
      let base64 = encoded
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      // Add padding if needed
      const padding = base64.length % 4;
      if (padding > 0) {
        const paddingNeeded = 4 - padding;
        for (let i = 0; i < paddingNeeded; i++) {
          base64 += '=';
        }
      }

      return atob(base64);
    } catch (error) {
      console.error('Error decoding value:', error);
      // Fallback to URL decode
      try {
        return decodeURIComponent(encoded);
      } catch {
        return encoded;
      }
    }
  }, [compress]);

  // Initialize from URL on mount
  useEffect(() => {
    if (initialized) return;

    const urlParams = new URLSearchParams(window.location.search);
    const urlValue = urlParams.get(paramName);

    if (urlValue) {
      const decoded = decodeValue(urlValue);
      setValueState(decoded);
    } else {
      setValueState(defaultValue);
    }

    setInitialized(true);
  }, [paramName, defaultValue, decodeValue, initialized]);

  // Update URL when value changes (without full page reload)
  const setValue = useCallback(
    (newValue: string) => {
      setValueState(newValue);

      // Update URL without reload
      const url = new URL(window.location.href);
      const params = new URLSearchParams(url.search);

      if (newValue && newValue !== defaultValue) {
        params.set(paramName, encodeValue(newValue));
      } else {
        params.delete(paramName);
      }

      const newUrl = `${url.pathname}${params.toString() ? '?' + params.toString() : ''}${url.hash}`;
      window.history.replaceState({}, '', newUrl);
    },
    [paramName, encodeValue, defaultValue]
  );

  // Get shareable URL with current value
  const getShareableUrl = useCallback((): string => {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);

    if (value && value !== defaultValue) {
      params.set(paramName, encodeValue(value));
    } else {
      params.delete(paramName);
    }

    return `${url.origin}${url.pathname}${params.toString() ? '?' + params.toString() : ''}${url.hash}`;
  }, [value, paramName, encodeValue, defaultValue]);

  return {
    value,
    setValue,
    getShareableUrl,
  };
}
