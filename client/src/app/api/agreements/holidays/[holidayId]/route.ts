import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_RESPONSE } from "@/app/api";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ holidayId: string }> }) {
    const { holidayId } = await params;
    try {
        const response = await axios.request({
            method: 'DELETE',
            url: `${process.env.API_URL}/api/agreements/holidays/${holidayId}`,
            headers: {
                Authorization: request.headers.get('authorization')
            },
        });
        return NextResponse.json(response.data, { status: response.status });
    } catch (error: any) {
        const response = error?.response?.data || DEFAULT_RESPONSE.ERROR;
        const status = error?.response?.status || 500;
        return NextResponse.json(response, { status });
    }
}
