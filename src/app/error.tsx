"use client";

import { useEffect } from "react";
import { frontendLogger } from "@/lib/frontend/logger";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    frontendLogger.error({
      scope: "route-error",
      message: error.message,
      details: { digest: error.digest, stack: error.stack },
    });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-light px-6 dark:bg-background-dark">
      <div className="max-w-lg rounded-2xl border border-red-500/20 bg-white p-8 shadow-sm dark:bg-zinc-900">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-red-500">Route Error</p>
        <h1 className="mt-3 text-2xl font-black text-slate-900 dark:text-slate-100">Algo deu errado nesta página.</h1>
        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          A aplicação capturou o erro e evitou uma tela branca. Você pode tentar novamente sem perder o restante do sistema.
        </p>
        <button
          className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-background-dark"
          onClick={() => reset()}
          type="button"
        >
          Tentar novamente
        </button>
      </div>
    </div>
  );
}
