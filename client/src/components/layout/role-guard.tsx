'use client';

import { useAuthStore } from "@/store/useAuthStore";
import { AuthRoleEnum } from "@/types/auth";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import CompanySelector from "./partner-selector";
import { Clock } from "lucide-react";

// TODO: Proteger la ruta según el rol del usuario
export default function RoleGuard({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const userId = useAuthStore(state => state.user?.id);
    const role = useAuthStore(state => state.user?.role);
    const authenticated = useAuthStore(state => state.authenticated);
    const partner_id = useAuthStore(state => state.partner_id);
    const loading = useAuthStore(state => state.loading);
    const [showCompanySelector, setShowCompanySelector] = useState<boolean>(false);

    useEffect(() => {
        if(!authenticated) {
            setShowCompanySelector(false);
            return;
        }
        
        if (role === AuthRoleEnum.Admin && (!partner_id || partner_id === '')) {
            setShowCompanySelector(true);
        } 
        else if (role && role !== AuthRoleEnum.Admin) {
            setShowCompanySelector(false);
        }
        else if (role === AuthRoleEnum.Admin && partner_id && partner_id !== '') {
            setShowCompanySelector(false);
        }
        else {  
            setShowCompanySelector(false);
        }
    }, [role, partner_id, authenticated, userId]);

    if (loading) {
        return <></>;
    }

    if (showCompanySelector) {
        return (
            <div className="min-h-screen bg-slate-50">
                <div className="container mx-auto px-6 py-8">
                    {/* Header Corporativo */}
                    <div className="bg-gradient-brand rounded-2xl p-8 text-white mb-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-brand-primary rounded-md flex items-center justify-center mx-auto mb-4">
                                <Clock className="w-8 h-8 text-white" />
                            </div>
                            <h1 className="text-3xl font-semibold mb-2">
                                Sistema de Fichajes Coagrisan
                            </h1>
                            <p className="text-slate-200 text-lg">
                                Plataforma integral para la gestión de recursos humanos y control horario
                            </p>
                        </div>
                    </div>

                    <CompanySelector />
                </div>
            </div>
        )
    }

    return children;
}