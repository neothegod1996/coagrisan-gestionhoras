import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_RESPONSE } from "../../index";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const body = await request.json();
    const { id } = await params;
    const partner_id = request.nextUrl.searchParams.get('partner_id');
    try {
        const response = await axios.request({
            method: 'PUT',
            url: `${process.env.API_URL}/api/incidence-categories/${id}`,
            data: body,
            params: partner_id ? { partner_id } : undefined,
            headers: {
                Authorization: request.headers.get('authorization')
            }
        });
        return NextResponse.json(response.data, { status: response.status });
    } catch (error: any) {
        const response = error?.response?.data || DEFAULT_RESPONSE.ERROR;
        return NextResponse.json(response, { status: error?.response?.status || 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const partner_id = request.nextUrl.searchParams.get('partner_id');
    try {
        const response = await axios.request({
            method: 'DELETE',
            url: `${process.env.API_URL}/api/incidence-categories/${id}`,
            params: partner_id ? { partner_id } : undefined,
            headers: {
                Authorization: request.headers.get('authorization')
            }
        });
        return NextResponse.json(response.data, { status: response.status });
    } catch (error: any) {
        const response = error?.response?.data || DEFAULT_RESPONSE.ERROR;
        return NextResponse.json(response, { status: error?.response?.status || 500 });
    }
}
