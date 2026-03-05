"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectItem, SelectContent, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import { PaginatedRequestHandler, RequestHandler } from "@/types";
import { createTimeSheet, updateTimeSheet } from "@/services/time-sheet";
import { getEmployees } from "@/services/employee";
import { Employee } from "@/types/employee";
import toast from "react-hot-toast";
import RingLoading from "../loading/Ring";

const timeSheetFormSchema = z.object({
  employee_id: z.string().min(1, "El empleado es obligatorio"),
  start_time: z.string().min(1, "La hora de inicio es obligatoria"),
  end_time: z.string().min(1, "La hora de fin es obligatoria"),
  status: z.enum(["pending", "approved"]),
});

type TimeSheetFormValues = z.infer<typeof timeSheetFormSchema>;

interface TimeSheetFormProps {
  isOpen: boolean;
  onClose: () => void;
  refetch: () => void;
  // Para edición pasamos los ids y datos actuales
  editTarget?: {
    taskTrackerId: string;
    startId: string;
    endId: string;
    employeeId: string;
    currentStartTime: string;
    currentEndTime: string;
    currentStatus: string;
  } | null;
}

export default function TimeSheetForm({
  isOpen,
  onClose,
  refetch,
  editTarget,
}: TimeSheetFormProps) {
  const isEdit = !!editTarget;
  const [employees, setEmployees] = useState<PaginatedRequestHandler<Employee>>({
    data: [], loading: false, total_pages: 0, total: 0
  });
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TimeSheetFormValues>({
    resolver: zodResolver(timeSheetFormSchema),
    defaultValues: {
      employee_id: "",
      start_time: "",
      end_time: "",
      status: "pending",
    },
  });

  // Cargar empleados
  useEffect(() => {
    if (!isOpen) return;
    setEmployees(prev => ({ ...prev, loading: true }));
    getEmployees({ page: 1, search: employeeSearch }).then((res) => {
      const { data, total, total_pages } = res || {};
      setEmployees({ data: data || [], loading: false, total: total || 0, total_pages: total_pages || 1 });
    });
  }, [isOpen, employeeSearch]);

  // Resetear form al abrir
  useEffect(() => {
    if (!isOpen) return;
    if (isEdit && editTarget) {
      form.reset({
        employee_id: editTarget.employeeId,
        start_time: new Date(editTarget.currentStartTime).toISOString().slice(0, 16),
        end_time: editTarget.currentEndTime ? new Date(editTarget.currentEndTime).toISOString().slice(0, 16) : '',
        status: editTarget.currentStatus as "pending" | "approved",
      });
    } else {
      form.reset({
        employee_id: "",
        start_time: "",
        end_time: "",
        status: "pending",
      });
    }
  }, [isOpen, editTarget]);

  const toUTCISOString = (localDateString: string) => {
    const [date, time] = localDateString.split("T");
    return new Date(`${date}T${time}:00Z`).toISOString();
  };

  const handleSubmit = async (values: TimeSheetFormValues) => {
    if (new Date(values.end_time) <= new Date(values.start_time)) {
      toast.error("La hora de fin debe ser mayor a la de inicio");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        start_time: toUTCISOString(values.start_time),
        end_time: toUTCISOString(values.end_time),
      };

      if (isEdit && editTarget) {
        await updateTimeSheet(
          editTarget.taskTrackerId,
          editTarget.startId,
          editTarget.endId,
          payload
        );
      } else {
        await createTimeSheet(payload);
      }

      toast.success(isEdit ? "Registro actualizado correctamente" : "Registro creado correctamente");
      refetch();
      onClose();
    } catch {
      toast.error("Hubo un error al guardar el registro");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 bg-white dialog-close-btn-white">
        <DialogHeader className="px-8 py-6 bg-gradient-brand text-white">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-primary rounded-md flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            {isEdit ? "Editar Registro" : "Nuevo Registro"}
          </DialogTitle>
          <DialogDescription className="text-slate-200 mt-2">
            {isEdit
              ? "Modifica los datos del registro seleccionado"
              : "Completa los campos para crear un nuevo registro de asistencia"
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="p-8 space-y-6">

            <FormField
              control={form.control}
              name="employee_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-slate-700">Empleado *</FormLabel>
                  <FormControl>
                    <MultiCombobox
                      options={employees.data.map((e: Employee) => ({
                        value: e.id,
                        label: `${e.first_name} ${e.last_name || ''}`
                      }))}
                      values={field.value}
                      onSearchChange={setEmployeeSearch}
                      onValuesChange={(v) => field.onChange(Array.isArray(v) ? v[0] : v)}
                      placeholder="Seleccionar empleado"
                      searchPlaceholder="Buscar empleado"
                      emptyMessage="No se encontraron empleados"
                      loading={employees.loading}
                      multiple={false}
                      className="w-full h-10 border-slate-300"
                      disabled={isEdit}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="start_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-slate-700">Hora de Inicio *</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      onChange={(e) => {
                        field.onChange(e);
                        // Si end_time ya está seteado y es menor al nuevo start, lo limpiamos
                        const endTime = form.getValues('end_time');
                        if (endTime && new Date(endTime) <= new Date(e.target.value)) {
                          form.setValue('end_time', '');
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
              name="end_time"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-slate-700">Hora de Fin *</FormLabel>
                  <FormControl>
                    <Input
                      type="datetime-local"
                      {...field}
                      min={form.watch('start_time') || undefined}
                      onChange={(e) => {
                        const startTime = form.getValues('start_time');
                        if (startTime && new Date(e.target.value) <= new Date(startTime)) {
                          toast.error("La hora de fin debe ser mayor a la de inicio");
                          form.setValue('end_time', '');
                          return;
                        }
                        field.onChange(e);
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
                    <FormControl>
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

            <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-8 h-10 font-medium border-slate-300 hover:bg-slate-50"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="px-8 h-10 font-medium bg-brand-primary hover:bg-brand-primary-700 text-white"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </div>
                ) : isEdit ? "Actualizar Registro" : "Crear Registro"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}