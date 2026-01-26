import { PaginationResponse, Params } from ".";

export interface Partner {
    id: string;
    wp_name: string;
}

export type PartnerResponse = PaginationResponse<Partner>;
export interface PartnerFilters extends Params {
    search?: string;
}