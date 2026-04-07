"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Edit, Trash2, CalendarDays, ArrowLeft, X } from "lucide-react";
import { Incidence, IncidenceFilters, IncidenceShowEnum, IncidenceType, IncidenceTypeEnum } from "@/types/incidence";
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
import { Calendar } from "@/components/ui/calendar";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { redirect } from "next/navigation";
import { PaginatedRequestHandler } from "@/types";
import { deleteIncidence, getIncidences } from "@/services/incidence";
import { getEmployees } from "@/services/employee";
import { useAuthStore } from "@/store/useAuthStore";
import { AuthRoleEnum } from "@/types/auth";
import { Employee } from "@/types/employee";
import RingLoading from "../loading/Ring";
import IncidenceForm from "./incidence-form";
import dayjs from "dayjs";
import es from 'dayjs/locale/es';
import { cn } from "@/lib/utils";

dayjs.locale(es);

interface Props {

}
export default function IncidenceList({ }: Props) {
    const [incidences, setIncidences] = useState<PaginatedRequestHandler<Incidence>>({ data: [], loading: true, total_pages: 0, total: 0 });
    const [search, setSearch] = useState<string>("");
    const [employeeList, setEmployeeList] = useState<Employee[]>([]);
    const { user } = useAuthStore();
    const isAdminOrManager = user?.role === AuthRoleEnum.Admin || user?.role === AuthRoleEnum.Manager;

    const [filters, setFilters] = useState<IncidenceFilters>({
        page: 1,
        search,
        show: IncidenceShowEnum.All,
        date: undefined,
        type: undefined,
        employee_id: undefined
    });

    useEffect(() => {
        if (isAdminOrManager) {
            getEmployees({ page: 1, limit: 1000, search: "" }).then(res => {
                if (res?.data) setEmployeeList(res.data);
            });
        }
    }, [isAdminOrManager]);

    const handleGetIncidences = async (filters: IncidenceFilters) => {
        setIncidences({ ...incidences, loading: true });
        getIncidences(filters).then((response) => {
            const { data, total_pages, total } = response || {};
            setIncidences({ data: data || [], loading: false, total_pages: total_pages || 0, total: total || 0 });
        });
    }

    useEffect(() => {
        handleGetIncidences(filters);
    }, [filters])

    const handleDeleteIncidence = (id: string) => {
        deleteIncidence(id).then(() => {
            handleGetIncidences(filters);
        });
    }

    const handlePageChange = (page: number) => {
        setFilters((prev) => ({ ...prev, page }));
    };
    const handleFilterChange = (key: keyof IncidenceFilters, value: string | boolean | undefined) => {
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
        incidence_id: string | null;
    }>({
        isOpen: false,
        type: "create",
        incidence_id: null,
    });
    return (
        <div className="space-y-6">
            {/* Header Corporativo */}
            <div className="bg-gradient-brand rounded-md p-8 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand-primary rounded-md flex items-center justify-center">
                            <CalendarDays className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold">Gestión de Incidencias</h1>
                            <p className="text-slate-200 mt-1">
                                Administra las incidencias del calendario
                                {filters.date && (
                                    <span className="block text-sm mt-1 opacity-90">
                                        Mostrando incidencias del {dayjs(filters.date).format("DD [de] MMMM, YYYY")}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setShowForm({ isOpen: true, type: "create", incidence_id: null })}
                        className="px-6 py-3 h-11 font-medium bg-brand-primary hover:bg-brand-primary-600 text-white border-0"
                    >
                        <Plus className="w-4 h-4 mr-2" />
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
                            <CalendarDays className="w-4 h-4 text-slate-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-800">
                            Lista de Incidencias
                            {filters.date && (
                                <span className="text-sm font-normal text-slate-500 ml-2">
                                    - {dayjs(filters.date).format("DD/MM/YYYY")}
                                </span>
                            )}
                        </h2>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Barra de búsqueda y filtros */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                <Input
                                    placeholder="Buscar por descripción"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="min-w-72 w-fit pl-10 h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                                />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="flex gap-2">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "flex-1 h-10 justify-start text-left font-normal border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary",
                                                    !filters.date && "text-muted-foreground"
                                                )}
                                            >
                                                <CalendarDays className="mr-2 h-4 w-4" />
                                                {filters.date ? dayjs(filters.date).format("DD/MM/YYYY") : "Todas las fechas"}
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <div className="p-3 border-b">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium">Seleccionar fecha</span>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleFilterChange("date", undefined)}
                                                        className="h-6 px-2 text-xs"
                                                    >
                                                        Todas
                                                    </Button>
                                                </div>
                                                <Calendar
                                                    mode="single"
                                                    selected={filters.date ? dayjs(filters.date).toDate() : undefined}
                                                    onSelect={(date) => handleFilterChange("date", date ? dayjs(date).format("YYYY-MM-DD") : undefined)}
                                                    initialFocus
                                                />
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                    {filters.date && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleFilterChange("date", undefined)}
                                            className="h-10 px-3 text-slate-500 hover:text-slate-700"
                                            title="Ver todas las fechas"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                                <Select
                                    value={filters.type || "all"}
                                    onValueChange={(value) =>
                                        handleFilterChange("type", value === "all" ? undefined : value as IncidenceTypeEnum)
                                    }
                                >
                                    <SelectTrigger className="w-full h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary">
                                        <SelectValue placeholder="Tipo de incidencia" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los tipos</SelectItem>
                                        {Object.entries(IncidenceType).map(([key, type]) => (
                                            <SelectItem key={key} value={key}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <Select
                                    value={filters.show || "all"}
                                    onValueChange={(value) => handleFilterChange("show", value === "all" ? undefined : value as IncidenceShowEnum)}
                                >
                                    <SelectTrigger className="w-full h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary">
                                        <SelectValue placeholder="Mostrar" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={IncidenceShowEnum.All}>Anteriores y próximas</SelectItem>
                                        <SelectItem value={IncidenceShowEnum.Upcoming}>Próximas</SelectItem>
                                    </SelectContent>
                                </Select>
                                {isAdminOrManager && (
                                    <Select
                                        value={filters.employee_id || "all"}
                                        onValueChange={(value) => handleFilterChange("employee_id", value === "all" ? undefined : value)}
                                    >
                                        <SelectTrigger className="w-full h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary">
                                            <SelectValue placeholder="Empleado" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos los empleados</SelectItem>
                                            {employeeList.map((emp) => (
                                                <SelectItem key={emp.id} value={emp.id}>
                                                    {emp.first_name} {emp.last_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tabla de incidencias */}
                    <div className="rounded-md border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead className="font-semibold">Tipo</TableHead>
                                    <TableHead className="font-semibold">Descripción</TableHead>
                                    <TableHead className="font-semibold">Fecha</TableHead>
                                    <TableHead className="font-semibold">Pago</TableHead>
                                    <TableHead className="font-semibold">Estado</TableHead>
                                    <TableHead className="font-semibold">Empleados</TableHead>
                                    <TableHead className="font-semibold">Categorías</TableHead>
                                    <TableHead className="font-semibold text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {incidences.loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-20 text-gray-500">
                                            <RingLoading />
                                        </TableCell>
                                    </TableRow>
                                ) : incidences.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                                            No se encontraron incidencias
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    incidences.data.map((incidence) => (
                                        <TableRow key={incidence.id} className="hover:bg-gray-50">
                                            <TableCell>
                                                <Badge className={'bg-brand-primary-100 text-brand-primary'}>
                                                    {IncidenceType[incidence.type].label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{incidence.description}</span>
                                                    {incidence.paid !== undefined && (
                                                        <span className="text-xs text-gray-500">
                                                            {incidence.paid ? 'Pago' : 'No pago'}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    {dayjs(incidence.end_date).diff(dayjs(incidence.start_date), 'day') > 0 ? (
                                                        <div>
                                                            <div>{dayjs(incidence.start_date).format("DD MMM YYYY")} - {dayjs(incidence.end_date).format("DD MMM YYYY")}</div>
                                                            <div className={'text-gray-500'}>{!incidence.all_day ? <div>{dayjs(incidence.start_date).format("HH:mm")} - {dayjs(incidence.end_date).format("HH:mm")}</div> : 'Todo el día'}</div>
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            <div>{dayjs(incidence.start_date).format("DD MMM YYYY")}</div>
                                                            <div className={'text-gray-500'}>{!incidence.all_day ? <div>{dayjs(incidence.start_date).format("HH:mm")} - {dayjs(incidence.end_date).format("HH:mm")}</div> : 'Todo el día'}</div>
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div
                                                    className={`${incidence.paid ? "text-brand-primary" : "text-red-400"}`}
                                                >
                                                    {incidence.paid ? "Si" : "No"}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={`${incidence.is_global ? "bg-brand-primary-100 text-brand-primary" : "bg-gray-100 text-gray-800"}`}
                                                >
                                                    {incidence.is_global ? "Global" : "Específica"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {incidence.is_global ? (
                                                    <span className="text-slate-500 italic text-sm">Todos</span>
                                                ) : (
                                                    <div className="flex flex-wrap gap-1">
                                                        {incidence.employees && incidence.employees.length > 0 ? (
                                                            incidence.employees.map(e => (
                                                                <Badge key={e.id} variant="secondary" className="font-normal text-xs">
                                                                    {e.first_name} {e.last_name}
                                                                </Badge>
                                                            ))
                                                        ) : (
                                                            <span className="text-slate-400">-</span>
                                                        )}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {incidence.is_global ? (
                                                    <span className="text-slate-500 italic text-sm">Todas</span>
                                                ) : (
                                                    <div className="flex flex-wrap gap-1">
                                                        {incidence.profiles && incidence.profiles.length > 0 ? (
                                                            incidence.profiles.map(p => (
                                                                <Badge key={p.id} variant="outline" className="font-normal text-xs">
                                                                    {p.name}
                                                                </Badge>
                                                            ))
                                                        ) : (
                                                            <span className="text-slate-400">-</span>
                                                        )}
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setShowForm({ isOpen: true, type: "edit", incidence_id: incidence.id })}
                                                        className="rounded-md p-2"
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </Button>
                                                    <AlertDialog>
                                                        <AlertDialogTrigger asChild>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="rounded-md p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        </AlertDialogTrigger>
                                                        <AlertDialogContent className="rounded-lg">
                                                            <AlertDialogHeader>
                                                                <AlertDialogTitle>¿Eliminar incidencia?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Esta acción no se puede deshacer. Se eliminará permanentemente
                                                                    la incidencia {incidence.description} y todos sus datos asociados.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel className="rounded-md">
                                                                    Cancelar
                                                                </AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDeleteIncidence(incidence.id)}
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

                    {incidences.total_pages > 1 && (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() => handlePageChange(Math.max(1, (filters.page || 1) - 1))}
                                            className={(filters.page || 1) === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                        />
                                    </PaginationItem>

                                    {Array.from({ length: incidences.total_pages }, (_, i) => i + 1).map((page) => (
                                        <PaginationItem key={page}>
                                            <PaginationLink
                                                onClick={() => handlePageChange(page)}
                                                isActive={page === (filters.page || 1)}
                                                className="cursor-pointer"
                                            >
                                                {page}
                                            </PaginationLink>
                                        </PaginationItem>
                                    ))}

                                    <PaginationItem>
                                        <PaginationNext
                                            onClick={() => handlePageChange(Math.min(incidences.total_pages, (filters.page || 1) + 1))}
                                            className={(filters.page || 1) === incidences.total_pages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </CardContent>
            </Card>

            <IncidenceForm
                isOpen={showForm.isOpen}
                incidence_id={showForm.incidence_id}
                onClose={() => setShowForm({ isOpen: false, type: "create", incidence_id: null })}
                refetch={() => handleGetIncidences(filters)}
            />
        </div>
    );
}