"use client";

import { useMemo, useState } from "react";
import { AppShell } from "@/modules/core/ui/app-shell";
import { MetricTile } from "@/modules/core/ui/metric-tile";
import { StatePanel } from "@/modules/core/ui/state-panel";
import { StatusBadge } from "@/modules/core/ui/status-badge";
import { SurfaceCard } from "@/modules/core/ui/surface-card";
import { useViewResource } from "@/modules/core/hooks/use-view-resource";
import { BjjSessionForm } from "@/modules/bjj-sessions/components/bjj-session-form";
import { BjjSessionList } from "@/modules/bjj-sessions/components/bjj-session-list";
import {
  RawBjjSessionFormValues,
  getDefaultBjjSessionFormValues,
  parseBjjSessionForm,
} from "@/modules/bjj-sessions/schemas/bjj-session-form.schema";
import { createBjjSession } from "@/modules/bjj-sessions/api/create-bjj-session";
import { deleteBjjSession } from "@/modules/bjj-sessions/api/delete-bjj-session";
import { listBjjSessions } from "@/modules/bjj-sessions/api/list-bjj-sessions";
import { updateBjjSession } from "@/modules/bjj-sessions/api/update-bjj-session";
import { resolveAppErrorMessage } from "@/modules/core/api/app-error";
import { BjjSessionViewModel } from "@/modules/bjj-sessions/types/bjj-session.types";

const toFormValues = (session?: BjjSessionViewModel | null): RawBjjSessionFormValues => {
  if (!session) {
    return getDefaultBjjSessionFormValues();
  }

  return {
    date: session.date,
    startTime: session.startTime ?? "",
    durationMinutes: String(session.durationMinutes),
    location: session.location ?? "",
    coach: session.coach ?? "",
    trainingType: session.trainingType,
    giMode: session.giMode,
    srpe: String(session.srpe),
    rounds: session.rounds ? String(session.rounds) : "",
    roundDurationMinutes: session.roundDurationMinutes ? String(session.roundDurationMinutes) : "",
    roundRestMinutes: session.roundRestMinutes ? String(session.roundRestMinutes) : "",
    sparringMinutes: session.sparringMinutes ? String(session.sparringMinutes) : "",
    drillMinutes: session.drillMinutes ? String(session.drillMinutes) : "",
    techniqueMinutes: session.techniqueMinutes ? String(session.techniqueMinutes) : "",
    trainedPositions: session.trainedPositions.join(", "),
    trainedTechniques: session.trainedTechniques.join(", "),
    successfulTechniques: session.successfulTechniques.join(", "),
    sufferedTechniques: session.sufferedTechniques.join(", "),
    notes: session.notes ?? "",
    fatigueBefore: session.fatigueBefore ? String(session.fatigueBefore) : "",
    painLevel: session.painLevel ? String(session.painLevel) : "",
    injuryNotes: session.injuryNotes ?? "",
    sessionScore: session.sessionScore ? String(session.sessionScore) : "",
  };
};

export function BjjSessionsPage() {
  const resource = useViewResource({
    scope: "bjj-sessions-page",
    fetcher: listBjjSessions,
    isEmpty: (data) => !data || data.items.length === 0,
  });

  const [values, setValues] = useState<RawBjjSessionFormValues>(getDefaultBjjSessionFormValues());
  const [editingSession, setEditingSession] = useState<BjjSessionViewModel | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [banner, setBanner] = useState<{ tone: "success" | "danger"; message: string } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);

  const parsed = useMemo(() => parseBjjSessionForm(values), [values]);

  const openCreate = () => {
    setEditingSession(null);
    setValues(getDefaultBjjSessionFormValues());
    setErrors([]);
    setIsEditorOpen(true);
  };

  const openEdit = (session: BjjSessionViewModel) => {
    setEditingSession(session);
    setValues(toFormValues(session));
    setErrors([]);
    setIsEditorOpen(true);
  };

  const handleSubmit = async (mode: "save" | "save-and-create") => {
    if (!parsed.value) {
      setErrors(parsed.errors);
      return;
    }

    setIsSaving(true);
    setErrors([]);
    setBanner(null);

    try {
      if (editingSession) {
        await updateBjjSession(editingSession.id, parsed.value);
        setBanner({ tone: "success", message: "Sessao atualizada com sucesso." });
      } else {
        await createBjjSession(parsed.value);
        setBanner({ tone: "success", message: "Sessao registrada com sucesso." });
      }

      await resource.refetch();
      if (mode === "save-and-create") {
        setEditingSession(null);
        setValues(getDefaultBjjSessionFormValues());
      } else {
        setIsEditorOpen(false);
      }
    } catch (error) {
      setErrors([resolveAppErrorMessage(error as Error)]);
      setBanner({ tone: "danger", message: resolveAppErrorMessage(error as Error) });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (session: BjjSessionViewModel) => {
    const confirmed = window.confirm(`Excluir a sessao de ${new Date(session.date).toLocaleDateString("pt-BR")}?`);
    if (!confirmed) {
      return;
    }

    try {
      await deleteBjjSession(session.id);
      setBanner({ tone: "success", message: "Sessao excluida com sucesso." });
      await resource.refetch();
    } catch (error) {
      setBanner({ tone: "danger", message: resolveAppErrorMessage(error as Error) });
    }
  };

  const statusBadges = (
    <>
      <StatusBadge label={`${resource.data?.summary.totalSessions ?? 0} sessoes`} tone="default" />
      <StatusBadge label={`${resource.data?.summary.monthlyMatHours ?? 0} h no mes`} tone="success" />
      <StatusBadge label={`Carga semanal ${resource.data?.summary.weeklyLoad ?? 0}`} tone="warning" />
    </>
  );

  const actions = (
    <>
      <button
        type="button"
        onClick={openCreate}
        className="rounded-2xl bg-primary px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-background-dark transition-opacity hover:opacity-90"
      >
        Registrar sessao
      </button>
    </>
  );

  return (
    <AppShell
      title="Jiu-Jitsu Sessions"
      subtitle="Historico operacional de treino, carga, tecnica e estado fisico em um fluxo realmente persistido."
      statusBadges={statusBadges}
      actions={actions}
    >
      <div className="space-y-8">
        {banner ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm ${
              banner.tone === "success"
                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                : "border-red-500/20 bg-red-500/10 text-red-300"
            }`}
          >
            {banner.message}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <MetricTile
            label="Carga semanal"
            value={String(resource.data?.summary.weeklyLoad ?? 0)}
            helper="Atualizada apos criar, editar ou excluir sessoes."
            tone="primary"
          />
          <MetricTile
            label="Horas no mes"
            value={`${resource.data?.summary.monthlyMatHours ?? 0} h`}
            helper="Base real dos ultimos 30 dias."
          />
          <MetricTile
            label="Ultima sessao"
            value={
              resource.data?.summary.lastSessionAt
                ? new Date(resource.data.summary.lastSessionAt).toLocaleDateString("pt-BR")
                : "--"
            }
            helper="Registro mais recente persistido no banco."
          />
        </div>

        {isEditorOpen ? (
          <SurfaceCard>
            <BjjSessionForm
              title={editingSession ? "Editar sessao" : "Nova sessao"}
              values={values}
              errors={errors}
              isSaving={isSaving}
              onChange={(field, value) => setValues((current) => ({ ...current, [field]: value }))}
              onCancel={() => {
                setIsEditorOpen(false);
                setEditingSession(null);
                setErrors([]);
              }}
              onSubmit={handleSubmit}
            />
          </SurfaceCard>
        ) : null}

        {resource.isLoading ? (
          <StatePanel
            eyebrow="BJJ Sessions"
            title="Carregando sessoes"
            description="Buscando historico persistido, carga semanal e ultimo registro real."
          />
        ) : resource.isError ? (
          <StatePanel
            eyebrow="BJJ Sessions"
            title="Erro ao carregar sessoes"
            description={resource.error?.message ?? "Nao foi possivel montar a visao de sessoes."}
            actions={
              <button
                type="button"
                onClick={() => void resource.refetch()}
                className="rounded-2xl bg-primary px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-background-dark"
              >
                Tentar novamente
              </button>
            }
          />
        ) : resource.isEmpty || !resource.data ? (
          <StatePanel
            eyebrow="BJJ Sessions"
            title="Nenhuma sessao registrada ainda"
            description="A rota principal agora usa estado vazio explicito. Registre a primeira sessao para popular dashboard, insights e carga derivada."
            actions={
              <button
                type="button"
                onClick={openCreate}
                className="rounded-2xl bg-primary px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-background-dark"
              >
                Registrar primeira sessao
              </button>
            }
          />
        ) : (
          <BjjSessionList sessions={resource.data.items} onEdit={openEdit} onDelete={handleDelete} />
        )}
      </div>
    </AppShell>
  );
}
