export interface Agreement {
    id: string;
    name: string;
    description: string | null;
    saturday_is_holiday: boolean;
    sunday_is_holiday: boolean;
    partner_id: string;
    created_at: string;
    updated_at: string;
    _count?: {
        employees: number;
        holidays: number;
    };
    holidays?: AgreementHoliday[];
}

export interface AgreementHoliday {
    id: string;
    date: string;
    description: string | null;
    agreement_id: string;
    created_at: string;
    updated_at: string;
}

export interface AgreementResponse {
    data: Agreement[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    success?: boolean;
    message?: string;
}

export interface AgreementByIdResponse {
    success: boolean;
    data: Agreement;
    message: string;
}

export interface AgreementParams {
    page?: number;
    limit?: number;
    search?: string;
    partner_id?: string;
}

export interface AgreementFormData {
    name: string;
    description?: string;
    saturday_is_holiday?: boolean;
    sunday_is_holiday?: boolean;
}

export interface HolidayFormData {
    date: string;
    description?: string;
}
