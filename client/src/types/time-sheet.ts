import { PaginationResponse, Params, Response, Status } from ".";

export interface TimeSheet {
  id: string;
  task_tracker_id: string;
  time: string;
  status: TimeSheetStatus;
  session_id: string;
  terminal: {
    id: string;
    name: string;
  };
  employee_shift: {
    employee: {
      id: string;
      card_id: string | null;
      first_name: string;
      last_name: string | null;
    };
  };
  is_modified?: boolean;
}

export type TimeSheetStatus = "approved" | "pending";

export interface TimeSheetFormData {
  employee_id: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'approved';
  notes?: string;
}

export interface TimeSheetFilters {
  page: number;
  search?: string;
  status?: TimeSheetStatus;
  employee_id?: string;
  terminal_id?: string;
  date_from?: string;
  date_to?: string;
}

export type TimeSheetAction = 'view' | 'edit' | 'delete';

export type TimeSheetResponse = PaginationResponse<TimeSheet>;
export type TimeSheetByIdResponse = Response<TimeSheet>;
export type TimeSheetParams = Params & TimeSheetFilters;
