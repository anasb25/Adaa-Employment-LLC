import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Simple and robust debounce hook for React
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounced callback hook for React
 * @param callback - The callback function to debounce
 * @param delay - Delay in milliseconds
 * @param deps - Dependencies array for the callback
 * @returns The debounced callback function
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: React.DependencyList = []
): T {
  const timeoutRef = useRef<number | undefined>(undefined);
  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        callbackRef.current(...args);
      }, delay);
    }) as T,
    [delay, ...deps]
  );

  return debouncedCallback;
}

/**
 * Search hook with debouncing
 * @param initialValue - Initial search value
 * @param delay - Debounce delay in milliseconds
 * @param onSearch - Callback function called when search value changes
 * @returns Object with search state and handlers
 */
export function useSearch(
  initialValue: string = "",
  delay: number = 300,
  onSearch?: (value: string) => void
) {
  const [searchValue, setSearchValue] = useState(initialValue);
  const debouncedSearchValue = useDebounce(searchValue, delay);

  useEffect(() => {
    if (onSearch && debouncedSearchValue !== initialValue) {
      onSearch(debouncedSearchValue);
    }
  }, [debouncedSearchValue, onSearch, initialValue]);

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchValue("");
  }, []);

  return {
    searchValue,
    debouncedSearchValue,
    handleSearchChange,
    clearSearch,
    isSearching: debouncedSearchValue.length > 0,
  };
}

/**
 * Simple debounce function for non-React use
 * @param func - The function to debounce
 * @param delay - Delay in milliseconds
 * @param immediate - Whether to call the function immediately on first call
 * @returns The debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number,
  immediate: boolean = false
): (...args: Parameters<T>) => void {
  let timeoutId: number | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const callNow = immediate && !timeoutId;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = window.setTimeout(() => {
      timeoutId = null;
      if (!immediate) {
        func.apply(this, args);
      }
    }, delay);

    if (callNow) {
      func.apply(this, args);
    }
  };
}

/**
 * Simple throttle function for non-React use
 * @param func - The function to throttle
 * @param delay - Delay in milliseconds
 * @returns The throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: number | null = null;
  let lastExecTime = 0;

  return function (this: any, ...args: Parameters<T>) {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > delay) {
      func.apply(this, args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = window.setTimeout(() => {
        func.apply(this, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}
