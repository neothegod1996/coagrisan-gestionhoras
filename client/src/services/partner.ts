import { PartnerFilters, PartnerResponse } from "@/types/partner";
import { getAccessToken } from ".";
import axios from "axios";

export async function getPartners(filters: PartnerFilters) {
    const token = await getAccessToken();
    try {
        const response = await axios.request<PartnerResponse>({
            method: 'GET',
            url: '/api/partners',
            params: filters,
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    } catch (error) {
        return null;
    }
}