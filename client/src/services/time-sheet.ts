import axios from "axios";
import { TimeSheetResponse, TimeSheetParams, TimeSheetByIdResponse, TimeSheetFormData } from "@/types/time-sheet";
import { getAccessToken } from ".";

export async function getTimeSheets(params?: TimeSheetParams) {
    const token = await getAccessToken();
    try {
        const response = await axios.request<TimeSheetResponse>({
            method: 'GET',
            url: '/api/time-sheet',
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params: {
                ...params,
                partner_id: localStorage.getItem('partner_id'),
            },
        });
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
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params: {
                partner_id: localStorage.getItem('partner_id'),
            },
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
            headers: {
                Authorization: `Bearer ${token}`,
            },
            data,
            params: {
                partner_id: localStorage.getItem('partner_id'),
            },
        });
        return response.data;
    } catch (error) {
        return null;
    }
}

export async function updateTimeSheet(id: string, data: TimeSheetFormData) {
    const token = await getAccessToken();
    try {
        const response = await axios.request<TimeSheetByIdResponse>({
            method: 'PUT',
            url: `/api/time-sheet/${id}`,
            headers: {
                Authorization: `Bearer ${token}`,
            },
            data,
            params: {
                partner_id: localStorage.getItem('partner_id'),
            },
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
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params: {
                partner_id: localStorage.getItem('partner_id'),
            },
        });
        return response.data;
    } catch (error) {
        return null;
    }
}
