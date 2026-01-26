import axios from "axios";
import { IncidenceResponse, IncidenceParams, IncidenceByIdResponse, IncidenceFormData } from "@/types/incidence";
import { getAccessToken } from ".";

export async function getIncidences(params?: IncidenceParams) {
    const token = await getAccessToken();
    try {
        const response = await axios.request<IncidenceResponse>({
            method: 'GET',
            url: '/api/incidences',
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

export async function getIncidence(id: string) {
    const token = await getAccessToken();
    try {
        const response = await axios.request<IncidenceByIdResponse>({
            method: 'GET',
            url: `/api/incidences/${id}`,
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

export async function createIncidence(data: IncidenceFormData) {
    const token = await getAccessToken();
    try {
        const response = await axios.request<IncidenceByIdResponse>({
            method: 'POST',
            url: `/api/incidences`,
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

export async function updateIncidence(id: string, data: IncidenceFormData) {
    const token = await getAccessToken();
    try {
        const response = await axios.request<IncidenceByIdResponse>({
            method: 'PUT',
            url: `/api/incidences/${id}`,
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

export async function deleteIncidence(id: string) {
    const token = await getAccessToken();
    try {
        const response = await axios.request({
            method: 'DELETE',
            url: `/api/incidences/${id}`,
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