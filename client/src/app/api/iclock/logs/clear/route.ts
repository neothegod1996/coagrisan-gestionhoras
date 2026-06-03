import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

const API_URL = process.env.API_URL;

export async function POST(request: NextRequest) {
    try {
        const response = await axios.request({
            method: 'POST',
            url: `${API_URL}/iclock/logs/clear`,
            responseType: 'text'
        });

        return new NextResponse(response.data, { 
            status: response.status,
            headers: { 'Content-Type': 'text/plain' }
        });
    } catch (error: any) {
        console.error("Error clearing logs from API:", error?.message);
        return new NextResponse(`Error clearing logs from API: ${error.message}`, { status: 500 });
    }
}
