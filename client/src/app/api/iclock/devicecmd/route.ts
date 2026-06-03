import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL;

export async function POST(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const rawBody = await request.text();

    try {
        const response = await axios.request({
            method: 'POST',
            url: `${API_URL}/iclock/devicecmd`,
            params: searchParams,
            data: rawBody,
            headers: { 'Content-Type': 'text/plain' },
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
