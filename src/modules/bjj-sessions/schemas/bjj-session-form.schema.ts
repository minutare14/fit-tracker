import {
  BjjGiMode,
  BjjTrainingType,
  CreateBjjSessionInput,
} from "@/modules/bjj-sessions/types/bjj-session.types";

const toTagArray = (value: string) =>
  value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

export interface RawBjjSessionFormValues {
  date: string;
  startTime: string;
  durationMinutes: string;
  location: string;
  coach: string;
  trainingType: BjjTrainingType;
  giMode: BjjGiMode;
  srpe: string;
  rounds: string;
  roundDurationMinutes: string;
  sparringMinutes: string;
  drillMinutes: string;
  techniqueMinutes: string;
  trainedPositions: string;
  trainedTechniques: string;
  successfulTechniques: string;
  sufferedTechniques: string;
  notes: string;
  fatigueBefore: string;
  painLevel: string;
  sessionScore: string;
}

export function getDefaultBjjSessionFormValues(): RawBjjSessionFormValues {
  return {
    date: new Date().toISOString().slice(0, 10),
    startTime: "",
    durationMinutes: "90",
    location: "",
    coach: "",
    trainingType: "technical",
    giMode: "gi",
    srpe: "7",
    rounds: "",
    roundDurationMinutes: "",
    sparringMinutes: "",
    drillMinutes: "",
    techniqueMinutes: "",
    trainedPositions: "",
    trainedTechniques: "",
    successfulTechniques: "",
    sufferedTechniques: "",
    notes: "",
    fatigueBefore: "",
    painLevel: "",
    sessionScore: "",
  };
}

const parseOptionalNumber = (value: string) => {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export function parseBjjSessionForm(values: RawBjjSessionFormValues): {
  value: CreateBjjSessionInput | null;
  errors: string[];
} {
  const durationMinutes = Number(values.durationMinutes);
  const srpe = Number(values.srpe);
  const errors: string[] = [];

  if (!values.date) {
    errors.push("Informe a data da sessao.");
  }
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    errors.push("Duracao deve ser maior que zero.");
  }
  if (!Number.isFinite(srpe) || srpe < 1 || srpe > 10) {
    errors.push("sRPE deve ficar entre 1 e 10.");
  }

  if (errors.length > 0) {
    return { value: null, errors };
  }

  return {
    value: {
      date: values.date,
      startTime: values.startTime || null,
      durationMinutes,
      location: values.location || null,
      coach: values.coach || null,
      trainingType: values.trainingType,
      giMode: values.giMode,
      srpe,
      rounds: parseOptionalNumber(values.rounds),
      roundDurationMinutes: parseOptionalNumber(values.roundDurationMinutes),
      sparringMinutes: parseOptionalNumber(values.sparringMinutes),
      drillMinutes: parseOptionalNumber(values.drillMinutes),
      techniqueMinutes: parseOptionalNumber(values.techniqueMinutes),
      trainedPositions: toTagArray(values.trainedPositions),
      trainedTechniques: toTagArray(values.trainedTechniques),
      successfulTechniques: toTagArray(values.successfulTechniques),
      sufferedTechniques: toTagArray(values.sufferedTechniques),
      notes: values.notes || null,
      fatigueBefore: parseOptionalNumber(values.fatigueBefore),
      painLevel: parseOptionalNumber(values.painLevel),
      sessionScore: parseOptionalNumber(values.sessionScore),
    },
    errors: [],
  };
}
