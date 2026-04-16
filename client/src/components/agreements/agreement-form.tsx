'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Calendar as CalendarIcon, Plus, Trash } from 'lucide-react';
import { Agreement, AgreementFormData, AgreementHoliday } from '@/types/agreement';
import { createAgreement, updateAgreement, getAgreement, addHoliday, deleteHoliday } from '@/services/agreement';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const agreementSchema = z.object({
    name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres.' }),
    description: z.string().optional(),
    saturday_is_holiday: z.boolean(),
    sunday_is_holiday: z.boolean(),
});

type FormValues = z.infer<typeof agreementSchema>;

interface AgreementFormProps {
    agreement: Agreement | null;
    onSuccess: () => void;
    onCancel: () => void;
}

export function AgreementForm({ agreement, onSuccess, onCancel }: AgreementFormProps) {
    const [submitting, setSubmitting] = useState(false);
    // Stores the agreement after creation so holidays can be added immediately
    const [savedAgreement, setSavedAgreement] = useState<Agreement | null>(agreement);

    // Holiday state
    const [holidays, setHolidays] = useState<AgreementHoliday[]>([]);
    const [loadingHolidays, setLoadingHolidays] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
    const [calendarOpen, setCalendarOpen] = useState(false);
    const [holidayDescription, setHolidayDescription] = useState('');
    const [addingHoliday, setAddingHoliday] = useState(false);

    const activeAgreement = savedAgreement ?? agreement;

    const form = useForm<FormValues>({
        resolver: zodResolver(agreementSchema),
        defaultValues: {
            name: agreement?.name || '',
            description: agreement?.description || '',
            saturday_is_holiday: agreement?.saturday_is_holiday ?? false,
            sunday_is_holiday: agreement?.sunday_is_holiday ?? true,
        },
    });

    // Load holidays when editing or after creation
    useEffect(() => {
        if (!activeAgreement?.id) return;
        setLoadingHolidays(true);
        getAgreement(activeAgreement.id).then((res) => {
            setHolidays(res?.holidays || []);
            setLoadingHolidays(false);
        });
    }, [activeAgreement?.id]);

    async function onSubmit(values: FormValues) {
        setSubmitting(true);
        const data: AgreementFormData = { ...values };

        if (activeAgreement?.id) {
            const result = await updateAgreement(activeAgreement.id, data);
            if (result) {
                toast.success('Convenio actualizado correctamente');
                onSuccess();
            } else {
                toast.error('Ha ocurrido un error al guardar el convenio.');
            }
        } else {
            const result = await createAgreement(data);
            if (result) {
                toast.success('Convenio creado correctamente. Ahora puedes añadir festivos.');
                setSavedAgreement(result);
            } else {
                toast.error('Ha ocurrido un error al crear el convenio.');
            }
        }
        setSubmitting(false);
    }

    const handleAddHoliday = async () => {
        if (!selectedDate || !activeAgreement?.id) return;
        setAddingHoliday(true);
        const result = await addHoliday(activeAgreement.id, {
            date: format(selectedDate, 'yyyy-MM-dd'),
            description: holidayDescription || undefined,
        });
        if (result) {
            toast.success('Festivo añadido');
            setSelectedDate(undefined);
            setHolidayDescription('');
            const res = await getAgreement(activeAgreement.id);
            setHolidays(res?.holidays || []);
        } else {
            toast.error('No se pudo añadir el festivo.');
        }
        setAddingHoliday(false);
    };

    const handleDeleteHoliday = async (id: string) => {
        if (!activeAgreement?.id) return;
        const success = await deleteHoliday(id);
        if (success) {
            toast.success('Festivo eliminado');
            const res = await getAgreement(activeAgreement.id);
            setHolidays(res?.holidays || []);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Nombre */}
                <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre del Convenio</FormLabel>
                            <FormControl>
                                <Input placeholder="Ej. Agro, Empaquetado..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Descripción */}
                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Descripción</FormLabel>
                            <FormControl>
                                <Input placeholder="Opcional..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {/* Fines de semana */}
                <div className="space-y-4 rounded-md border p-4 bg-muted/50">
                    <h3 className="text-sm font-medium">Configuración de Fines de Semana</h3>
                    <div className="flex flex-col gap-3">
                        <FormField
                            control={form.control}
                            name="saturday_is_holiday"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Sábados son festivos</FormLabel>
                                        <FormDescription>
                                            Marcar si los sábados computan como horas extras.
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="sunday_is_holiday"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                    </FormControl>
                                    <div className="space-y-1 leading-none">
                                        <FormLabel>Domingos son festivos</FormLabel>
                                        <FormDescription>
                                            El estándar suele ser que los domingos sean festivos.
                                        </FormDescription>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Festivos — visible en edición y tras crear */}
                {activeAgreement?.id && (
                    <>
                        <div className="border-t" />
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold">Días Festivos</h3>

                            {/* Formulario de nuevo festivo */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-md border p-3 bg-muted/30">
                                <div className="space-y-1">
                                    <Label>Fecha Festiva</Label>
                                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className={cn(
                                                    'w-full justify-start text-left font-normal h-9',
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
                                                onSelect={(date) => { setSelectedDate(date); setCalendarOpen(false); }}
                                                captionLayout="dropdown"
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                </div>
                                <div className="space-y-1">
                                    <Label>Descripción (Opcional)</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Ej. Año Nuevo..."
                                            value={holidayDescription}
                                            onChange={(e) => setHolidayDescription(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddHoliday())}
                                            className="h-9"
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            onClick={handleAddHoliday}
                                            disabled={addingHoliday || !selectedDate}
                                            className="h-9 shrink-0"
                                        >
                                            <Plus className="h-4 w-4 mr-1" /> Añadir
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Lista de festivos */}
                            <div className="rounded-md border max-h-[200px] overflow-auto">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background">
                                        <TableRow>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Descripción</TableHead>
                                            <TableHead className="text-right w-10"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {loadingHolidays ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-4 text-sm text-muted-foreground">
                                                    Cargando festivos...
                                                </TableCell>
                                            </TableRow>
                                        ) : holidays.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-4 text-sm text-muted-foreground">
                                                    No hay festivos registrados.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            holidays.map((holiday) => (
                                                <TableRow key={holiday.id}>
                                                    <TableCell className="text-sm">
                                                        <div className="flex items-center gap-2">
                                                            <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                                                            {format(new Date(holiday.date), 'dd/MM/yyyy', { locale: es })}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-sm">{holiday.description || '-'}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7"
                                                            onClick={() => handleDeleteHoliday(holiday.id)}
                                                        >
                                                            <Trash className="h-3.5 w-3.5 text-destructive" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </>
                )}

                <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
                        {savedAgreement && !agreement ? 'Cerrar' : 'Cancelar'}
                    </Button>
                    {savedAgreement && !agreement ? (
                        <Button type="button" onClick={onSuccess}>
                            Finalizar
                        </Button>
                    ) : (
                        <Button type="submit" disabled={submitting}>
                            {activeAgreement?.id && agreement ? 'Guardar Cambios' : 'Crear Convenio'}
                        </Button>
                    )}
                </div>
            </form>
        </Form>
    );
}
