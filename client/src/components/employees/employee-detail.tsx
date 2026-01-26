"use client";

import { 
  ArrowLeft, 
  Edit, 
  MapPin, 
  Building2, 
  Phone, 
  Mail, 
  User,
} from "lucide-react";
import { FullEmployee } from "@/types/employee";
import { Button } from "@/components/ui/button";
import { Badge as BadgeComponent } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { redirect } from "next/navigation";
import dayjs from "dayjs";
import "dayjs/locale/es";
dayjs.locale("es");

interface EmployeeDetailProps {
  employee: FullEmployee | null;
  loading: boolean;
  onEdit: () => void;
}

export default function EmployeeDetail({
  employee,
  loading,
  onEdit,
}: EmployeeDetailProps) {

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => redirect("/employees")}
            className="rounded-md"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {employee?.first_name} {employee?.last_name}
            </h1>
            <p className="text-gray-600">{employee?.id.slice(-10)}</p>
          </div>
        </div>
        <Button onClick={onEdit} className="rounded-md bg-brand-primary hover:bg-brand-primary-600">
          <Edit className="w-4 h-4 mr-2" />
          Editar
        </Button>
      </div>

      {/* Ficha básica */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Información personal */}
        <Card className="rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">NIF/DNI</p>
              <p className="font-medium">{employee?.dni}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Fecha de Nacimiento</p>
              <p className="font-medium">
                {employee?.birth_date ? dayjs(employee.birth_date).format("DD/MM/YYYY") : "-"}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Dirección</p>
              <p className="font-medium">{employee?.address}</p>
              <p className="text-sm text-gray-500">
                {employee?.postal_code} {employee?.population}, {employee?.province}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Información de contacto */}
        <Card className="rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Contacto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{employee?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Móvil</p>
                <p className="font-medium">{employee?.mobile_number}</p>
              </div>
            </div>
            {employee?.phone_number && (
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Teléfono</p>
                  <p className="font-medium">{employee?.phone_number}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Información laboral */}
        <Card className="rounded-lg shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Información Laboral
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">Horario</p>
              <p className="font-medium">{employee?.schedule.name}</p>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Ubicación</p>
                <p className="font-medium">{employee?.location.name}</p>
              </div>
            </div>  
            {employee?.schedule.name === "Turno noche" && (
              <div>
                <BadgeComponent variant="outline" className="rounded-full">
                  Turno Noche
                </BadgeComponent>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
