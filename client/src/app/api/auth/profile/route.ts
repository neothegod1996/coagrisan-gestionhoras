import axios from "axios";
import { NextResponse } from "next/server";
import { DEFAULT_RESPONSE } from "../..";

export async function GET(request: Request) {
    try {
        const response = await axios.request({
            method: 'GET',
            url: `${process.env.API_URL}/api/auth/profile`,
            headers: {
                Authorization: request.headers.get('authorization')
            }
        })
        const status = response.status;
        return NextResponse.json(response.data, { status });
    } catch (error: any) {
        const response = error?.response?.data || DEFAULT_RESPONSE.ERROR;
        const status = error?.response?.status || 500;
        return NextResponse.json(response, { status });
    }
}