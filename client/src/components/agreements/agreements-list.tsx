'use client';

import { useState, useEffect } from 'react';
import { getAgreements, deleteAgreement } from '@/services/agreement';
import { Agreement } from '@/types/agreement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
} from '@/components/ui/alert-dialog';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from '@/components/ui/pagination';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Calendar as CalendarIcon, Search, FileText, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { AgreementForm } from './agreement-form';
import { HolidayManager } from './holiday-manager';
import RingLoading from '../loading/Ring';
import { redirect } from 'next/navigation';

export function AgreementsList() {
    const [agreements, setAgreements] = useState<{ data: Agreement[]; total_pages: number; total: number; loading: boolean }>({
        data: [],
        total_pages: 0,
        total: 0,
        loading: true,
    });
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [openAdd, setOpenAdd] = useState(false);
    const [selectedAgreement, setSelectedAgreement] = useState<Agreement | null>(null);
    const [openHolidays, setOpenHolidays] = useState(false);

    const loadAgreements = async (currentPage = page, currentSearch = search) => {
        setAgreements(prev => ({ ...prev, loading: true }));
        const response = await getAgreements({ page: currentPage, limit: 10, search: currentSearch });
        setAgreements({
            data: response?.data || [],
            total_pages: response?.total_pages || 0,
            total: response?.total || 0,
            loading: false,
        });
    };

    useEffect(() => {
        const timeout = setTimeout(() => {
            setPage(1);
            loadAgreements(1, search);
        }, 500);
        return () => clearTimeout(timeout);
    }, [search]);

    useEffect(() => {
        loadAgreements(page, search);
    }, [page]);

    const handleDelete = async (id: string) => {
        const success = await deleteAgreement(id);
        if (success) {
            toast.success('Convenio eliminado correctamente.');
            loadAgreements();
        } else {
            toast.error('No se pudo eliminar el convenio.');
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-brand rounded-md p-8 text-white">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand-primary rounded-md flex items-center justify-center">
                            <FileText className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold">Gestión de Convenios</h1>
                            <p className="text-slate-200 mt-1">Administra los convenios laborales y sus festivos</p>
                        </div>
                    </div>
                    <Button
                        onClick={() => { setSelectedAgreement(null); setOpenAdd(true); }}
                        className="px-6 py-3 h-11 font-medium bg-brand-primary hover:bg-brand-primary-600 text-white border-0"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo Convenio
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
                            <FileText className="w-4 h-4 text-slate-600" />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-800">Lista de Convenios</h2>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Búsqueda */}
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <Input
                            placeholder="Buscar por nombre..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-10 h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                        />
                    </div>

                    {/* Tabla */}
                    <div className="rounded-md border border-slate-200 overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-slate-50">
                                    <TableHead className="font-medium text-slate-700">Nombre</TableHead>
                                    <TableHead className="font-medium text-slate-700">Descripción</TableHead>
                                    <TableHead className="font-medium text-slate-700">Fines de Semana</TableHead>
                                    <TableHead className="font-medium text-slate-700">Trabajadores</TableHead>
                                    <TableHead className="font-medium text-slate-700">Festivos</TableHead>
                                    <TableHead className="font-medium text-slate-700 text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {agreements.loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-20">
                                            <RingLoading />
                                        </TableCell>
                                    </TableRow>
                                ) : agreements.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                            No se encontraron convenios
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    agreements.data.map((agreement) => (
                                        <TableRow key={agreement.id} className="hover:bg-slate-50">
                                            <TableCell>
                                                <div className="font-medium text-slate-900">{agreement.name}</div>
                                            </TableCell>
                                            <TableCell className="text-slate-500 text-sm">
                                                {agreement.description || '-'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex gap-1">
                                                    {agreement.saturday_is_holiday && (
                                                        <Badge variant="secondary">Sáb</Badge>
                                                    )}
                                                    {agreement.sunday_is_holiday && (
                                                        <Badge variant="secondary">Dom</Badge>
                                                    )}
                                                    {!agreement.saturday_is_holiday && !agreement.sunday_is_holiday && (
                                                        <span className="text-muted-foreground text-xs">Laborables</span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-slate-700">
                                                {agreement._count?.employees || 0}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="gap-1 text-slate-600 hover:text-slate-900"
                                                    onClick={() => { setSelectedAgreement(agreement); setOpenHolidays(true); }}
                                                >
                                                    <CalendarIcon className="h-4 w-4" />
                                                    {agreement._count?.holidays || 0}
                                                </Button>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => { setSelectedAgreement(agreement); setOpenAdd(true); }}
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
                                                                    Esta acción eliminará permanentemente el convenio &quot;{agreement.name}&quot; y todos sus festivos asociados.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    onClick={() => handleDelete(agreement.id)}
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
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Paginación */}
                    {agreements.total_pages > 1 && (
                        <Pagination>
                            <PaginationContent>
                                <PaginationItem>
                                    <PaginationPrevious
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        className={page === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                    />
                                </PaginationItem>
                                {Array.from({ length: agreements.total_pages }, (_, i) => i + 1).map((p) => (
                                    <PaginationItem key={p}>
                                        <PaginationLink
                                            onClick={() => setPage(p)}
                                            isActive={p === page}
                                            className="cursor-pointer"
                                        >
                                            {p}
                                        </PaginationLink>
                                    </PaginationItem>
                                ))}
                                <PaginationItem>
                                    <PaginationNext
                                        onClick={() => setPage(p => Math.min(agreements.total_pages, p + 1))}
                                        className={page === agreements.total_pages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                    />
                                </PaginationItem>
                            </PaginationContent>
                        </Pagination>
                    )}
                </CardContent>
            </Card>

            {/* Dialog Crear/Editar */}
            <Dialog open={openAdd} onOpenChange={setOpenAdd}>
                <DialogContent className={selectedAgreement ? "sm:max-w-[700px]" : "sm:max-w-[500px]"}>
                    <DialogHeader>
                        <DialogTitle>{selectedAgreement ? 'Editar Convenio' : 'Nuevo Convenio'}</DialogTitle>
                        <DialogDescription>
                            Define las reglas básicas del convenio y el comportamiento de los fines de semana.
                        </DialogDescription>
                    </DialogHeader>
                    <AgreementForm
                        agreement={selectedAgreement}
                        onSuccess={() => { setOpenAdd(false); loadAgreements(); }}
                        onCancel={() => setOpenAdd(false)}
                    />
                </DialogContent>
            </Dialog>

            {/* Dialog Festivos */}
            <Dialog open={openHolidays} onOpenChange={setOpenHolidays}>
                <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle>Festivos — {selectedAgreement?.name}</DialogTitle>
                        <DialogDescription>
                            Añade fechas específicas que serán consideradas festivas para este convenio.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedAgreement && (
                        <HolidayManager
                            agreementId={selectedAgreement.id}
                            onUpdate={loadAgreements}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
