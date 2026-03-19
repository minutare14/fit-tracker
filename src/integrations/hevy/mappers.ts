import { HevyWorkout as HevyApiWorkout, HevySet as HevyApiSet, HevyRoutine as HevyApiRoutine } from "./types";

interface RoutineExerciseTemplateInput {
  templateId?: string;
  title?: string;
  setsCount?: number;
  defaultWeight?: number;
  defaultReps?: number;
}

interface LegacyWorkoutSetInput {
  index: number;
  weight: number;
  reps: number;
  distance: number | null;
  duration: number | null;
  isPersonalRecord: boolean;
  setType: NonNullable<HevyApiSet["type"]> | "normal";
}

interface LegacyWorkoutExerciseInput {
  exerciseTemplateId: string | null;
  title: string;
  sets: {
    create: LegacyWorkoutSetInput[];
  };
}

interface LegacyWorkoutInput {
  userId: string;
  externalId: string;
  title: string;
  startTime: Date;
  endTime: Date | null;
  durationMinutes: number;
  calories: number;
  notes: string;
  exercises: {
    create: LegacyWorkoutExerciseInput[];
  };
}

export class HevyMapper {
  static toHevyRoutine(title: string, exercises: RoutineExerciseTemplateInput[]): HevyApiRoutine {
    return {
      title,
      exercises: exercises.map((ex) => ({
        exercise_template_id: ex.templateId,
        title: ex.title,
        sets: Array(ex.setsCount || 3).fill(null).map((_, i) => ({
          index: i,
          weight_kg: ex.defaultWeight || 0,
          reps: ex.defaultReps || 20,
        })),
      })),
    };
  }

  // Legacy mapper kept for compatibility with older workout DTO consumers.
  static toPrismaWorkout(userId: string, workout: HevyApiWorkout): LegacyWorkoutInput {
    const durationSeconds = workout.duration_seconds ?? 0;

    return {
      userId,
      externalId: workout.id,
      title: workout.title ?? "Workout",
      startTime: new Date(workout.start_time),
      endTime: workout.end_time ? new Date(workout.end_time) : null,
      durationMinutes: Math.floor(durationSeconds / 60),
      calories: workout.calories ?? 0,
      notes: workout.notes ?? "",
      exercises: {
        create: workout.exercises.map((ex) => ({
          exerciseTemplateId: ex.exercise_template_id ?? null,
          title: ex.title ?? "Exercise",
          sets: {
            create: ex.sets.map((set) => ({
              index: set.index,
              weight: set.weight_kg ?? 0,
              reps: set.reps ?? 0,
              distance: set.distance_meters ?? null,
              duration: set.duration_seconds ?? null,
              isPersonalRecord: set.is_personal_record ?? false,
              setType: set.type ?? "normal",
            })),
          },
        })),
      },
    };
  }
}
