import * as dayjs from 'dayjs';

const NORMAL_HOURS_LIMIT = 8;

/**
 * Calcula horas normales y extras
 */
export function calculateNormalAndExtraHours(totalHours: number, limitTo8Hours: boolean = false): {
  normal_hours: number;
  extra_hours: number;
} {
  if (limitTo8Hours) {
    return {
      normal_hours: Math.min(totalHours, NORMAL_HOURS_LIMIT),
      extra_hours: 0,
    };
  }
  
  if (totalHours <= NORMAL_HOURS_LIMIT) {
    return {
      normal_hours: totalHours,
      extra_hours: 0,
    };
  }
  
  return {
    normal_hours: NORMAL_HOURS_LIMIT,
    extra_hours: totalHours - NORMAL_HOURS_LIMIT,
  };
}

/**
 * Calcula las horas trabajadas desde las marcaciones
 */
export function calculateWorkedHours(clockRecords: Date[]): {
  hours: number;
  clockIn: Date | null;
  clockOut: Date | null;
  breakStart: Date | null;
  breakEnd: Date | null;
} {
  if (clockRecords.length === 0) {
    return {
      hours: 0,
      clockIn: null,
      clockOut: null,
      breakStart: null,
      breakEnd: null,
    };
  }
  
  // Ordenar marcaciones por tiempo
  const sorted = [...clockRecords].sort((a, b) => 
    dayjs(a).valueOf() - dayjs(b).valueOf()
  );
  
  const clockIn = sorted[0];
  const clockOut = sorted[sorted.length - 1];
  
  // Lógica simple: primera marcación es entrada, última es salida
  // Para descansos: si hay 3 o 4 marcaciones, las del medio son descanso
  let breakStart: Date | null = null;
  let breakEnd: Date | null = null;
  let totalWorkedMinutes = 0;
  
  if (sorted.length === 2) {
    // Entrada y salida simple
    totalWorkedMinutes = dayjs(clockOut).diff(dayjs(clockIn), 'minute');
  } else if (sorted.length === 3) {
    // Entrada, algo en el medio (probablemente inicio de descanso), salida
    // Calcular desde entrada hasta el medio, no contar después
    totalWorkedMinutes = dayjs(sorted[1]).diff(dayjs(clockIn), 'minute');
    breakStart = sorted[1];
  } else if (sorted.length >= 4) {
    // Entrada, inicio descanso, fin descanso, salida
    const firstPeriod = dayjs(sorted[1]).diff(dayjs(clockIn), 'minute');
    const secondPeriod = dayjs(clockOut).diff(dayjs(sorted[2]), 'minute');
    totalWorkedMinutes = firstPeriod + secondPeriod;
    breakStart = sorted[1];
    breakEnd = sorted[2];
  }
  
  return {
    hours: totalWorkedMinutes / 60,
    clockIn,
    clockOut,
    breakStart,
    breakEnd,
  };
}

/**
 * Formatea horas a string legible
 */
export function formatHours(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  
  if (m === 0) {
    return `${h}h`;
  }
  
  return `${h}h ${m}m`;
}

/**
 * Redondea horas a 2 decimales
 */
export function roundHours(hours: number): number {
  return Math.round(hours * 100) / 100;
}

