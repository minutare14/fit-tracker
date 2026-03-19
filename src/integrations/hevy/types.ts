export interface HevyExerciseTemplate {
  id: string;
  title: string;
  description?: string;
  type?: string;
  exercise_type?: string;
  muscle_group?: string;
  primary_muscle_group?: string;
  other_muscles?: string[];
  secondary_muscle_groups?: string[];
  equipment?: string;
  equipment_category?: string;
  is_custom: boolean;
  created_at?: string;
  updated_at?: string;
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
  type?: "normal" | "warmup" | "dropset" | "drop_set" | "failure";
}

export interface HevyExercise {
  id?: string;
  exercise_template_id?: string;
  title?: string;
  notes?: string;
  sets: HevySet[];
}

export interface HevyWorkout {
  id: string;
  title?: string;
  description?: string;
  start_time: string;
  end_time?: string;
  duration_seconds?: number;
  volume_kg?: number;
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
  id: number;
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
  count?: number;
  exercise_templates?: T;
  workouts?: T;
  routines?: T;
  folders?: T;
  events?: T;
}
