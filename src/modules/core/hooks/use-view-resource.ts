"use client";

import { useCallback, useEffect, useState } from "react";
import { AppError, toAppError } from "@/modules/core/api/app-error";
import { frontendLogger } from "@/lib/frontend/logger";

export type ViewState<T> = {
  data: T | null;
  isLoading: boolean;
  isEmpty: boolean;
  isError: boolean;
  error: AppError | null;
  refetch: () => Promise<void>;
  setData: React.Dispatch<React.SetStateAction<T | null>>;
};

interface UseViewResourceOptions<T> {
  scope: string;
  fetcher: () => Promise<T>;
  initialData?: T | null;
  isEmpty?: (data: T | null) => boolean;
}

export function useViewResource<T>({
  scope,
  fetcher,
  initialData = null,
  isEmpty,
}: UseViewResourceOptions<T>): ViewState<T> {
  const [data, setData] = useState<T | null>(initialData);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  const computeEmpty = useCallback(
    (value: T | null) => (isEmpty ? isEmpty(value) : value === null),
    [isEmpty]
  );

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const nextValue = await fetcher();
      setData(nextValue);
    } catch (caughtError) {
      const appError = toAppError(caughtError);
      frontendLogger.error({
        scope,
        message: appError.message,
        details: appError,
      });
      setError(appError);
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
    isError: error !== null,
    error,
    refetch,
    setData,
  };
}
