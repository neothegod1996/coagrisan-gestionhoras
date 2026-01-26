import axios from "axios";
import { ProfileResponse, ProfileParams, ProfileByIdResponse, ProfileFormData } from "@/types/profile";
import { getAccessToken } from ".";

export async function getProfiles(params?: ProfileParams) {
    const token = await getAccessToken();
    try {
        const response = await axios.request<ProfileResponse>({
            method: 'GET',
            url: '/api/profiles',
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

export async function getProfile(id: string) {
    const token = await getAccessToken();
    try {
        const response = await axios.request<ProfileByIdResponse>({
            method: 'GET',
            url: `/api/profiles/${id}`,
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

export async function createProfile(data: ProfileFormData) {
    const token = await getAccessToken();
    try {
        const response = await axios.request<ProfileByIdResponse>({
            method: 'POST',
            url: `/api/profiles`,
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

export async function updateProfile(id: string, data: ProfileFormData) {
    const token = await getAccessToken();
    try {
        const response = await axios.request<ProfileByIdResponse>({
            method: 'PUT',
            url: `/api/profiles/${id}`,
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

export async function deleteProfile(id: string) {
    const token = await getAccessToken();
    try {
        const response = await axios.request({
            method: 'DELETE',
            url: `/api/profiles/${id}`,
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