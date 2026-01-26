import axios from "axios";
import { ProfileResponse, ValidateResponse } from "@/types/auth";
import { getAccessToken, getPort } from ".";

export const validate = async (token: string) => {
    try {
        const response = await axios.request<ValidateResponse>({
            method: 'POST',
            url: '/api/auth/validate',
            data: {
                token,
            }
        });
        return response.data;
    } catch (error: any) {
        return null;
    }
};

export const getProfile = async () => {
    const token = await getAccessToken();
    const port = await getPort();
    try {
        const response = await axios.request<ProfileResponse>({
            method: 'GET',
            url: `http://127.0.0.1:${port}/api/auth/profile`,
            headers: {
                Authorization: `Bearer ${token}`,
            }
        });
        return response.data;
    } catch (error: any) {
        return null;
    }
};