"use client";

import { useEffect, useState } from "react";
import { Search, CheckCircle, Clock, ArrowLeft, Plus, CircleAlert } from "lucide-react";
import { TimeSheet, TimeSheetFilters } from "@/types/time-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import { redirect } from "next/navigation";
import { PaginatedRequestHandler } from "@/types";
import { approveTimeSheet, getTimeSheets } from "@/services/time-sheet";
import { getEmployees } from "@/services/employee";
import { Employee } from "@/types/employee";
import RingLoading from "../loading/Ring";
import toast from "react-hot-toast";
import IncidenceForm from "../calendar/incidence-form";

interface Props {
  
}
export default function TimeSheetList({}: Props) {
  const [timeSheets, setTimeSheets] = useState<PaginatedRequestHandler<TimeSheet>>({ data: [], loading: true, total_pages: 0, total: 0 });
  const [search, setSearch] = useState<string>("");
  const [employees, setEmployees] = useState<PaginatedRequestHandler<Employee>>({ data: [], loading: false, total_pages: 0, total: 0 });
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<TimeSheetFilters>({
    page: 1,
    search,
    status: undefined,
    employee_id: undefined,
    terminal_id: undefined,
    date_from: undefined,
    date_to: undefined
  });

  const handleGetTimeSheets = async (filters: TimeSheetFilters) => {
    setTimeSheets({ ...timeSheets, loading: true });
    getTimeSheets(filters).then((response) => {
      const { data, total_pages, total } = response || {};
      setTimeSheets({ data: data || [], loading: false, total_pages: total_pages || 0, total: total || 0 });
    });
  }

  useEffect(() => {
    handleGetTimeSheets(filters);
  }, [filters])

  const handleApproveTimeSheet = (id: string) => {
    approveTimeSheet(id).then((response) => {
      if (response) {
        toast.success("Horas aprobadas correctamente");
        handleGetTimeSheets(filters);
      } else {
        toast.error("Error al aprobar las horas");
      }
    });
  }

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };
  const handleFilterChange = (key: keyof TimeSheetFilters, value: string | boolean | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search, page: 1 }));
    }, 500);
    return () => clearTimeout(timeout);
  }, [search])

  // Cargar empleados
  useEffect(() => {
    setEmployees((prev) => ({ ...prev, loading: true }));
    getEmployees({ page: 1, search: employeeSearch }).then((res) => {
      const { data, total, total_pages } = res || {};
      setEmployees({ data: data || [], loading: false, total: total || 0, total_pages: total_pages || 1 });
    });
  }, [employeeSearch]);

  // Actualizar filtros cuando cambien los empleados seleccionados
  useEffect(() => {
    setFilters((prev) => ({ 
      ...prev, 
      employee_id: selectedEmployeeIds.length > 0 ? selectedEmployeeIds.join(',') : undefined,
      page: 1 
    }));
  }, [selectedEmployeeIds]);


  const getStatusBadge = (status: string) => {
    const statusConfig = {
      approved: { label: "Aprobado", className: "bg-green-100 text-green-800" },
      pending: { label: "Pendiente", className: "bg-yellow-100 text-yellow-800" },
      rejected: { label: "Rechazado", className: "bg-red-100 text-red-800" }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const formatDateTime = (time: string) => {
    return new Date(time).toLocaleString('es-ES', { 
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getEmployeeName = (timeSheet: TimeSheet) => {
    const { first_name, last_name } = timeSheet.employee_shift.employee;
    return `${first_name} ${last_name || ''}`.trim();
  };

  const handleEmployeeSelection = (values: string | string[]) => {
    const employeeIds = Array.isArray(values) ? values : [values];
    setSelectedEmployeeIds(employeeIds);
  };

  const [showIncidenceForm, setShowIncidenceForm] = useState<boolean>(false);

  return (
    <div className="space-y-6">
      {/* Header Corporativo */}
      <div className="bg-gradient-brand rounded-md p-8 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-primary rounded-md flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Control de Asistencia</h1>
              <p className="text-slate-200 mt-1">Consulta y aprueba el registro de horas de tus empleados</p>
            </div>
          </div>
          <Button
            onClick={() => setShowIncidenceForm(true)}
            className="px-6 py-3 h-11 font-medium bg-brand-primary hover:bg-brand-primary-600 text-white border-0"
          >
            <CircleAlert className="w-4 h-4 mr-2" />
            Nueva Incidencia
          </Button>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => redirect('/')}
        className="rounded-md"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver
      </Button>

      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-100 rounded-md flex items-center justify-center">
              <Clock className="w-4 h-4 text-slate-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">Registros de Asistencia</h2>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Barra de búsqueda y filtros */}
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por empleado o terminal"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="min-w-72 w-fit pl-10 h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
              </div>
              <div className="flex gap-4">
                <div className="w-64">
                  <MultiCombobox
                    options={employees.data.map((employee: Employee) => ({
                      value: employee.id,
                      label: `${employee.first_name} ${employee.last_name || ''}`
                    }))}
                    values={selectedEmployeeIds}
                    onSearchChange={setEmployeeSearch}
                    onValuesChange={handleEmployeeSelection}
                    placeholder="Filtrar por empleados"
                    searchPlaceholder="Buscar empleados"
                    emptyMessage="No se encontraron empleados"
                    loading={employees.loading}
                    className="w-full h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                  />
                </div>
                <div className="w-48">
                  <Select
                    value={filters.status?.toString() || "all"}
                    onValueChange={(value) =>
                      handleFilterChange("status", value === "all" ? undefined : value)
                    }
                  >
                    <SelectTrigger className="w-full h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="approved">Aprobado</SelectItem>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="rejected">Rechazado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de registros */}
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Empleado</TableHead>
                  <TableHead className="font-semibold">Fecha y Hora</TableHead>
                  <TableHead className="font-semibold">Terminal</TableHead>
                  <TableHead className="font-semibold">Estado</TableHead>
                  <TableHead className="font-semibold text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeSheets.loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-gray-500">
                      <RingLoading />
                    </TableCell>
                  </TableRow>
                ) : timeSheets.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No se encontraron registros de asistencia
                    </TableCell>
                  </TableRow>
                ) : (
                  timeSheets.data.map((timeSheet) => (
                    <TableRow key={timeSheet.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{getEmployeeName(timeSheet)}</TableCell>
                      <TableCell>{formatDateTime(timeSheet.time)}</TableCell>
                      <TableCell>{timeSheet.terminal.name}</TableCell>
                      <TableCell>{getStatusBadge(timeSheet.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {timeSheet.status === "pending" && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-md p-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="rounded-lg">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>¿Aprobar horas?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    ¿Estás seguro de que deseas aprobar las horas de {getEmployeeName(timeSheet)} 
                                    del {formatDateTime(timeSheet.time)}? Esta acción cambiará el estado a &quot;Aprobado&quot;.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-md">
                                    Cancelar
                                  </AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleApproveTimeSheet(timeSheet.id)}
                                    className="rounded-md bg-green-600 hover:bg-green-700"
                                  >
                                    Aprobar Horas
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {timeSheets.total_pages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(Math.max(1, filters.page - 1))}
                      className={filters.page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from({ length: timeSheets.total_pages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => handlePageChange(page)}
                        isActive={page === filters.page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(Math.min(timeSheets.total_pages, filters.page + 1))}
                      className={filters.page === timeSheets.total_pages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      <IncidenceForm
        isOpen={showIncidenceForm}
        incidence_id={null}
        onClose={() => setShowIncidenceForm(false)}
        refetch={() => null}
      />
    </div>
  );
}
