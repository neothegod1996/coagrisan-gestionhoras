import axios from "axios";
import { TimeSheetResponse, TimeSheetParams, TimeSheetByIdResponse, TimeSheetFormData } from "@/types/time-sheet";
import { getAccessToken } from ".";

export async function getTimeSheets(params?: TimeSheetParams) {
    const token = await getAccessToken();
    try {
        const response = await axios.request<TimeSheetResponse>({
            method: 'GET',
            url: '/api/time-sheet',
            headers: { Authorization: `Bearer ${token}` },
            params: {
                ...params,
                partner_id: localStorage.getItem('partner_id'),
            },
        });
        console.log('TimeSheets response:', response.data);
        return response.data;
    } catch (error) {
        return null;
    }
}

export async function getTimeSheet(id: string) {
    const token = await getAccessToken();
    try {
        const response = await axios.request<TimeSheetByIdResponse>({
            method: 'GET',
            url: `/api/time-sheet/${id}`,
            headers: { Authorization: `Bearer ${token}` },
            params: { partner_id: localStorage.getItem('partner_id') },
        });
        return response.data;
    } catch (error) {
        return null;
    }
}

export async function createTimeSheet(data: TimeSheetFormData) {
    const token = await getAccessToken();
    try {
        const response = await axios.request<TimeSheetByIdResponse>({
            method: 'POST',
            url: `/api/time-sheet`,
            headers: { Authorization: `Bearer ${token}` },
            data,
            params: { partner_id: localStorage.getItem('partner_id') },
        });
        return response.data;
    } catch (error) {
        return null;
    }
}

export async function updateTimeSheet(taskTrackerId: string, startId: string, endId: string, data: { start_time?: string; end_time?: string; status?: string }) {
    const token = await getAccessToken();
    console.log('Updating time sheet with data:', {
        taskTrackerId,
        startId,
        endId,
        ...data,
    });
    try {
        let url = `/api/time-sheet/${taskTrackerId}`;
        if (endId) {
            url += `?endId=${endId}`;
        }
        if (startId) {
            url += `${endId ? '&' : '?'}startId=${startId}`;
        }
        const response = await axios.request({
            method: 'PUT',
            url,
            headers: { Authorization: `Bearer ${token}` },
            data,
            params: { partner_id: localStorage.getItem('partner_id') },
        });
        return response.data;
    } catch (error) {
        return null;
    }
}

export async function deleteTimeSheet(taskTrackerId: string, startId: string, endId: string) {
    const token = await getAccessToken();
    try {
        let url = `/api/time-sheet/${startId}`;
        if (endId) {
            url += `?endId=${endId}`;
        }
        if (taskTrackerId) {
            url += `${endId ? '&' : '?'}task_tracker_id=${taskTrackerId}`;
        }
        const response = await axios.request({
            method: 'DELETE',
            url,
            headers: { Authorization: `Bearer ${token}` },
            params: { partner_id: localStorage.getItem('partner_id') },
        });
        return response.data;
    } catch (error) {
        return null;
    }
}

export async function approveTimeSheet(id: string) {
    const token = await getAccessToken();
    try {
        const response = await axios.request({
            method: 'POST',
            url: `/api/time-sheet/${id}/approve`,
            headers: { Authorization: `Bearer ${token}` },
            params: { partner_id: localStorage.getItem('partner_id') },
        });
        return response.data;
    } catch (error) {
        return null;
    }
}