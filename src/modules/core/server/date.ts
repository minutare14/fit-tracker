export const parseDateOnly = (value: string) => {
  const [year, month, day] = value.split("-").map(Number);

  if (!year || !month || !day) {
    throw new Error(`Invalid date value: ${value}`);
  }

  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
};

export const toDateKey = (value: Date | string) => {
  const date = value instanceof Date ? value : new Date(value);
  return date.toISOString().slice(0, 10);
};

export const startOfDayUtc = (date: Date) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 0, 0, 0));
