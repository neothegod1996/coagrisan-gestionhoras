import axios from "axios";
import { NextResponse } from "next/server";
import { DEFAULT_RESPONSE } from "../..";

export async function POST(request: Request) {
    const body = await request.json();
    const { token } = body;
    if(!token) {
        return NextResponse.json(DEFAULT_RESPONSE.ERROR, { status: 400 });
    }
    try {
        const response = await axios.request({
            method: 'POST',
            url: `${process.env.API_URL}/api/auth/validate`,
            data: {
                wp_token: token
            }
        })
        const accessToken = response?.data?.data?.access_token;

        const status = response.status;
        const nextResponse = NextResponse.json(response.data, { status });

        if(accessToken) {
            nextResponse.cookies.set('access_token', accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 60 * 60 * 24 * 7,
                path: '/'
            });
        }

        return nextResponse;
    } catch (error: any) {
        const response = error?.response?.data || DEFAULT_RESPONSE.ERROR;
        const status = error?.response?.status || 500;
        return NextResponse.json(response, { status });
    }
}