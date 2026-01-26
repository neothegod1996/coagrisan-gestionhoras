"use client";

import React, { useState, useEffect } from "react";
import { CalendarDays, Users, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import { FullEmployeeTurnover, TurnoverTypeEnum } from "@/types/employee-turnover";
import { useForm } from "react-hook-form";
import dayjs, { Dayjs } from "dayjs";
import { Employee } from "@/types/employee";
import { PaginatedRequestHandler, RequestHandler } from "@/types";
import { createTurnover, getTurnover, updateTurnover } from "@/services/turnover";
import { getEmployees } from "@/services/employee";
import toast from "react-hot-toast";
import { turnoverFormSchema, TurnoverFormValues } from "@/zod/turnover";
import { zodResolver } from "@hookform/resolvers/zod";
import RingLoading from "../../loading/Ring";

interface TurnoverFormProps {
    isOpen: boolean;
    turnover_id: string | null;
    onClose: () => void;
    refetch: () => void;
}

export default function TurnoverForm({
    isOpen,
    turnover_id,
    onClose,
    refetch,
}: TurnoverFormProps) {
    const [turnover, setTurnover] = useState<RequestHandler<FullEmployeeTurnover | null>>({ data: null, loading: true });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [employees, setEmployees] = useState<PaginatedRequestHandler<Employee>>({ data: [], loading: false, total_pages: 0, total: 0 });
    const [employeeSearch, setEmployeeSearch] = useState("");
    const [selectedDate, setSelectedDate] = useState<Dayjs | undefined>(dayjs());

    const form = useForm<TurnoverFormValues>({
        resolver: zodResolver(turnoverFormSchema),
        defaultValues: {
            type: TurnoverTypeEnum.Hiring,
            date: dayjs().format("YYYY-MM-DD"),
            employee_id: "",
        },
    });

    useEffect(() => {
        if (isOpen && !turnover.data?.id) {
            form.reset({
                type: TurnoverTypeEnum.Hiring,
                date: dayjs().format("YYYY-MM-DD"),
                employee_id: "",
            });
            setSelectedDate(dayjs());
        }
    }, [isOpen, turnover.data?.id]);

    useEffect(() => {
        if (isOpen && !turnover_id) {
            setTurnover({ data: null, loading: false });
            return;
        }
        if (!isOpen || !turnover_id) return;

        setTurnover({ data: null, loading: true });
        getTurnover(turnover_id).then((res) => {
            const { data } = res || {};
            setTurnover({ data: data || null, loading: false });
            form.reset({
                type: data?.type,
                date: dayjs(data?.date).format("YYYY-MM-DD"),
                employee_id: data?.employee_id,
            });
            setSelectedDate(dayjs(data?.date));
            setEmployees((prev: PaginatedRequestHandler<Employee>) => ({ 
                ...prev, 
                data: prev.data.concat(data?.employee as any || []) as any, 
                loading: false 
            }));
        });
    }, [isOpen, turnover_id]);

    useEffect(() => {
        if (!isOpen) return;

        setEmployees((prev: PaginatedRequestHandler<Employee>) => ({ ...prev, loading: true }));
        getEmployees({ page: 1, search: employeeSearch }).then((res) => {
            const { data, total, total_pages } = res || {};
            setEmployees({ data: data || [], loading: false, total: total || 0, total_pages: total_pages || 1 });
        });
    }, [isOpen, employeeSearch]);

    const handleSubmit = async (data: TurnoverFormValues) => {
        setIsSubmitting(true);

        const body: any = {
            ...data,
            date: selectedDate?.format("YYYY-MM-DD"),
        };

        let res: any = null;
        if (turnover_id) {
            res = await updateTurnover(turnover_id, body);
        } else {
            res = await createTurnover(body);
        }
        if (res?.success) {
            toast.success("Registro de alta/baja creado correctamente");
            refetch();
            onClose();
        } else {
            toast.error(res?.message || "Hubo un error al crear el registro, por favor intente nuevamente.");
        }
        setIsSubmitting(false);
    };

    const handleClose = () => {
        form.reset();
        setSelectedDate(dayjs());
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 bg-white dialog-close-btn-white">
                <DialogHeader className="px-8 py-6 bg-gradient-brand text-white">
                    <DialogTitle className="text-2xl font-semibold flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-primary rounded-md flex items-center justify-center">
                            <Users className="w-5 h-5 text-white" />
                        </div>
                        {turnover_id ? "Editar Registro" : "Nuevo Registro"}
                    </DialogTitle>
                    <DialogDescription className="text-slate-200 mt-2">
                        {turnover_id
                            ? "Modifica los datos del registro seleccionado"
                            : "Completa todos los campos para crear un nuevo registro de alta/baja"
                        }
                    </DialogDescription>
                </DialogHeader>

                {turnover.loading ? (
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
                                        <Users className="w-4 h-4 text-white" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-800">Información del Registro</h3>
                                </div>

                                <div className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium text-slate-700">Tipo de registro *</FormLabel>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary">
                                                            <SelectValue placeholder="Selecciona el tipo" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value={TurnoverTypeEnum.Hiring}>
                                                            Alta
                                                        </SelectItem>
                                                        <SelectItem value={TurnoverTypeEnum.Departure}>
                                                            Baja
                                                        </SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="employee_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm font-medium text-slate-700">Empleado *</FormLabel>
                                                <FormControl>
                                                    <MultiCombobox
                                                        options={employees.data.map((employee: Employee) => ({
                                                            value: employee.id,
                                                            label: `${employee.first_name} ${employee.last_name}`
                                                        }))}
                                                        values={field.value || ""}
                                                        onSearchChange={setEmployeeSearch}
                                                        onValuesChange={field.onChange}
                                                        placeholder="Seleccionar empleado"
                                                        searchPlaceholder="Buscar empleados por nombre"
                                                        emptyMessage="No se encontraron empleados"
                                                        loading={employees.loading}
                                                        multiple={false}
                                                        className="w-full h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            {/* Selección de Fecha */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                                    <div className="w-8 h-8 bg-brand-primary rounded-md flex items-center justify-center">
                                        <CalendarDays className="w-4 h-4 text-white" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-800">Fecha del Registro</h3>
                                </div>

                                <div className="space-y-4">
                                    <div className="border rounded-md p-3">
                                        <Calendar
                                            mode="single"
                                            selected={selectedDate?.toDate()}
                                            onSelect={(date) => {
                                                setSelectedDate(dayjs(date));
                                            }}
                                            // disabled={(date) => date < dayjs().toDate()}
                                            className="rounded-md w-full"
                                        />
                                    </div>

                                    {selectedDate && (
                                        <div className="flex items-center gap-3 border border-brand-primary-100 rounded-md p-3">
                                            <div className={'grid place-content-center size-8 bg-brand-primary-100 rounded-md p-1'}>
                                                <CalendarDays className="size-5 text-brand-primary" />
                                            </div>
                                            <div className="text-sm">
                                                <p>
                                                    Fecha seleccionada: {dayjs(selectedDate).format("DD [de] MMMM, YYYY")}
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
                                        turnover.loading ||
                                        !selectedDate
                                    }
                                    className="px-8 py-2 h-10 font-medium bg-brand-primary hover:bg-brand-primary-700 text-white"
                                >
                                    {isSubmitting ? (
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Guardando...
                                        </div>
                                    ) : turnover_id ? "Actualizar Registro" : "Crear Registro"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                )}
            </DialogContent>
        </Dialog>
    );
}
