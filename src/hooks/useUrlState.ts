import { useCallback, useState } from 'react';

interface UrlStateOptions {
  paramName?: string;
  compress?: boolean;
}

interface UrlStateResult {
  value: string;
  setValue: (newValue: string) => void;
  getShareableUrl: () => string;
}

/** Encode a value for the URL: URL-safe base64 when `compress`, else percent-encoding. */
export function encodeUrlValue(val: string, compress = true): string {
  if (!compress) return encodeURIComponent(val);
  try {
    return btoa(val).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch {
    // btoa only takes Latin-1; fall back to percent-encoding for other text.
    return encodeURIComponent(val);
  }
}

/** Decode a value written by `encodeUrlValue`. */
export function decodeUrlValue(encoded: string, compress = true): string {
  if (!compress) return decodeURIComponent(encoded);
  try {
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const padding = base64.length % 4;
    if (padding > 0) base64 += '='.repeat(4 - padding);
    return atob(base64);
  } catch {
    try {
      return decodeURIComponent(encoded);
    } catch {
      return encoded;
    }
  }
}

function readFromUrl(paramName: string, compress: boolean, defaultValue: string): string {
  const urlValue = new URLSearchParams(window.location.search).get(paramName);
  return urlValue ? decodeUrlValue(urlValue, compress) : defaultValue;
}

function buildUrl(value: string, paramName: string, compress: boolean, defaultValue: string): URL {
  const url = new URL(window.location.href);
  if (value && value !== defaultValue) {
    url.searchParams.set(paramName, encodeUrlValue(value, compress));
  } else {
    url.searchParams.delete(paramName);
  }
  return url;
}

/**
 * State kept in a URL query parameter (URL-safe base64 by default), so a query
 * can be shared as a link. The initial value comes from the URL on first render.
 */
export function useUrlState(defaultValue: string, options: UrlStateOptions = {}): UrlStateResult {
  const { paramName = 'q', compress = true } = options;
  const [value, setValueState] = useState(() => readFromUrl(paramName, compress, defaultValue));

  const setValue = useCallback(
    (newValue: string) => {
      setValueState(newValue);
      const url = buildUrl(newValue, paramName, compress, defaultValue);
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    },
    [paramName, compress, defaultValue],
  );

  const getShareableUrl = useCallback(
    (): string => buildUrl(value, paramName, compress, defaultValue).toString(),
    [value, paramName, compress, defaultValue],
  );

  return { value, setValue, getShareableUrl };
}
