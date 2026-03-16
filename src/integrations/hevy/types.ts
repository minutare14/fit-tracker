export interface HevyExerciseTemplate {
  id: string;
  title: string;
  type: string;
  primary_muscle_group: string;
  secondary_muscle_groups: string[];
  equipment: string;
  is_custom: boolean;
}

export interface HevySet {
  id?: string;
  index: number;
  weight_kg?: number | null;
  reps?: number | null;
  distance_meters?: number | null;
  duration_seconds?: number | null;
  rpe?: number | null;
  is_personal_record?: boolean;
  rest_seconds?: number | null;
  type?: "normal" | "warmup" | "dropset" | "failure"; // Corrected from warm_up, drop_set
}

export interface HevyExercise {
  exercise_template_id: string;
  title: string;
  notes?: string;
  sets: HevySet[];
}

export interface HevyWorkout {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  calories?: number;
  notes?: string;
  exercises: HevyExercise[];
}

export interface HevyRoutine {
  id?: string;
  title: string;
  notes?: string;
  folder_id?: string;
  exercises: HevyExercise[];
}

export interface HevyFolder {
  id: number; // Folders use numeric IDs in some docs, but UUID in others. Swagger says Int for ID in some places but UUID usually. Actually GET /folders says id is number.
  title: string;
  routine_ids: string[];
}

export interface HevyRoutineFolderPayload {
  routine_folder: {
    title: string;
  };
}

export interface HevySyncEvent {
  id: string;
  type: "created" | "updated" | "deleted";
  workout_id: string;
  created_at: string;
}

export interface HevyApiResponse<T> {
  page?: number;
  page_count?: number;
  page_size?: number;
  exercise_templates?: T;
  workouts?: T;
  routines?: T;
  folders?: T;
  events?: T;
}
