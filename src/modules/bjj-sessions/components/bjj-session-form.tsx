"use client";

import {
  RawBjjSessionFormValues,
  parseBjjSessionForm,
} from "@/modules/bjj-sessions/schemas/bjj-session-form.schema";

interface BjjSessionFormProps {
  title: string;
  values: RawBjjSessionFormValues;
  errors: string[];
  isSaving: boolean;
  onChange: (field: keyof RawBjjSessionFormValues, value: string) => void;
  onCancel: () => void;
  onSubmit: (mode: "save" | "save-and-create") => void;
}

const inputClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-primary dark:border-zinc-800 dark:bg-zinc-950 dark:text-white";

const sectionTitleClassName = "text-xs font-black uppercase tracking-[0.3em] text-slate-500";

export function BjjSessionForm({
  title,
  values,
  errors,
  isSaving,
  onChange,
  onCancel,
  onSubmit,
}: BjjSessionFormProps) {
  const parsed = parseBjjSessionForm(values);

  const handleSubmit = (mode: "save" | "save-and-create") => {
    if (parsed.value) {
      onSubmit(mode);
    }
  };

  return (
    <form
      className="space-y-8"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit("save");
      }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">BJJ Sessions</p>
          <h2 className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{title}</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Salve a sessao, atualize a carga derivada e reflita o resultado imediatamente no historico.
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <h3 className={sectionTitleClassName}>Dados do treino</h3>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Data</span>
            <input className={inputClassName} type="date" value={values.date} onChange={(event) => onChange("date", event.target.value)} />
          </label>
          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Inicio</span>
            <input className={inputClassName} type="time" value={values.startTime} onChange={(event) => onChange("startTime", event.target.value)} />
          </label>
          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Duracao (min)</span>
            <input className={inputClassName} type="number" value={values.durationMinutes} onChange={(event) => onChange("durationMinutes", event.target.value)} />
          </label>
          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Tipo</span>
            <select className={inputClassName} value={values.trainingType} onChange={(event) => onChange("trainingType", event.target.value)}>
              <option value="technical">Technical</option>
              <option value="drill">Drill</option>
              <option value="sparring">Sparring</option>
              <option value="competition">Competition</option>
              <option value="open_mat">Open Mat</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Gi / No-Gi</span>
            <select className={inputClassName} value={values.giMode} onChange={(event) => onChange("giMode", event.target.value)}>
              <option value="gi">Gi</option>
              <option value="nogi">No-Gi</option>
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Local</span>
            <input className={inputClassName} value={values.location} onChange={(event) => onChange("location", event.target.value)} />
          </label>
          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Professor</span>
            <input className={inputClassName} value={values.coach} onChange={(event) => onChange("coach", event.target.value)} />
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className={sectionTitleClassName}>Carga</h3>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">sRPE</span>
            <input className={inputClassName} type="number" min="1" max="10" value={values.srpe} onChange={(event) => onChange("srpe", event.target.value)} />
          </label>
          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Rounds</span>
            <input className={inputClassName} type="number" value={values.rounds} onChange={(event) => onChange("rounds", event.target.value)} />
          </label>
          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Sparring (min)</span>
            <input className={inputClassName} type="number" value={values.sparringMinutes} onChange={(event) => onChange("sparringMinutes", event.target.value)} />
          </label>
          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Drill (min)</span>
            <input className={inputClassName} type="number" value={values.drillMinutes} onChange={(event) => onChange("drillMinutes", event.target.value)} />
          </label>
          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Tecnica (min)</span>
            <input className={inputClassName} type="number" value={values.techniqueMinutes} onChange={(event) => onChange("techniqueMinutes", event.target.value)} />
          </label>
        </div>
        <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm text-slate-700 dark:text-slate-200">
          Carga calculada: <strong>{parsed.value ? parsed.value.durationMinutes * parsed.value.srpe : "--"}</strong>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className={sectionTitleClassName}>Conteudo tecnico</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Posicoes treinadas</span>
            <textarea className={`${inputClassName} min-h-28`} value={values.trainedPositions} onChange={(event) => onChange("trainedPositions", event.target.value)} placeholder="Passe separado por virgula ou quebra de linha" />
          </label>
          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Tecnicas treinadas</span>
            <textarea className={`${inputClassName} min-h-28`} value={values.trainedTechniques} onChange={(event) => onChange("trainedTechniques", event.target.value)} placeholder="Armlock, single leg, guarda..." />
          </label>
          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Funcionaram</span>
            <textarea className={`${inputClassName} min-h-28`} value={values.successfulTechniques} onChange={(event) => onChange("successfulTechniques", event.target.value)} />
          </label>
          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Sofridas</span>
            <textarea className={`${inputClassName} min-h-28`} value={values.sufferedTechniques} onChange={(event) => onChange("sufferedTechniques", event.target.value)} />
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className={sectionTitleClassName}>Estado fisico</h3>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Fadiga pre</span>
            <input className={inputClassName} type="number" min="1" max="10" value={values.fatigueBefore} onChange={(event) => onChange("fatigueBefore", event.target.value)} />
          </label>
          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Dor / lesao</span>
            <input className={inputClassName} type="number" min="1" max="10" value={values.painLevel} onChange={(event) => onChange("painLevel", event.target.value)} />
          </label>
          <label className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Nota geral</span>
            <input className={inputClassName} type="number" min="1" max="10" value={values.sessionScore} onChange={(event) => onChange("sessionScore", event.target.value)} />
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className={sectionTitleClassName}>Observacoes</h3>
        <label className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500">Notas da sessao</span>
          <textarea className={`${inputClassName} min-h-32`} value={values.notes} onChange={(event) => onChange("notes", event.target.value)} />
        </label>
      </section>

      {errors.length > 0 ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {errors.join(" ")}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-2xl bg-primary px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-background-dark transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {isSaving ? "Salvando..." : "Salvar sessao"}
        </button>
        <button
          type="button"
          disabled={isSaving}
          onClick={() => handleSubmit("save-and-create")}
          className="rounded-2xl border border-primary/20 bg-primary/10 px-5 py-3 text-sm font-black uppercase tracking-[0.2em] text-primary transition-colors hover:bg-primary/20 disabled:opacity-50"
        >
          Salvar e criar outra
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-500 transition-colors hover:bg-slate-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
