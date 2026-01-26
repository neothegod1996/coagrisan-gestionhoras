import { create } from "zustand";
import { Auth } from "@/types/auth";

type AuthStore = {
    user: Auth | null;
    partner_id: string | null;
    authenticated: boolean;
    loading: boolean;
    setUser: (user: Auth | null) => void;
    setAuthenticated: (authenticated: boolean) => void;
    setLoading: (loading: boolean) => void;
    setPartnerId: (partner_id: string | null) => void;
    logout: () => void;
};

export const useAuthStore = create<AuthStore>((set) => ({
    user: null,
    partner_id: null,
    authenticated: false,
    loading: true,
    setUser: (user) => set(current => {
        const userChanged = current.user?.id !== user?.id;
        
        return {
            ...current,
            user,
            partner_id: userChanged || !user ? null : current.partner_id,
        };
    }),
    setPartnerId: (partner_id) => set(current => ({
        ...current,
        partner_id,
    })),
    logout: () => {
        localStorage.removeItem('partner_id');
        set({ user: null, partner_id: null, authenticated: false, loading: false });
    },
    setAuthenticated: (authenticated) => set({ authenticated }),
    setLoading: (loading) => set({ loading }),
}));