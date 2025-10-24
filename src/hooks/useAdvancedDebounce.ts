import { useRef, useCallback, useEffect, useState } from "react";

/**
 * Advanced debounce hook with cancellation and immediate execution options
 * @param callback - The callback function to debounce
 * @param delay - Delay in milliseconds
 * @param options - Additional options for debouncing behavior
 * @returns Object with debounced function and control methods
 */
export function useAdvancedDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  options: {
    immediate?: boolean;
    maxWait?: number;
    leading?: boolean;
    trailing?: boolean;
  } = {}
) {
  const { leading = false, trailing = true, maxWait } = options;

  const timeoutRef = useRef<number | undefined>(undefined);
  const maxTimeoutRef = useRef<number | undefined>(undefined);
  const lastCallTimeRef = useRef<number>(0);
  const lastInvokeTimeRef = useRef<number>(0);
  const lastArgsRef = useRef<Parameters<T> | undefined>(undefined);
  const lastThisRef = useRef<any>(undefined);
  const resultRef = useRef<ReturnType<T> | undefined>(undefined);

  const callbackRef = useRef(callback);

  // Update callback ref when callback changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (maxTimeoutRef.current) {
        clearTimeout(maxTimeoutRef.current);
      }
    };
  }, []);

  const invokeFunc = useCallback((time: number) => {
    const args = lastArgsRef.current;
    const thisArg = lastThisRef.current;

    if (args) {
      lastArgsRef.current = undefined;
      lastThisRef.current = undefined;
      lastInvokeTimeRef.current = time;
      resultRef.current = callbackRef.current.apply(thisArg, args);
      return resultRef.current;
    }
    return resultRef.current;
  }, []);

  const leadingEdge = useCallback(
    (time: number) => {
      lastInvokeTimeRef.current = time;
      timeoutRef.current = window.setTimeout(timerExpired, delay);
      return leading ? invokeFunc(time) : resultRef.current;
    },
    [delay, leading, invokeFunc]
  );

  const remainingWait = useCallback(
    (time: number) => {
      const timeSinceLastCall = time - lastCallTimeRef.current;
      const timeSinceLastInvoke = time - lastInvokeTimeRef.current;
      const timeWaiting = delay - timeSinceLastCall;

      return maxWait
        ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
        : timeWaiting;
    },
    [delay, maxWait]
  );

  const shouldInvoke = useCallback(
    (time: number) => {
      const timeSinceLastCall = time - lastCallTimeRef.current;
      const timeSinceLastInvoke = time - lastInvokeTimeRef.current;

      return (
        lastCallTimeRef.current === 0 ||
        timeSinceLastCall >= delay ||
        timeSinceLastCall < 0 ||
        (maxWait && timeSinceLastInvoke >= maxWait)
      );
    },
    [delay, maxWait]
  );

  const timerExpired = useCallback(() => {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timeoutRef.current = window.setTimeout(timerExpired, remainingWait(time));
  }, [shouldInvoke, remainingWait]);

  const trailingEdge = useCallback(
    (time: number) => {
      timeoutRef.current = undefined;

      if (trailing && lastArgsRef.current) {
        return invokeFunc(time);
      }
      lastArgsRef.current = undefined;
      lastThisRef.current = undefined;
      return resultRef.current;
    },
    [trailing, invokeFunc]
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (maxTimeoutRef.current) {
      clearTimeout(maxTimeoutRef.current);
    }
    lastCallTimeRef.current = 0;
    lastArgsRef.current = undefined;
    lastThisRef.current = undefined;
    lastInvokeTimeRef.current = 0;
  }, []);

  const flush = useCallback(() => {
    return timeoutRef.current === undefined
      ? resultRef.current
      : trailingEdge(Date.now());
  }, [trailingEdge]);

  const debounced = useCallback(
    function (this: any, ...args: Parameters<T>) {
      const time = Date.now();
      const isInvoking = shouldInvoke(time);

      lastArgsRef.current = args;
      lastThisRef.current = this;
      lastCallTimeRef.current = time;

      if (isInvoking) {
        if (timeoutRef.current === undefined) {
          return leadingEdge(time);
        }
        if (maxWait) {
          timeoutRef.current = window.setTimeout(timerExpired, delay);
          return invokeFunc(time);
        }
        return leadingEdge(time);
      }

      if (timeoutRef.current === undefined) {
        timeoutRef.current = window.setTimeout(timerExpired, delay);
      }

      return resultRef.current;
    } as T,
    [shouldInvoke, leadingEdge, timerExpired, invokeFunc, delay, maxWait]
  );

  return {
    debounced,
    cancel,
    flush,
    pending: () => timeoutRef.current !== undefined,
  };
}

/**
 * Hook for creating a debounced search with advanced features
 * @param initialValue - Initial search value
 * @param delay - Debounce delay in milliseconds
 * @param options - Advanced debounce options
 * @returns Object with search state and handlers
 */
export function useAdvancedSearch(
  initialValue: string = "",
  delay: number = 300,
  options: {
    immediate?: boolean;
    maxWait?: number;
    leading?: boolean;
    trailing?: boolean;
    onSearch?: (value: string) => void;
    onClear?: () => void;
  } = {}
) {
  const [searchValue, setSearchValue] = useState(initialValue);
  const [isSearching, setIsSearching] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

  const { debounced, cancel, flush } = useAdvancedDebounce(
    (value: string) => {
      if (options.onSearch) {
        options.onSearch(value);
      }
      setIsSearching(value.length > 0);
    },
    delay,
    options
  );

  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchValue(value);
      debounced(value);
    },
    [debounced]
  );

  const clearSearch = useCallback(() => {
    setSearchValue("");
    setIsSearching(false);
    cancel();
    if (options.onClear) {
      options.onClear();
    }
  }, [cancel, options]);

  const addToHistory = useCallback(
    (value: string) => {
      if (value && !searchHistory.includes(value)) {
        setSearchHistory((prev) => [value, ...prev.slice(0, 9)]); // Keep last 10 searches
      }
    },
    [searchHistory]
  );

  const removeFromHistory = useCallback((value: string) => {
    setSearchHistory((prev) => prev.filter((item) => item !== value));
  }, []);

  const clearHistory = useCallback(() => {
    setSearchHistory([]);
  }, []);

  return {
    searchValue,
    isSearching,
    searchHistory,
    handleSearchChange,
    clearSearch,
    addToHistory,
    removeFromHistory,
    clearHistory,
    cancel,
    flush,
  };
}
