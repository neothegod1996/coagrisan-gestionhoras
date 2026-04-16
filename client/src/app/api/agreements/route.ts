import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_RESPONSE } from "..";

export async function GET(request: NextRequest) {
    const params = request.nextUrl.searchParams;
    try {
        const response = await axios.request({
            method: 'GET',
            url: `${process.env.API_URL}/api/agreements`,
            headers: {
                Authorization: request.headers.get('authorization')
            },
            params
        });
        return NextResponse.json(response.data, { status: response.status });
    } catch (error: any) {
        const response = error?.response?.data || DEFAULT_RESPONSE.ERROR;
        const status = error?.response?.status || 500;
        return NextResponse.json(response, { status });
    }
}

export async function POST(request: NextRequest) {
    const body = await request.json();
    const params = request.nextUrl.searchParams;
    try {
        const response = await axios.request({
            method: 'POST',
            url: `${process.env.API_URL}/api/agreements`,
            headers: {
                Authorization: request.headers.get('authorization')
            },
            data: {
                ...body,
                partner_id: params.get('partner_id'),
            }
        });
        return NextResponse.json(response.data, { status: response.status });
    } catch (error: any) {
        const response = error?.response?.data || DEFAULT_RESPONSE.ERROR;
        const status = error?.response?.status || 500;
        return NextResponse.json(response, { status });
    }
}
