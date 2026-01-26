"use client";

import { ArrowLeft, Monitor, Edit } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Terminal } from "@/types/terminal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TerminalDetailProps {
  terminal: Terminal;
  onBack: () => void;
  onEdit: () => void;
}

export default function TerminalDetail({
  terminal,
  onBack,
  onEdit,
}: TerminalDetailProps) {
  const getConnectionStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "disconnected":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getConnectionStatusText = (status: string) => {
    switch (status) {
      case "connected":
        return "Conectado";
      case "failed":
        return "Fallido";
      case "disconnected":
        return "Desconectado";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header con navegación */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="px-4 py-2 h-10 font-medium border-slate-300 hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold text-slate-800">{terminal.name}</h1>
          <p className="text-slate-600 mt-1">Código: {terminal.id.slice(-10)}</p>
        </div>
        <Button
          onClick={onEdit}
          className="px-6 py-2 h-10 font-medium bg-brand-primary hover:bg-brand-primary-700 text-white"
        >
          <Edit className="w-4 h-4 mr-2" />
          Editar Terminal
        </Button>
      </div>

      {/* Información básica del terminal */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-brand-primary rounded-md flex items-center justify-center">
              <Monitor className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">Información del Terminal</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Nombre</label>
                <p className="text-slate-900 font-medium mt-1">{terminal.name}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700">Código</label>
                <p className="text-slate-900 font-medium mt-1">{terminal.id}</p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700">Estado de Conexión</label>
                <div className="mt-1">
                  <Badge  
                    className={`rounded-full ${getConnectionStatusBadge(terminal.connection_status)}`}
                  >
                    {getConnectionStatusText(terminal.connection_status)}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Fecha de Creación</label>
                <p className="text-slate-900 mt-1">
                  {format(terminal.created_at, "PPP", { locale: es })}
                </p>
              </div>
              
              <div>
                <label className="text-sm font-medium text-slate-700">Última Actualización</label>
                <p className="text-slate-900 mt-1">
                  {format(terminal.updated_at, "PPP", { locale: es })}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
