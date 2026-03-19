export interface ProfileFormData {
  userId: string;
  name: string;
  email: string;
  displayName: string;
  birthDate: string;
  sex: string;
  heightCm: number | null;
  currentWeightKg: number | null;
  targetCategory: string;
  beltRank: string;
  academyTeam: string;
  primaryGoal: string;
  injuriesRestrictions: string;
  timezone: string;
  unitSystem: string;
  dailyCalorieTarget: number | null;
  proteinTargetG: number | null;
  carbsTargetG: number | null;
  fatTargetG: number | null;
  hydrationTargetLiters: number | null;
}
