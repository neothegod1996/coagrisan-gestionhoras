import { PaginationResponse, Params, Response, Status } from ".";

export interface Location {
  id: string;
  name: string;
  status: Status;
  created_at: Date;
  updated_at: Date;
}

export interface LocationFormData {
  name: string;
  status: Status;
}

export interface LocationFilters {
  page: number;
  search: string;
  status?: Status;
}

export type LocationAction = 'view' | 'edit' | 'delete';

export type LocationResponse = PaginationResponse<Location>;
export type LocationByIdResponse = Response<Location>;
export type LocationParams = Params & LocationFilters;