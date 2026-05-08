import axios from "axios";
import { getAccessToken } from "./index";

export const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add partner_id if available in localStorage (for client-side calls)
  if (typeof window !== 'undefined') {
    const partnerId = localStorage.getItem('partner_id');
    if (partnerId && !config.params?.partner_id) {
      config.params = { ...config.params, partner_id: partnerId };
    }
  }
  
  return config;
});
