import { TrainingRoutine, TrainingExercise, TrainingSetTemplate } from "@prisma/client";
import { HevyRoutine, HevyExercise, HevySet } from "../types";

export class ProgramToHevyMapper {
  static toHevyRoutine(
    routine: TrainingRoutine & { exercises: (TrainingExercise & { setTemplates: TrainingSetTemplate[] })[] }
  ): HevyRoutine {
    return {
      title: routine.title,
      notes: routine.description || undefined,
      exercises: routine.exercises.map((ex) => this.toHevyExercise(ex)),
    };
  }

  private static toHevyExercise(
    exercise: TrainingExercise & { setTemplates: TrainingSetTemplate[] }
  ): HevyExercise {
    return {
      exercise_template_id: exercise.hevyExerciseTemplateId || "",
      title: exercise.internalName,
      sets: exercise.setTemplates.map((set, idx) => this.toHevySet(set, idx)),
    };
  }

  private static toHevySet(setTemplate: TrainingSetTemplate, index: number): HevySet {
    return {
      index,
      type: setTemplate.setType as any,
      reps: setTemplate.reps,
      weight_kg: setTemplate.weightKg,
      duration_seconds: setTemplate.durationSeconds,
      distance_meters: setTemplate.distanceM,
      rest_seconds: setTemplate.restSeconds,
    };
  }
}
