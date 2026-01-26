import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_RESPONSE } from "..";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const page = searchParams.get('page') || 1;
    const limit = searchParams.get('limit') || 10;
    const search = searchParams.get('search') || undefined;
    const profile = searchParams.get('profile') || undefined;
    const location = searchParams.get('location') || undefined;
    const active = searchParams.get('active') || undefined;
    const company_id = searchParams.get('company_id') || undefined;

    const params = {
        page: Number(page),
        limit: Number(limit),
        search,
        profile,
        location,
        active: active ? Boolean(active) : undefined,
        company_id,
    }

    try {
        const response = await axios.request({
            method: 'GET',
            url: `${process.env.API_URL}/api/employees`,
            params,
            headers: {
                Authorization: request.headers.get('authorization')
            }
        })
        const status = response.status;
        return NextResponse.json(response.data, { status });
    } catch (error: any) {
        const response = error?.response?.data || DEFAULT_RESPONSE.ERROR;
        const status = error?.response?.status || 500;
        return NextResponse.json(response, { status });
    }
}

export async function POST(request: NextRequest) {
    const body = await request.json();
    const searchParams = request.nextUrl.searchParams;
    try {
        const response = await axios.request({
            method: 'POST',
            url: `${process.env.API_URL}/api/employees`,
            data: {
                ...body,
                partner_id: searchParams.get('partner_id'),
            },
            headers: {
                Authorization: request.headers.get('authorization')
            }
        });
        const status = response.status;
        return NextResponse.json(response.data, { status });
    } catch (error: any) {
        const response = error?.response?.data || DEFAULT_RESPONSE.ERROR;
        const status = error?.response?.status || 500;
        return NextResponse.json(response, { status });
    }
}