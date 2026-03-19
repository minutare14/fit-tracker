import { NextRequest, NextResponse } from "next/server";
import { unstable_noStore as noStore } from "next/cache";
import prisma from "@/lib/prisma";
import { ensureUser, resolveUserId } from "@/lib/current-user";

export const dynamic = "force-dynamic";

const toNullableNumber = (value: unknown) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toNullableDate = (value: unknown) => {
  if (!value || typeof value !== "string") {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const serializeProfile = (user: any, profile: any) => ({
  userId: user.id,
  name: user.name ?? "",
  email: user.email ?? "",
  displayName: profile?.displayName ?? "",
  birthDate: profile?.birthDate ? profile.birthDate.toISOString().slice(0, 10) : "",
  sex: profile?.sex ?? "",
  heightCm: profile?.heightCm ?? null,
  currentWeightKg: profile?.currentWeightKg ?? user.weight ?? null,
  targetCategory: profile?.targetCategory ?? "",
  beltRank: profile?.beltRank ?? user.belt ?? "",
  academyTeam: profile?.academyTeam ?? "",
  primaryGoal: profile?.primaryGoal ?? "",
  injuriesRestrictions: profile?.injuriesRestrictions ?? "",
  timezone: profile?.timezone ?? "America/Bahia",
  unitSystem: profile?.unitSystem ?? "metric",
  dailyCalorieTarget: profile?.dailyCalorieTarget ?? user.caloriesTarget ?? null,
  proteinTargetG: profile?.proteinTargetG ?? user.proteinTarget ?? null,
  carbsTargetG: profile?.carbsTargetG ?? user.carbsTarget ?? null,
  fatTargetG: profile?.fatTargetG ?? user.fatTarget ?? null,
  hydrationTargetLiters: profile?.hydrationTargetLiters ?? null,
});

export async function GET(req: NextRequest) {
  noStore();

  try {
    const userId = resolveUserId(req.nextUrl.searchParams.get("userId"));
    const user = await ensureUser(userId);
    const profile = await prisma.userProfile.findUnique({ where: { userId } });

    return NextResponse.json(serializeProfile(user, profile));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  noStore();

  try {
    const body = await req.json();
    const userId = resolveUserId(body.userId);
    await ensureUser(userId);

    const [user, profile] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          name: typeof body.name === "string" ? body.name : undefined,
          belt: typeof body.beltRank === "string" ? body.beltRank : undefined,
          weight: toNullableNumber(body.currentWeightKg) ?? undefined,
          caloriesTarget: toNullableNumber(body.dailyCalorieTarget) ?? undefined,
          proteinTarget: toNullableNumber(body.proteinTargetG) ?? undefined,
          carbsTarget: toNullableNumber(body.carbsTargetG) ?? undefined,
          fatTarget: toNullableNumber(body.fatTargetG) ?? undefined,
        },
      }),
      prisma.userProfile.upsert({
        where: { userId },
        update: {
          displayName: body.displayName ?? "",
          birthDate: toNullableDate(body.birthDate),
          sex: body.sex ?? "",
          heightCm: toNullableNumber(body.heightCm),
          currentWeightKg: toNullableNumber(body.currentWeightKg),
          targetCategory: body.targetCategory ?? "",
          beltRank: body.beltRank ?? "",
          academyTeam: body.academyTeam ?? "",
          primaryGoal: body.primaryGoal ?? "",
          injuriesRestrictions: body.injuriesRestrictions ?? "",
          timezone: body.timezone || "America/Bahia",
          unitSystem: body.unitSystem || "metric",
          dailyCalorieTarget: toNullableNumber(body.dailyCalorieTarget),
          proteinTargetG: toNullableNumber(body.proteinTargetG),
          carbsTargetG: toNullableNumber(body.carbsTargetG),
          fatTargetG: toNullableNumber(body.fatTargetG),
          hydrationTargetLiters: toNullableNumber(body.hydrationTargetLiters),
        },
        create: {
          userId,
          displayName: body.displayName ?? "",
          birthDate: toNullableDate(body.birthDate),
          sex: body.sex ?? "",
          heightCm: toNullableNumber(body.heightCm),
          currentWeightKg: toNullableNumber(body.currentWeightKg),
          targetCategory: body.targetCategory ?? "",
          beltRank: body.beltRank ?? "",
          academyTeam: body.academyTeam ?? "",
          primaryGoal: body.primaryGoal ?? "",
          injuriesRestrictions: body.injuriesRestrictions ?? "",
          timezone: body.timezone || "America/Bahia",
          unitSystem: body.unitSystem || "metric",
          dailyCalorieTarget: toNullableNumber(body.dailyCalorieTarget),
          proteinTargetG: toNullableNumber(body.proteinTargetG),
          carbsTargetG: toNullableNumber(body.carbsTargetG),
          fatTargetG: toNullableNumber(body.fatTargetG),
          hydrationTargetLiters: toNullableNumber(body.hydrationTargetLiters),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      profile: serializeProfile(user, profile),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
