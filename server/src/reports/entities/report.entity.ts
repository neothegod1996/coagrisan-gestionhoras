export class SessionReport {
  schedule_start: Date | null;
  schedule_end: Date | null;
  clock_in: Date | null;
  clock_out: Date | null;
  break_start: Date | null;
  break_end: Date | null;
  actual_break_start: Date | null;
  actual_break_end: Date | null;
  hours: number;
  has_incidence: boolean;
  incidence_type?: string;
}

export class DayReport {
  date: string;
  schedule_info: string;
  total_hours: number;
  normal_hours: number;
  extra_hours: number;
  has_incidence: boolean;
  incidence_name?: string;
  incidence_type?: string;
  incidence_paid?: boolean;
  sessions: SessionReport[];
}

export class WeekReport {
  week_range: string;
  week_number: number;
  year: number;
  total_hours: number;
  normal_hours: number;
  extra_hours: number;
  days: DayReport[];
}

export class EmployeeReport {
  id: string;
  first_name: string;
  last_name: string | null;
  full_name: string;
  total_hours: number;
  normal_hours: number;
  extra_hours: number;
  weeks: WeekReport[];
}

export class ReportStatistics {
  total_employees: number;
  total_hours: number;
  normal_hours: number;
  extra_hours: number;
  average_hours_per_employee: number;
}

export class Report {
  statistics: ReportStatistics;
  employees: EmployeeReport[];
}

