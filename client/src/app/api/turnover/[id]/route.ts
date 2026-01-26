import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_RESPONSE } from "../..";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    try {
        const response = await axios.request({
            method: 'GET',
            url: `${process.env.API_URL}/api/turnover/${id}`,
            headers: {
                Authorization: request.headers.get('authorization')
            },
            params: searchParams
        })
        const status = response.status;
        return NextResponse.json(response.data, { status });
    } catch (error: any) {
        const response = error?.response?.data || DEFAULT_RESPONSE.ERROR;
        const status = error?.response?.status || 500;
        return NextResponse.json(response, { status });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const body = await request.json();
    const searchParams = request.nextUrl.searchParams;
    try {
        const response = await axios.request({
            method: 'PUT',
            url: `${process.env.API_URL}/api/turnover/${id}`,
            data: body,
            headers: {
                Authorization: request.headers.get('authorization')
            },
            params: searchParams
        });
        const status = response.status;
        return NextResponse.json(response.data, { status });
    } catch (error: any) {
        const response = error?.response?.data || DEFAULT_RESPONSE.ERROR;
        const status = error?.response?.status || 500;
        return NextResponse.json(response, { status });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    try {
        const response = await axios.request({
            method: 'DELETE',
            url: `${process.env.API_URL}/api/turnover/${id}`,
            headers: {
                Authorization: request.headers.get('authorization')
            },
            params: searchParams
        })
        const status = response.status;
        return NextResponse.json(response.data, { status });
    } catch (error: any) {
        const response = error?.response?.data || DEFAULT_RESPONSE.ERROR;
        const status = error?.response?.status || 500;
        return NextResponse.json(response, { status });
    }
}
