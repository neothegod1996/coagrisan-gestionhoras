import axios from "axios";
import { getAccessToken } from ".";
import { ScheduleByIdResponse, ScheduleFormData, ScheduleParams, ScheduleResponse } from "@/types/schedule";
import dayjs from "dayjs";

export async function getSchedules(params?: ScheduleParams) {
    const token = await getAccessToken();
    try {
        const response = await axios.request<ScheduleResponse>({
            method: 'GET',
            url: '/api/schedules',
            params: {
                ...params,
                partner_id: localStorage.getItem('partner_id'),
            },
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        return null;
    }
}

export async function getSchedule(id: string) {
    const token = await getAccessToken();
    try {
        const response = await axios.request<ScheduleByIdResponse>({
            method: 'GET',
            url: `/api/schedules/${id}`,
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

export async function createSchedule(data: ScheduleFormData) {
    const token = await getAccessToken();
    try {
        const response = await axios.request<ScheduleResponse>({
            method: 'POST',
            url: `/api/schedules`,
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params: {
                partner_id: localStorage.getItem('partner_id'),
            },
            data: {
                ...data,
                sessions: data.sessions.map(session => ({
                    ...session,
                    start_time: dayjs().set('hour', Number(session.start_time.split(':')[0])).set('minute', Number(session.start_time.split(':')[1])).toDate(),
                    end_time: dayjs().set('hour', Number(session.end_time.split(':')[0])).set('minute', Number(session.end_time.split(':')[1])).toDate(),
                    has_break: session.has_break || false,
                    break_start_time: session.break_start_time ? dayjs().set('hour', Number(session.break_start_time.split(':')[0])).set('minute', Number(session.break_start_time.split(':')[1])).toDate() : undefined,
                    break_end_time: session.break_end_time ? dayjs().set('hour', Number(session.break_end_time.split(':')[0])).set('minute', Number(session.break_end_time.split(':')[1])).toDate() : undefined,
                })),
            },
        });
        return response.data;
    } catch (error) {
        return null;
    }
}

export async function updateSchedule(id: string, data: ScheduleFormData) {
    const token = await getAccessToken();
    try {
        const response = await axios.request<ScheduleResponse>({
            method: 'PUT',
            url: `/api/schedules/${id}`,
            headers: {
                Authorization: `Bearer ${token}`,
            },
            data: {
                ...data,
                sessions: data.sessions.map(session => ({
                    ...session,
                    start_time: dayjs().set('hour', Number(session.start_time.split(':')[0])).set('minute', Number(session.start_time.split(':')[1])).toDate(),
                    end_time: dayjs().set('hour', Number(session.end_time.split(':')[0])).set('minute', Number(session.end_time.split(':')[1])).toDate(),
                    has_break: session.has_break || false,
                    break_start_time: session.break_start_time ? dayjs().set('hour', Number(session.break_start_time.split(':')[0])).set('minute', Number(session.break_start_time.split(':')[1])).toDate() : undefined,
                    break_end_time: session.break_end_time ? dayjs().set('hour', Number(session.break_end_time.split(':')[0])).set('minute', Number(session.break_end_time.split(':')[1])).toDate() : undefined,
                })),
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

export async function deleteSchedule(id: string) {
    const token = await getAccessToken();
    try {
        const response = await axios.request({
            method: 'DELETE',
            url: `/api/schedules/${id}`,
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