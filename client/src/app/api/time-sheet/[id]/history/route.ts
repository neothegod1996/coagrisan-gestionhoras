import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_RESPONSE = {
    ERROR: {
        success: false,
        message: "Ocurrió un error inesperado.",
    }
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const response = await axios.request({
            method: 'GET',
            url: `${process.env.API_URL}/api/shift-clock/${id}/history`,
            headers: {
                Authorization: request.headers.get('authorization')
            }
        });
        const status = response.status;
        return NextResponse.json(response.data, { status });
    } catch (error: any) {
        const responseData = error?.response?.data || DEFAULT_RESPONSE.ERROR;
        const status = error?.response?.status || 500;
        return NextResponse.json(responseData, { status });
    }
}
