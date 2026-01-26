"use client";

import { useEffect, useState } from "react";
import { Clock, ArrowLeft } from "lucide-react";
import { TimeSheet, TimeSheetFilters } from "@/types/time-sheet";
import { Button } from "@/components/ui/button";
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
import { redirect } from "next/navigation";
import { PaginatedRequestHandler } from "@/types";
import { getTimeSheets } from "@/services/time-sheet";
import RingLoading from "../loading/Ring";

interface Props {

}
export default function TimeSheetList({ }: Props) {
    const [timeSheets, setTimeSheets] = useState<PaginatedRequestHandler<TimeSheet>>({ data: [], loading: true, total_pages: 0, total: 0 });
    const [filters, setFilters] = useState<TimeSheetFilters>({
        page: 1
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

    const handlePageChange = (page: number) => {
        setFilters((prev) => ({ ...prev, page }));
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
    }

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
                    {/* Tabla de registros */}
                    <div className="rounded-md border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead className="font-semibold">Empleado</TableHead>
                                    <TableHead className="font-semibold">Fecha y Hora</TableHead>
                                    <TableHead className="font-semibold">Terminal</TableHead>
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
        </div>
    );
}
