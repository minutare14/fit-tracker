import Link from "next/link";

export default function LegacyHevySettingsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Legacy route</p>
      <h1 className="mt-3 text-3xl font-black text-slate-900 dark:text-white">
        Hevy integration is managed in Settings
      </h1>
      <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
        A configuracao antiga foi removida para evitar contratos concorrentes. Use a tela principal de Settings.
      </p>
      <Link
        href="/settings"
        className="mt-8 inline-flex w-fit rounded-2xl bg-primary px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-background-dark"
      >
        Abrir Settings
      </Link>
    </main>
  );
}
