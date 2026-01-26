"use client";

import Link from "next/link";
import { Home, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
            <div className="max-w-md w-full">
                {/* Card principal */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 text-center">
                    {/* Icono de error */}
                    <div className="w-20 h-20 bg-brand-primary-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Search className="w-10 h-10 text-brand-primary" />
                    </div>

                    {/* Título */}
                    <h1 className="text-3xl font-semibold text-slate-900 mb-3">
                        Página no encontrada
                    </h1>

                    {/* Descripción */}
                    <p className="text-slate-600 mb-8 leading-relaxed">
                        Lo sentimos, la página que buscas no existe o ha sido movida.
                        Verifica la URL o regresa al inicio.
                    </p>

                    {/* Botones de acción */}
                    <div className="space-y-3">
                        <Link href="/" className="block">
                            <Button
                                className="w-full bg-brand-primary hover:bg-brand-primary-600 text-white"
                                size="lg"
                            >
                                <Home className="w-4 h-4" />
                                Ir al Inicio
                            </Button>
                        </Link>

                        <Button
                            variant="outline"
                            className="w-full"
                            size="lg"
                            onClick={() => window.history.back()}
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Volver Atrás
                        </Button>
                    </div>
                </div>

                {/* Información adicional */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-slate-500">
                        ¿Necesitas ayuda? Contacta con el administrador del sistema
                    </p>
                </div>
            </div>
        </div>
    );
}