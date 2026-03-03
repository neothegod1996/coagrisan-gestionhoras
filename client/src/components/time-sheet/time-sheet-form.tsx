"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Clock } from "lucide-react";
import { TimeSheet } from "@/types/time-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RequestHandler } from "@/types";
import { createTimeSheet, getTimeSheet, updateTimeSheet, updateTimeSheetById } from "@/services/time-sheet";
import { getEmployees } from "@/services/employee";
import { getTerminals } from "@/services/terminal";
import toast from "react-hot-toast";
import RingLoading from "../loading/Ring";
import { timeSheetFormSchema, TimeSheetFormValues } from "@/zod/time-sheet";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TimeSheetFormProps {
  isOpen: boolean;
  onClose: () => void;
  refetch: () => void;
  time_sheet_id?: string | null;
}

export default function TimeSheetForm({
  isOpen,
  onClose,
  refetch,
  time_sheet_id
}: TimeSheetFormProps) {
  const [timeSheet, setTimeSheet] = useState<RequestHandler<TimeSheet | null>>({ data: null, loading: true });
  const [employees, setEmployees] = useState<any[]>([]);
  const [terminals, setTerminals] = useState<any[]>([]);

  const form = useForm<TimeSheetFormValues>({
    resolver: zodResolver(timeSheetFormSchema),
    defaultValues: {
      task_tracker_id: "",
      employee_id: "",
      time: "",
      terminal_id: "",
      status: "pending"
    },
  });

  useEffect(() => {
    if (isOpen && !timeSheet.data?.id) {
      form.reset({
        task_tracker_id:"",
        employee_id: '',
        time: '',
        terminal_id: '',
        status: "pending"
      });
    }
  }, [isOpen, timeSheet.data?.id]);

  useEffect(() => {
    if (isOpen && !time_sheet_id) {
      setTimeSheet({ data: null, loading: false });
      return;
    }
    if (!isOpen || !time_sheet_id) return;

    setTimeSheet({ data: null, loading: true });
    getTimeSheet(time_sheet_id).then((res) => {
      const { data } = res || {};
      setTimeSheet({ data: data || null, loading: false });
      form.reset({
        task_tracker_id: data?.task_tracker_id || '',
        employee_id: data?.employee_shift?.employee?.id || '',
        time: data?.time || '',
        terminal_id: data?.terminal?.id || '',
        status: data?.status || "pending"
      });
    });
  }, [isOpen, time_sheet_id]);

  // Cargar empleados y terminales
  useEffect(() => {
    if (isOpen) {
      // Cargar empleados
      getEmployees({ page: 1, search: "" }).then((response) => {
        if (response?.data) {
          setEmployees(response.data);
        }
      });

      // Cargar terminales
      getTerminals({ page: 1, search: "" }).then((response) => {
        if (response?.data) {
          setTerminals(response.data);
        }
      });
    }
  }, [isOpen]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (values: TimeSheetFormValues) => {
    setIsSubmitting(true);
    try {
      if (time_sheet_id) {
        await updateTimeSheetById(time_sheet_id, values);
      } else {
        await createTimeSheet(values);
      }
      toast.success("Registro guardado correctamente");
      refetch();
      onClose();
      setTimeSheet({ data: null, loading: true });
    } catch (error) {
      console.log(error);
      toast.error("Hubo un error al guardar el registro, por favor intente nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
    setTimeSheet({ data: null, loading: true });
  };

  const formatDateTimeLocal = (dateTime: string) => {
    if (!dateTime) return '';
    const date = new Date(dateTime);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 bg-white dialog-close-btn-white">
        <DialogHeader className="px-8 py-6 bg-gradient-brand text-white">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-primary rounded-md flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            {time_sheet_id ? "Editar Registro" : "Nuevo Registro"}
          </DialogTitle>
          <DialogDescription className="text-slate-200 mt-2">
            {time_sheet_id
              ? "Modifica los datos del registro seleccionado"
              : "Completa todos los campos para crear un nuevo registro de asistencia"
            }
          </DialogDescription>
        </DialogHeader>

        {timeSheet.loading ? (
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
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">Información del Registro</h3>
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="employee_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700">Empleado *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl className={'w-full'}>
                            <SelectTrigger className="h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary">
                              <SelectValue placeholder="Selecciona un empleado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {employees.map((employee) => (
                              <SelectItem key={employee.id} value={employee.id}>
                                {employee.first_name} {employee.last_name || ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="terminal_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700">Terminal *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl className={'w-full'}>
                            <SelectTrigger className="h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary">
                              <SelectValue placeholder="Selecciona un terminal" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {terminals.map((terminal) => (
                              <SelectItem key={terminal.id} value={terminal.id}>
                                {terminal.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700">Fecha y Hora *</FormLabel>
                        <FormControl>
                          <Input
                            type="datetime-local"
                            {...field}
                            value={formatDateTimeLocal(field.value)}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value) {
                                const date = new Date(value);
                                field.onChange(date.toISOString());
                              }
                            }}
                            className="h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700">Estado</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl className={'w-full'}>
                            <SelectTrigger className="h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary">
                              <SelectValue placeholder="Selecciona un estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pending">Pendiente</SelectItem>
                            <SelectItem value="approved">Aprobado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                  disabled={isSubmitting || timeSheet.loading}
                  className="px-8 py-2 h-10 font-medium bg-brand-primary hover:bg-brand-primary-700 text-white"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Guardando...
                    </div>
                  ) : time_sheet_id ? "Actualizar Registro" : "Crear Registro"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
