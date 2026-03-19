import { IntegrationProvider, SyncStatus } from "@prisma/client";
import prisma from "@/lib/prisma";
import { ensureUser } from "@/lib/current-user";

export class HevyRepository {
  async ensureUser(userId: string) {
    return ensureUser(userId);
  }

  async getConnection(userId: string) {
    return prisma.integrationConnection.findUnique({
      where: { userId_provider: { userId, provider: IntegrationProvider.HEVY } },
    });
  }

  async saveApiKey(userId: string, apiKey: string, status = "CONNECTED") {
    await this.ensureUser(userId);

    return prisma.integrationConnection.upsert({
      where: { userId_provider: { userId, provider: IntegrationProvider.HEVY } },
      update: { apiKey, status, lastError: null },
      create: { userId, provider: IntegrationProvider.HEVY, apiKey, status },
    });
  }

  async updateConnectionStatus(userId: string, status: string, error?: string, externalId?: string) {
    await this.ensureUser(userId);

    return prisma.integrationConnection.upsert({
      where: { userId_provider: { userId, provider: IntegrationProvider.HEVY } },
      update: { status, lastError: error, externalUserId: externalId },
      create: { userId, provider: IntegrationProvider.HEVY, status, lastError: error, externalUserId: externalId },
    });
  }

  async updateLastSync(
    userId: string,
    status: SyncStatus,
    processed: number,
    created = 0,
    updated = 0,
    error?: string,
    syncType = "WORKOUTS",
    metadataJson?: any
  ) {
    const connection = await this.getConnection(userId);
    if (!connection) return;
    const finishedAt = new Date();

    await prisma.syncRun.create({
      data: {
        userId,
        connectionId: connection.id,
        provider: IntegrationProvider.HEVY,
        syncType,
        status,
        startedAt: finishedAt,
        recordsProcessed: processed,
        recordsCreated: created,
        recordsUpdated: updated,
        errorMessage: error,
        finishedAt,
        metadataJson,
      },
    });

    if (status === SyncStatus.SUCCESS) {
      await prisma.integrationConnection.update({
        where: { id: connection.id },
        data: { lastSyncedAt: finishedAt, lastError: null, status: "CONNECTED" },
      });
      return;
    }

    await prisma.integrationConnection.update({
      where: { id: connection.id },
      data: { lastError: error, status: "ERROR" },
    });
  }

  async recordRawEvent(userId: string, eventType: string, payloadJson: any, externalEventId?: string) {
    return prisma.rawEvent.create({
      data: {
        userId,
        provider: IntegrationProvider.HEVY,
        eventType,
        externalEventId,
        payloadJson,
        status: "RECEIVED",
        processedAt: new Date(),
      },
    });
  }

  async findWorkoutByExternalId(externalWorkoutId: string) {
    return prisma.hevyWorkout.findUnique({
      where: { externalWorkoutId },
      select: { id: true },
    });
  }

  async deleteWorkoutByExternalId(externalWorkoutId: string) {
    return prisma.hevyWorkout.delete({
      where: { externalWorkoutId },
    }).catch(() => null);
  }

  async findExerciseTemplateByExternalId(externalTemplateId: string) {
    return prisma.hevyExerciseTemplate.findUnique({
      where: { externalTemplateId },
      select: { id: true },
    });
  }

  async upsertWorkout(_userId: string, data: any) {
    const { exercises, ...workoutData } = data;

    const exercisesForCreate = exercises.map((exercise: any) => {
      const { id, workoutId, ...exerciseData } = exercise;
      return {
        ...exerciseData,
        sets: {
          create: exercise.sets.map((set: any) => {
            const { id: setId, exerciseId, ...setData } = set;
            return setData;
          })
        }
      };
    });

    return prisma.hevyWorkout.upsert({
      where: { externalWorkoutId: data.externalWorkoutId },
      update: {
        ...workoutData,
        exercises: {
          deleteMany: {},
          create: exercisesForCreate,
        },
      },
      create: {
        ...workoutData,
        exercises: {
          create: exercisesForCreate,
        },
      },
    });
  }

  async upsertExerciseTemplate(data: any) {
    const {
      id,
      title,
      type,
      exercise_type,
      muscle_group,
      primary_muscle_group,
      other_muscles,
      secondary_muscle_groups,
      equipment,
      equipment_category,
      is_custom,
    } = data;

    return prisma.hevyExerciseTemplate.upsert({
      where: { externalTemplateId: id },
      update: {
        title,
        category: exercise_type || type || null,
        primaryMuscle: primary_muscle_group || muscle_group || null,
        secondaryMuscles: secondary_muscle_groups || other_muscles || [],
        equipment: equipment || equipment_category || null,
        isCustom: is_custom,
        rawPayloadJson: data,
      },
      create: {
        externalTemplateId: id,
        title,
        category: exercise_type || type || null,
        primaryMuscle: primary_muscle_group || muscle_group || null,
        secondaryMuscles: secondary_muscle_groups || other_muscles || [],
        equipment: equipment || equipment_category || null,
        isCustom: is_custom,
        rawPayloadJson: data,
      },
    });
  }

  async getExerciseTemplates(search?: string, category?: string) {
    const where: any = {};

    if (search) {
      where.title = { contains: search, mode: "insensitive" };
    }

    if (category) {
      where.category = category;
    }

    return prisma.hevyExerciseTemplate.findMany({
      where,
      orderBy: { title: "asc" },
    });
  }

  async getMappings(userId: string) {
    return prisma.exerciseMapping.findMany({
      where: { userId, provider: IntegrationProvider.HEVY },
      orderBy: { internalExerciseName: "asc" },
    });
  }

  async upsertMapping(userId: string, data: any) {
    await this.ensureUser(userId);

    return prisma.exerciseMapping.upsert({
      where: {
        userId_internalExerciseName_provider: {
          userId,
          internalExerciseName: data.internalExerciseName,
          provider: IntegrationProvider.HEVY,
        },
      },
      update: data,
      create: { ...data, userId, provider: IntegrationProvider.HEVY },
    });
  }

  async deleteMapping(userId: string, internalName: string) {
    return prisma.exerciseMapping.delete({
      where: {
        userId_internalExerciseName_provider: {
          userId,
          internalExerciseName: internalName,
          provider: IntegrationProvider.HEVY,
        },
      },
    });
  }

  async getWorkouts(userId: string, limit = 50) {
    return prisma.hevyWorkout.findMany({
      where: { userId },
      orderBy: { startedAt: "desc" },
      take: limit,
      include: {
        exercises: {
          orderBy: { orderIndex: "asc" },
          include: {
            sets: { orderBy: { orderIndex: "asc" } }
          }
        }
      }
    });
  }

  async getWorkoutById(id: string) {
    return prisma.hevyWorkout.findUnique({
      where: { id },
      include: {
        exercises: {
          orderBy: { orderIndex: "asc" },
          include: {
            sets: { orderBy: { orderIndex: "asc" } }
          }
        }
      }
    });
  }

  async updateProgramExternalId(programId: string, externalId: string) {
    return prisma.trainingProgram.update({
      where: { id: programId },
      data: { externalId }
    });
  }

  async updateRoutineExternalId(routineId: string, externalId: string) {
    return prisma.trainingRoutine.update({
      where: { id: routineId },
      data: { externalId }
    });
  }

  async findProgramByExternalId(externalId: string) {
    return prisma.trainingProgram.findUnique({
      where: { externalId }
    });
  }

  async upsertProgramLink(userId: string, data: any) {
    await this.ensureUser(userId);

    const { id, ...updateData } = data;
    if (id) {
      return prisma.hevyProgramLink.update({
        where: { id },
        data: updateData
      });
    }

    return prisma.hevyProgramLink.create({
      data: { ...data, userId }
    });
  }

  async getProgramLinks(userId: string, programId: string) {
    return prisma.hevyProgramLink.findMany({
      where: { userId, trainingProgramId: programId }
    });
  }
}
