import { HevyApiResponse, HevyExerciseTemplate, HevyRoutine, HevyWorkout, HevyFolder, HevyRoutineFolderPayload, HevySyncEvent } from "./types";

export class HevyClient {
  private apiKey: string;
  private baseUrl = "https://api.hevyapp.com/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...options,
      headers: {
        "api-key": this.apiKey,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Hevy API Error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<T>;
  }

  // Connection Validation
  async validateConnection(): Promise<boolean> {
    try {
      // Small request to check if key is valid
      await this.getExerciseTemplates(1, 1);
      return true;
    } catch (e) {
      return false;
    }
  }

  // Exercise Templates
  async getExerciseTemplates(page = 1, pageSize = 100): Promise<HevyExerciseTemplate[]> {
    const data = await this.request<HevyApiResponse<HevyExerciseTemplate[]>>(
      `/exercise_templates?page=${page}&pageSize=${pageSize}`
    );
    return data.exercise_templates || [];
  }

  // Routines
  async getRoutines(): Promise<HevyRoutine[]> {
    const data = await this.request<HevyApiResponse<HevyRoutine[]>>("/routines");
    return data.routines || [];
  }

  async createRoutine(routine: HevyRoutine): Promise<HevyRoutine> {
    return this.request<HevyRoutine>("/routines", {
      method: "POST",
      body: JSON.stringify({ routine }),
    });
  }

  async updateRoutine(id: string, routine: HevyRoutine): Promise<HevyRoutine> {
    return this.request<HevyRoutine>(`/routines/${id}`, {
      method: "PUT",
      body: JSON.stringify({ routine }),
    });
  }

  // Folders
  async getFolders(): Promise<HevyFolder[]> {
    const data = await this.request<HevyApiResponse<HevyFolder[]>>("/routine_folders");
    return data.folders || [];
  }

  async createFolder(title: string): Promise<HevyFolder> {
    const payload: HevyRoutineFolderPayload = {
      routine_folder: { title }
    };
    return this.request<HevyFolder>("/routine_folders", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  // Workouts (Polling/Sync)
  async getWorkouts(page = 1, pageSize = 100): Promise<HevyWorkout[]> {
    const data = await this.request<HevyApiResponse<HevyWorkout[]>>(
      `/workouts?page=${page}&pageSize=${pageSize}`
    );
    return data.workouts || [];
  }

  async getWorkoutById(id: string): Promise<HevyWorkout> {
    return this.request<HevyWorkout>(`/workouts/${id}`);
  }

  async getWorkoutEvents(since: string): Promise<HevySyncEvent[]> {
    const data = await this.request<HevyApiResponse<HevySyncEvent[]>>(
      `/workouts/events?since=${since}`
    );
    return data.events || [];
  }
}
