"use client";

import { useEffect, useState } from "react";
import { Search, CheckCircle, Clock, ArrowLeft, CircleAlert, Edit, Trash2, Plus } from "lucide-react";
import { TimeSheet, TimeSheetFilters } from "@/types/time-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import { redirect } from "next/navigation";
import { PaginatedRequestHandler } from "@/types";
import { approveTimeSheet, getTimeSheets, updateTimeSheet, deleteTimeSheet } from "@/services/time-sheet";
import { getEmployees } from "@/services/employee";
import { Employee } from "@/types/employee";
import RingLoading from "../loading/Ring";
import toast from "react-hot-toast";
import IncidenceForm from "../calendar/incidence-form";
import TimeSheetForm from "./time-sheet-form";

interface EditForm {
  start_time: string;
  end_time: string;
  status: string;
}

interface EditTarget {
  taskTrackerId: string;
  startId: string;
  endId: string;
  employeeId: string;
  employeeName: string;
  currentStartTime: string;
  currentEndTime: string;
  currentStatus: string;
}

export default function TimeSheetList() {
  const [timeSheets, setTimeSheets] = useState<PaginatedRequestHandler<any>>({ data: [], loading: true, total_pages: 0, total: 0 });
  const [search, setSearch] = useState<string>("");
  const [employees, setEmployees] = useState<PaginatedRequestHandler<Employee>>({ data: [], loading: false, total_pages: 0, total: 0 });
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [filters, setFilters] = useState<TimeSheetFilters>({
    page: 1, search, status: undefined, employee_id: undefined,
    terminal_id: undefined, date_from: undefined, date_to: undefined
  });

  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({ start_time: '', end_time: '', status: 'pending' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showIncidenceForm, setShowIncidenceForm] = useState<boolean>(false);

  const [showTimeSheetForm, setShowTimeSheetForm] = useState(false);
  const [timeSheetFormId, setTimeSheetFormId] = useState<string | null>(null);

  const handleGetTimeSheets = async (filters: TimeSheetFilters) => {
    setTimeSheets(prev => ({ ...prev, loading: true }));
    getTimeSheets(filters).then((response) => {
      const { data, total_pages, total } = response || {};
      setTimeSheets({ data: data || [], loading: false, total_pages: total_pages || 0, total: total || 0 });
    });
  };

  useEffect(() => { handleGetTimeSheets(filters); }, [filters]);

  useEffect(() => {
    const timeout = setTimeout(() => setFilters(prev => ({ ...prev, search, page: 1 })), 500);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    setEmployees(prev => ({ ...prev, loading: true }));
    getEmployees({ page: 1, search: employeeSearch }).then((res) => {
      const { data, total, total_pages } = res || {};
      setEmployees({ data: data || [], loading: false, total: total || 0, total_pages: total_pages || 1 });
    });
  }, [employeeSearch]);

  useEffect(() => {
    setFilters(prev => ({
      ...prev,
      employee_id: selectedEmployeeIds.length > 0 ? selectedEmployeeIds.join(',') : undefined,
      page: 1
    }));
  }, [selectedEmployeeIds]);

  const handlePageChange = (page: number) => setFilters(prev => ({ ...prev, page }));
  const handleFilterChange = (key: keyof TimeSheetFilters, value: string | boolean | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleUpdateTimeSheet = async () => {
    if (!editTarget) return;
    setIsSubmitting(true);
    try {
      console.log("Updating time sheet with data:", editTarget, editForm);
      if (!editForm.start_time || !editForm.end_time) {
        toast.error("La hora de inicio y fin son obligatorias");
        setIsSubmitting(false);
        return;
      }
      const toUTCISOString = (localDateString: string) => {
        const [date, time] = localDateString.split("T");
        return new Date(`${date}T${time}:00Z`).toISOString();
      };

      editForm.start_time = toUTCISOString(editForm.start_time);
      editForm.end_time = toUTCISOString(editForm.end_time);
      await updateTimeSheet(editTarget.taskTrackerId, editTarget.startId, editTarget.endId, editForm);
      toast.success("Registro actualizado correctamente");
      setEditTarget(null);
      handleGetTimeSheets(filters);
    } catch (error) {
      toast.error("Error al actualizar el registro");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTimeSheet = async (taskTrackerId: string, startId: string, endId: string) => {
    try {
      await deleteTimeSheet(taskTrackerId, startId, endId);
      toast.success("Registro eliminado correctamente");
      handleGetTimeSheets(filters);
    } catch {
      toast.error("Error al eliminar el registro");
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: any = {
      approved: { label: "Aprobado", className: "bg-green-100 text-green-800" },
      pending: { label: "Pendiente", className: "bg-yellow-100 text-yellow-800" },
      rejected: { label: "Rechazado", className: "bg-red-100 text-red-800" }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatDateTime = (time: string) => new Date(time).toLocaleString('es-ES', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  });

  const handleOpenEdit = (item: any) => {
    setEditTarget({
      taskTrackerId: item.task_tracker_id,
      startId: item.start?.id,
      endId: item.end?.id,
      employeeId: item.employee.id,
      employeeName: `${item.employee.first_name} ${item.employee.last_name || ''}`.trim(),
      currentStartTime: item.start?.time || '',
      currentEndTime: item.end?.time || '',
      currentStatus: item.start?.status || 'pending',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
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
          <Button onClick={() => setShowIncidenceForm(true)} className="px-6 py-3 h-11 font-medium bg-brand-primary hover:bg-brand-primary-600 text-white border-0">
            <CircleAlert className="w-4 h-4 mr-2" /> Nueva Incidencia
          </Button>
          <Button
            onClick={() => { setTimeSheetFormId(null); setShowTimeSheetForm(true); }}
            className="px-6 py-3 h-11 font-medium bg-white text-brand-primary hover:bg-slate-100 border-0"
          >
            <Plus className="w-4 h-4 mr-2" /> Nuevo Registro
          </Button>
        </div>
      </div>

      <Button variant="outline" size="sm" onClick={() => redirect('/')} className="rounded-md">
        <ArrowLeft className="w-4 h-4 mr-2" /> Volver
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
          {/* Filtros */}
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
              <Input
                placeholder="Buscar por empleado"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="min-w-72 w-fit pl-10 h-10 border-slate-300"
              />
            </div>
            <div className="flex gap-4">
              <div className="w-64">
                <MultiCombobox
                  options={employees.data.map((e: Employee) => ({ value: e.id, label: `${e.first_name} ${e.last_name || ''}` }))}
                  values={selectedEmployeeIds}
                  onSearchChange={setEmployeeSearch}
                  onValuesChange={(v) => setSelectedEmployeeIds(Array.isArray(v) ? v : [v])}
                  placeholder="Filtrar por empleados"
                  searchPlaceholder="Buscar empleados"
                  emptyMessage="No se encontraron empleados"
                  loading={employees.loading}
                  className="w-full h-10 border-slate-300"
                />
              </div>
              <div className="w-48">
                <Select value={filters.status?.toString() || "all"} onValueChange={(v) => handleFilterChange("status", v === "all" ? undefined : v)}>
                  <SelectTrigger className="w-full h-10 border-slate-300">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="approved">Aprobado</SelectItem>
                    <SelectItem value="pending">Pendiente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Tabla */}
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Empleado</TableHead>
                  <TableHead className="font-semibold">Tarea</TableHead>
                  <TableHead className="font-semibold">Inicio</TableHead>
                  <TableHead className="font-semibold">Fin</TableHead>
                  <TableHead className="font-semibold">Estado</TableHead>
                  <TableHead className="font-semibold text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {timeSheets.loading ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-20"><RingLoading /></TableCell></TableRow>
                ) : timeSheets.data.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No se encontraron registros</TableCell></TableRow>
                ) : (
                  timeSheets.data.map((item: any) => (
                    <TableRow key={item.task_tracker_id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {item.employee.first_name} {item.employee.last_name || ''}
                      </TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.start ? formatDateTime(item.start.time) : '—'}</TableCell>
                      <TableCell>{item.end ? formatDateTime(item.end.time) : '—'}</TableCell>
                      <TableCell>{getStatusBadge(item.start?.status || 'pending')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline" size="sm"
                            onClick={() => handleOpenEdit(item)}
                            className="rounded-md p-2"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="rounded-md p-2 text-red-600 hover:text-red-700 hover:bg-red-50">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-lg">
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar registro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Se eliminarán los registros de entrada y salida de{' '}
                                  {item.employee.first_name} {item.employee.last_name}.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-md">Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteTimeSheet(item.task_tracker_id, item.start?.id, item.end?.id)}
                                  className="rounded-md bg-red-600 hover:bg-red-700"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {timeSheets.total_pages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious onClick={() => handlePageChange(Math.max(1, filters.page - 1))} className={filters.page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                </PaginationItem>
                {Array.from({ length: timeSheets.total_pages }, (_, i) => i + 1).map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink onClick={() => handlePageChange(p)} isActive={p === filters.page} className="cursor-pointer">{p}</PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext onClick={() => handlePageChange(Math.min(timeSheets.total_pages, filters.page + 1))} className={filters.page === timeSheets.total_pages ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </CardContent>
      </Card>

      {/* Modal de edición */}
      <TimeSheetForm
        isOpen={showTimeSheetForm || !!editTarget}
        onClose={() => { setShowTimeSheetForm(false); setEditTarget(null); }}
        refetch={() => handleGetTimeSheets(filters)}
        editTarget={editTarget}
      />

      <IncidenceForm isOpen={showIncidenceForm} incidence_id={null} onClose={() => setShowIncidenceForm(false)} refetch={() => null} />
    </div>
  );
}