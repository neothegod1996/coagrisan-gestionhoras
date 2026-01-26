import { PaginationResponse, Params, Status } from ".";

export interface Profile {
    id: string;
    name: string;
    status: Status;
}

export interface ProfileFilters {
    page: number;
    search: string;
    status?: Status;
}

export interface ProfileFormData {
    id?: string;
    name: string;
    status: Status;
}

export type ProfileResponse = PaginationResponse<Profile>;
export type ProfileParams = Params & ProfileFilters;
export type ProfileByIdResponse = { data: Profile };