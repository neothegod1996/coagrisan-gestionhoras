"use client";

import { useEffect, useState } from "react";
import { Search, CheckCircle, Clock, ArrowLeft, CircleAlert, Edit, Trash2, Plus } from "lucide-react";
import { TimeSheetFilters } from "@/types/time-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from "@/components/ui/tabs";
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import { redirect } from "next/navigation";
import { PaginatedRequestHandler } from "@/types";
import { getTimeSheets, deleteTimeSheet } from "@/services/time-sheet";
import { getEmployees } from "@/services/employee";
import { getIncidences, deleteIncidence } from "@/services/incidence";
import { Employee } from "@/types/employee";
import { Incidence, IncidenceType } from "@/types/incidence";
import RingLoading from "../loading/Ring";
import toast from "react-hot-toast";
import TimeSheetForm from "./time-sheet-form";

interface EditTarget {
  taskTrackerId: string;
  startId: string;
  endId: string;
  employeeId: string;
  employeeName: string;
  currentStartTime: string;
  currentEndTime: string;
  currentStatus: string;
  incidenceCategoryId?: string;
  isPaid?: boolean;
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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);

  const [showTimeSheetForm, setShowTimeSheetForm] = useState(false);
  const [timeSheetFormDefaultTab, setTimeSheetFormDefaultTab] = useState<'registro' | 'incidencia'>('registro');

  // Incidences tab state
  const [incidences, setIncidences] = useState<Incidence[]>([]);
  const [incLoading, setIncLoading] = useState(false);
  const [incPage, setIncPage] = useState(1);
  const [incTotalPages, setIncTotalPages] = useState(0);

  const handleGetTimeSheets = async (filters: TimeSheetFilters) => {
    setTimeSheets(prev => ({ ...prev, loading: true }));
    getTimeSheets(filters).then((response) => {
      const { data, total_pages, total } = response || {};
      setTimeSheets({ data: data || [], loading: false, total_pages: total_pages || 0, total: total || 0 });
    });
  };

  const handleGetIncidences = async (page = 1) => {
    setIncLoading(true);
    const params: any = { page, limit: 10 };
    if (selectedEmployeeIds.length === 1) params.employee_id = selectedEmployeeIds[0];
    const res = await getIncidences(params);
    const data = (res as any)?.data || [];
    setIncidences(data);
    setIncTotalPages((res as any)?.total_pages || 0);
    setIncLoading(false);
  };

  useEffect(() => { handleGetTimeSheets(filters); }, [filters]);

  useEffect(() => {
    handleGetIncidences(incPage);
  }, [incPage, selectedEmployeeIds]);

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

  const handleDeleteTimeSheet = async (taskTrackerId: string, startId: string, endId: string) => {
    try {
      await deleteTimeSheet(taskTrackerId, startId, endId);
      toast.success("Registro eliminado correctamente");
      handleGetTimeSheets(filters);
    } catch {
      toast.error("Error al eliminar el registro");
    }
  };

  const handleDeleteIncidence = async (id: string) => {
    try {
      await deleteIncidence(id);
      toast.success("Incidencia eliminada");
      handleGetIncidences(incPage);
    } catch {
      toast.error("Error al eliminar la incidencia");
    }
  };

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    const loadingToast = toast.loading("Aprobando registros...");
    try {
      const { api } = await import("@/services/api");
      const res = await api.post("/task-tracker/bulk-approve", { ids: selectedIds });
      if (res.data.success) {
        toast.success(`Se han procesado ${selectedIds.length} registros`, { id: loadingToast });
        setSelectedIds([]);
        handleGetTimeSheets(filters);
      } else {
        toast.error("Error al procesar la aprobación masiva", { id: loadingToast });
      }
    } catch (error) {
      toast.error("Error en la petición de aprobación masiva", { id: loadingToast });
    }
  };

  const toggleSelectAll = () => {
    const pendingIds = timeSheets.data
      .filter((item: any) => item.start?.status === 'pending')
      .map((item: any) => item.task_tracker_id);

    if (selectedIds.length === pendingIds.length && pendingIds.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(pendingIds);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
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

  const formatDate = (time: string) => new Date(time).toLocaleDateString('es-ES', {
    year: 'numeric', month: '2-digit', day: '2-digit'
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
      incidenceCategoryId: item.incidence_category?.id,
      isPaid: item.is_paid,
    });
  };

  const openNewForm = (tab: 'registro' | 'incidencia') => {
    setTimeSheetFormDefaultTab(tab);
    setShowTimeSheetForm(true);
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
          <div className="flex gap-3">
            <Button
              onClick={() => openNewForm('incidencia')}
              className="px-6 py-3 h-11 font-medium bg-brand-primary hover:bg-brand-primary-600 text-white border-0"
            >
              <CircleAlert className="w-4 h-4 mr-2" /> Nueva Incidencia
            </Button>
            <Button
              onClick={() => openNewForm('registro')}
              className="px-6 py-3 h-11 font-medium bg-white text-brand-primary hover:bg-slate-100 border-0"
            >
              <Plus className="w-4 h-4 mr-2" /> Nuevo Registro
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" size="sm" onClick={() => redirect('/')} className="rounded-md">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver
        </Button>

        {selectedIds.length > 0 && (
          <Button
            onClick={handleBulkApprove}
            className="bg-green-600 hover:bg-green-700 text-white animate-in fade-in slide-in-from-right-4"
          >
            <CheckCircle className="w-4 h-4 mr-2" /> Aprobar {selectedIds.length} Seleccionados
          </Button>
        )}
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-100 rounded-md flex items-center justify-center">
              <Clock className="w-4 h-4 text-slate-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">Registros de Asistencia</h2>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Shared filters */}
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

          <Tabs defaultValue="registros">
            <TabsList className="mb-2">
              <TabsTrigger value="registros">Registros</TabsTrigger>
              <TabsTrigger value="incidencias">Incidencias</TabsTrigger>
            </TabsList>

            {/* ── Registros tab ── */}
            <TabsContent value="registros" className="space-y-4">
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          onChange={toggleSelectAll}
                          checked={selectedIds.length > 0 && selectedIds.length === timeSheets.data.filter((i: any) => i.start?.status === 'pending').length}
                          className="w-4 h-4 rounded border-slate-300"
                        />
                      </TableHead>
                      <TableHead className="font-semibold">Empleado</TableHead>
                      <TableHead className="font-semibold">Incidencia / Tarea</TableHead>
                      <TableHead className="font-semibold">Inicio</TableHead>
                      <TableHead className="font-semibold">Fin</TableHead>
                      <TableHead className="font-semibold">Horas</TableHead>
                      <TableHead className="font-semibold">Estado</TableHead>
                      <TableHead className="font-semibold text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {timeSheets.loading ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-20"><RingLoading /></TableCell></TableRow>
                    ) : timeSheets.data.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center py-8 text-gray-500">No se encontraron registros</TableCell></TableRow>
                    ) : (
                      timeSheets.data.map((item: any) => (
                        <TableRow key={item.task_tracker_id} className={`hover:bg-gray-50 ${selectedIds.includes(item.task_tracker_id) ? 'bg-blue-50' : ''}`}>
                          <TableCell>
                            {item.start?.status === 'pending' && (
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(item.task_tracker_id)}
                                onChange={() => toggleSelect(item.task_tracker_id)}
                                className="w-4 h-4 rounded border-slate-300"
                              />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {item.employee.first_name} {item.employee.last_name || ''}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-800">{item.name}</span>
                              {item.incidence_category && (
                                <Badge variant="outline" className="w-fit text-[10px] py-0 px-1 mt-1 bg-slate-50">
                                  {item.incidence_category.name}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={item.start_time_modified ? "text-red-600 font-medium underline decoration-dotted" : ""}>
                              {item.start ? formatDateTime(item.start.time) : '—'}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className={item.end_time_modified ? "text-red-600 font-medium underline decoration-dotted" : ""}>
                              {item.end ? formatDateTime(item.end.time) : '—'}
                            </span>
                          </TableCell>
                          <TableCell>
                            {item.duration ? (item.duration / 3600).toFixed(2) + 'h' : '—'}
                          </TableCell>
                          <TableCell>{getStatusBadge(item.start?.status || 'pending')}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="outline" size="sm"
                                onClick={() => handleOpenEdit(item)}
                                className="rounded-md p-2"
                                disabled={item.start?.status === 'approved'}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline" size="sm"
                                    className="rounded-md p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                    disabled={item.start?.status === 'approved'}
                                  >
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
            </TabsContent>

            {/* ── Incidencias tab ── */}
            <TabsContent value="incidencias" className="space-y-4">
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="font-semibold">Tipo</TableHead>
                      <TableHead className="font-semibold">Descripción</TableHead>
                      <TableHead className="font-semibold">Inicio</TableHead>
                      <TableHead className="font-semibold">Fin</TableHead>
                      <TableHead className="font-semibold">Empleado(s)</TableHead>
                      <TableHead className="font-semibold">Remunerada</TableHead>
                      <TableHead className="font-semibold text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {incLoading ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-20"><RingLoading /></TableCell></TableRow>
                    ) : incidences.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">No se encontraron incidencias</TableCell></TableRow>
                    ) : (
                      incidences.map((inc: any) => {
                        const typeMeta = IncidenceType[inc.type as keyof typeof IncidenceType];
                        return (
                          <TableRow key={inc.id} className="hover:bg-gray-50">
                            <TableCell>
                              {typeMeta ? (
                                <Badge style={{ backgroundColor: typeMeta.bgHex, color: typeMeta.textHex }} className="border-0 font-medium">
                                  {typeMeta.label}
                                </Badge>
                              ) : (
                                <Badge variant="outline">{inc.type}</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-slate-700 max-w-[200px] truncate">{inc.description || '—'}</TableCell>
                            <TableCell>{inc.start_date ? formatDate(inc.start_date) : '—'}</TableCell>
                            <TableCell>{inc.end_date ? formatDate(inc.end_date) : '—'}</TableCell>
                            <TableCell>
                              {inc.is_global ? (
                                <Badge variant="outline" className="text-slate-600">Global</Badge>
                              ) : Array.isArray(inc.employees) && inc.employees.length > 0 ? (
                                <div className="flex flex-col gap-0.5">
                                  {inc.employees.slice(0, 2).map((e: any) => (
                                    <span key={e.id} className="text-sm text-slate-700">
                                      {e.first_name} {e.last_name || ''}
                                    </span>
                                  ))}
                                  {inc.employees.length > 2 && (
                                    <span className="text-xs text-slate-400">+{inc.employees.length - 2} más</span>
                                  )}
                                </div>
                              ) : (inc.employees_count ?? 0) > 0 ? (
                                <Badge variant="outline" className="text-slate-600">{inc.employees_count} empleado{inc.employees_count !== 1 ? 's' : ''}</Badge>
                              ) : '—'}
                            </TableCell>
                            <TableCell>
                              {inc.paid ? (
                                <Badge className="bg-green-100 text-green-800">Sí</Badge>
                              ) : (
                                <Badge className="bg-slate-100 text-slate-600">No</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline" size="sm"
                                    className="rounded-md p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-lg">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Eliminar incidencia?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Esta acción no se puede deshacer. Se eliminará la incidencia &quot;{inc.description}&quot;.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-md">Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDeleteIncidence(inc.id)}
                                      className="rounded-md bg-red-600 hover:bg-red-700"
                                    >
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {incTotalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious onClick={() => setIncPage(p => Math.max(1, p - 1))} className={incPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                    </PaginationItem>
                    {Array.from({ length: incTotalPages }, (_, i) => i + 1).map((p) => (
                      <PaginationItem key={p}>
                        <PaginationLink onClick={() => setIncPage(p)} isActive={p === incPage} className="cursor-pointer">{p}</PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext onClick={() => setIncPage(p => Math.min(incTotalPages, p + 1))} className={incPage === incTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <TimeSheetForm
        isOpen={showTimeSheetForm || !!editTarget}
        onClose={() => { setShowTimeSheetForm(false); setEditTarget(null); }}
        refetch={() => { handleGetTimeSheets(filters); handleGetIncidences(incPage); }}
        editTarget={editTarget}
        defaultTab={editTarget ? 'registro' : timeSheetFormDefaultTab}
      />
    </div>
  );
}
