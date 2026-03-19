"use client";

import { useCallback, useEffect, useState } from "react";
import { frontendLogger } from "@/lib/frontend/logger";

interface AsyncResourceOptions<T> {
  scope: string;
  initialData?: T | null;
  isEmpty?: (data: T | null) => boolean;
  fetcher: () => Promise<T>;
}

interface AsyncResourceState<T> {
  data: T | null;
  isLoading: boolean;
  isEmpty: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
}

export function useAsyncResource<T>({
  scope,
  initialData = null,
  isEmpty,
  fetcher,
}: AsyncResourceOptions<T>): AsyncResourceState<T> {
  const [data, setData] = useState<T | null>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const computeEmpty = useCallback(
    (value: T | null) => (isEmpty ? isEmpty(value) : value == null),
    [isEmpty]
  );

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nextData = await fetcher();
      setData(nextData);
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : "Unexpected fetch error";
      frontendLogger.error({
        scope,
        message,
        details: caughtError,
      });
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [fetcher, scope]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    data,
    isLoading,
    isEmpty: computeEmpty(data),
    error,
    refetch,
    setData,
  };
}
