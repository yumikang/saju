import { useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for cleaning up memory and preventing memory leaks
 */
export function useMemoryCleanup() {
  const cleanupFunctions = useRef<Set<() => void>>(new Set());
  const timers = useRef<Set<NodeJS.Timeout>>(new Set());
  const abortControllers = useRef<Set<AbortController>>(new Set());

  // Register cleanup function
  const registerCleanup = useCallback((cleanup: () => void) => {
    cleanupFunctions.current.add(cleanup);
    return () => {
      cleanupFunctions.current.delete(cleanup);
      cleanup();
    };
  }, []);

  // Safe setTimeout that auto-cleans
  const safeSetTimeout = useCallback((callback: () => void, delay: number) => {
    const timer = setTimeout(() => {
      callback();
      timers.current.delete(timer);
    }, delay);
    timers.current.add(timer);
    return timer;
  }, []);

  // Safe setInterval that auto-cleans
  const safeSetInterval = useCallback((callback: () => void, delay: number) => {
    const timer = setInterval(callback, delay);
    timers.current.add(timer);
    return timer;
  }, []);

  // Clear specific timer
  const clearTimer = useCallback((timer: NodeJS.Timeout) => {
    clearTimeout(timer);
    clearInterval(timer);
    timers.current.delete(timer);
  }, []);

  // Create abort controller for fetch requests
  const createAbortController = useCallback(() => {
    const controller = new AbortController();
    abortControllers.current.add(controller);
    return controller;
  }, []);

  // Cleanup all resources
  const cleanup = useCallback(() => {
    // Run all cleanup functions
    cleanupFunctions.current.forEach(fn => fn());
    cleanupFunctions.current.clear();

    // Clear all timers
    timers.current.forEach(timer => {
      clearTimeout(timer);
      clearInterval(timer);
    });
    timers.current.clear();

    // Abort all fetch requests
    abortControllers.current.forEach(controller => controller.abort());
    abortControllers.current.clear();
  }, []);

  // Auto cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    registerCleanup,
    safeSetTimeout,
    safeSetInterval,
    clearTimer,
    createAbortController,
    cleanup,
  };
}

/**
 * Hook for managing event listeners with automatic cleanup
 */
export function useEventListener<K extends keyof WindowEventMap>(
  eventName: K,
  handler: (event: WindowEventMap[K]) => void,
  element: Window | HTMLElement | null = window,
  options?: AddEventListenerOptions
) {
  const savedHandler = useRef(handler);

  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    if (!element || !element.addEventListener) {
      return;
    }

    const eventListener = (event: Event) => savedHandler.current(event as WindowEventMap[K]);

    element.addEventListener(eventName, eventListener, options);

    return () => {
      element.removeEventListener(eventName, eventListener, options);
    };
  }, [eventName, element, options]);
}

/**
 * Hook for debouncing values
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const { safeSetTimeout } = useMemoryCleanup();

  useEffect(() => {
    const timer = safeSetTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay, safeSetTimeout]);

  return debouncedValue;
}

/**
 * Hook for throttling callbacks
 */
export function useThrottle<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 1000
): T {
  const lastRun = useRef(Date.now());
  const timeout = useRef<NodeJS.Timeout>();
  const { registerCleanup } = useMemoryCleanup();

  useEffect(() => {
    return registerCleanup(() => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
    });
  }, [registerCleanup]);

  return useCallback((...args: Parameters<T>) => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRun.current;

    if (timeSinceLastRun >= delay) {
      callback(...args);
      lastRun.current = now;
    } else {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
      timeout.current = setTimeout(() => {
        callback(...args);
        lastRun.current = Date.now();
      }, delay - timeSinceLastRun);
    }
  }, [callback, delay]) as T;
}

/**
 * Hook for managing WeakMap/WeakSet to prevent memory leaks
 */
export function useWeakStorage<K extends object, V>() {
  const storage = useRef(new WeakMap<K, V>());

  const set = useCallback((key: K, value: V) => {
    storage.current.set(key, value);
  }, []);

  const get = useCallback((key: K) => {
    return storage.current.get(key);
  }, []);

  const has = useCallback((key: K) => {
    return storage.current.has(key);
  }, []);

  const remove = useCallback((key: K) => {
    return storage.current.delete(key);
  }, []);

  return { set, get, has, remove };
}

/**
 * Hook for intersection observer with cleanup
 */
export function useIntersectionObserver(
  ref: React.RefObject<HTMLElement>,
  options?: IntersectionObserverInit
) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);

  useEffect(() => {
    if (!ref.current || !window.IntersectionObserver) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        setEntry(entry);
      },
      options
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [ref, options]);

  return { isIntersecting, entry };
}

// Import useState if not already imported
import { useState } from 'react';