import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_RESPONSE } from "../index";

export async function GET(request: NextRequest) {
    const params = request.nextUrl.searchParams;
    try {
        const response = await axios.request({
            method: 'GET',
            url: `${process.env.API_URL}/api/incidence-categories`,
            params,
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

export async function POST(request: NextRequest) {
    const body = await request.json();
    const params = request.nextUrl.searchParams;
    try {
        const response = await axios.request({
            method: 'POST',
            url: `${process.env.API_URL}/api/incidence-categories`,
            headers: {
                Authorization: request.headers.get('authorization')
            },
            params,
            data: body,
        });
        return NextResponse.json(response.data, { status: response.status });
    } catch (error: any) {
        const response = error?.response?.data || DEFAULT_RESPONSE.ERROR;
        return NextResponse.json(response, { status: error?.response?.status || 500 });
    }
}
