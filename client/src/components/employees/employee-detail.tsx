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
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge as BadgeComponent } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  History, 
  Calendar, 
  AlertCircle,
  Clock,
  Briefcase
} from "lucide-react";
import { redirect } from "next/navigation";
import IncidenceSummary from "./incidence-summary";
import EmployeeIncidenceList from "./employee-incidence-list";
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

      <Tabs defaultValue="info" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="info" className="flex gap-2">
            <User className="w-4 h-4" /> Información
          </TabsTrigger>
          <TabsTrigger value="laboral" className="flex gap-2">
            <Briefcase className="w-4 h-4" /> Historial Laboral
          </TabsTrigger>
          <TabsTrigger value="horarios" className="flex gap-2">
            <Calendar className="w-4 h-4" /> Historial Horarios
          </TabsTrigger>
          <TabsTrigger value="incidencias" className="flex gap-2">
            <AlertCircle className="w-4 h-4" /> Incidencias
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-6">
          {/* Ficha básica */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Información personal */}
            <Card className="rounded-lg shadow-md border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="w-5 h-5 text-brand-primary" />
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">NIF/DNI</p>
                  <p className="font-medium text-slate-800">{employee?.dni}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha de Nacimiento</p>
                  <p className="font-medium text-slate-800">
                    {employee?.birth_date ? dayjs(employee.birth_date).format("DD/MM/YYYY") : "-"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Dirección</p>
                  <p className="font-medium text-slate-800">{employee?.address}</p>
                  <p className="text-sm text-slate-500">
                    {employee?.postal_code} {employee?.population}, {employee?.province}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Información de contacto */}
            <Card className="rounded-lg shadow-md border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Phone className="w-5 h-5 text-brand-primary" />
                  Contacto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</p>
                    <p className="font-medium text-slate-800">{employee?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Móvil</p>
                    <p className="font-medium text-slate-800">{employee?.mobile_number}</p>
                  </div>
                </div>
                {employee?.phone_number && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Teléfono</p>
                      <p className="font-medium text-slate-800">{employee?.phone_number}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Información laboral actual */}
            <Card className="rounded-lg shadow-md border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="w-5 h-5 text-brand-primary" />
                  Información Laboral
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Horario Actual</p>
                  <p className="font-medium text-slate-800">{employee?.schedule.name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ubicación</p>
                    <p className="font-medium text-slate-800">{employee?.location.name}</p>
                  </div>
                </div>  
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</p>
                  <BadgeComponent 
                    className={cn(
                      "mt-1 rounded-full px-3 py-1 text-xs font-bold uppercase",
                      employee?.status === 'active' 
                        ? "bg-green-100 text-green-700 border-green-200" 
                        : "bg-red-100 text-red-700 border-red-200"
                    )}
                  >
                    {employee?.status === 'active' ? "Alta" : "Baja"}
                  </BadgeComponent>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="laboral" className="space-y-6">
          <Card className="rounded-lg shadow-md border-slate-200">
            <CardHeader>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <History className="w-6 h-6 text-brand-primary" />
                Historial de Altas y Bajas
              </CardTitle>
              <CardDescription>
                Registro de movimientos laborales (historial unificado unificado de fichas).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-bold">Fecha</TableHead>
                    <TableHead className="font-bold">Movimiento</TableHead>
                    <TableHead className="font-bold">Motivo</TableHead>
                    <TableHead className="font-bold">Comentario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(employee as any)?.employee_turnover?.length > 0 ? (
                    (employee as any)?.employee_turnover.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{dayjs(item.date).format("DD/MM/YYYY")}</TableCell>
                        <TableCell>
                          <BadgeComponent 
                            className={cn(
                              "rounded-full px-3 py-1 text-xs font-bold",
                              item.type === 'hire' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            )}
                          >
                            {item.type === 'hire' ? "ALTA" : "BAJA"}
                          </BadgeComponent>
                        </TableCell>
                        <TableCell>{item.reason || "-"}</TableCell>
                        <TableCell>{item.comment || "-"}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-slate-500 italic">
                        No hay registros de movimientos laborales.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="horarios" className="space-y-6">
          <Card className="rounded-lg shadow-md border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Clock className="w-6 h-6 text-brand-primary" />
                  Historial de Horarios (Asignación Dinámica)
                </CardTitle>
                <CardDescription>
                  Listado de horarios asignados al empleado por rangos de fecha.
                </CardDescription>
              </div>
              <Button size="sm" className="rounded-md bg-brand-primary" disabled>
                Asignar Horario
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-bold">Desde</TableHead>
                    <TableHead className="font-bold">Hasta</TableHead>
                    <TableHead className="font-bold">Horario</TableHead>
                    <TableHead className="font-bold">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(employee as any)?.schedules_history?.length > 0 ? (
                    (employee as any)?.schedules_history.map((item: any) => (
                      <TableRow key={item.id}>
                        <TableCell>{dayjs(item.start_date).format("DD/MM/YYYY")}</TableCell>
                        <TableCell>{item.end_date ? dayjs(item.end_date).format("DD/MM/YYYY") : "Indefinido"}</TableCell>
                        <TableCell className="font-semibold">{item.schedule?.name}</TableCell>
                        <TableCell>
                          {(!item.end_date || dayjs().isBefore(dayjs(item.end_date))) && dayjs().isAfter(dayjs(item.start_date)) ? (
                            <BadgeComponent className="bg-green-100 text-green-700">Activo</BadgeComponent>
                          ) : (
                            <BadgeComponent variant="outline" className="text-slate-400">Pasado</BadgeComponent>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-slate-500 italic">
                        No hay historial de horarios dinámicos. Usando horario base.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="incidencias" className="space-y-6">
          {employee?.id && (
            <div className="space-y-8">
              <IncidenceSummary employeeId={employee.id} />
              <EmployeeIncidenceList employeeId={employee.id} />
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
