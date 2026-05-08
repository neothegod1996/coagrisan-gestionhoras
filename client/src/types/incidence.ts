import { PaginationResponse, Params, Response } from ".";

export interface IncidenceCategory {
    id: string;
    name: string;
    description?: string;
    paid: boolean;
    type: IncidenceTypeEnum;
}

export interface Incidence {
    id: string;
    start_date?: string;
    end_date?: string;
    duration_hours?: number;
    type: IncidenceTypeEnum;
    description: string;
    all_day: boolean;
    paid?: boolean;
    is_global: boolean;
    employees?: { id: string; first_name: string; last_name: string }[];
    profiles?: { id: string; name: string }[];
    employees_count?: number;
    profiles_count?: number;
}
export interface FullIncidence {
    id: string;
    start_date?: string;
    end_date?: string;
    duration_hours?: number;
    type: IncidenceTypeEnum;
    description: string;
    all_day: boolean;
    paid?: boolean;
    is_global: boolean;
    employees?: { id: string; first_name: string; last_name: string }[];
    profiles?: { id: string; name: string }[];
}
export enum IncidenceTypeEnum {
    Holiday = 'holiday',
    Festive = 'festive',
    Absence = 'absence',
    MedicalLeave = 'medical_leave',
    PersonalLeave = 'personal_leave',
    SindicalLeave = 'sindical_leave',
    MedicalVisit = 'medical_visit',
    UnionHours = 'union_hours',
    LeaveOfAbsence = 'leave_of_absence',
    OvertimeRest = 'overtime_rest',
    Other = 'other',
}
export const IncidenceType = {
    [IncidenceTypeEnum.Holiday]: {
        label: 'Vacaciones',
        color: 'bg-green-100 text-green-800',
        bgHex: '#dcfce7',
        textHex: '#016630',
    },
    [IncidenceTypeEnum.Festive]: {
        label: 'Festivo',
        color: 'bg-violet-100 text-violet-800',
        bgHex: '#ede9fe',
        textHex: '#5d0ec0',
    },
    [IncidenceTypeEnum.Absence]: {
        label: 'Ausencia',
        color: 'bg-red-100 text-red-800',
        bgHex: '#ffe2e2',
        textHex: '#9f0712',
    },
    [IncidenceTypeEnum.MedicalLeave]: {
        label: 'Baja médica',
        color: 'bg-blue-100 text-blue-800',
        bgHex: '#dbeafe',
        textHex: '#193cb8',
    },
    [IncidenceTypeEnum.PersonalLeave]: {
        label: 'Baja personal',
        color: 'bg-yellow-200 text-yellow-800',
        bgHex: '#fff085',
        textHex: '#894b00',
    },
    [IncidenceTypeEnum.SindicalLeave]: {
        label: 'Baja sindical',
        color: 'bg-purple-100 text-purple-800',
        bgHex: '#f5e6ff',
        textHex: '#7e22ce',
    },
    [IncidenceTypeEnum.MedicalVisit]: {
        label: 'Visita médica',
        color: 'bg-indigo-100 text-indigo-800',
        bgHex: '#e0e7ff',
        textHex: '#3730a3',
    },
    [IncidenceTypeEnum.UnionHours]: {
        label: 'Horas sindicales',
        color: 'bg-pink-100 text-pink-800',
        bgHex: '#fce7f3',
        textHex: '#9d174d',
    },
    [IncidenceTypeEnum.LeaveOfAbsence]: {
        label: 'Excedencia',
        color: 'bg-orange-100 text-orange-800',
        bgHex: '#ffedd5',
        textHex: '#9a3412',
    },
    [IncidenceTypeEnum.OvertimeRest]: {
        label: 'Descanso exceso tiempo',
        color: 'bg-cyan-100 text-cyan-800',
        bgHex: '#ecfeff',
        textHex: '#155e75',
    },
    [IncidenceTypeEnum.Other]: {
        label: 'Otras',
        color: 'bg-gray-200 text-gray-800',
        bgHex: '#e5e7eb',
        textHex: '#1e2939',
    },
}

export interface IncidenceFilters {
    page?: number;
    limit?: number;
    date?: string;
    employee_id?: string;
    type?: IncidenceTypeEnum;
    show?: IncidenceShowEnum;
    search?: string;
}

export enum IncidenceShowEnum {
    All = 'all',
    Upcoming = 'upcoming',
}

export interface IncidenceFormData {
    type?: IncidenceTypeEnum;
    category_id?: string;
    description?: string;
    all_day: boolean;
    is_global: boolean;
    start_date?: string;
    end_date?: string;
    start_time?: string;
    end_time?: string;
    duration_hours?: number;
    paid: boolean;
    employee_ids?: string[];
    profile_ids?: string[];
}

export type IncidenceResponse = PaginationResponse<Incidence>;
export type IncidenceByIdResponse = Response<FullIncidence>;
export type IncidenceParams = Params;