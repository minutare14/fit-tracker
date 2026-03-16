import { HevyWorkout as HevyApiWorkout, HevyExercise as HevyApiExercise, HevySet as HevyApiSet } from "../types";

export class HevyToLocalMapper {
  static toWorkoutModel(userId: string, apiWorkout: HevyApiWorkout) {
    return {
      userId,
      externalWorkoutId: apiWorkout.id,
      title: apiWorkout.title,
      startedAt: new Date(apiWorkout.start_time),
      endedAt: apiWorkout.end_time ? new Date(apiWorkout.end_time) : null,
      durationSeconds: apiWorkout.duration_seconds,
      rawPayloadJson: apiWorkout as any,
      source: "Hevy",
    };
  }

  static toExerciseModel(workoutId: string, apiExercise: HevyApiExercise, index: number) {
    return {
      workoutId,
      exerciseTemplateId: apiExercise.exercise_template_id,
      exerciseName: apiExercise.title,
      orderIndex: index,
      rawPayloadJson: apiExercise as any,
    };
  }

  static toSetModel(exerciseId: string, apiSet: HevyApiSet, index: number) {
    return {
      exerciseId,
      orderIndex: index,
      setType: apiSet.type || "normal",
      reps: apiSet.reps,
      weightKg: apiSet.weight_kg,
      durationSeconds: apiSet.duration_seconds,
      distanceM: apiSet.distance_meters,
      isWarmup: apiSet.type === "warmup",
      rawPayloadJson: apiSet as any,
    };
  }
}
