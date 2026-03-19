import { HevyExercise as HevyApiExercise, HevySet as HevyApiSet, HevyWorkout as HevyApiWorkout } from "../types";

export class HevyToLocalMapper {
  static toWorkoutModel(userId: string, apiWorkout: HevyApiWorkout) {
    const metrics = this.calculateWorkoutMetrics(apiWorkout);

    return {
      userId,
      externalWorkoutId: apiWorkout.id,
      title: apiWorkout.title || "Workout",
      startedAt: new Date(apiWorkout.start_time),
      endedAt: apiWorkout.end_time ? new Date(apiWorkout.end_time) : null,
      durationSeconds: apiWorkout.duration_seconds ?? metrics.estimatedDurationSeconds,
      rawPayloadJson: {
        ...apiWorkout,
        volume_kg: apiWorkout.volume_kg ?? metrics.volumeKg,
        exercise_count: metrics.exerciseCount,
        set_count: metrics.setCount,
      } as any,
      source: "Hevy",
    };
  }

  static toExerciseModel(workoutId: string, apiExercise: HevyApiExercise, index: number) {
    return {
      workoutId,
      externalExerciseId: apiExercise.id,
      exerciseTemplateId: apiExercise.exercise_template_id,
      exerciseName: apiExercise.title || "Exercise",
      orderIndex: index,
      rawPayloadJson: apiExercise as any,
    };
  }

  static toSetModel(exerciseId: string, apiSet: HevyApiSet, index: number) {
    const normalizedType = apiSet.type === "drop_set" ? "dropset" : (apiSet.type || "normal");

    return {
      exerciseId,
      externalSetId: apiSet.id,
      orderIndex: index,
      setType: normalizedType,
      reps: apiSet.reps,
      weightKg: apiSet.weight_kg,
      durationSeconds: apiSet.duration_seconds,
      distanceM: apiSet.distance_meters,
      isWarmup: normalizedType === "warmup",
      rawPayloadJson: apiSet as any,
    };
  }

  static calculateWorkoutMetrics(apiWorkout: HevyApiWorkout) {
    const exerciseCount = apiWorkout.exercises?.length || 0;
    let setCount = 0;
    let volumeKg = 0;
    let estimatedDurationSeconds = apiWorkout.duration_seconds || 0;

    for (const exercise of apiWorkout.exercises || []) {
      for (const set of exercise.sets || []) {
        setCount += 1;
        volumeKg += (set.weight_kg || 0) * (set.reps || 0);
        estimatedDurationSeconds += set.duration_seconds || 0;
      }
    }

    return {
      exerciseCount,
      setCount,
      volumeKg,
      estimatedDurationSeconds: estimatedDurationSeconds || null,
    };
  }
}
