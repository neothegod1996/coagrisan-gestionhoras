import axios from "axios";
import { TerminalResponse, TerminalParams, TerminalByIdResponse, TerminalFormData } from "@/types/terminal";
import { getAccessToken } from ".";

export async function getTerminals(params?: TerminalParams) {
    const token = await getAccessToken();
    try {
        const response = await axios.request<TerminalResponse>({
            method: 'GET',
            url: '/api/terminals',
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

export async function getTerminal(id: string) {
    const token = await getAccessToken();
    try {
        const response = await axios.request<TerminalByIdResponse>({
            method: 'GET',
            url: `/api/terminals/${id}`,
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

export async function createTerminal(data: TerminalFormData) {
    const token = await getAccessToken();
    try {
        const response = await axios.request<TerminalByIdResponse>({
            method: 'POST',
            url: `/api/terminals`,
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

export async function updateTerminal(id: string, data: TerminalFormData) {
    const token = await getAccessToken();
    try {
        const response = await axios.request<TerminalByIdResponse>({
            method: 'PUT',
            url: `/api/terminals/${id}`,
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

export async function deleteTerminal(id: string) {
    const token = await getAccessToken();
    try {
        const response = await axios.request({
            method: 'DELETE',
            url: `/api/terminals/${id}`,
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
