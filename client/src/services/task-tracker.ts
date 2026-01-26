import axios from "axios";
import { getAccessToken } from ".";
import { 
  TaskTracker, 
  TaskTrackerFilters, 
  CreateTaskTrackerRequest, 
  UpdateTaskTrackerRequest,
  StartTaskRequest,
  StopTaskRequest
} from "@/types/task-tracker";
import { PaginationResponse } from "@/types";

export async function getTaskTrackers(filters: TaskTrackerFilters) {
  const token = await getAccessToken();
  try {
    const response = await axios.request<PaginationResponse<TaskTracker>>({
      method: 'GET',
      url: '/api/task-tracker',
      params: filters,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    return null;
  }
}

export async function getTaskTracker(id: string) {
  const token = await getAccessToken();
  try {
    const response = await axios.request<TaskTracker>({
      method: 'GET',
      url: `/api/task-tracker/${id}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    return null;
  }
}

export async function createTaskTracker(data: CreateTaskTrackerRequest) {
  const token = await getAccessToken();
  try {
    const response = await axios.request<TaskTracker>({
      method: 'POST',
      url: '/api/task-tracker',
      data,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function updateTaskTracker(id: string, data: UpdateTaskTrackerRequest) {
  const token = await getAccessToken();
  try {
    const response = await axios.request<TaskTracker>({
      method: 'PUT',
      url: `/api/task-tracker/${id}`,
      data,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function deleteTaskTracker(id: string) {
  const token = await getAccessToken();
  try {
    const response = await axios.request({
      method: 'DELETE',
      url: `/api/task-tracker/${id}`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function startTask(data: StartTaskRequest) {
  const token = await getAccessToken();
  try {
    const response = await axios.request<TaskTracker>({
      method: 'PUT',
      url: `/api/task-tracker/${data.task_id}`,
      data: { 
        start_time: data.start_time,
        status: 'running'
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function stopTask(data: StopTaskRequest) {
  const token = await getAccessToken();
  try {
    const response = await axios.request<TaskTracker>({
      method: 'PUT',
      url: `/api/task-tracker/${data.task_id}`,
      data: { 
        end_time: data.end_time,
        status: 'completed'
      },
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}
