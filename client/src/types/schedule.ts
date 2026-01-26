import { PaginationResponse, Params, Response } from ".";

export interface Schedule {
  id: string;
  name: string;
  description?: string;
  sessions: ScheduleSession[];
  days: DaysEnum[];
}

export enum DaysEnum {
  Monday = 'monday',
  Tuesday = 'tuesday',
  Wednesday = 'wednesday',
  Thursday = 'thursday',
  Friday = 'friday',
  Saturday = 'saturday',
  Sunday = 'sunday',
}
export const Days = {
  [DaysEnum.Monday]: {
    label: 'Lun',
    color: 'bg-brand-primary-100 text-brand-primary',
  },
  [DaysEnum.Tuesday]: {
    label: 'Mar',
    color: 'bg-brand-primary-100 text-brand-primary',
  },
  [DaysEnum.Wednesday]: {
    label: 'Mie',
    color: 'bg-brand-primary-100 text-brand-primary',
  },
  [DaysEnum.Thursday]: {
    label: 'Jue',
    color: 'bg-brand-primary-100 text-brand-primary',
  },
  [DaysEnum.Friday]: {
    label: 'Vie',
    color: 'bg-brand-primary-100 text-brand-primary',
  },
  [DaysEnum.Saturday]: {
    label: 'Sab',
    color: 'bg-brand-primary-100 text-brand-primary',
  },
  [DaysEnum.Sunday]: {
    label: 'Dom',
    color: 'bg-brand-primary-100 text-brand-primary',
  },
}
export interface ScheduleFilters {
  page: number;
  search: string;
  shift_type?: ShiftTypeEnum;
  status?: string;
}

export interface ScheduleFormData {
  id?: string;
  name: string;
  description?: string;
  sessions: ScheduleSession[];
  days: DaysEnum[];
}

export type ScheduleResponse = PaginationResponse<Schedule>;
export type ScheduleByIdResponse = Response<Schedule>;
export type ScheduleParams = Params & ScheduleFilters;

export interface ScheduleSession {
  id?: string;
  start_time: string;
  end_time: string;
  total_time?: number;
  shift_type: ShiftTypeEnum;
  has_break: boolean;
  break_start_time?: string;
  break_end_time?: string;
}

export enum ShiftTypeEnum {
  Morning = 'morning',
  Afternoon = 'afternoon',
  Night = 'night',
}
export const ShiftType = {
  [ShiftTypeEnum.Morning]: {
    label: 'Mañana',
    color: 'bg-brand-primary-100 text-brand-primary',
  },
  [ShiftTypeEnum.Afternoon]: {
    label: 'Tarde',
    color: 'bg-brand-primary-100 text-brand-primary',
  },
  [ShiftTypeEnum.Night]: {
    label: 'Noche',
    color: 'bg-brand-primary-100 text-brand-primary',
  },
}