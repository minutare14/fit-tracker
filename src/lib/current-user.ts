import prisma from "@/lib/prisma";

export const DEFAULT_USER_ID = process.env.NEXT_PUBLIC_DEFAULT_USER_ID || "default-user";

const DEFAULT_USER_EMAIL = process.env.DEFAULT_USER_EMAIL || "default-user@fit-tracker.local";
const DEFAULT_USER_NAME = process.env.DEFAULT_USER_NAME || "Default Athlete";

export function resolveUserId(userId?: string | null) {
  return userId?.trim() || DEFAULT_USER_ID;
}

export async function ensureUser(userId?: string | null) {
  const resolvedUserId = resolveUserId(userId);

  return prisma.user.upsert({
    where: { id: resolvedUserId },
    update: {},
    create: {
      id: resolvedUserId,
      email: DEFAULT_USER_EMAIL,
      name: DEFAULT_USER_NAME,
    },
  });
}
