"use client";

import { BjjSessionViewModel } from "@/modules/bjj-sessions/types/bjj-session.types";
import { StatusBadge } from "@/modules/core/ui/status-badge";
import { SurfaceCard } from "@/modules/core/ui/surface-card";

interface BjjSessionCardProps {
  session: BjjSessionViewModel;
  onEdit: (session: BjjSessionViewModel) => void;
  onDelete: (session: BjjSessionViewModel) => void;
}

export function BjjSessionCard({ session, onEdit, onDelete }: BjjSessionCardProps) {
  const trainedTechniques = session.trainedTechniques ?? [];

  return (
    <SurfaceCard className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
            {new Date(session.date).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
          <h3 className="mt-2 text-xl font-black text-slate-900 dark:text-white">
            {session.trainingType.replace("_", " ")}
          </h3>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {session.durationMinutes} min · sRPE {session.srpe} · {session.giMode.toUpperCase()}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge label={`Carga ${session.sessionLoad}`} tone="success" />
          {session.location ? <StatusBadge label={session.location} /> : null}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Coach</p>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{session.coach || "--"}</p>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Rounds</p>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{session.rounds ?? "--"}</p>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Fadiga pre</p>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{session.fatigueBefore ?? "--"}</p>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Nota geral</p>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">{session.sessionScore ?? "--"}</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Tecnicas</p>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
            {trainedTechniques.length ? trainedTechniques.join(", ") : "Nenhuma tecnica detalhada."}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Observacoes</p>
          <p className="mt-2 text-sm text-slate-700 dark:text-slate-200">
            {session.notes || "Sem observacoes adicionais."}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onEdit(session)}
          className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-primary transition-colors hover:bg-primary/20"
        >
          Editar
        </button>
        <button
          type="button"
          onClick={() => onDelete(session)}
          className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-red-400 transition-colors hover:bg-red-500/20"
        >
          Excluir
        </button>
      </div>
    </SurfaceCard>
  );
}
