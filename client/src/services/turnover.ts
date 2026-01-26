import axios from "axios";
import { TurnoverResponse, TurnoverParams, TurnoverByIdResponse, TurnoverFormData } from "@/types/employee-turnover";
import { getAccessToken } from ".";

export async function getTurnovers(params?: TurnoverParams) {
    const token = await getAccessToken();
    try {
        const response = await axios.request<TurnoverResponse>({
            method: 'GET',
            url: '/api/turnover',
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

export async function getTurnover(id: string) {
    const token = await getAccessToken();
    try {
        const response = await axios.request<TurnoverByIdResponse>({
            method: 'GET',
            url: `/api/turnover/${id}`,
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

export async function createTurnover(data: TurnoverFormData) {
    const token = await getAccessToken();
    try {
        const response = await axios.request<TurnoverByIdResponse>({
            method: 'POST',
            url: `/api/turnover`,
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params: {
                partner_id: localStorage.getItem('partner_id'),
            },
            data,
        });
        return response.data;
    } catch (error: any) {
        return error.response.data;
    }
}

export async function updateTurnover(id: string, data: TurnoverFormData) {
    const token = await getAccessToken();
    try {
        const response = await axios.request<TurnoverByIdResponse>({
            method: 'PUT',
            url: `/api/turnover/${id}`,
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params: {
                partner_id: localStorage.getItem('partner_id'),
            },
            data,
        });
        return response.data;
    } catch (error: any) {
        return error.response.data;
    }
}

export async function deleteTurnover(id: string) {
    const token = await getAccessToken();
    try {
        const response = await axios.request({
            method: 'DELETE',
            url: `/api/turnover/${id}`,
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