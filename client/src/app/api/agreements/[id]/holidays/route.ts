import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_RESPONSE } from "@/app/api";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const body = await request.json();
    try {
        const response = await axios.request({
            method: 'POST',
            url: `${process.env.API_URL}/api/agreements/${id}/holidays`,
            headers: {
                Authorization: request.headers.get('authorization')
            },
            data: body,
        });
        return NextResponse.json(response.data, { status: response.status });
    } catch (error: any) {
        const response = error?.response?.data || DEFAULT_RESPONSE.ERROR;
        const status = error?.response?.status || 500;
        return NextResponse.json(response, { status });
    }
}
