import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL;

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;

    try {
        const response = await axios.request({
            method: 'GET',
            url: `${API_URL}/iclock/getrequest`,
            params: searchParams,
            responseType: 'text'
        });

        return new NextResponse(response.data, {
            status: response.status,
            headers: { 'Content-Type': 'text/plain' }
        });
    } catch (error: any) {
        return new NextResponse("OK", { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }
}
