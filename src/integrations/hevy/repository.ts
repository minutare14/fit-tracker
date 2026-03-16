import { SyncStatus, IntegrationProvider } from "@prisma/client";
import prisma from "@/lib/prisma";

export class HevyRepository {
  async getConnection(userId: string) {
    return prisma.integrationConnection.findUnique({
      where: { userId_provider: { userId, provider: IntegrationProvider.HEVY } },
    });
  }

  async updateConnectionStatus(userId: string, status: string, error?: string, externalId?: string) {
    return prisma.integrationConnection.upsert({
      where: { userId_provider: { userId, provider: IntegrationProvider.HEVY } },
      update: { status, lastError: error, externalUserId: externalId },
      create: { userId, provider: IntegrationProvider.HEVY, status, lastError: error, externalUserId: externalId },
    });
  }

  async updateLastSync(userId: string, status: SyncStatus, processed: number, created = 0, updated = 0, error?: string) {
    const connection = await this.getConnection(userId);
    if (!connection) return;

    // Create Sync Run Log
    await prisma.syncRun.create({
      data: {
        userId,
        connectionId: connection.id,
        provider: IntegrationProvider.HEVY,
        status,
        recordsProcessed: processed,
        recordsCreated: created,
        recordsUpdated: updated,
        errorMessage: error,
        finishedAt: new Date(),
      },
    });

    // Update Connection
    if (status === SyncStatus.SUCCESS) {
      await prisma.integrationConnection.update({
        where: { id: connection.id },
        data: { lastSyncedAt: new Date(), lastError: null, status: "CONNECTED" },
      });
    }
  }

  async upsertWorkout(userId: string, data: any) {
    const { exercises, ...workoutData } = data;

    const exercisesForCreate = exercises.map((ex: any) => {
      const { id, workoutId, ...exData } = ex;
      return {
        ...exData,
        sets: {
          create: ex.sets.map((s: any) => {
            const { id, exerciseId, ...setData } = s;
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
          create: exercisesForCreate
        }
      },
      create: {
        ...workoutData,
        exercises: {
          create: exercisesForCreate
        }
      }
    });
  }

  async upsertExerciseTemplate(data: any) {
    const { id, title, type, primary_muscle_group, secondary_muscle_groups, equipment, is_custom } = data;
    return prisma.hevyExerciseTemplate.upsert({
      where: { externalTemplateId: id },
      update: {
        title,
        category: type,
        primaryMuscle: primary_muscle_group,
        secondaryMuscles: secondary_muscle_groups,
        equipment,
        isCustom: is_custom,
        rawPayloadJson: data
      },
      create: {
        externalTemplateId: id,
        title,
        category: type,
        primaryMuscle: primary_muscle_group,
        secondaryMuscles: secondary_muscle_groups,
        equipment,
        isCustom: is_custom,
        rawPayloadJson: data
      },
    });
  }

  async getExerciseTemplates(search?: string, category?: string) {
    const where: any = {};
    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }
    if (category) {
      where.category = category;
    }
    return prisma.hevyExerciseTemplate.findMany({
      where,
      orderBy: { title: 'asc' },
    });
  }

  async getMappings(userId: string) {
    return prisma.exerciseMapping.findMany({
      where: { userId, provider: IntegrationProvider.HEVY },
      orderBy: { internalExerciseName: 'asc' },
    });
  }

  async upsertMapping(userId: string, data: any) {
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
      orderBy: { startedAt: 'desc' },
      take: limit,
      include: {
        exercises: {
          include: {
            sets: true
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
          orderBy: { orderIndex: 'asc' },
          include: {
            sets: { orderBy: { orderIndex: 'asc' } }
          }
        }
      }
    });
  }

  // --- Routine Persistence ---
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
