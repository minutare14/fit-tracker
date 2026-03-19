"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="flex min-h-screen items-center justify-center bg-background-dark px-6 text-slate-100">
        <div className="max-w-lg rounded-2xl border border-red-500/20 bg-zinc-900 p-8">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-red-500">Fatal Error</p>
          <h1 className="mt-3 text-2xl font-black">A aplicação encontrou um erro crítico.</h1>
          <p className="mt-3 text-sm text-slate-400">{error.message}</p>
          <button
            className="mt-6 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-background-dark"
            onClick={() => reset()}
            type="button"
          >
            Recarregar aplicação
          </button>
        </div>
      </body>
    </html>
  );
}
