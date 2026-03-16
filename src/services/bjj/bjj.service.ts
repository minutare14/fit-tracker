import { PrismaClient, BjjSession } from "@prisma/client";
import prisma from "@/lib/prisma";

export class BjjService {
  async getSessions(userId: string) {
    return await prisma.bjjSession.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });
  }

  async createSession(userId: string, data: {
    date: string;
    duration: number;
    type: string;
    rpe: number;
    notes?: string;
  }) {
    // Calculate load (TSS-like): duration * rpe
    const load = data.duration * data.rpe;

    return await prisma.bjjSession.create({
      data: {
        userId,
        date: new Date(data.date),
        duration: data.duration,
        type: data.type,
        rpe: data.rpe,
        load,
        notes: data.notes,
      },
    });
  }

  async updateSession(id: string, userId: string, data: {
    date?: string;
    duration?: number;
    type?: string;
    rpe?: number;
    notes?: string;
  }) {
    const updateData: any = { ...data };
    if (data.date) updateData.date = new Date(data.date);
    
    // Recalculate load if duration or rpe changes
    if (data.duration || data.rpe) {
      const current = await prisma.bjjSession.findUnique({ where: { id } });
      if (current) {
        const duration = data.duration ?? current.duration;
        const rpe = data.rpe ?? current.rpe;
        updateData.load = duration * rpe;
      }
    }

    return await prisma.bjjSession.update({
      where: { id, userId },
      data: updateData,
    });
  }

  async deleteSession(id: string, userId: string) {
    return await prisma.bjjSession.delete({
      where: { id, userId },
    });
  }

  async getSessionStats(userId: string) {
    const rawSessions = await prisma.bjjSession.findMany({
      where: {
        userId,
        date: {
          gte: new Date(new Date().setDate(new Date().getDate() - 30)),
        },
      },
    });

    const totalHours = rawSessions.reduce((acc: number, s: BjjSession) => acc + s.duration, 0) / 60;
    const weeklyLoad = rawSessions
      .filter((s: BjjSession) => s.date >= new Date(new Date().setDate(new Date().getDate() - 7)))
      .reduce((acc: number, s: BjjSession) => acc + s.load, 0);

    return {
      monthlyMatHours: parseFloat(totalHours.toFixed(1)),
      weeklyLoad,
      recentCount: rawSessions.length
    };
  }
}
