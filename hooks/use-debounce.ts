import { useCallback, useEffect, useState } from "react";

export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};


export function useDebounceFunction<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): T {
  const [timeoutRef, setTimeoutRef] = useState<NodeJS.Timeout | null>(null);

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef) {
        clearTimeout(timeoutRef);
      }

      const newTimeout = setTimeout(() => {
        callback(...args);
      }, delay);

      setTimeoutRef(newTimeout);
    },
    [callback, delay, timeoutRef]
  ) as T;
}
