import { useRef, useEffect, useCallback, useState } from 'react';

interface Point {
  x: number;
  y: number;
}

interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

interface UseSwipeOptions extends SwipeHandlers {
  threshold?: number; // Minimum distance for swipe
  preventDefault?: boolean;
}

// Swipe gesture hook
export function useSwipe(
  elementRef: React.RefObject<HTMLElement>,
  options: UseSwipeOptions = {}
) {
  const {
    threshold = 50,
    preventDefault = true,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
  } = options;

  const touchStartRef = useRef<Point | null>(null);
  const touchEndRef = useRef<Point | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (preventDefault) e.preventDefault();
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }, [preventDefault]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (preventDefault) e.preventDefault();
    touchEndRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }, [preventDefault]);

  const handleTouchEnd = useCallback(() => {
    if (!touchStartRef.current || !touchEndRef.current) return;

    const deltaX = touchEndRef.current.x - touchStartRef.current.x;
    const deltaY = touchEndRef.current.y - touchStartRef.current.y;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    // Determine if it's a horizontal or vertical swipe
    if (absX > absY && absX > threshold) {
      // Horizontal swipe
      if (deltaX > 0) {
        onSwipeRight?.();
      } else {
        onSwipeLeft?.();
      }
    } else if (absY > absX && absY > threshold) {
      // Vertical swipe
      if (deltaY > 0) {
        onSwipeDown?.();
      } else {
        onSwipeUp?.();
      }
    }

    // Reset
    touchStartRef.current = null;
    touchEndRef.current = null;
  }, [threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart, { passive: !preventDefault });
    element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefault });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, handleTouchStart, handleTouchMove, handleTouchEnd, preventDefault]);
}

// Pinch gesture hook
interface UsePinchOptions {
  onPinchIn?: (scale: number) => void;
  onPinchOut?: (scale: number) => void;
  onPinchEnd?: (finalScale: number) => void;
}

export function usePinch(
  elementRef: React.RefObject<HTMLElement>,
  options: UsePinchOptions = {}
) {
  const { onPinchIn, onPinchOut, onPinchEnd } = options;
  const initialDistanceRef = useRef<number | null>(null);
  const currentScaleRef = useRef<number>(1);

  const getDistance = useCallback((touches: TouchList): number => {
    const [touch1, touch2] = [touches[0], touches[1]];
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      initialDistanceRef.current = getDistance(e.touches);
      currentScaleRef.current = 1;
    }
  }, [getDistance]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2 && initialDistanceRef.current) {
      const currentDistance = getDistance(e.touches);
      const scale = currentDistance / initialDistanceRef.current;
      
      if (scale > currentScaleRef.current) {
        onPinchOut?.(scale);
      } else if (scale < currentScaleRef.current) {
        onPinchIn?.(scale);
      }
      
      currentScaleRef.current = scale;
    }
  }, [getDistance, onPinchIn, onPinchOut]);

  const handleTouchEnd = useCallback(() => {
    if (initialDistanceRef.current) {
      onPinchEnd?.(currentScaleRef.current);
      initialDistanceRef.current = null;
      currentScaleRef.current = 1;
    }
  }, [onPinchEnd]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchmove', handleTouchMove);
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return currentScaleRef.current;
}

// Long press hook
interface UseLongPressOptions {
  onLongPress: () => void;
  delay?: number;
  preventDefault?: boolean;
}

export function useLongPress(
  elementRef: React.RefObject<HTMLElement>,
  options: UseLongPressOptions
) {
  const { onLongPress, delay = 500, preventDefault = true } = options;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPressingRef = useRef<boolean>(false);

  const start = useCallback((e: TouchEvent | MouseEvent) => {
    if (preventDefault) e.preventDefault();
    isPressingRef.current = true;
    timeoutRef.current = setTimeout(() => {
      if (isPressingRef.current) {
        onLongPress();
      }
    }, delay);
  }, [delay, onLongPress, preventDefault]);

  const stop = useCallback(() => {
    isPressingRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Touch events
    element.addEventListener('touchstart', start, { passive: !preventDefault });
    element.addEventListener('touchend', stop);
    element.addEventListener('touchcancel', stop);
    
    // Mouse events (for testing on desktop)
    element.addEventListener('mousedown', start);
    element.addEventListener('mouseup', stop);
    element.addEventListener('mouseleave', stop);

    return () => {
      element.removeEventListener('touchstart', start);
      element.removeEventListener('touchend', stop);
      element.removeEventListener('touchcancel', stop);
      element.removeEventListener('mousedown', start);
      element.removeEventListener('mouseup', stop);
      element.removeEventListener('mouseleave', stop);
      stop(); // Clear any pending timeout
    };
  }, [elementRef, start, stop, preventDefault]);
}

// Double tap hook
interface UseDoubleTapOptions {
  onDoubleTap: () => void;
  delay?: number;
}

export function useDoubleTap(
  elementRef: React.RefObject<HTMLElement>,
  options: UseDoubleTapOptions
) {
  const { onDoubleTap, delay = 300 } = options;
  const lastTapRef = useRef<number>(0);

  const handleTap = useCallback(() => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    
    if (timeSinceLastTap < delay && timeSinceLastTap > 0) {
      onDoubleTap();
      lastTapRef.current = 0; // Reset
    } else {
      lastTapRef.current = now;
    }
  }, [delay, onDoubleTap]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    element.addEventListener('touchend', handleTap);
    element.addEventListener('click', handleTap);

    return () => {
      element.removeEventListener('touchend', handleTap);
      element.removeEventListener('click', handleTap);
    };
  }, [elementRef, handleTap]);
}

// Pull to refresh hook
interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  resistance?: number;
}

export function usePullToRefresh(options: UsePullToRefreshOptions) {
  const { onRefresh, threshold = 80, resistance = 2.5 } = options;
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (window.scrollY === 0 && !isRefreshing) {
      startYRef.current = e.touches[0].clientY;
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (startYRef.current === null || isRefreshing) return;
    
    const currentY = e.touches[0].clientY;
    const distance = (currentY - startYRef.current) / resistance;
    
    if (distance > 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance, threshold * 1.5));
    }
  }, [isRefreshing, resistance, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (startYRef.current === null) return;
    
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
    
    setPullDistance(0);
    startYRef.current = null;
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    pullDistance,
    isRefreshing,
    isPulling: pullDistance > 0,
    canRefresh: pullDistance >= threshold,
  };
}