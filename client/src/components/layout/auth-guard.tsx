'use client';

import { useAuthStore } from "@/store/useAuthStore";
import { redirect } from "next/navigation";
import RingLoading from "../loading/Ring";


export default function AuthGuard({ children }: { children: React.ReactNode }) {
    const authenticated = useAuthStore(state => state.authenticated);
    const loading = useAuthStore(state => state.loading);
    
    if (loading) {
        return (
            <div className={'min-h-screen grid place-items-center'}>
                <RingLoading color="primary" />
            </div>
        );
    }
    
    if (!authenticated) {
        redirect('/validate');
    }
    
    return children
}