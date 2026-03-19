import React from "react";

interface QueryStateProps<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  isEmpty: boolean;
  loadingFallback: React.ReactNode;
  emptyFallback: React.ReactNode;
  errorFallback: React.ReactNode;
  children: (data: T) => React.ReactNode;
}

export function QueryState<T>({
  data,
  isLoading,
  error,
  isEmpty,
  loadingFallback,
  emptyFallback,
  errorFallback,
  children,
}: QueryStateProps<T>) {
  if (isLoading) {
    return <>{loadingFallback}</>;
  }

  if (error) {
    return <>{errorFallback}</>;
  }

  if (isEmpty || !data) {
    return <>{emptyFallback}</>;
  }

  return <>{children(data)}</>;
}
