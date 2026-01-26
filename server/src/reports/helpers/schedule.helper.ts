import * as dayjs from 'dayjs';

/**
 * Días de la semana en español
 */
export const DAYS_OF_WEEK_MAP: Record<number, string> = {
  1: 'monday',
  2: 'tuesday',
  3: 'wednesday',
  4: 'thursday',
  5: 'friday',
  6: 'saturday',
  0: 'sunday', // dayjs usa 0 para domingo
};

/**
 * Convierte un número de día (0-6) al enum de schedule_day
 */
export function getDayOfWeekName(date: Date): string {
  const dayNumber = dayjs(date).day();
  return DAYS_OF_WEEK_MAP[dayNumber];
}

/**
 * Verifica si un día está incluido en los días laborables del schedule
 */
export function isWorkingDay(
  date: Date,
  scheduleDays: Array<{ day: string }>
): boolean {
  if (!scheduleDays || scheduleDays.length === 0) {
    // Si no hay días definidos, asumir todos son laborables
    return true;
  }

  const dayName = getDayOfWeekName(date);
  return scheduleDays.some((scheduleDay) => scheduleDay.day === dayName);
}

/**
 * Genera un array de todas las fechas en un rango
 */
export function getAllDatesInRange(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  let currentDate = dayjs(startDate).startOf('day');
  const end = dayjs(endDate).startOf('day');

  while (currentDate.isBefore(end) || currentDate.isSame(end)) {
    dates.push(currentDate.toDate());
    currentDate = currentDate.add(1, 'day');
  }

  return dates;
}

