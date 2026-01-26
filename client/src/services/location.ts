import axios from "axios";
import { LocationResponse, LocationParams, LocationByIdResponse, LocationFormData } from "@/types/location";
import { getAccessToken } from ".";

export async function getLocations(params?: LocationParams) {
    const token = await getAccessToken();
    try {
        const response = await axios.request<LocationResponse>({
            method: 'GET',
            url: '/api/locations',
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

export async function getLocation(id: string) {
    const token = await getAccessToken();
    try {
        const response = await axios.request<LocationByIdResponse>({
            method: 'GET',
            url: `/api/locations/${id}`,
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

export async function createLocation(data: LocationFormData) {
    const token = await getAccessToken();
    try {
        const response = await axios.request<LocationByIdResponse>({
            method: 'POST',
            url: `/api/locations`,
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

export async function updateLocation(id: string, data: LocationFormData) {
    const token = await getAccessToken();
    try {
        const response = await axios.request<LocationByIdResponse>({
            method: 'PUT',
            url: `/api/locations/${id}`,
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

export async function deleteLocation(id: string) {
    const token = await getAccessToken();
    try {
        const response = await axios.request({
            method: 'DELETE',
            url: `/api/locations/${id}`,
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