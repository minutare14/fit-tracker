import prisma from "@/lib/prisma";

export class TrainingService {
  async getProgram(userId: string) {
    return prisma.trainingProgram.findFirst({
      where: { userId, isActive: true },
      include: {
        routines: {
          orderBy: { orderIndex: "asc" },
          include: {
            exercises: {
              orderBy: { orderIndex: "asc" },
              include: {
                setTemplates: {
                  orderBy: { orderIndex: "asc" },
                },
              },
            },
          },
        },
      },
    });
  }

  async initializeDefaultProgram(userId: string) {
    // 1. Check if user already has a program
    const existing = await prisma.trainingProgram.findFirst({ where: { userId } });
    if (existing) return existing;

    // 2. Create the "BJJ Performance Blueprint"
    return prisma.trainingProgram.create({
      data: {
        userId,
        name: "BJJ Performance Blueprint",
        description: "Standardized strength & conditioning for BJJ athletes (Push, Pull, Legs).",
        routines: {
          create: [
            {
              title: "Upper Body Push",
              orderIndex: 0,
              restSecondsDefault: 90,
              exercises: {
                create: [
                  this.createExercise("Bench Press", "79D0BB3A", 0, 60),
                  this.createExercise("Incline Bench Press (Barbell)", "50DFDFAB", 1),
                  this.createExercise("Shoulder Press (Dumbbell)", "878CD1D0", 2),
                  this.createExercise("Upright Row (Barbell)", "7AB9A362", 3),
                  this.createExercise("Triceps Pushdown", "93A552C6", 4),
                ]
              }
            },
            {
              title: "Upper Body Pull",
              orderIndex: 1,
              restSecondsDefault: 90,
              exercises: {
                create: [
                  this.createExercise("Bent Over Row (Barbell)", "55E6546F", 0),
                  this.createExercise("Reverse Grip Lat Pulldown (Cable)", "046E25A2", 1),
                  this.createExercise("Dumbbell Row", "F1E57334", 2),
                  this.createExercise("Rear Delt Reverse Fly (Dumbbell)", "E5988A0A", 3),
                  this.createExercise("Hammer Curl (Dumbbell)", "7E3BC8B6", 4),
                ]
              }
            },
            {
              title: "Lower Body",
              orderIndex: 2,
              restSecondsDefault: 90,
              exercises: {
                create: [
                  this.createExercise("Squat (Barbell)", "D04AC939", 0),
                  this.createExercise("Deadlift (Barbell)", "C6272009", 1),
                  this.createExercise("Lunge (Dumbbell)", "B537D09F", 2),
                  this.createExercise("Romanian Deadlift (Dumbbell)", "72CFFAD5", 3),
                ]
              }
            }
          ]
        }
      }
    });
  }

  private createExercise(name: string, templateId: string, order: number, defaultWeight = 0) {
    return {
      internalName: name,
      hevyExerciseTemplateId: templateId,
      orderIndex: order,
      setTemplates: {
        create: [
          { orderIndex: 0, reps: 20, weightKg: defaultWeight, restSeconds: 90 },
          { orderIndex: 1, reps: 20, weightKg: defaultWeight, restSeconds: 90 },
          { orderIndex: 2, reps: 20, weightKg: defaultWeight, restSeconds: 90 },
        ]
      }
    };
  }
}
