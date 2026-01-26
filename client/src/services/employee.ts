import axios from "axios";
import { getAccessToken } from ".";
import { EmployeeFilters, EmployeeFormData, EmployeeResponse, FullEmployeeResponse } from "@/types/employee";

export async function getEmployees(filters: EmployeeFilters) {
    const token = await getAccessToken();
    try {
        const response = await axios.request<EmployeeResponse>({
            method: 'GET',
            url: '/api/employees',
            params: {
                ...filters,
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

export async function getEmployee(id: string) {
    const token = await getAccessToken();
    try {
        const response = await axios.request<FullEmployeeResponse>({
            method: 'GET',
            url: `/api/employees/${id}`,
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

export async function createEmployee(employee: EmployeeFormData) {
    const token = await getAccessToken();
    try {
        const response = await axios.request({
            method: 'POST',
            url: `/api/employees`,
            data: employee,
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params: {
                partner_id: localStorage.getItem('partner_id'),
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function updateEmployee(employee_id: string, employee: EmployeeFormData) {
    const token = await getAccessToken();
    try {
        const response = await axios.request({
            method: 'PUT',
            url: `/api/employees/${employee_id}`,
            data: employee,
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params: {
                partner_id: localStorage.getItem('partner_id'),
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}

export async function deleteEmployee(id: string) {
    const token = await getAccessToken();
    try {
        const response = await axios.request({
            method: 'DELETE',
            url: `/api/employees/${id}`,
            headers: {
                Authorization: `Bearer ${token}`,
            },
            params: {
                partner_id: localStorage.getItem('partner_id'),
            },
        });
        return response.data;
    } catch (error) {
        throw error;
    }
}