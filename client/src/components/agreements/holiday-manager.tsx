'use client';

import { useState, useEffect } from 'react';
import { getAgreement, addHoliday, deleteHoliday } from '@/services/agreement';
import { AgreementHoliday } from '@/types/agreement';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Trash, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface HolidayManagerProps {
    agreementId: string;
    onUpdate: () => void;
}

export function HolidayManager({ agreementId, onUpdate }: HolidayManagerProps) {
    const [holidays, setHolidays] = useState<AgreementHoliday[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [newDescription, setNewDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const loadHolidays = async () => {
        setLoading(true);
        const response = await getAgreement(agreementId);
        if (response?.holidays) {
            setHolidays(response.holidays);
        }
        setLoading(false);
    };

    useEffect(() => {
        loadHolidays();
    }, [agreementId]);

    const handleAdd = async () => {
        if (!selectedDate) {
            toast.error('La fecha es obligatoria.');
            return;
        }

        setSubmitting(true);
        const result = await addHoliday(agreementId, {
            date: format(selectedDate, 'yyyy-MM-dd'),
            description: newDescription || undefined,
        });

        if (result) {
            toast.success('Festivo añadido correctamente');
            setSelectedDate(undefined);
            setNewDescription('');
            loadHolidays();
            onUpdate();
        } else {
            toast.error('No se pudo añadir el festivo.');
        }
        setSubmitting(false);
    };

    const handleDelete = async (id: string) => {
        const success = await deleteHoliday(id);
        if (success) {
            toast.success('Festivo eliminado correctamente');
            loadHolidays();
            onUpdate();
        }
    };

    return (
        <div className="space-y-6 py-4">
            {/* Formulario de nuevo festivo */}
            <div className="grid gap-4 rounded-md border p-4 bg-muted/30">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Fecha Festiva</Label>
                        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className={cn(
                                        'w-full justify-start text-left font-normal h-10',
                                        !selectedDate && 'text-muted-foreground'
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {selectedDate
                                        ? format(selectedDate, 'dd/MM/yyyy', { locale: es })
                                        : 'Seleccionar fecha'}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={(date) => {
                                        setSelectedDate(date);
                                        setCalendarOpen(false);
                                    }}
                                    captionLayout="dropdown"
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Descripción (Opcional)</Label>
                        <div className="flex gap-2">
                            <Input
                                id="description"
                                placeholder="Ej. Año Nuevo, Festivo Local..."
                                value={newDescription}
                                onChange={(e) => setNewDescription(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                            />
                            <Button onClick={handleAdd} disabled={submitting || !selectedDate}>
                                <Plus className="h-4 w-4 mr-1" /> Añadir
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lista de festivos */}
            <div className="rounded-md border max-h-[300px] overflow-auto">
                <Table>
                    <TableHeader className="sticky top-0 bg-background">
                        <TableRow>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Descripción</TableHead>
                            <TableHead className="text-right">Acción</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-6">
                                    Cargando festivos...
                                </TableCell>
                            </TableRow>
                        ) : holidays.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                                    No hay festivos registrados para este convenio.
                                </TableCell>
                            </TableRow>
                        ) : (
                            holidays.map((holiday) => (
                                <TableRow key={holiday.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                                            {format(new Date(holiday.date), 'dd/MM/yyyy', { locale: es })}
                                        </div>
                                    </TableCell>
                                    <TableCell>{holiday.description || '-'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(holiday.id)}
                                        >
                                            <Trash className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
