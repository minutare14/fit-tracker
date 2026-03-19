"use client";

import { FormEvent, useEffect, useState } from "react";
import { resolveAppErrorMessage } from "@/modules/core/api/app-error";
import { requestJson } from "@/modules/core/api/http-client";

export interface ProfileFormData {
  userId: string;
  name: string;
  email: string;
  displayName: string;
  birthDate: string;
  sex: string;
  heightCm: number | null;
  currentWeightKg: number | null;
  targetCategory: string;
  beltRank: string;
  academyTeam: string;
  primaryGoal: string;
  injuriesRestrictions: string;
  timezone: string;
  unitSystem: string;
  dailyCalorieTarget: number | null;
  proteinTargetG: number | null;
  carbsTargetG: number | null;
  fatTargetG: number | null;
  hydrationTargetLiters: number | null;
}

interface ProfileSettingsFormProps {
  userId: string;
}

const defaultProfile: ProfileFormData = {
  userId: "default-user",
  name: "",
  email: "",
  displayName: "",
  birthDate: "",
  sex: "",
  heightCm: null,
  currentWeightKg: null,
  targetCategory: "",
  beltRank: "",
  academyTeam: "",
  primaryGoal: "",
  injuriesRestrictions: "",
  timezone: "America/Bahia",
  unitSystem: "metric",
  dailyCalorieTarget: null,
  proteinTargetG: null,
  carbsTargetG: null,
  fatTargetG: null,
  hydrationTargetLiters: null,
};

const numericValue = (value: number | null) => (value ?? "") as number | "";

const toNullableNumber = (value: string) => {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export default function ProfileSettingsForm({ userId }: ProfileSettingsFormProps) {
  const [form, setForm] = useState<ProfileFormData>({ ...defaultProfile, userId });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    const loadProfile = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await requestJson<ProfileFormData>(`/api/settings/profile?userId=${encodeURIComponent(userId)}`, {
          signal: controller.signal,
        });
        setForm({ ...defaultProfile, ...data, userId });
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setError(resolveAppErrorMessage(err));
        }
      } finally {
        setIsLoading(false);
      }
    };

    void loadProfile();

    return () => controller.abort();
  }, [userId]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = await requestJson<{ success: boolean; profile: ProfileFormData }>("/api/settings/profile", {
        method: "PUT",
        body: JSON.stringify(form),
      });

      setForm({ ...defaultProfile, ...payload.profile, userId });
      setSuccess("Perfil salvo com sucesso.");
    } catch (err: any) {
      setError(resolveAppErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const renderInput = (
    label: string,
    key: keyof ProfileFormData,
    options?: { type?: string; placeholder?: string }
  ) => (
    <label className="space-y-1.5">
      <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">{label}</span>
      <input
        type={options?.type ?? "text"}
        placeholder={options?.placeholder}
        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-primary dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
        value={typeof form[key] === "number" || form[key] === null ? numericValue(form[key] as number | null) : String(form[key] ?? "")}
        onChange={(e) =>
          setForm((current) => ({
            ...current,
            [key]: options?.type === "number" ? toNullableNumber(e.target.value) : e.target.value,
          }))
        }
      />
    </label>
  );

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Perfil</p>
          <h2 className="mt-2 text-xl font-black text-slate-900 dark:text-slate-100">Dados do atleta</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Esta base passa a alimentar metas, dashboards e integrações sem depender de valores mockados.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="rounded-lg border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500 dark:border-zinc-800 dark:text-slate-400">
          Carregando perfil salvo...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {renderInput("Nome", "name")}
            {renderInput("Nome de exibicao", "displayName")}
            {renderInput("Data de nascimento", "birthDate", { type: "date" })}
            {renderInput("Sexo", "sex")}
            {renderInput("Altura (cm)", "heightCm", { type: "number" })}
            {renderInput("Peso atual (kg)", "currentWeightKg", { type: "number" })}
            {renderInput("Categoria alvo", "targetCategory")}
            {renderInput("Graduacao", "beltRank")}
            {renderInput("Academia / Equipe", "academyTeam")}
            {renderInput("Objetivo principal", "primaryGoal")}
            {renderInput("Timezone", "timezone")}
            {renderInput("Unidade", "unitSystem")}
            {renderInput("Meta calorica", "dailyCalorieTarget", { type: "number" })}
            {renderInput("Meta de proteina (g)", "proteinTargetG", { type: "number" })}
            {renderInput("Meta de carbo (g)", "carbsTargetG", { type: "number" })}
            {renderInput("Meta de gordura (g)", "fatTargetG", { type: "number" })}
            {renderInput("Meta de hidratacao (L)", "hydrationTargetLiters", { type: "number" })}
          </div>

          <label className="space-y-1.5">
            <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">Lesoes / Restricoes</span>
            <textarea
              className="min-h-28 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-primary dark:border-zinc-800 dark:bg-zinc-950 dark:text-white"
              value={form.injuriesRestrictions}
              onChange={(e) => setForm((current) => ({ ...current, injuriesRestrictions: e.target.value }))}
            />
          </label>

          {error && <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">{error}</div>}
          {success && <div className="rounded-lg border border-primary/20 bg-primary/10 p-3 text-sm text-primary">{success}</div>}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-lg bg-primary px-5 py-3 text-sm font-bold text-background-dark transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Salvando..." : "Salvar perfil"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
