"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Edit, Trash2, Filter, Clock, ArrowLeft, Clock3, Clock9 } from "lucide-react";
import { Days, Schedule, ScheduleFilters, ShiftType, ShiftTypeEnum } from "@/types/schedule";
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
import { redirect } from "next/navigation";
import { PaginatedRequestHandler } from "@/types";
import { getSchedules, deleteSchedule } from "@/services/schedule";
import dayjs from "dayjs";
import ScheduleForm from "./schedule-form";
import RingLoading from "../loading/Ring";

interface Props {

}

export default function SchedulesList({ }: Props) {
  const [schedules, setSchedules] = useState<PaginatedRequestHandler<Schedule>>({ data: [], loading: true, total_pages: 0, total: 0 });
  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<ScheduleFilters>({
    page: 1,
    search,
    status: undefined,
    shift_type: undefined
  });

  const handleGetSchedules = async (filters: ScheduleFilters) => {
    setSchedules({ ...schedules, loading: true });
    getSchedules(filters).then((response) => {
      const { data, total_pages, total } = response || {};
      setSchedules({ data: data || [], loading: false, total_pages: total_pages || 0, total: total || 0 });
    });
  }

  useEffect(() => {
    handleGetSchedules(filters);
  }, [filters])

  const handleDeleteSchedule = (id: string) => {
    deleteSchedule(id).then(() => {
      handleGetSchedules(filters);
    });
  }

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };
  const handleFilterChange = (key: keyof ScheduleFilters, value: string | boolean | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search, page: 1 }));
    }, 500);
    return () => clearTimeout(timeout);
  }, [search])

  const [showForm, setShowForm] = useState<{
    isOpen: boolean;
    type: "create" | "edit";
    schedule_id: string | null;
  }>({
    isOpen: false,
    type: "create",
    schedule_id: null,
  });

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
              <h1 className="text-2xl font-semibold">Gestión de Horarios</h1>
              <p className="text-slate-200 mt-1">Administra los horarios de trabajo por sectores</p>
            </div>
          </div>
          <Button
            onClick={() => setShowForm({ isOpen: true, type: "create", schedule_id: null })}
            className="px-6 py-3 h-11 font-medium bg-brand-primary hover:bg-brand-primary-600 text-white border-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Horario
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
            <h2 className="text-lg font-semibold text-slate-800">Lista de Horarios</h2>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Barra de búsqueda y filtros */}
          <div className="space-y-4">

            <div className="flex items-center justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre o descripción"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="min-w-70 w-fit pl-10 h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
              </div>
              <div className={'grid grid-cols-1 gap-4'}>
                <Select
                  value={filters.shift_type}
                  onValueChange={(value) =>
                    handleFilterChange("shift_type", value === "all" ? undefined : value)
                  }
                >
                  <SelectTrigger className="w-full h-10">
                    <SelectValue placeholder="Todos los turnos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={'all'}>Todos los turnos</SelectItem>
                    <SelectItem value={ShiftTypeEnum.Morning}>Mañana</SelectItem>
                    <SelectItem value={ShiftTypeEnum.Afternoon}>Tarde</SelectItem>
                    <SelectItem value={ShiftTypeEnum.Night}>Noche</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Tabla de horarios */}
          <div className="rounded-md border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-medium text-slate-700">Nombre</TableHead>
                  <TableHead className="font-medium text-slate-700">Tipo Turno</TableHead>
                  <TableHead className="font-medium text-slate-700">Horario</TableHead>
                  <TableHead className="font-medium text-slate-700">Días</TableHead>
                  <TableHead className="font-medium text-slate-700 text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedules.loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-20 text-gray-500">
                      <RingLoading />
                    </TableCell>
                  </TableRow>
                ) : schedules.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No se encontraron horarios
                    </TableCell>
                  </TableRow>
                ) : schedules.data.map((schedule) => (
                  <TableRow key={schedule.id} className="hover:bg-slate-50">
                    <TableCell>
                      <div>
                        <div className="font-medium text-slate-900">
                          {schedule.name}
                        </div>
                        {schedule.description && (
                          <div className="text-sm text-slate-500">
                            {schedule.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {schedule.sessions.map((session) => (
                          <Badge key={session.id} className={ShiftType[session.shift_type]?.color}>
                            {ShiftType[session.shift_type]?.label}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className={'flex flex-col justify-center gap-1 h-full'}>
                      {schedule.sessions.map(s => (
                        <div key={s.id} className="flex items-center gap-2">
                          <Clock9 className="w-4 h-4 text-slate-400" />
                          <div className={'flex flex-col gap-1 text-sm font-mono'}>
                            <span>
                              {dayjs(s.start_time).format("HH:mm")} - {dayjs(s.end_time).format("HH:mm")}
                            </span>
                          </div>
                        </div>
                      ))}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {schedule.days.map((day) => Days[day]?.label).join(", ")}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowForm({ isOpen: true, type: "edit", schedule_id: schedule.id })}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Esto eliminará permanentemente el horario
                                &quot;{schedule.name}&quot;.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteSchedule(schedule.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Paginación */}
          {schedules.total_pages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(Math.max(1, filters.page - 1))}
                      className={filters.page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from({ length: schedules.total_pages }, (_, i) => i + 1).map((page) => (
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
                      onClick={() => handlePageChange(Math.min(schedules.total_pages, filters.page + 1))}
                      className={filters.page === schedules.total_pages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      <ScheduleForm
        isOpen={showForm.isOpen}
        onClose={() => setShowForm({ isOpen: false, type: "create", schedule_id: null })}
        schedule_id={showForm.schedule_id}
        refetch={() => handleGetSchedules(filters)}
      />
    </div>
  );
}