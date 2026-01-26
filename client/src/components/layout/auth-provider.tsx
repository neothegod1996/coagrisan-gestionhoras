'use client';

import { useAuthStore } from "@/store/useAuthStore";
import { Auth } from "@/types/auth";
import { useEffect } from "react";

export default function AuthProvider({ user }: { user: Auth | null }) {
    const setUser = useAuthStore((state) => state.setUser);
    const setAuthenticated = useAuthStore((state) => state.setAuthenticated);
    const setAuthLoading = useAuthStore((state) => state.setLoading);
    const setPartnerId = useAuthStore((state) => state.setPartnerId);

    useEffect(() => {
        if (!user) {
            setUser(null);
            setAuthenticated(false);
            setAuthLoading(false);
            setPartnerId(null);
            localStorage.removeItem('partner_id');
            return;
        }

        setUser(user);
        setAuthenticated(true);
        setAuthLoading(false);
        const partner_id = localStorage.getItem('partner_id');
        if (partner_id) {
            setPartnerId(partner_id);
        }
    }, [user])
    
    return <></>;
}