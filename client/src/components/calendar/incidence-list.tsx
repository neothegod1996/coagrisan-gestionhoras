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
import IncidenceCategoryForm from "./incidence-category-form";
import { getIncidenceCategories, deleteIncidenceCategory } from "@/services/incidence-category";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import dayjs from "dayjs";
import "dayjs/locale/es";

dayjs.locale("es");

interface Props {

}
export default function IncidenceCategoryList() {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState<string>("");

    const handleGetCategories = async () => {
        setLoading(true);
        const res = await getIncidenceCategories();
        if (res.success) {
            setCategories(res.data);
        }
        setLoading(false);
    }

    useEffect(() => {
        handleGetCategories();
    }, []);

    const handleDelete = async (id: string) => {
        const res = await deleteIncidenceCategory(id);
        if (res.success) {
            toast.success("Categoría eliminada");
            handleGetCategories();
        } else {
            toast.error("Error al eliminar");
        }
    }

    const [showForm, setShowForm] = useState<{
        isOpen: boolean;
        category_id: string | null;
    }>({
        isOpen: false,
        category_id: null,
    });

    const filteredCategories = categories.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) || 
        (c.code && c.code.toLowerCase().includes(search.toLowerCase()))
    );
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
                            <h1 className="text-2xl font-semibold">Maestro de Incidencias</h1>
                            <p className="text-slate-200 mt-1">
                                Configura los tipos de incidencia globales y su comportamiento (pago/no pago)
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => setShowForm({ isOpen: true, category_id: null })}
                        className="px-6 py-3 h-11 font-medium bg-brand-primary hover:bg-brand-primary-600 text-white border-0"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Categoría
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
                            Maestro de Categorías de Incidencia
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
                                    placeholder="Buscar por nombre o código"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="min-w-72 w-fit pl-10 h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tabla de incidencias */}
                    <div className="rounded-md border overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50">
                                    <TableHead className="font-semibold">Nombre</TableHead>
                                    <TableHead className="font-semibold">Código</TableHead>
                                    <TableHead className="font-semibold">¿Es paga?</TableHead>
                                    <TableHead className="font-semibold text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-20 text-gray-500">
                                            <RingLoading />
                                        </TableCell>
                                    </TableRow>
                                ) : filteredCategories.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                            No se encontraron categorías
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredCategories.map((category) => (
                                        <TableRow key={category.id} className="hover:bg-gray-50">
                                            <TableCell className="font-medium">{category.name}</TableCell>
                                            <TableCell>{category.code || '-'}</TableCell>
                                            <TableCell>
                                                <Badge className={category.paid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                                    {category.paid ? 'Sí' : 'No'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setShowForm({ isOpen: true, category_id: category.id })}
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
                                                                <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
                                                                <AlertDialogDescription>
                                                                    Esta acción no se puede deshacer. Si hay registros que usan esta categoría, es posible que no se pueda eliminar.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel className="rounded-md">
                                                                    Cancelar
                                                                </AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDelete(category.id)}
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
                </CardContent>
            </Card>

            <IncidenceCategoryForm
                isOpen={showForm.isOpen}
                category_id={showForm.category_id}
                onClose={() => setShowForm({ isOpen: false, category_id: null })}
                refetch={handleGetCategories}
            />
        </div>
    );
}