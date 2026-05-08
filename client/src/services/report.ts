import axios from "axios";
import { getAccessToken } from ".";
import { ReportParams, ReportResponse } from "@/types/report";

export async function getReports(params?: ReportParams) {
    const token = await getAccessToken();
    try {
        const response = await axios.request<ReportResponse>({
            method: 'GET',
            url: '/api/reports',
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
