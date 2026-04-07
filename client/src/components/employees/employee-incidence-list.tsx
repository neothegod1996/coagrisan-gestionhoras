"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Filter, X } from "lucide-react";
import { Incidence, IncidenceFilters, IncidenceShowEnum, IncidenceType, IncidenceTypeEnum } from "@/types/incidence";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { PaginatedRequestHandler } from "@/types";
import { getIncidences } from "@/services/incidence";
import RingLoading from "../loading/Ring";
import dayjs from "dayjs";
import es from 'dayjs/locale/es';
import { cn } from "@/lib/utils";

dayjs.locale(es);

interface EmployeeIncidenceListProps {
    employeeId: string;
    title?: string;
}

export default function EmployeeIncidenceList({ employeeId, title = "Historial de Incidencias" }: EmployeeIncidenceListProps) {
    const [incidences, setIncidences] = useState<PaginatedRequestHandler<Incidence>>({ data: [], loading: true, total_pages: 0, total: 0 });
    const [filters, setFilters] = useState<IncidenceFilters>({
        page: 1,
        employee_id: employeeId,
        show: IncidenceShowEnum.All,
        date: undefined,
        type: undefined
    });

    const handleGetIncidences = async (currentFilters: IncidenceFilters) => {
        setIncidences((prev) => ({ ...prev, loading: true }));
        getIncidences(currentFilters).then((response) => {
            const { data, total_pages, total } = response || {};
            setIncidences({ data: data || [], loading: false, total_pages: total_pages || 0, total: total || 0 });
        });
    }

    useEffect(() => {
        if (employeeId) {
            handleGetIncidences({ ...filters, employee_id: employeeId });
        }
    }, [filters, employeeId]);

    const handlePageChange = (page: number) => {
        setFilters((prev) => ({ ...prev, page }));
    };

    const handleFilterChange = (key: keyof IncidenceFilters, value: any) => {
        setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
    };

    return (
        <Card className="border border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-200 py-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-brand-primary" />
                        {title}
                    </CardTitle>
                    
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Filtro de Fecha */}
                        <div className="flex gap-1">
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className={cn(
                                            "h-9 justify-start text-left font-normal border-slate-300",
                                            !filters.date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarDays className="mr-2 h-4 w-4 text-slate-400" />
                                        {filters.date ? dayjs(filters.date).format("DD/MM/YYYY") : "Fecha"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                    <Calendar
                                        mode="single"
                                        selected={filters.date ? dayjs(filters.date).toDate() : undefined}
                                        onSelect={(date) => handleFilterChange("date", date ? dayjs(date).format("YYYY-MM-DD") : undefined)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            {filters.date && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleFilterChange("date", undefined)}
                                    className="h-9 px-2 text-slate-400 hover:text-slate-600"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        {/* Filtro de Tipo */}
                        <Select
                            value={filters.type || "all"}
                            onValueChange={(value) =>
                                handleFilterChange("type", value === "all" ? undefined : value as IncidenceTypeEnum)
                            }
                        >
                            <SelectTrigger className="w-[160px] h-9 border-slate-300 text-sm">
                                <SelectValue placeholder="Tipo" />
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
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                                <TableHead className="w-[180px] font-semibold text-slate-700">Tipo</TableHead>
                                <TableHead className="font-semibold text-slate-700">Descripción</TableHead>
                                <TableHead className="w-[220px] font-semibold text-slate-700">Periodo</TableHead>
                                <TableHead className="w-[100px] font-semibold text-slate-700">Pago</TableHead>
                                <TableHead className="w-[120px] font-semibold text-slate-700">Duración</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {incidences.loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-16">
                                        <RingLoading />
                                    </TableCell>
                                </TableRow>
                            ) : incidences.data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-12 text-slate-500 italic">
                                        No se encontraron incidencias registradas
                                    </TableCell>
                                </TableRow>
                            ) : (
                                incidences.data.map((incidence) => {
                                    const typeInfo = IncidenceType[incidence.type] || IncidenceType[IncidenceTypeEnum.Other];
                                    const isMultiDay = dayjs(incidence.end_date).diff(dayjs(incidence.start_date), 'day') > 0;
                                    
                                    return (
                                        <TableRow key={incidence.id} className="hover:bg-slate-50/50 transition-colors">
                                            <TableCell>
                                                <Badge 
                                                    className="font-medium shadow-none border-0"
                                                    style={{ backgroundColor: typeInfo.bgHex, color: typeInfo.textHex }}
                                                >
                                                    {typeInfo.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-slate-700">{incidence.description || "-"}</span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-sm">
                                                    <div className="font-medium text-slate-800">
                                                        {dayjs(incidence.start_date).format("DD MMM YYYY")}
                                                        {isMultiDay && ` - ${dayjs(incidence.end_date).format("DD MMM YYYY")}`}
                                                    </div>
                                                    {!incidence.all_day && (
                                                        <div className="text-slate-500 text-xs mt-0.5">
                                                            {dayjs(incidence.start_date).format("HH:mm")} - {dayjs(incidence.end_date).format("HH:mm")}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={incidence.paid ? "outline" : "secondary"} className={cn(
                                                    "shadow-none",
                                                    incidence.paid ? "border-green-200 bg-green-50 text-green-700" : "border-slate-200 bg-slate-50 text-slate-600"
                                                )}>
                                                    {incidence.paid ? "Paga" : "No paga"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <span className="text-slate-600 font-medium whitespace-nowrap">
                                                    {incidence.duration_hours ? `${incidence.duration_hours}h` : "-"}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>

                {incidences.total_pages > 1 && (
                    <div className="px-4 py-4 border-t border-slate-100 bg-slate-50/30">
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => handlePageChange(Math.max(1, (filters.page || 1) - 1))}
                                        className={(filters.page || 1) === 1 ? "pointer-events-none opacity-50" : "cursor-pointer h-8 text-xs"}
                                    />
                                </PaginationItem>

                                {Array.from({ length: incidences.total_pages }, (_, i) => i + 1).map((page) => (
                                    <PaginationItem key={page}>
                                        <PaginationLink
                                            onClick={() => handlePageChange(page)}
                                            isActive={page === (filters.page || 1)}
                                            className="cursor-pointer h-8 w-8 text-xs"
                                        >
                                            {page}
                                        </PaginationLink>
                                    </PaginationItem>
                                ))}

                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() => handlePageChange(Math.min(incidences.total_pages, (filters.page || 1) + 1))}
                                        className={(filters.page || 1) === incidences.total_pages ? "pointer-events-none opacity-50" : "cursor-pointer h-8 text-xs"}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
