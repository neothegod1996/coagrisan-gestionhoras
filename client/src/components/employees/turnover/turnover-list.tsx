"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Edit, Trash2, CalendarDays, ArrowLeft, X, Users } from "lucide-react";
import { EmployeeTurnover, TurnoverFilters, TurnoverType, TurnoverTypeEnum } from "@/types/employee-turnover";
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
import { deleteTurnover, getTurnovers } from "@/services/turnover";
import RingLoading from "../../loading/Ring";
import TurnoverForm from "./turnover-form";
import dayjs from "dayjs";
import es from 'dayjs/locale/es';
import { cn } from "@/lib/utils";

dayjs.locale(es);

interface Props {

}
export default function TurnoverList({ }: Props) {
    const [turnovers, setTurnovers] = useState<PaginatedRequestHandler<EmployeeTurnover>>({ data: [], loading: true, total_pages: 0, total: 0 });
    const [search, setSearch] = useState<string>("");
    const [filters, setFilters] = useState<TurnoverFilters>({
        page: 1,
        search,
        date: undefined,
        type: undefined
    });

    const handleGetTurnovers = async (filters: TurnoverFilters) => {
        setTurnovers({ ...turnovers, loading: true });
        getTurnovers(filters).then((response) => {
            const { data, total_pages, total } = response || {};
            setTurnovers({ data: data || [], loading: false, total_pages: total_pages || 0, total: total || 0 });
        });
    }

    useEffect(() => {
        handleGetTurnovers(filters);
    }, [filters])

    const handleDeleteTurnover = (id: string) => {
        deleteTurnover(id).then(() => {
            handleGetTurnovers(filters);
        });
    }

    const handlePageChange = (page: number) => {
        setFilters((prev) => ({ ...prev, page }));
    };
    const handleFilterChange = (key: keyof TurnoverFilters, value: string | boolean | undefined) => {
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
        turnover_id: string | null;
    }>({
        isOpen: false,
        type: "create",
        turnover_id: null,
    });
    return (
        <div className="space-y-6">
            {/* Header Corporativo */}
            <div className="bg-gradient-brand rounded-md p-8 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand-primary rounded-md flex items-center justify-center">
                            <Users className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold">Gestión de Altas y Bajas</h1>
                            <p className="text-slate-200 mt-1">
                                Administra los registros de altas y bajas de empleados
                                {filters.date && (
                                    <span className="block text-sm mt-1 opacity-90">
                                        Mostrando registros del {dayjs(filters.date).format("DD [de] MMMM, YYYY")}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setShowForm({ isOpen: true, type: "create", turnover_id: null })}
                        className="px-6 py-3 h-11 font-medium bg-brand-primary hover:bg-brand-primary-600 text-white border-0"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo Registro
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
                            <Users className="w-4 h-4 text-slate-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-800">
                            Lista de Altas y Bajas
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
                                    placeholder="Buscar por id, nombre, dni o tarjeta de empleado"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="min-w-96 w-fit pl-10 h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
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
                                        handleFilterChange("type", value === "all" ? undefined : value as TurnoverTypeEnum)
                                    }
                                >
                                    <SelectTrigger className="w-full h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary">
                                        <SelectValue placeholder="Tipo de registro" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los tipos</SelectItem>
                                        {Object.entries(TurnoverType).map(([key, type]) => (
                                            <SelectItem key={key} value={key}>
                                                {type.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Tabla de registros */}
                    <div className="rounded-md border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead className="font-semibold">Tipo</TableHead>
                                    <TableHead className="font-semibold">Empleado</TableHead>
                                    <TableHead className="font-semibold">Fecha</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {turnovers.loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-20 text-gray-500">
                                            <RingLoading />
                                        </TableCell>
                                    </TableRow>
                                ) : turnovers.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                            No se encontraron registros
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    turnovers.data.map((turnover) => (
                                        <TableRow key={turnover.id} className="hover:bg-gray-50">
                                            <TableCell>
                                                <Badge className={TurnoverType[turnover.type].color}>
                                                    {TurnoverType[turnover.type].label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">
                                                        {turnover.employee.first_name} {turnover.employee.last_name}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <div>{dayjs(turnover.date).format("DD MMM YYYY")}</div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {turnovers.total_pages > 1 && (
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <Pagination>
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            onClick={() => handlePageChange(Math.max(1, (filters.page || 1) - 1))}
                                            className={(filters.page || 1) === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                        />
                                    </PaginationItem>

                                    {Array.from({ length: turnovers.total_pages }, (_, i) => i + 1).map((page) => (
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
                                            onClick={() => handlePageChange(Math.min(turnovers.total_pages, (filters.page || 1) + 1))}
                                            className={(filters.page || 1) === turnovers.total_pages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    )}
                </CardContent>
            </Card>

            <TurnoverForm
                isOpen={showForm.isOpen}
                turnover_id={showForm.turnover_id}
                onClose={() => setShowForm({ isOpen: false, type: "create", turnover_id: null })}
                refetch={() => handleGetTurnovers(filters)}
            />
        </div>
    );
}
