import { useEffect, useState } from 'react';

/**
 * 디바운스 훅 - 값이 변경된 후 일정 시간이 지나면 업데이트
 * @param value 디바운스할 값
 * @param delay 지연 시간 (ms)
 * @returns 디바운스된 값
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // 값이 변경되면 타이머 설정
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // 컴포넌트 언마운트 또는 값, delay 변경 시 타이머 정리
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * 디바운스 콜백 훅 - 함수 호출을 디바운스
 * @param callback 디바운스할 함수
 * @param delay 지연 시간 (ms)
 * @returns 디바운스된 함수
 */
export function useDebouncedCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // 컴포넌트 언마운트 시 타이머 정리
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return (...args: Parameters<T>) => {
    // 이전 타이머가 있으면 취소
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    // 새 타이머 설정
    const newTimeoutId = setTimeout(() => {
      callback(...args);
    }, delay);

    setTimeoutId(newTimeoutId);
  };
}