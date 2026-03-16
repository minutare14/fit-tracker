import { HevyWorkout as HevyApiWorkout, HevyExercise as HevyApiExercise, HevySet as HevyApiSet, HevyRoutine as HevyApiRoutine } from "./types";

export class HevyMapper {
  static toHevyRoutine(title: string, exercises: any[]): HevyApiRoutine {
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

  // Map from API to Prisma Input
  static toPrismaWorkout(userId: string, workout: HevyApiWorkout) {
    return {
      userId,
      externalId: workout.id,
      title: workout.title,
      startTime: new Date(workout.start_time),
      endTime: new Date(workout.end_time),
      durationMinutes: Math.floor(workout.duration_seconds / 60),
      calories: workout.calories,
      notes: workout.notes,
      exercises: {
        create: workout.exercises.map((ex) => ({
          exerciseTemplateId: ex.exercise_template_id,
          title: ex.title,
          sets: {
            create: ex.sets.map((set) => ({
              index: set.index,
              weight: set.weight_kg,
              reps: set.reps,
              distance: set.distance_meters,
              duration: set.duration_seconds,
              isPersonalRecord: set.is_personal_record || false,
              setType: set.type || "normal",
            })),
          },
        })),
      },
    };
  }
}
