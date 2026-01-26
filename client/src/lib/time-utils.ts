/**
 * Calcula las horas trabajadas entre dos fechas
 */
export function calculateWorkedHours(
  startTime: Date, 
  endTime: Date,
  breakMinutes: number = 0
): number {
  const diffMs = endTime.getTime() - startTime.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const breakHours = breakMinutes / 60;
  
  return Math.max(0, diffHours - breakHours);
}

/**
 * Formatea una duración en horas y minutos
 */
export function formatDuration(hours: number): string {
  const wholeHours = Math.floor(hours);
  const minutes = Math.round((hours - wholeHours) * 60);
  
  if (minutes === 0) {
    return `${wholeHours}h`;
  }
  
  return `${wholeHours}h ${minutes}m`;
}

/**
 * Formatea una hora en formato HH:mm
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-ES', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  });
}

/**
 * Convierte string de hora (HH:mm) a Date en fecha específica
 */
export function timeStringToDate(timeString: string, baseDate: Date = new Date()): Date {
  const [hours, minutes] = timeString.split(':').map(Number);
  const result = new Date(baseDate);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

/**
 * Convierte Date a string de hora (HH:mm)
 */
export function dateToTimeString(date: Date): string {
  return date.toTimeString().slice(0, 5);
}

/**
 * Calcula la diferencia en minutos entre dos strings de hora
 */
export function timeDifferenceInMinutes(startTime: string, endTime: string): number {
  const start = timeStringToDate(startTime);
  const end = timeStringToDate(endTime);
  
  // Si la hora de fin es menor, asumimos que es del día siguiente
  if (end < start) {
    end.setDate(end.getDate() + 1);
  }
  
  return (end.getTime() - start.getTime()) / (1000 * 60);
}

/**
 * Valida si una hora está en formato HH:mm correcto
 */
export function isValidTimeFormat(timeString: string): boolean {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
}

/**
 * Obtiene los intervalos de 15 minutos para un rango de horas
 */
export function getQuarterHourIntervals(startHour: number = 0, endHour: number = 24): string[] {
  const intervals: string[] = [];
  
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      intervals.push(timeString);
    }
  }
  
  return intervals;
}

/**
 * Calcula el tiempo de descanso total en minutos
 */
export function calculateTotalBreakTime(breaks: { horaInicio: string; horaFin: string }[]): number {
  return breaks.reduce((total, breakTime) => {
    return total + timeDifferenceInMinutes(breakTime.horaInicio, breakTime.horaFin);
  }, 0);
}

/**
 * Verifica si un día es laborable (lunes a viernes)
 */
export function isWorkday(date: Date): boolean {
  const dayOfWeek = date.getDay();
  return dayOfWeek >= 1 && dayOfWeek <= 5; // lunes = 1, viernes = 5
}

/**
 * Obtiene el día de la semana en español
 */
export function getDayName(dayNumber: number): string {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[dayNumber] || '';
}

/**
 * Calcula las horas entre dos fechas excluyendo fines de semana
 */
export function calculateWorkdayHours(startDate: Date, endDate: Date): number {
  let totalHours = 0;
  const currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    if (isWorkday(currentDate)) {
      totalHours += 8; // 8 horas por día laborable por defecto
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return totalHours;
}
