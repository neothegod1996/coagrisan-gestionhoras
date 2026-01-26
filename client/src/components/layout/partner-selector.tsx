import { useEffect, useState } from "react";
import { MultiCombobox } from "../ui/multi-combobox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { PaginatedRequestHandler } from "@/types";
import { Partner } from "@/types/partner";
import { getPartners } from "@/services/partner";
import { useAuthStore } from "@/store/useAuthStore";
import { Building2, Settings } from "lucide-react";

export default function PartnerSelector() {

    const partner_id = useAuthStore(state => state.partner_id);
    const setPartnerId = useAuthStore(state => state.setPartnerId);
    const [partners, setPartners] = useState<PaginatedRequestHandler<Partner>>({ data: [], loading: true, total_pages: 0, total: 0 });
    const [partnerSearch, setPartnerSearch] = useState("");
    const [partnerValues, setPartnerValues] = useState<string>("");

    const handleGetPartners = async (search: string) => {
        setPartners({ ...partners, loading: true });
        getPartners({ page: 1, search: search }).then((response) => {
            const { data, total_pages, total } = response || {};
            setPartners({ data: data || [], loading: false, total_pages: total_pages || 0, total: total || 0 });
        });
    }

    useEffect(() => {
        handleGetPartners(partnerSearch);
    }, [partnerSearch]);

    useEffect(() => {
        if(!partnerValues || partner_id) return;
        setPartnerId(partnerValues);
        localStorage.setItem('partner_id', partnerValues);
    }, [partnerValues, partner_id, partners.data]);

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Building2 className="h-5 w-5" />
                    <h2 className="text-lg font-semibold">Gestión de Socios</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                    Selecciona un socio para gestionar sus datos y configuraciones
                </p>
            </div>

            {/* Company Selector */}
            <Card className="border-2 border-dashed border-muted-foreground/25 hover:border-muted-foreground/50 transition-colors">
                <CardHeader className="pb-4">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        Seleccionar Socio
                    </CardTitle>
                    <CardDescription>
                        Busca y selecciona el socio que deseas administrar
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <MultiCombobox
                        options={partners.data.map((partner: Partner) => ({
                            value: partner.id,
                            label: partner.wp_name
                        }))}
                        values={partnerValues}
                        onSearchChange={setPartnerSearch}
                        onValuesChange={(values) => setPartnerValues(values as string)}
                        placeholder="Buscar socio por nombre..."
                        searchPlaceholder="Escribe el nombre del socio"
                        emptyMessage="No se encontraron socios"
                        loading={partners.loading}
                        className="w-full h-12 border-slate-300 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 transition-all"
                        multiple={false}
                    />
                </CardContent>
            </Card>
        </div>
    )
}