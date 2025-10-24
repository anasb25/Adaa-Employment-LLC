// Re-export all debounce utilities for easy importing
export * from "../hooks/useDebounce";
export * from "../hooks/useAdvancedDebounce";

// Additional utility functions for common use cases

/**
 * Creates a debounced version of a function that will postpone its execution
 * until after wait milliseconds have elapsed since the last time it was invoked.
 *
 * @param func - The function to debounce
 * @param wait - The number of milliseconds to delay
 * @param options - Options object
 * @returns The debounced function
 */
export function createDebouncedFunction<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: {
    leading?: boolean;
    trailing?: boolean;
    maxWait?: number;
  } = {}
): T & { cancel: () => void; flush: () => ReturnType<T> } {
  const { leading = false, trailing = true, maxWait } = options;

  let timeoutId: number | undefined;
  let maxTimeoutId: number | undefined;
  let lastCallTime = 0;
  let lastInvokeTime = 0;
  let lastArgs: Parameters<T> | undefined;
  let lastThis: any;
  let result: ReturnType<T>;

  function invokeFunc(time: number) {
    const args = lastArgs;
    const thisArg = lastThis;

    if (args) {
      lastArgs = undefined;
      lastThis = undefined;
      lastInvokeTime = time;
      result = func.apply(thisArg, args);
      return result;
    }
    return result;
  }

  function leadingEdge(time: number) {
    lastInvokeTime = time;
    timeoutId = window.setTimeout(timerExpired, wait);
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time: number) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;

    return maxWait
      ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
      : timeWaiting;
  }

  function shouldInvoke(time: number) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === 0 ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      (maxWait && timeSinceLastInvoke >= maxWait)
    );
  }

  function timerExpired() {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timeoutId = window.setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time: number) {
    timeoutId = undefined;

    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = undefined;
    lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    if (maxTimeoutId !== undefined) {
      clearTimeout(maxTimeoutId);
    }
    lastCallTime = 0;
    lastArgs = undefined;
    lastThis = undefined;
    lastInvokeTime = 0;
  }

  function flush() {
    return timeoutId === undefined ? result : trailingEdge(Date.now());
  }

  function debounced(this: any, ...args: Parameters<T>) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timeoutId === undefined) {
        return leadingEdge(time);
      }
      if (maxWait) {
        timeoutId = window.setTimeout(timerExpired, wait);
        return invokeFunc(time);
      }
      return leadingEdge(time);
    }

    if (timeoutId === undefined) {
      timeoutId = window.setTimeout(timerExpired, wait);
    }

    return result;
  }

  debounced.cancel = cancel;
  debounced.flush = flush;

  return debounced as T & { cancel: () => void; flush: () => ReturnType<T> };
}

/**
 * Creates a throttled version of a function that will only execute once per wait period.
 *
 * @param func - The function to throttle
 * @param wait - The number of milliseconds to throttle invocations to
 * @param options - Options object
 * @returns The throttled function
 */
export function createThrottledFunction<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: {
    leading?: boolean;
    trailing?: boolean;
  } = {}
): T & { cancel: () => void; flush: () => ReturnType<T> } {
  const { leading = true, trailing = true } = options;

  let timeoutId: number | undefined;
  let lastCallTime = 0;
  let lastInvokeTime = 0;
  let lastArgs: Parameters<T> | undefined;
  let lastThis: any;
  let result: ReturnType<T>;

  function invokeFunc(time: number) {
    const args = lastArgs;
    const thisArg = lastThis;

    if (args) {
      lastArgs = undefined;
      lastThis = undefined;
      lastInvokeTime = time;
      result = func.apply(thisArg, args);
      return result;
    }
    return result;
  }

  function leadingEdge(time: number) {
    lastInvokeTime = time;
    timeoutId = window.setTimeout(timerExpired, wait);
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time: number) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;

    return Math.min(timeWaiting, wait - timeSinceLastInvoke);
  }

  function shouldInvoke(time: number) {
    const timeSinceLastCall = time - lastCallTime;
    const timeSinceLastInvoke = time - lastInvokeTime;

    return (
      lastCallTime === 0 ||
      timeSinceLastCall >= wait ||
      timeSinceLastCall < 0 ||
      timeSinceLastInvoke >= wait
    );
  }

  function timerExpired() {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    timeoutId = window.setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time: number) {
    timeoutId = undefined;

    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = undefined;
    lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
    lastCallTime = 0;
    lastArgs = undefined;
    lastThis = undefined;
    lastInvokeTime = 0;
  }

  function flush() {
    return timeoutId === undefined ? result : trailingEdge(Date.now());
  }

  function throttled(this: any, ...args: Parameters<T>) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);

    lastArgs = args;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timeoutId === undefined) {
        return leadingEdge(time);
      }
      return invokeFunc(time);
    }

    if (timeoutId === undefined) {
      timeoutId = window.setTimeout(timerExpired, wait);
    }

    return result;
  }

  throttled.cancel = cancel;
  throttled.flush = flush;

  return throttled as T & { cancel: () => void; flush: () => ReturnType<T> };
}
