import { Response } from "."

export interface Report {
    statistics: ReportStatistics
    employees: ReportEmployee[]
}

export interface ReportStatistics {
    total_employees: number
    total_hours: number
    normal_hours: number
    extra_hours: number
    average_hours_per_employee: number
}

export interface ReportEmployee {
    id: string
    first_name: string
    last_name: string
    full_name: string
    total_hours: number
    normal_hours: number
    extra_hours: number
    weeks: ReportWeek[]
}

export interface ReportWeek {
    week_range: string
    week_number: number
    year: number
    total_hours: number
    normal_hours: number
    extra_hours: number
    days: ReportDay[]
}

export interface ReportDay {
    date: string
    schedule_info: string
    total_hours: number
    normal_hours: number
    extra_hours: number
    has_incidence: boolean
    sessions: ReportSession[]
    incidence_name?: string
    incidence_type?: string
    incidence_paid?: boolean
}

export interface ReportSession {
    schedule_start: string
    schedule_end: string
    clock_in?: string
    clock_out?: string
    break_start?: string
    break_end?: string
    actual_break_start: any
    actual_break_end: any
    hours: number
    has_incidence: boolean
}

export interface ReportParams {
    employee_id?: string;
    location_id?: string;
    profile_id?: string;
    start_date: Date;
    end_date: Date;
    limit_to_8_hours?: boolean;
}

export type ReportResponse = Response<Report>;