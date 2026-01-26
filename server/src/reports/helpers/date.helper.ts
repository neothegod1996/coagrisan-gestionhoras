import * as dayjs from 'dayjs';
import * as isoWeek from 'dayjs/plugin/isoWeek';
import * as isBetween from 'dayjs/plugin/isBetween';

dayjs.extend(isoWeek);
dayjs.extend(isBetween);

/**
 * Obtiene el número de semana ISO y el año
 */
export function getISOWeek(date: Date | string): { week: number; year: number } {
  const d = dayjs(date);
  return {
    week: d.isoWeek(),
    year: d.isoWeekYear(),
  };
}

/**
 * Obtiene el rango de fechas de una semana ISO
 */
export function getWeekRange(week: number, year: number): { start: Date; end: Date } {
  const start = dayjs().year(year).isoWeek(week).startOf('isoWeek');
  const end = dayjs().year(year).isoWeek(week).endOf('isoWeek');
  return {
    start: start.toDate(),
    end: end.toDate(),
  };
}

/**
 * Formatea el rango de semana para mostrar
 */
export function formatWeekRange(week: number, year: number): string {
  const { start, end } = getWeekRange(week, year);
  return `${dayjs(start).format('DD/MM')} - ${dayjs(end).format('DD/MM')}`;
}

/**
 * Verifica si una fecha está dentro de un rango
 */
export function isDateInRange(date: Date | string, startDate: Date | string, endDate: Date | string): boolean {
  return dayjs(date).isBetween(dayjs(startDate).startOf('day'), dayjs(endDate).endOf('day'), null, '[]');
}

/**
 * Verifica si una incidencia afecta un día específico
 */
export function doesIncidenceAffectDay(
  incidenceStart: Date,
  incidenceEnd: Date,
  day: Date
): boolean {
  const dayStart = dayjs(day).startOf('day');
  const dayEnd = dayjs(day).endOf('day');
  const incStart = dayjs(incidenceStart);
  const incEnd = dayjs(incidenceEnd);
  
  return incStart.isBefore(dayEnd) && incEnd.isAfter(dayStart);
}

/**
 * Calcula las horas de una incidencia en un día específico
 * Si all_day es true, retorna las horas del schedule_session
 * Si no, calcula las horas de intersección
 */
export function getIncidenceHoursForDay(
  incidenceStart: Date,
  incidenceEnd: Date,
  day: Date,
  allDay: boolean,
  sessionStart?: Date,
  sessionEnd?: Date
): number {
  if (allDay && sessionStart && sessionEnd) {
    // Si es todo el día, retornar las horas de la sesión
    return calculateHoursBetween(sessionStart, sessionEnd);
  }
  
  // Calcular intersección de la incidencia con el día
  const dayStart = dayjs(day).startOf('day');
  const dayEnd = dayjs(day).endOf('day');
  const incStart = dayjs(incidenceStart).isAfter(dayStart) ? dayjs(incidenceStart) : dayStart;
  const incEnd = dayjs(incidenceEnd).isBefore(dayEnd) ? dayjs(incidenceEnd) : dayEnd;
  
  if (sessionStart && sessionEnd) {
    // Si hay sesión, calcular la intersección con la sesión
    const sessStart = dayjs(sessionStart);
    const sessEnd = dayjs(sessionEnd);
    const intersectionStart = incStart.isAfter(sessStart) ? incStart : sessStart;
    const intersectionEnd = incEnd.isBefore(sessEnd) ? incEnd : sessEnd;
    
    if (intersectionStart.isBefore(intersectionEnd)) {
      return calculateHoursBetween(intersectionStart.toDate(), intersectionEnd.toDate());
    }
    return 0;
  }
  
  // Si no hay sesión, retornar las horas de la incidencia en el día
  return calculateHoursBetween(incStart.toDate(), incEnd.toDate());
}

/**
 * Calcula las horas entre dos fechas
 */
export function calculateHoursBetween(start: Date, end: Date): number {
  const diff = dayjs(end).diff(dayjs(start), 'minute');
  return Math.max(0, diff / 60);
}

/**
 * Agrupa fechas por semana ISO
 */
export function groupByWeek<T>(items: T[], dateGetter: (item: T) => Date): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  
  for (const item of items) {
    const date = dateGetter(item);
    const { week, year } = getISOWeek(date);
    const key = `${year}-W${week}`;
    
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(item);
  }
  
  return groups;
}

