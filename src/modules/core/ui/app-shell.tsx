"use client";

import Sidebar from "@/components/Sidebar";

interface AppShellProps {
  title: string;
  subtitle: string;
  statusBadges?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function AppShell({ title, subtitle, statusBadges, actions, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background-light text-slate-900 dark:bg-background-dark dark:text-slate-100">
      <Sidebar />
      <main className="ml-64 min-h-screen">
        <div className="border-b border-slate-200 bg-background-light/95 backdrop-blur dark:border-slate-800 dark:bg-background-dark/95">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-8 lg:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-[11px] font-black uppercase tracking-[0.35em] text-primary">BJJ LAB</p>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 dark:text-white">{title}</h1>
                <p className="mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
              </div>
              {actions ? <div className="flex shrink-0 flex-wrap gap-3">{actions}</div> : null}
            </div>
            {statusBadges ? <div className="flex flex-wrap gap-2">{statusBadges}</div> : null}
          </div>
        </div>
        <div className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-8">{children}</div>
      </main>
    </div>
  );
}
