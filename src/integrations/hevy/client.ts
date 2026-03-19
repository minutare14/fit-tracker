import {
  HevyApiResponse,
  HevyExerciseTemplate,
  HevyFolder,
  HevyRoutine,
  HevyRoutineFolderPayload,
  HevySyncEvent,
  HevyWorkout,
} from "./types";

export class HevyClient {
  private readonly apiKey: string;
  private readonly baseUrl = "https://api.hevyapp.com/v1";

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
      cache: "no-store",
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Hevy API Error: ${response.status} - ${error}`);
    }

    const text = await response.text();
    return text ? JSON.parse(text) as T : ({} as T);
  }

  async validateConnection(): Promise<boolean> {
    try {
      await this.getExerciseTemplates(1, 1);
      return true;
    } catch {
      return false;
    }
  }

  async getExerciseTemplates(page = 1, pageSize = 100): Promise<HevyExerciseTemplate[]> {
    const data = await this.request<HevyApiResponse<HevyExerciseTemplate[]>>(
      `/exercise_templates?page=${page}&pageSize=${pageSize}`
    );
    return data.exercise_templates || [];
  }

  async getExerciseTemplateById(id: string): Promise<HevyExerciseTemplate> {
    return this.request<HevyExerciseTemplate>(`/exercise_templates/${id}`);
  }

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

  async getWorkouts(page = 1, pageSize = 10): Promise<HevyWorkout[]> {
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
      `/workouts/events?since=${encodeURIComponent(since)}`
    );
    return data.events || [];
  }
}
