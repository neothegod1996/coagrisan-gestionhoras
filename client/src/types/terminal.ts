import { PaginationResponse, Params, Response } from ".";

export type ConnectionStatus = "connected" | "failed" | "disconnected";

export interface Terminal {
  id: string;
  external_id: string;
  name: string;
  connection_status: ConnectionStatus;
  created_at: Date;
  updated_at: Date;
}

export interface TerminalFormData {
  name: string;
}

export interface TerminalFilters {
  page: number;
  search: string;
  connection_status?: ConnectionStatus;
}

export type TerminalAction = 'view' | 'edit' | 'delete';

export type TerminalResponse = PaginationResponse<Terminal>;
export type TerminalByIdResponse = Response<Terminal>;
export type TerminalParams = Params & TerminalFilters;
