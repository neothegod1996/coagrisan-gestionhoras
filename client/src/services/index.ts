'use server';

import { cookies, headers } from "next/headers";

export async function getAccessToken() {
    const cookieStore = await cookies();
    const token = cookieStore.get('access_token')?.value;
    return token;
}

export async function getPort() {
    const headersList = await headers();
    const port = headersList.get('x-forwarded-port') || '3001';

    return port;
}