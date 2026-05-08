"use client";

import React, { useState, useEffect } from "react";;
import { CalendarDays, Clock, Users, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import { FullIncidence, IncidenceCategory, IncidenceTypeEnum } from "@/types/incidence";
import { useForm } from "react-hook-form";
import dayjs, { Dayjs } from "dayjs";
import { Employee } from "@/types/employee";
import { Profile, ProfileFilters } from "@/types/profile";
import { PaginatedRequestHandler, RequestHandler } from "@/types";
import { createIncidence, getIncidence, updateIncidence } from "@/services/incidence";
import { getEmployees } from "@/services/employee";
import { getProfiles } from "@/services/profile";
import { getIncidenceCategories } from "@/services/incidence-category";
import toast from "react-hot-toast";
import { incidenceFormSchema, IncidenceFormValues } from "@/zod/incidence";
import { zodResolver } from "@hookform/resolvers/zod";
import RingLoading from "../loading/Ring";

interface IncidenceFormProps {
    isOpen: boolean;
    incidence_id: string | null;
    onClose: () => void;
    refetch: () => void;
}

import { useAuthStore } from "@/store/useAuthStore";
import { AuthRoleEnum } from "@/types/auth";

export default function IncidenceForm({
    isOpen,
    incidence_id,
    onClose,
    refetch,
}: IncidenceFormProps) {
    const { user } = useAuthStore();
    const isAdminOrManager = user?.role === AuthRoleEnum.Admin || user?.role === AuthRoleEnum.Manager;
    
    const [incidence, setIncidence] = useState<RequestHandler<FullIncidence | null>>({ data: null, loading: true });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [employees, setEmployees] = useState<PaginatedRequestHandler<Employee>>({ data: [], loading: false, total_pages: 0, total: 0 });
    const [profiles, setProfiles] = useState<PaginatedRequestHandler<Profile>>({ data: [], loading: false, total_pages: 0, total: 0 });
    const [categories, setCategories] = useState<IncidenceCategory[]>([]);
    const [employeeSearch, setEmployeeSearch] = useState("");
    const [profileSearch, setProfileSearch] = useState("");
    const [dateRange, setDateRange] = useState<{
        from: Dayjs | undefined;
        to: Dayjs | undefined;
    }>({
        from: dayjs(),
        to: dayjs(),
    });

    const form = useForm<IncidenceFormValues>({
        resolver: zodResolver(incidenceFormSchema),
        defaultValues: {
            category_id: "",
            description: "",
            all_day: true,
            start_time: "09:00",
            end_time: "17:00",
            paid: true,
            is_global: false,
            employee_ids: [],
            profile_ids: [],
            duration_hours: "",
        },
    });

    const selectedCategoryId = form.watch('category_id');
    const selectedCategory = categories.find(c => c.id === selectedCategoryId) ?? null;
    const incidenceType = selectedCategory?.type ?? IncidenceTypeEnum.Other;

    useEffect(() => {
        if (isOpen && !incidence.data?.id) {
            form.reset({
                category_id: "",
                description: '',
                all_day: true,
                start_time: "09:00",
                end_time: "17:00",
                paid: true,
                is_global: false,
                employee_ids: [],
                profile_ids: [],
                duration_hours: "",
            });
        }
    }, [isOpen, incidence.data?.id]);

    useEffect(() => {
        if (isOpen && !incidence_id) {
            setIncidence({ data: null, loading: false });
            return;
        }
        if (!isOpen || !incidence_id) return;

        setIncidence({ data: null, loading: true });
        getIncidence(incidence_id).then((res) => {
            const { data } = res || {};
            setIncidence({ data: data || null, loading: false });
            form.reset({
                category_id: (data as any)?.category_id ?? "",
                description: data?.description,
                all_day: data?.all_day,
                start_time: dayjs(data?.start_date).format("HH:mm"),
                end_time: dayjs(data?.end_date).format("HH:mm"),
                paid: data?.paid,
                is_global: data?.is_global,
                employee_ids: data?.employees?.map((employee: any) => employee.id) || [],
                profile_ids: data?.profiles?.map((profile: any) => profile.id) || [],
                duration_hours: data?.duration_hours ? String(data?.duration_hours) : "",
            });
            setDateRange({
                from: dayjs(data?.start_date),
                to: dayjs(data?.end_date),
            });
            setEmployees((prev: PaginatedRequestHandler<Employee>) => ({ ...prev, data: prev.data.concat(data?.employees as any || []) as any, loading: false }));
            setProfiles((prev: PaginatedRequestHandler<Profile>) => ({ ...prev, data: prev.data.concat(data?.profiles as any || []) as any, loading: false }));
        });
    }, [isOpen, incidence_id]);

    const isAllDay = form.watch("all_day");
    const isGlobal = form.watch("is_global");
    const employeeIds = form.watch("employee_ids");
    const profileIds = form.watch("profile_ids");

    useEffect(() => {
        if (!isOpen) return;
        getIncidenceCategories().then((res: any) => {
            if (res?.success) setCategories(res.data as IncidenceCategory[]);
        });
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || !isAdminOrManager) return;

        setEmployees((prev: PaginatedRequestHandler<Employee>) => ({ ...prev, loading: true }));
        getEmployees({ page: 1, search: employeeSearch }).then((res) => {
            const { data, total, total_pages } = res || {};
            setEmployees({ data: data || [], loading: false, total: total || 0, total_pages: total_pages || 1 });
        });
    }, [isOpen, employeeSearch, isAdminOrManager]);

    useEffect(() => {
        if (!isOpen || !isAdminOrManager) return;

        setProfiles((prev: PaginatedRequestHandler<Profile>) => ({ ...prev, loading: true }));
        getProfiles({ page: 1, search: profileSearch } as ProfileFilters).then((res) => {
            const { data, total, total_pages } = res || {};
            setProfiles({ data: data || [], loading: false, total: total || 0, total_pages: total_pages || 1 });
        });
    }, [isOpen, profileSearch, isAdminOrManager]);

    const handleSubmit = async (data: IncidenceFormValues) => {
        setIsSubmitting(true);

        const body: any = {
            ...data,
            type: incidenceType,
        };
        // If category has a paid default and user hasn't overridden, apply it
        if (selectedCategory && body.paid === undefined) {
            body.paid = selectedCategory.paid;
        }
        const useDurationHours = [
            IncidenceTypeEnum.MedicalLeave,
            IncidenceTypeEnum.SindicalLeave,
            IncidenceTypeEnum.MedicalVisit,
            IncidenceTypeEnum.UnionHours,
            IncidenceTypeEnum.LeaveOfAbsence,
            IncidenceTypeEnum.OvertimeRest,
        ].includes(incidenceType);
        if (!dateRange.from || !dateRange.to) return;
        if (isAllDay) {
            // All-day always uses a date range, never duration_hours
            body.start_date = dateRange.from.startOf('day').toISOString();
            body.end_date = dateRange.to.endOf('day').toISOString();
            delete body.duration_hours;
        } else {
            const start_time = data.start_time;
            const end_time = data.end_time;
            body.start_date = dateRange.from.set('hour', Number(start_time?.split(':')[0])).set('minute', Number(start_time?.split(':')[1])).toISOString();
            if (useDurationHours) {
                const hours = Number(body.duration_hours);
                if (!hours || hours < 1) {
                    toast.error("El número de horas debe ser al menos 1");
                    setIsSubmitting(false);
                    return;
                }
                body.duration_hours = hours;
                delete body.end_date;
            } else {
                body.end_date = dateRange.to.set('hour', Number(end_time?.split(':')[0])).set('minute', Number(end_time?.split(':')[1])).toISOString();
                delete body.duration_hours;
            }
        }

        // Remove form-only fields that the server doesn't expect
        delete body.start_time;
        delete body.end_time;

        let res: any = null;
        if (incidence_id) {
            res = await updateIncidence(incidence_id, body);
        } else {
            res = await createIncidence(body);
        }
        if (res?.success) {
            toast.success("Incidencia creada correctamente");
            refetch();
            onClose();
        } else {
            toast.error("Hubo un error al crear la incidencia, por favor intente nuevamente.");
        }
        setIsSubmitting(false);
    };

    const handleClose = () => {
        form.reset();
        setDateRange({ from: undefined, to: undefined });
        onClose();
    };

    React.useEffect(() => {
        form.trigger(['employee_ids', 'profile_ids', 'is_global']);
    }, [employeeIds, profileIds, isGlobal, form]);

    const calculateDays = (): number => {
        if (!dateRange.from || !dateRange.to) return 0;

        const start = dayjs(dateRange.from);
        const end = dayjs(dateRange.to);

        return end.diff(start, 'day') + 1;
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 bg-white dialog-close-btn-white">
                <DialogHeader className="px-8 py-6 bg-gradient-brand text-white">
                    <DialogTitle className="text-2xl font-semibold flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-primary rounded-md flex items-center justify-center">
                            <CalendarDays className="w-5 h-5 text-white" />
                        </div>
                        {incidence_id ? "Editar Incidencia" : "Nueva Incidencia"}
                    </DialogTitle>
                    <DialogDescription className="text-slate-200 mt-2">
                        {incidence_id
                            ? "Modifica los datos de la incidencia seleccionada"
                            : "Completa todos los campos para crear una nueva incidencia"
                        }
                    </DialogDescription>
                </DialogHeader>

                {incidence.loading ? (
                    <div className="flex items-center justify-center py-20">
                        <RingLoading />
                    </div>
                ) : (
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="p-8 space-y-8">

                            {/* Información Básica */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                                    <div className="w-8 h-8 bg-brand-primary rounded-md flex items-center justify-center">
                                        <CalendarDays className="w-4 h-4 text-white" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-800">Información de la Incidencia</h3>
                                </div>

                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="category_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium text-slate-700">Categoría *</FormLabel>
                                                <Select
                                                    onValueChange={(val) => {
                                                        field.onChange(val);
                                                        const cat = categories.find(c => c.id === val);
                                                        if (cat) form.setValue('paid', cat.paid);
                                                    }}
                                                    value={field.value}
                                                >
                                                    <FormControl>
                                                        <SelectTrigger className="h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary">
                                                            <SelectValue placeholder="Selecciona una categoría" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {categories.length === 0 ? (
                                                            <SelectItem value="__empty__" disabled>
                                                                Sin categorías — crea una primero
                                                            </SelectItem>
                                                        ) : (
                                                            categories.map((cat) => (
                                                                <SelectItem key={cat.id} value={cat.id}>
                                                                    {cat.name}
                                                                </SelectItem>
                                                            ))
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium text-slate-700">Descripción</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Describe el motivo o detalles..."
                                                        className="h-20 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary resize-none"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Configuración de Alcance */}
                            {isAdminOrManager && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                                        <div className="w-8 h-8 bg-brand-primary rounded-md flex items-center justify-center">
                                            <Users className="w-4 h-4 text-white" />
                                        </div>
                                        <h3 className="text-lg font-semibold text-slate-800">Alcance de la Incidencia</h3>
                                    </div>

                                    <div className="space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="is_global"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-base">
                                                            Aplicar globalmente
                                                        </FormLabel>
                                                        <div className="text-sm text-gray-600">
                                                            Se aplicará a todos los empleados
                                                        </div>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />

                                        {!isGlobal ? (
                                            <>
                                                <FormField
                                                    control={form.control}
                                                    name="employee_ids"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-sm font-medium text-slate-700">Empleados</FormLabel>
                                                            <FormControl>
                                                                <MultiCombobox
                                                                    options={employees.data.map((employee: Employee) => ({
                                                                        value: employee.id,
                                                                        label: `${employee.first_name} ${employee.last_name}`
                                                                    }))}
                                                                    values={field.value || []}
                                                                    onSearchChange={setEmployeeSearch}
                                                                    onValuesChange={field.onChange}
                                                                    placeholder="Seleccionar empleados"
                                                                    searchPlaceholder="Buscar empleados por nombre"
                                                                    emptyMessage="No se encontraron empleados"
                                                                    loading={employees.loading}
                                                                    className="w-full h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="profile_ids"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-sm font-medium text-slate-700">Categorías</FormLabel>
                                                            <FormControl>
                                                                <MultiCombobox
                                                                    options={profiles.data.map((profile: Profile) => ({
                                                                        value: profile.id,
                                                                        label: profile.name
                                                                    }))}
                                                                    values={field.value || []}
                                                                    onSearchChange={setProfileSearch}
                                                                    onValuesChange={field.onChange}
                                                                    placeholder="Seleccionar categorías"
                                                                    searchPlaceholder="Buscar categorías por nombre"
                                                                    emptyMessage="No se encontraron categorías"
                                                                    loading={profiles.loading}
                                                                    className="w-full h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </>
                                        ) : null}
                                    </div>
                                </div>
                            )}

                            {/* Configuración de Tiempo */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                                    <div className="w-8 h-8 bg-brand-primary rounded-md flex items-center justify-center">
                                        <Clock className="w-4 h-4 text-white" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-800">Configuración de Tiempo</h3>
                                </div>

                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="all_day"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">Todo el día</FormLabel>
                                                    <div className="text-sm text-gray-600">
                                                        La incidencia afecta todo el día laboral
                                                    </div>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />

                                    {/* Horarios específicos */}
                                    {!isAllDay && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="start_time"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-sm font-medium text-slate-700">Hora inicio</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="time"
                                                                className="h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            {![
                                                IncidenceTypeEnum.MedicalLeave, 
                                                IncidenceTypeEnum.SindicalLeave,
                                                IncidenceTypeEnum.MedicalVisit,
                                                IncidenceTypeEnum.UnionHours,
                                                IncidenceTypeEnum.LeaveOfAbsence,
                                                IncidenceTypeEnum.OvertimeRest
                                            ].includes(incidenceType) ? (
                                                <FormField
                                                    control={form.control}
                                                    name="end_time"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-sm font-medium text-slate-700">Hora fin</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="time"
                                                                    className="h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            ) : (
                                                <FormField
                                                    control={form.control}
                                                    name="duration_hours"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel className="text-sm font-medium text-slate-700">Nº de horas</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    className="h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                                                                    placeholder="0"
                                                                    step={1}
                                                                    min={0}
                                                                    onKeyDown={e => {
                                                                        if (e.key === "." || e.key === "," || e.key === "e") {
                                                                            e.preventDefault();
                                                                        }
                                                                    }}
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            )}
                                        </div>
                                    )}

                                    <FormField
                                        control={form.control}
                                        name="paid"
                                        render={({ field }) => (
                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">
                                                        Incidencia paga
                                                    </FormLabel>
                                                    <div className="text-sm text-gray-600">
                                                        Será remunerado normalmente
                                                    </div>
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Selección de Fechas */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                                    <div className="w-8 h-8 bg-brand-primary rounded-md flex items-center justify-center">
                                        <CalendarDays className="w-4 h-4 text-white" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-800">Selección de Fechas</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="border rounded-md p-3">
                                        <Calendar
                                            mode="range"
                                            selected={{
                                                from: dateRange.from?.toDate(),
                                                to: dateRange.to?.toDate(),
                                            }}
                                            onSelect={(range) => {
                                                setDateRange({
                                                    from: dayjs(range?.from),
                                                    to: dayjs(range?.to),
                                                });
                                            }}
                                            disabled={(date) => date < dayjs().startOf('day').toDate()}
                                            className="rounded-md w-full"
                                        />
                                    </div>

                                    {dateRange.from && dateRange.to && (
                                        <div className="flex items-center gap-3 border border-brand-primary-100 rounded-md p-3">
                                            <div className={'grid place-content-center size-8 bg-brand-primary-100 rounded-md p-1'}>
                                                <CalendarDays className="size-5 text-brand-primary" />
                                            </div>
                                            <div className="text-sm">
                                                <p>
                                                    Desde: {dayjs(dateRange.from).format("DD [de] MMMM")} hasta {dateRange.to ? `${dayjs(dateRange.to).format("DD [de] MMMM")}` : '-'}
                                                </p>
                                                <p>
                                                    <span className="font-medium">Total:</span> {calculateDays()} días
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Botones de acción */}
                            <div className="flex justify-end gap-4 pt-8 border-t border-slate-200">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleClose}
                                    disabled={isSubmitting}
                                    className="px-8 py-2 h-10 font-medium border-slate-300 hover:bg-slate-50"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={
                                        isSubmitting ||
                                        incidence.loading ||
                                        !dateRange.from || !dateRange.to
                                    }
                                    className="px-8 py-2 h-10 font-medium bg-brand-primary hover:bg-brand-primary-700 text-white"
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Guardando...
                                        </div>
                                    ) : incidence_id ? "Actualizar Incidencia" : "Crear Incidencia"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
