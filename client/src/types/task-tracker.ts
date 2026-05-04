export interface TaskTracker {
  id: string;
  name: string;
  description?: string;
  status: TaskStatus;
  start_time?: string;
  end_time?: string;
  start_time_modified?: boolean;
  end_time_modified?: boolean;
  duration?: number; // en segundos
  created_at: string;
  updated_at: string;
  employee_id: string;
  schedule_snapshot_id?: string;
  agreement_snapshot_id?: string;
  schedule_snapshot_name?: string;
  agreement_snapshot_name?: string;
  schedule_snapshot?: {
    id: string;
    name: string;
  };
  agreement_snapshot?: {
    id: string;
    name: string;
  };
}

export type TaskStatus = "pending" | "running" | "completed" | "paused";

export interface TaskTrackerFilters {
  page: number;
  search?: string;
  status?: TaskStatus;
  employee_id?: string;
}

export interface CreateTaskTrackerRequest {
  name: string;
  description?: string;
  employee_id: string;
  latitude?: number;
  longitude?: number;
  terminal_id?: string;
}

export interface UpdateTaskTrackerRequest {
  name?: string;
  description?: string;
  status?: TaskStatus;
}

export interface StartTaskRequest {
  task_id: string;
  start_time: string;
}

export interface StopTaskRequest {
  task_id: string;
  end_time: string;
}
