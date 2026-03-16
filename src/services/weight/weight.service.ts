import { WeightEntry } from "@prisma/client";
import prisma from "@/lib/prisma";

export class WeightService {
  async getEntries(userId: string) {
    return await prisma.weightEntry.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });
  }

  async createEntry(userId: string, data: {
    date: string;
    weight: number;
    bodyFat?: number;
    notes?: string;
    source?: string;
  }) {
    return await prisma.weightEntry.create({
      data: {
        userId,
        date: new Date(data.date),
        weight: data.weight,
        bodyFat: data.bodyFat,
        notes: data.notes,
        source: data.source || "Manual",
      },
    });
  }

  async deleteEntry(id: string, userId: string) {
    return await prisma.weightEntry.delete({
      where: { id, userId },
    });
  }

  async getWeightStats(userId: string) {
    const entries = await prisma.weightEntry.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 30,
    });

    if (entries.length === 0) return null;

    const current = entries[0];
    const avg7d = entries
      .filter((e: WeightEntry) => e.date >= new Date(new Date().setDate(new Date().getDate() - 7)))
      .reduce((acc: number, e: WeightEntry) => acc + e.weight, 0) / (entries.length > 7 ? 7 : entries.length);

    return {
      currentWeight: current.weight,
      currentBodyFat: current.bodyFat,
      avg7d: parseFloat(avg7d.toFixed(1)),
      trend: current.weight > avg7d ? "up" : "down",
      diff: Math.abs(current.weight - avg7d).toFixed(1),
    };
  }
}
