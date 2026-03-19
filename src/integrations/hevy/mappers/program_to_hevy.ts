import { TrainingExercise, TrainingRoutine, TrainingSetTemplate } from "@prisma/client";
import { HevyExercise, HevyRoutine, HevySet } from "../types";

export class ProgramToHevyMapper {
  static toHevyRoutine(
    routine: TrainingRoutine & { exercises: (TrainingExercise & { setTemplates: TrainingSetTemplate[] })[] }
  ): HevyRoutine {
    return {
      title: routine.title,
      notes: this.sanitizeNotes(routine.description),
      exercises: routine.exercises
        .filter((exercise) => Boolean(exercise.hevyExerciseTemplateId))
        .map((exercise) => this.toHevyExercise(exercise)),
    };
  }

  private static toHevyExercise(
    exercise: TrainingExercise & { setTemplates: TrainingSetTemplate[] }
  ): HevyExercise {
    return {
      exercise_template_id: exercise.hevyExerciseTemplateId || "",
      notes: this.sanitizeNotes(exercise.notes),
      sets: exercise.setTemplates.map((set, idx) => this.toHevySet(set, idx)),
    };
  }

  private static toHevySet(setTemplate: TrainingSetTemplate, index: number): HevySet {
    const setType = setTemplate.setType === "drop_set" ? "dropset" : setTemplate.setType;

    return {
      index,
      type: (setType || "normal") as any,
      ...(setTemplate.reps != null ? { reps: setTemplate.reps } : {}),
      ...(setTemplate.weightKg != null ? { weight_kg: setTemplate.weightKg } : {}),
      ...(setTemplate.durationSeconds != null ? { duration_seconds: setTemplate.durationSeconds } : {}),
      ...(setTemplate.distanceM != null ? { distance_meters: setTemplate.distanceM } : {}),
      ...(setTemplate.restSeconds != null ? { rest_seconds: setTemplate.restSeconds } : {}),
    };
  }

  private static sanitizeNotes(notes?: string | null) {
    if (!notes) return undefined;
    return notes.replace(/@/g, "").trim() || undefined;
  }
}
