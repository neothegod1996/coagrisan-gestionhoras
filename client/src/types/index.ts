export interface PaginationResponse<Data> {
    data: Data[];
    current_page: number;
    total_pages: number;
    total: number;
    limit: number;
}

export interface Response<Data> {
    data: Data;
    success: boolean;
    message: string;
}

export interface PaginatedRequestHandler<Data> {
    data: Data[];
    loading: boolean;
    total_pages: number;
    total: number;
}

export interface RequestHandler<Data> {
    data: Data;
    loading: boolean;
}

export interface Params {
    page?: number;
    limit?: number;
}

export type Status = "active" | "inactive";

export * from "./task-tracker";