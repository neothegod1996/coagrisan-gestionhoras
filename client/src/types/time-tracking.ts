export interface TimeEntry {
  id: string;
  employee_id: string;
  date: Date;
  entry_time?: string;
  exit_time?: string;
  break_start?: string;
  break_end?: string;
  total_hours: number;
  location: string;
  center: string;
  created_at: Date;
  updated_at: Date;
}

export interface TimeTrackingReport {
  employee_id: string;
  employee_code: string;
  employee_name: string;
  location: string;
  center: string;
  date: Date;
  entry_time?: string;
  exit_time?: string;
  break_start?: string;
  break_end?: string;
  total_hours: number;
  regular_hours: number;
  overtime_hours: number;
  observations?: string;
}

export interface TimeTrackingFilters {
  employee_id?: string;
  location_id?: string;
  profile_id?: string;
  start_date: Date;
  end_date: Date;
  limit_to_8_hours?: boolean;
}

export interface TimeTrackingSummary {
  total_employees: number;
  total_hours: number;
  total_regular_hours: number;
  total_overtime_hours: number;
  average_hours_per_employee: number;
}

export type TimeTrackingGroupBy = 'employee' | 'location' | 'center' | 'date';
export type TimeTrackingExportFormat = 'pdf' | 'excel' | 'csv';
