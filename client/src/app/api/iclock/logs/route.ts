import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL;

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;

    try {
        const response = await axios.request({
            method: 'GET',
            url: `${API_URL}/iclock/logs`,
            params: searchParams,
            responseType: 'text' 
        });

        return new NextResponse(response.data, { 
            status: response.status,
            headers: { 'Content-Type': 'text/html; charset=utf-8' } 
        });
    } catch (error: any) {
        console.error("Error loading logs from API:", error?.message);
        return new NextResponse(`Error loading logs from API: ${error.message}`, { status: 500 });
    }
}
