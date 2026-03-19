"use client";

import { AppErrorBoundary } from "@/components/app/AppErrorBoundary";

export function Providers({ children }: { children: React.ReactNode }) {
  return <AppErrorBoundary>{children}</AppErrorBoundary>;
}
