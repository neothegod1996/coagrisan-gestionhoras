import axios from "axios";
import { Agreement, AgreementResponse, AgreementParams, AgreementFormData, HolidayFormData } from "@/types/agreement";
import { getAccessToken } from ".";

export async function getAgreements(params?: AgreementParams) {
    const token = await getAccessToken();
    try {
        const response = await axios.request<AgreementResponse>({
            method: 'GET',
            url: '/api/agreements',
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

export async function getAgreement(id: string) {
    const token = await getAccessToken();
    try {
        const response = await axios.request<Agreement>({
            method: 'GET',
            url: `/api/agreements/${id}`,
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        return null;
    }
}

export async function createAgreement(data: AgreementFormData) {
    const token = await getAccessToken();
    try {
        const response = await axios.request<Agreement>({
            method: 'POST',
            url: `/api/agreements`,
            headers: {
                Authorization: `Bearer ${token}`,
            },
            data,
        });
        return response.data;
    } catch (error) {
        return null;
    }
}

export async function updateAgreement(id: string, data: AgreementFormData) {
    const token = await getAccessToken();
    try {
        const response = await axios.request<Agreement>({
            method: 'PATCH',
            url: `/api/agreements/${id}`,
            headers: {
                Authorization: `Bearer ${token}`,
            },
            data,
        });
        return response.data;
    } catch (error) {
        return null;
    }
}

export async function deleteAgreement(id: string) {
    const token = await getAccessToken();
    try {
        const response = await axios.request({
            method: 'DELETE',
            url: `/api/agreements/${id}`,
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        return null;
    }
}

export async function addHoliday(id: string, data: HolidayFormData) {
    const token = await getAccessToken();
    try {
        const response = await axios.request({
            method: 'POST',
            url: `/api/agreements/${id}/holidays`,
            headers: {
                Authorization: `Bearer ${token}`,
            },
            data,
        });
        return response.data;
    } catch (error) {
        return null;
    }
}

export async function deleteHoliday(holidayId: string) {
    const token = await getAccessToken();
    try {
        const response = await axios.request({
            method: 'DELETE',
            url: `/api/agreements/holidays/${holidayId}`,
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        return null;
    }
}
