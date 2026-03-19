import { IntegrationProvider, SyncStatus } from "@prisma/client";
import { resolveUserId } from "@/lib/current-user";
import { getIntegrationSecret, saveIntegrationSecret } from "@/lib/integration-secrets";
import { TrainingService } from "@/services/training/training.service";
import bjjEvolutionMappings from "./reference/bjj-evolution-mapping.json";
import { HevyClient } from "./client";
import { HevyToLocalMapper } from "./mappers/hevy_to_local_logs";
import { ProgramToHevyMapper } from "./mappers/program_to_hevy";
import { HevyRepository } from "./repository";

export class HevyService {
  private repository: HevyRepository;
  private trainingService: TrainingService;

  constructor() {
    this.repository = new HevyRepository();
    this.trainingService = new TrainingService();
  }

  private async getClient(userId: string) {
    const resolvedUserId = resolveUserId(userId);
    await this.repository.ensureUser(resolvedUserId);

    let connection = await this.repository.getConnection(resolvedUserId);
    let apiKey = (await getIntegrationSecret(resolvedUserId, IntegrationProvider.HEVY, "API_KEY"))?.value
      ?? connection?.apiKey
      ?? null;

    if ((!connection || !apiKey) && process.env.HEVY_API_KEY) {
      await saveIntegrationSecret({
        userId: resolvedUserId,
        provider: IntegrationProvider.HEVY,
        key: "API_KEY",
        value: process.env.HEVY_API_KEY,
      });
      connection = await this.repository.saveApiKey(resolvedUserId, process.env.HEVY_API_KEY, "CONNECTED");
      apiKey = process.env.HEVY_API_KEY;
    }

    if (!apiKey) {
      throw new Error("Hevy not connected. Configure the API key first.");
    }

    return {
      userId: resolvedUserId,
      connection,
      client: new HevyClient(apiKey),
    };
  }

  async syncWorkoutsFromHevy(userId: string, mode: "delta" | "full" = "delta") {
    const { userId: resolvedUserId, connection, client } = await this.getClient(userId);

    try {
      const shouldRunFullSync = mode === "full" || !connection?.lastSyncedAt;
      const events = shouldRunFullSync
        ? []
        : await client.getWorkoutEvents(connection!.lastSyncedAt!.toISOString());

      let processed = 0;
      let created = 0;
      let updated = 0;
      let deleted = 0;

      for (const event of events) {
        await this.repository.recordRawEvent(resolvedUserId, `hevy.workout.${event.type}`, event, event.id);

        if (event.type === "deleted") {
          await this.repository.deleteWorkoutByExternalId(event.workout_id);
          deleted += 1;
          processed += 1;
          continue;
        }

        const apiWorkout = await client.getWorkoutById(event.workout_id);
        await this.repository.recordRawEvent(resolvedUserId, "hevy.workout.payload", apiWorkout, apiWorkout.id);

        const existingWorkout = await this.repository.findWorkoutByExternalId(apiWorkout.id);
        const workoutModel = HevyToLocalMapper.toWorkoutModel(resolvedUserId, apiWorkout);
        const exercises = apiWorkout.exercises.map((exercise, exerciseIndex) => ({
          ...HevyToLocalMapper.toExerciseModel("", exercise, exerciseIndex),
          sets: exercise.sets.map((set, setIndex) => HevyToLocalMapper.toSetModel("", set, setIndex)),
        }));

        await this.repository.upsertWorkout(resolvedUserId, { ...workoutModel, exercises });

        if (existingWorkout) {
          updated += 1;
        } else {
          created += 1;
        }

        processed += 1;
      }

      if (shouldRunFullSync) {
        let page = 1;
        let hasMore = true;

        while (hasMore) {
          const workouts = await client.getWorkouts(page, 10);

          if (workouts.length === 0) {
            hasMore = false;
            continue;
          }

          for (const apiWorkout of workouts) {
            await this.repository.recordRawEvent(resolvedUserId, "hevy.workout.payload", apiWorkout, apiWorkout.id);

            const existingWorkout = await this.repository.findWorkoutByExternalId(apiWorkout.id);
            const workoutModel = HevyToLocalMapper.toWorkoutModel(resolvedUserId, apiWorkout);
            const exercises = apiWorkout.exercises.map((exercise, exerciseIndex) => ({
              ...HevyToLocalMapper.toExerciseModel("", exercise, exerciseIndex),
              sets: exercise.sets.map((set, setIndex) => HevyToLocalMapper.toSetModel("", set, setIndex)),
            }));

            await this.repository.upsertWorkout(resolvedUserId, { ...workoutModel, exercises });

            if (existingWorkout) {
              updated += 1;
            } else {
              created += 1;
            }

            processed += 1;
          }

          hasMore = workouts.length === 10;
          page += 1;
        }
      }

      await this.repository.updateLastSync(
        resolvedUserId,
        SyncStatus.SUCCESS,
        processed,
        created,
        updated,
        undefined,
        "WORKOUTS",
        { deleted, mode: shouldRunFullSync ? "full" : "delta" }
      );

      return {
        success: true,
        processed,
        created,
        updated,
        deleted,
        mode: shouldRunFullSync ? "full" : "delta",
      };
    } catch (error: any) {
      await this.repository.updateLastSync(
        resolvedUserId,
        SyncStatus.FAILURE,
        0,
        0,
        0,
        error.message,
        "WORKOUTS"
      );
      throw error;
    }
  }

  async syncProgramToHevy(userId: string) {
    const { userId: resolvedUserId, client } = await this.getClient(userId);
    const program = await this.trainingService.getProgram(resolvedUserId);

    if (!program) {
      throw new Error("No active training program found");
    }

    try {
      const folderId = await this.createOrGetHevyFolder(client, "BJJ Performance");
      const results = [];
      const programLinks = await this.repository.getProgramLinks(resolvedUserId, program.id);

      for (const routine of program.routines) {
        const payload = ProgramToHevyMapper.toHevyRoutine(routine as any);
        if (folderId) {
          payload.folder_id = folderId.toString();
        }

        const existingLink = programLinks.find((link: any) => link.localRoutineId === routine.id);

        try {
          const result = existingLink?.hevyRoutineId
            ? await client.updateRoutine(existingLink.hevyRoutineId, payload)
            : await client.createRoutine(payload);

          await this.repository.upsertProgramLink(resolvedUserId, {
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
          await this.repository.upsertProgramLink(resolvedUserId, {
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
    } catch (error) {
      console.error("Hevy Sync Error:", error);
      throw error;
    }
  }

  private async createOrGetHevyFolder(client: HevyClient, title = "BJJ Performance") {
    const folders = await client.getFolders();
    const existingFolder = folders.find((folder) => folder.title === title);

    if (existingFolder) {
      return existingFolder.id;
    }

    const newFolder = await client.createFolder(title);
    return newFolder.id;
  }

  async validateAndSaveConnection(userId: string, apiKey: string) {
    const resolvedUserId = resolveUserId(userId);
    const client = new HevyClient(apiKey);
    const isValid = await client.validateConnection();

    if (!isValid) {
      await this.repository.updateConnectionStatus(resolvedUserId, "ERROR", "Invalid API Key");
      throw new Error("Invalid Hevy API Key");
    }

    await saveIntegrationSecret({
      userId: resolvedUserId,
      provider: IntegrationProvider.HEVY,
      key: "API_KEY",
      value: apiKey,
    });
    await this.repository.saveApiKey(resolvedUserId, apiKey, "CONNECTED");
    return true;
  }

  async syncExerciseTemplates(userId: string) {
    const { userId: resolvedUserId, client } = await this.getClient(userId);

    try {
      let page = 1;
      let totalProcessed = 0;
      let created = 0;
      let updated = 0;
      let hasMore = true;

      while (hasMore) {
        const templates = await client.getExerciseTemplates(page, 100);

        if (templates.length === 0) {
          hasMore = false;
          continue;
        }

        for (const template of templates) {
          await this.repository.recordRawEvent(resolvedUserId, "hevy.exercise_template.payload", template, template.id);

          const existingTemplate = await this.repository.findExerciseTemplateByExternalId(template.id);
          await this.repository.upsertExerciseTemplate(template);

          if (existingTemplate) {
            updated += 1;
          } else {
            created += 1;
          }

          totalProcessed += 1;
        }

        hasMore = templates.length === 100;
        page += 1;
      }

      const mappingsSeeded = await this.seedMappingsFromReference(resolvedUserId);

      await this.repository.updateLastSync(
        resolvedUserId,
        SyncStatus.SUCCESS,
        totalProcessed,
        created,
        updated,
        undefined,
        "TEMPLATES",
        { mappingsSeeded }
      );

      return {
        success: true,
        count: totalProcessed,
        created,
        updated,
        mappingsSeeded,
      };
    } catch (error: any) {
      await this.repository.updateLastSync(
        resolvedUserId,
        SyncStatus.FAILURE,
        0,
        0,
        0,
        error.message,
        "TEMPLATES"
      );
      throw error;
    }
  }

  async getExerciseTemplates(search?: string, category?: string) {
    return this.repository.getExerciseTemplates(search, category);
  }

  async getMappings(userId: string) {
    return this.repository.getMappings(resolveUserId(userId));
  }

  async upsertMapping(userId: string, data: any) {
    return this.repository.upsertMapping(resolveUserId(userId), data);
  }

  async deleteMapping(userId: string, internalName: string) {
    return this.repository.deleteMapping(resolveUserId(userId), internalName);
  }

  async getWorkouts(userId: string, limit = 50) {
    const workouts = await this.repository.getWorkouts(resolveUserId(userId), limit);

    return workouts.map((workout: any) => {
      const volumeKg = Number(workout.rawPayloadJson?.volume_kg) || workout.exercises.reduce(
        (workoutAcc: number, exercise: any) => workoutAcc + exercise.sets.reduce(
          (setAcc: number, set: any) => setAcc + (Number(set.weightKg) || 0) * (Number(set.reps) || 0),
          0
        ),
        0
      );

      const prsCount = workout.exercises.reduce(
        (acc: number, exercise: any) =>
          acc + exercise.sets.filter((set: any) => Boolean(set.rawPayloadJson?.is_personal_record)).length,
        0
      );

      return {
        ...workout,
        volumeKg,
        exercisesCount: workout.exercises.length,
        setsCount: workout.exercises.reduce((acc: number, exercise: any) => acc + exercise.sets.length, 0),
        prsCount,
      };
    });
  }

  async getWorkoutById(id: string) {
    const workout: any = await this.repository.getWorkoutById(id);
    if (!workout) {
      return null;
    }

    const volumeKg = Number(workout.rawPayloadJson?.volume_kg) || workout.exercises.reduce(
      (workoutAcc: number, exercise: any) => workoutAcc + exercise.sets.reduce(
        (setAcc: number, set: any) => setAcc + (Number(set.weightKg) || 0) * (Number(set.reps) || 0),
        0
      ),
      0
    );

    return {
      ...workout,
      volumeKg,
      exercisesCount: workout.exercises.length,
      setsCount: workout.exercises.reduce((acc: number, exercise: any) => acc + exercise.sets.length, 0),
    };
  }

  async createDefaultBJJProgram(userId: string) {
    const resolvedUserId = resolveUserId(userId);
    const program = await this.trainingService.initializeDefaultProgram(resolvedUserId);

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

    for (const mapping of defaultMappings) {
      await this.upsertMapping(resolvedUserId, {
        internalExerciseName: mapping.internal,
        externalExerciseTemplateId: mapping.externalId,
        externalExerciseTitle: mapping.title
      });
    }

    return program;
  }

  private async seedMappingsFromReference(userId: string) {
    let seeded = 0;

    for (const [internalExerciseName, mapping] of Object.entries(bjjEvolutionMappings)) {
      const existingTemplate = await this.repository.findExerciseTemplateByExternalId(mapping.id);

      if (!existingTemplate) {
        continue;
      }

      await this.repository.upsertMapping(userId, {
        internalExerciseName,
        externalExerciseTemplateId: mapping.id,
        externalExerciseTitle: mapping.title,
        notes: "Imported from bjj evolution reference mapping",
      });

      seeded += 1;
    }

    return seeded;
  }
}
