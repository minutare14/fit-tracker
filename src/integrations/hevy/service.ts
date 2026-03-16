import { HevyClient } from "./client";
import { HevyRepository } from "./repository";
import { ProgramToHevyMapper } from "./mappers/program_to_hevy";
import { HevyToLocalMapper } from "./mappers/hevy_to_local_logs";
import { SyncStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { TrainingService } from "../../services/training/training.service";

export class HevyService {
  private repository: HevyRepository;
  private trainingService: TrainingService;

  constructor() {
    this.repository = new HevyRepository();
    this.trainingService = new TrainingService();
  }

  async syncWorkoutsFromHevy(userId: string) {
    const connection = await this.repository.getConnection(userId);
    if (!connection || !connection.apiKey) throw new Error("Hevy not connected");

    const client = new HevyClient(connection.apiKey);
    
    try {
      // Use polling with /events endpoint for incremental sync
      const lastSync = connection.lastSyncedAt ? connection.lastSyncedAt.toISOString() : "2024-01-01T00:00:00Z";
      const events = await client.getWorkoutEvents(lastSync);
      
      let created = 0;
      let updated = 0;

      for (const event of events) {
        if (event.type === "deleted") {
          // Handle deletion if necessary
          continue;
        }

        const apiWorkout = await client.getWorkoutById(event.workout_id);
        const workoutModel = HevyToLocalMapper.toWorkoutModel(userId, apiWorkout);
        const exercises = apiWorkout.exercises.map((ex, exIdx) => ({
          ...HevyToLocalMapper.toExerciseModel("", ex, exIdx),
          sets: ex.sets.map((s, sIdx) => HevyToLocalMapper.toSetModel("", s, sIdx))
        }));

        await this.repository.upsertWorkout(userId, { ...workoutModel, exercises });
        if (event.type === "created") created++;
        else updated++;
      }

      // If no events but user wants a full refresh or first sync
      if (events.length === 0 && !connection.lastSyncedAt) {
         const initialWorkouts = await client.getWorkouts(1, 50);
         for (const apiWorkout of initialWorkouts) {
            const workoutModel = HevyToLocalMapper.toWorkoutModel(userId, apiWorkout);
            const exercises = apiWorkout.exercises.map((ex, exIdx) => ({
              ...HevyToLocalMapper.toExerciseModel("", ex, exIdx),
              sets: ex.sets.map((s, sIdx) => HevyToLocalMapper.toSetModel("", s, sIdx))
            }));
            await this.repository.upsertWorkout(userId, { ...workoutModel, exercises });
            created++;
         }
      }

      await this.repository.updateLastSync(userId, SyncStatus.SUCCESS, events.length || created, created, updated);
      return { success: true, events: events.length, created, updated };
    } catch (error: any) {
      await this.repository.updateLastSync(userId, SyncStatus.FAILURE, 0, 0, 0, error.message);
      throw error;
    }
  }

  async syncProgramToHevy(userId: string) {
    const connection = await this.repository.getConnection(userId);
    if (!connection || !connection.apiKey) throw new Error("Hevy not connected");

    const client = new HevyClient(connection.apiKey);
    const program = await this.trainingService.getProgram(userId);
    if (!program) throw new Error("No active training program found");

    try {
      // 1. Ensure Folder exists: "BJJ Performance"
      const folderId = await this.createOrGetHevyFolder(client, program.id, "BJJ Performance");
      
      const results = [];
      const programLinks = await this.repository.getProgramLinks(userId, program.id);

      for (const routine of program.routines) {
        const payload = ProgramToHevyMapper.toHevyRoutine(routine as any);
        if (folderId) payload.folder_id = folderId.toString();

        let result;
        const existingLink = programLinks.find((l: any) => l.localRoutineId === routine.id);

        try {
          if (existingLink?.hevyRoutineId) {
            result = await client.updateRoutine(existingLink.hevyRoutineId, payload);
          } else {
            result = await client.createRoutine(payload);
          }

          // Persistence Step: Link local ↔ Hevy
          await this.repository.upsertProgramLink(userId, {
            id: existingLink?.id,
            trainingProgramId: program.id,
            hevyFolderId: folderId.toString(),
            hevyRoutineId: result.id,
            localRoutineId: routine.id,
            syncStatus: "SUCCESS",
            lastSyncedAt: new Date(),
            lastError: null
          });

          results.push({
            routine: routine.title,
            hevyId: result.id,
            status: "SUCCESS"
          });
        } catch (routineError: any) {
          await this.repository.upsertProgramLink(userId, {
            id: existingLink?.id,
            trainingProgramId: program.id,
            hevyFolderId: folderId.toString(),
            localRoutineId: routine.id,
            syncStatus: "FAILURE",
            lastError: routineError.message
          });
          results.push({
            routine: routine.title,
            status: "FAILURE",
            error: routineError.message
          });
        }
      }

      return { 
        success: true, 
        folder: "BJJ Performance",
        folderId,
        routines: results 
      };
    } catch (error: any) {
      console.error("Hevy Sync Error:", error);
      throw error;
    }
  }

  private async createOrGetHevyFolder(client: HevyClient, programId: string, title = "BJJ Performance"): Promise<number> {
    const folders = await client.getFolders();
    const existingFolder = folders.find(f => f.title === title);
    
    if (existingFolder) {
      return existingFolder.id;
    }
    
    const newFolder = await client.createFolder(title);
    return newFolder.id;
  }

  async validateAndSaveConnection(userId: string, apiKey: string) {
    const client = new HevyClient(apiKey);
    const isValid = await client.validateConnection();
    
    if (isValid) {
      await this.repository.updateConnectionStatus(userId, "CONNECTED", undefined, undefined);
      const connection = await this.repository.getConnection(userId);
      if (connection) {
        await prisma.integrationConnection.update({
          where: { id: connection.id },
          data: { apiKey }
        });
      }
    } else {
      await this.repository.updateConnectionStatus(userId, "ERROR", "Invalid API Key");
      throw new Error("Invalid Hevy API Key");
    }
    
    return isValid;
  }

  async syncExerciseTemplates(userId: string) {
    const connection = await this.repository.getConnection(userId);
    if (!connection || !connection.apiKey) throw new Error("Hevy not connected");

    const client = new HevyClient(connection.apiKey);
    
    try {
      let page = 1;
      let totalProcessed = 0;
      let hasMore = true;

      while (hasMore) {
        const templates = await client.getExerciseTemplates(page, 100);
        if (templates.length === 0) {
          hasMore = false;
          break;
        }

        for (const template of templates) {
          await this.repository.upsertExerciseTemplate(template);
          totalProcessed++;
        }
        
        page++;
        if (page > 20) break; // Safety break
      }

      return { success: true, count: totalProcessed };
    } catch (error: any) {
      throw error;
    }
  }

  async getExerciseTemplates(search?: string, category?: string) {
    return this.repository.getExerciseTemplates(search, category);
  }

  async getMappings(userId: string) {
    return this.repository.getMappings(userId);
  }

  async upsertMapping(userId: string, data: any) {
    return this.repository.upsertMapping(userId, data);
  }

  async deleteMapping(userId: string, internalName: string) {
    return this.repository.deleteMapping(userId, internalName);
  }

  async getWorkouts(userId: string, limit = 50) {
    return this.repository.getWorkouts(userId, limit);
  }

  async getWorkoutById(id: string) {
    return this.repository.getWorkoutById(id);
  }

  async createDefaultBJJProgram(userId: string) {
    const program = await this.trainingService.initializeDefaultProgram(userId);
    
    const defaultMappings = [
      { internal: "Bench Press", externalId: "79D0BB3A", title: "Bench Press (Barbell)" },
      { internal: "Incline Bench Press (Barbell)", externalId: "50DFDFAB", title: "Incline Bench Press (Barbell)" },
      { internal: "Shoulder Press (Dumbbell)", externalId: "878CD1D0", title: "Shoulder Press (Dumbbell)" },
      { internal: "Upright Row (Barbell)", externalId: "7AB9A362", title: "Upright Row (Barbell)" },
      { internal: "Triceps Pushdown", externalId: "93A552C6", title: "Triceps Pushdown (Cable)" },
      { internal: "Bent Over Row (Barbell)", externalId: "55E6546F", title: "Bent Over Row (Barbell)" },
      { internal: "Reverse Grip Lat Pulldown (Cable)", externalId: "046E25A2", title: "Lat Pulldown (Underhand Grip) (Cable)" },
      { internal: "Dumbbell Row", externalId: "F1E57334", title: "Dumbbell Row" },
      { internal: "Rear Delt Reverse Fly (Dumbbell)", externalId: "E5988A0A", title: "Reverse Fly (Dumbbell)" },
      { internal: "Hammer Curl (Dumbbell)", externalId: "7E3BC8B6", title: "Hammer Curl (Dumbbell)" },
      { internal: "Squat (Barbell)", externalId: "D04AC939", title: "Back Squat (Barbell)" },
      { internal: "Deadlift (Barbell)", externalId: "C6272009", title: "Deadlift (Barbell)" },
      { internal: "Lunge (Dumbbell)", externalId: "B537D09F", title: "Lunge (Dumbbell)" },
      { internal: "Romanian Deadlift (Dumbbell)", externalId: "72CFFAD5", title: "Romanian Deadlift (Dumbbell)" }
    ];

    for (const m of defaultMappings) {
      await this.upsertMapping(userId, {
        internalExerciseName: m.internal,
        externalExerciseTemplateId: m.externalId,
        externalExerciseTitle: m.title
      });
    }

    return program;
  }
}
