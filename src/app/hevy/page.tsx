import Link from "next/link";

export default function HevyPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Legacy route</p>
      <h1 className="mt-3 text-3xl font-black text-slate-900 dark:text-white">Hevy management moved</h1>
      <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
        A gestao do Hevy agora fica centralizada em Settings e usa somente a API Python.
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
