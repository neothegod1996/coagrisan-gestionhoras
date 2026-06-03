import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { DEFAULT_RESPONSE } from "../..";

const API_URL = process.env.API_URL;

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;

    try {
        const response = await axios.request({
            method: 'GET',
            url: `${API_URL}/iclock/cdata`,
            params: searchParams,
            responseType: 'text' 
        });

        return new NextResponse(response.data, { 
            status: response.status,
            headers: { 'Content-Type': 'text/plain' } 
        });
    } catch (error: any) {
        const response = error?.response?.data || DEFAULT_RESPONSE.ERROR;
        const status = error?.response?.status || 500;
        return NextResponse.json(response, { status });
    }
}

export async function POST(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    
    const rawBody = await request.text(); 

    try {
        const response = await axios.request({
            method: 'POST',
            url: `${API_URL}/iclock/cdata`,
            params: searchParams,
            data: rawBody,
            headers: {
                'Content-Type': 'text/plain',
                Authorization: request.headers.get('authorization')
            },
            responseType: 'text'
        });

        return new NextResponse(response.data, { 
            status: response.status,
            headers: { 'Content-Type': 'text/plain' }
        });
    } catch (error: any) {
        console.error("Error en Proxy ZKTeco:", error?.response?.data);
        return new NextResponse("OK", { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }
}