import { api } from "./api";
import { RequestHandler } from "@/types";

export const getIncidenceCategories = async (): Promise<RequestHandler<any>> => {
  try {
    const res = await api.get("/incidence-categories", {
      params: {
        partner_id: localStorage.getItem('partner_id'),
      }
    });
    return res.data;
  } catch (error) {
    console.error("Error fetching incidence categories", error);
    return { data: [], loading: false, success: false, message: "Error fetching incidence categories" };
  }
};

export const createIncidenceCategory = async (data: any): Promise<RequestHandler<any>> => {
  try {
    const res = await api.post("/incidence-categories", data);
    return res.data;
  } catch (error) {
    console.error("Error creating incidence category", error);
    throw error;
  }
};

export const updateIncidenceCategory = async (id: string, data: any): Promise<RequestHandler<any>> => {
  try {
    const res = await api.put(`/incidence-categories/${id}`, data);
    return res.data;
  } catch (error) {
    console.error("Error updating incidence category", error);
    throw error;
  }
};

export const deleteIncidenceCategory = async (id: string): Promise<RequestHandler<any>> => {
  try {
    const res = await api.delete(`/incidence-categories/${id}`);
    return res.data;
  } catch (error) {
    console.error("Error deleting incidence category", error);
    throw error;
  }
};
