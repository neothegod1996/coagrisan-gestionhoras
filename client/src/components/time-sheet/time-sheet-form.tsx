"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Clock, CalendarDays } from "lucide-react";
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
import { PaginatedRequestHandler } from "@/types";
import { createTimeSheet, updateTimeSheet } from "@/services/time-sheet";
import { createIncidence, getIncidences, deleteIncidence } from "@/services/incidence";
import { IncidenceType } from "@/types/incidence";
import { getEmployees } from "@/services/employee";
import { getIncidenceCategories } from "@/services/incidence-category";
import { Employee } from "@/types/employee";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import RingLoading from "../loading/Ring";
import { Plus, Trash2 } from "lucide-react";

const timeSheetFormSchema = z.object({
  employee_id: z.string().min(1, "El empleado es obligatorio"),
  incidence_category_id: z.string().optional(),
  is_paid: z.boolean(),
  ranges: z.array(z.object({
    start_time: z.string().min(1, "La hora de inicio es obligatoria"),
    end_time: z.string().min(1, "La hora de fin es obligatoria"),
  })).min(1),
  status: z.enum(["pending", "approved"]),
});

type TimeSheetFormValues = z.infer<typeof timeSheetFormSchema>;

interface TimeSheetFormProps {
  isOpen: boolean;
  onClose: () => void;
  refetch: () => void;
  defaultTab?: 'registro' | 'incidencia';
  editTarget?: {
    taskTrackerId: string;
    startId: string;
    endId: string;
    employeeId: string;
    currentStartTime: string;
    currentEndTime: string;
    currentStatus: string;
    incidenceCategoryId?: string;
    isPaid?: boolean;
  } | null;
}

export default function TimeSheetForm({
  isOpen,
  onClose,
  refetch,
  editTarget,
  defaultTab = 'registro',
}: TimeSheetFormProps) {
  const isEdit = !!editTarget;

  const [activeTab, setActiveTab] = useState<'registro' | 'incidencia'>(defaultTab);
  const [employees, setEmployees] = useState<PaginatedRequestHandler<Employee>>({
    data: [], loading: false, total_pages: 0, total: 0
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Incidence tab state
  const [incEmployeeId, setIncEmployeeId] = useState('');
  const [incCategoryId, setIncCategoryId] = useState('');
  const [incStartDate, setIncStartDate] = useState('');
  const [incEndDate, setIncEndDate] = useState('');
  const [incAllDay, setIncAllDay] = useState(true);
  const [incPaid, setIncPaid] = useState(false);
  const [incStartTime, setIncStartTime] = useState('09:00');
  const [incEndTime, setIncEndTime] = useState('17:00');

  // Incidences attached to a registro
  const [incEntries, setIncEntries] = useState<Array<{
    id: string;
    categoryId: string;
    startTime: string;
    endTime: string;
    paid: boolean;
  }>>([]);

  const addIncEntry = () => setIncEntries(prev => [...prev, {
    id: String(Date.now()),
    categoryId: '',
    startTime: '13:00',
    endTime: '17:00',
    paid: false,
  }]);

  const removeIncEntry = (id: string) => setIncEntries(prev => prev.filter(e => e.id !== id));

  const updateIncEntry = (id: string, key: string, value: any) =>
    setIncEntries(prev => prev.map(e => e.id === id ? { ...e, [key]: value } : e));

  // Existing incidences shown in edit mode
  const [existingIncidences, setExistingIncidences] = useState<any[]>([]);
  const [incLoading, setIncLoading] = useState(false);

  const handleDeleteExistingIncidence = async (id: string) => {
    try {
      await deleteIncidence(id);
      setExistingIncidences(prev => prev.filter(i => i.id !== id));
      toast.success("Incidencia eliminada");
    } catch {
      toast.error("Error al eliminar la incidencia");
    }
  };

  const form = useForm<TimeSheetFormValues>({
    resolver: zodResolver(timeSheetFormSchema),
    defaultValues: {
      employee_id: "",
      incidence_category_id: "",
      is_paid: false,
      ranges: [{ start_time: "", end_time: "" }],
      status: "pending",
    },
  });

  useEffect(() => {
    if (isOpen) setActiveTab(isEdit ? 'registro' : defaultTab);
  }, [isOpen, defaultTab, isEdit]);

  useEffect(() => {
    if (!isOpen) return;

    setEmployees(prev => ({ ...prev, loading: true }));
    getEmployees({ page: 1, search: employeeSearch }).then((res) => {
      const { data, total, total_pages } = res || {};
      setEmployees({ data: data || [], loading: false, total: total || 0, total_pages: total_pages || 1 });
    });

    getIncidenceCategories().then((res: any) => {
      if (res?.success) setCategories(res.data);
    });
  }, [isOpen, employeeSearch]);

  const toLocalDatetimeLocal = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().slice(0, 16);
  };

  useEffect(() => {
    if (!isOpen) return;
    if (isEdit && editTarget) {
      form.reset({
        employee_id: editTarget.employeeId,
        incidence_category_id: editTarget.incidenceCategoryId || "none",
        is_paid: !!editTarget.isPaid,
        ranges: [{
          start_time: toLocalDatetimeLocal(editTarget.currentStartTime),
          end_time: editTarget.currentEndTime ? toLocalDatetimeLocal(editTarget.currentEndTime) : '',
        }],
        status: editTarget.currentStatus as "pending" | "approved",
      });
    } else {
      form.reset({
        employee_id: "",
        incidence_category_id: "",
        is_paid: false,
        ranges: [{ start_time: "", end_time: "" }],
        status: "pending",
      });
      setIncEmployeeId('');
      setIncCategoryId('');
      setIncStartDate('');
      setIncEndDate('');
      setIncAllDay(true);
      setIncPaid(false);
      setIncEntries([]);
      setExistingIncidences([]);
    }
  }, [isOpen, editTarget]);

  useEffect(() => {
    if (!isOpen || !isEdit || !editTarget) return;
    const date = editTarget.currentStartTime.split('T')[0];
    setIncLoading(true);
    getIncidences({ employee_id: editTarget.employeeId, date } as any).then((res: any) => {
      setExistingIncidences(res?.data || []);
      setIncLoading(false);
    });
  }, [isOpen, isEdit, editTarget?.employeeId, editTarget?.currentStartTime]);

  const toUTCISOString = (localDateString: string) => new Date(localDateString).toISOString();

  const handleRegistroSubmit = async (values: TimeSheetFormValues) => {
    for (const range of values.ranges) {
      if (new Date(range.end_time) <= new Date(range.start_time)) {
        toast.error("La hora de fin debe ser mayor a la de inicio en todos los rangos");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const basePayload = {
        employee_id: values.employee_id,
        incidence_category_id: values.incidence_category_id && values.incidence_category_id !== 'none'
          ? values.incidence_category_id : undefined,
        is_paid: values.is_paid,
        status: values.status,
      };

      if (isEdit && editTarget) {
        await updateTimeSheet(editTarget.taskTrackerId, editTarget.startId, editTarget.endId, {
          ...basePayload,
          start_time: toUTCISOString(values.ranges[0].start_time),
          end_time: toUTCISOString(values.ranges[0].end_time),
        });
      } else {
        for (const range of values.ranges) {
          await createTimeSheet({
            ...basePayload,
            name: basePayload.incidence_category_id
              ? categories.find(c => c.id === basePayload.incidence_category_id)?.name || "Incidencia"
              : "Registro Manual",
            start_time: toUTCISOString(range.start_time),
            end_time: toUTCISOString(range.end_time),
          });
        }
      }

      // Create new incidence entries (both create and edit mode)
      if (incEntries.length > 0) {
        const baseDate = values.ranges[0].start_time.split('T')[0];
        for (const entry of incEntries) {
          if (!entry.categoryId || !entry.startTime || !entry.endTime) continue;
          const cat = categories.find(c => c.id === entry.categoryId);
          await createIncidence({
            category_id: entry.categoryId,
            type: cat?.type,
            start_date: toUTCISOString(`${baseDate}T${entry.startTime}`),
            end_date: toUTCISOString(`${baseDate}T${entry.endTime}`),
            all_day: false,
            paid: entry.paid,
            is_global: false,
            employee_ids: [values.employee_id],
            profile_ids: [],
          });
        }
      }

      toast.success(isEdit ? "Registro actualizado" : "Registro(s) creado(s) correctamente");
      refetch();
      onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Hubo un error al guardar el registro");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIncidenceSubmit = async () => {
    if (!incEmployeeId) { toast.error("El empleado es obligatorio"); return; }
    if (!incCategoryId) { toast.error("La categoría es obligatoria"); return; }
    if (!incStartDate) { toast.error("La fecha de inicio es obligatoria"); return; }

    const endDateStr = incEndDate || incStartDate;
    const startDate = incAllDay
      ? new Date(incStartDate + 'T00:00:00').toISOString()
      : new Date(incStartDate + 'T' + incStartTime + ':00').toISOString();
    const endDate = incAllDay
      ? new Date(endDateStr + 'T23:59:59').toISOString()
      : new Date(endDateStr + 'T' + incEndTime + ':00').toISOString();

    const selectedCat = categories.find(c => c.id === incCategoryId);

    setIsSubmitting(true);
    try {
      const res: any = await createIncidence({
        category_id: incCategoryId,
        type: selectedCat?.type,
        start_date: startDate,
        end_date: endDate,
        all_day: incAllDay,
        paid: incPaid,
        is_global: false,
        employee_ids: [incEmployeeId],
        profile_ids: [],
      });

      if (res?.success || res?.id) {
        toast.success("Incidencia creada correctamente");
        refetch();
        onClose();
      } else {
        toast.error("Hubo un error al crear la incidencia");
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Hubo un error al crear la incidencia");
    } finally {
      setIsSubmitting(false);
    }
  };

  const addRange = () => {
    const ranges = form.getValues('ranges');
    if (ranges.length < 2) form.setValue('ranges', [...ranges, { start_time: "", end_time: "" }]);
  };

  const removeRange = (index: number) => {
    const ranges = form.getValues('ranges');
    if (ranges.length > 1) form.setValue('ranges', ranges.filter((_, i) => i !== index));
  };

  const employeeOptions = employees.data.map((e: Employee) => ({
    value: e.id,
    label: `${e.first_name} ${e.last_name || ''}`
  }));

  return (
    <Dialog open={isOpen} onOpenChange={() => { form.reset(); onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-0 bg-white dialog-close-btn-white">
        <DialogHeader className="px-8 py-6 bg-gradient-brand text-white">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-primary rounded-md flex items-center justify-center">
              {activeTab === 'incidencia'
                ? <CalendarDays className="w-5 h-5 text-white" />
                : <Clock className="w-5 h-5 text-white" />
              }
            </div>
            {isEdit ? "Editar Registro" : activeTab === 'incidencia' ? "Nueva Incidencia" : "Nuevo Registro"}
          </DialogTitle>
          <DialogDescription className="text-slate-200 mt-2">
            {isEdit
              ? "Modifica los datos del registro seleccionado"
              : "Registra horas trabajadas o una incidencia para un empleado"
            }
          </DialogDescription>
        </DialogHeader>

        <div className="p-8 space-y-6">
          {/* Tab selector — solo en creación */}
          {!isEdit && (
            <div className="flex rounded-md bg-slate-100 p-1 gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('registro')}
                className={cn(
                  "flex-1 rounded py-2 text-sm font-medium transition-colors",
                  activeTab === 'registro'
                    ? "bg-white shadow text-brand-primary"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <Clock className="inline w-3.5 h-3.5 mr-1.5" />
                Registro de Horas
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('incidencia')}
                className={cn(
                  "flex-1 rounded py-2 text-sm font-medium transition-colors",
                  activeTab === 'incidencia'
                    ? "bg-white shadow text-brand-primary"
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                <CalendarDays className="inline w-3.5 h-3.5 mr-1.5" />
                Incidencia
              </button>
            </div>
          )}

          {/* ── TAB: REGISTRO DE HORAS ── */}
          {(activeTab === 'registro' || isEdit) && (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleRegistroSubmit)} className="space-y-6">

                <FormField
                  control={form.control}
                  name="employee_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-slate-700">Empleado *</FormLabel>
                      <FormControl>
                        <MultiCombobox
                          options={employeeOptions}
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="incidence_category_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700">Tipo de Incidencia</FormLabel>
                        <Select
                          onValueChange={(v) => {
                            field.onChange(v);
                            const cat = categories.find(c => c.id === v);
                            if (cat) form.setValue('is_paid', cat.paid);
                          }}
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="h-10 border-slate-300">
                              <SelectValue placeholder="Opcional" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">Sin incidencia (Trabajo)</SelectItem>
                            {categories.map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="is_paid"
                    render={({ field }) => (
                      <FormItem className="flex flex-col justify-center space-y-2">
                        <FormLabel className="text-sm font-medium text-slate-700">¿Es paga?</FormLabel>
                        <FormControl>
                          <div className="flex items-center space-x-2">
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                            <span className="text-sm text-slate-500">{field.value ? 'Sí' : 'No'}</span>
                          </div>
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-sm font-bold text-slate-800 uppercase tracking-wider">Rangos Horarios</FormLabel>
                    {!isEdit && form.watch('ranges').length < 2 && (
                      <Button type="button" variant="ghost" size="sm" onClick={addRange} className="text-brand-primary h-8">
                        <Plus className="w-4 h-4 mr-1" /> Añadir segundo rango
                      </Button>
                    )}
                  </div>

                  {form.watch('ranges').map((_, index) => (
                    <div key={index} className="p-4 border border-slate-200 rounded-lg bg-slate-50 space-y-4 relative group">
                      {!isEdit && index > 0 && (
                        <Button
                          type="button" variant="ghost" size="sm"
                          onClick={() => removeRange(index)}
                          className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full bg-white border border-slate-200 text-red-500 hover:bg-red-50 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`ranges.${index}.start_time`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-slate-500">Hora de Inicio *</FormLabel>
                              <FormControl>
                                <Input type="datetime-local" {...field} className="h-9 border-slate-300 text-sm" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name={`ranges.${index}.end_time`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-slate-500">Hora de Fin *</FormLabel>
                              <FormControl>
                                <Input
                                  type="datetime-local" {...field}
                                  min={form.watch(`ranges.${index}.start_time`) || undefined}
                                  className="h-9 border-slate-300 text-sm"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Incidencias del día */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-sm font-bold text-slate-800 uppercase tracking-wider">Incidencias del día</FormLabel>
                    <Button type="button" variant="ghost" size="sm" onClick={addIncEntry} className="text-brand-primary h-8">
                      <Plus className="w-4 h-4 mr-1" /> Agregar incidencia
                    </Button>
                  </div>

                  {/* Existing incidences (edit mode) */}
                  {isEdit && (
                    incLoading ? (
                      <div className="flex justify-center py-3"><RingLoading /></div>
                    ) : existingIncidences.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-2">Sin incidencias para este día</p>
                    ) : (
                      existingIncidences.map((inc: any) => {
                        const typeMeta = IncidenceType[inc.type as keyof typeof IncidenceType];
                        const startTime = inc.start_date ? new Date(inc.start_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '—';
                        const endTime = inc.end_date ? new Date(inc.end_date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '—';
                        return (
                          <div key={inc.id} className="flex items-center justify-between p-2.5 border border-slate-200 rounded-lg bg-slate-50 gap-3">
                            <div className="flex items-center gap-2 min-w-0">
                              {typeMeta && (
                                <span
                                  className="text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0"
                                  style={{ backgroundColor: typeMeta.bgHex, color: typeMeta.textHex }}
                                >
                                  {typeMeta.label}
                                </span>
                              )}
                              <span className="text-xs text-slate-600 truncate">{inc.description || '—'}</span>
                              <span className="text-xs text-slate-400 shrink-0">{startTime} – {endTime}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteExistingIncidence(inc.id)}
                              className="h-6 w-6 flex items-center justify-center rounded text-red-400 hover:text-red-600 hover:bg-red-50 shrink-0"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })
                    )
                  )}

                  {/* New incidence entries to be created on submit */}
                  {incEntries.map(entry => (
                    <div key={entry.id} className="p-3 border border-slate-200 rounded-lg bg-amber-50 relative group">
                      <button
                        type="button"
                        onClick={() => removeIncEntry(entry.id)}
                        className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center rounded-full bg-white border border-slate-200 text-red-500 hover:bg-red-50 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>

                      <div className="mb-2">
                        <Label className="text-xs font-medium text-slate-500 mb-1 block">Categoría de incidencia</Label>
                        <Select
                          value={entry.categoryId}
                          onValueChange={(v) => {
                            updateIncEntry(entry.id, 'categoryId', v);
                            const cat = categories.find(c => c.id === v);
                            if (cat) updateIncEntry(entry.id, 'paid', cat.paid);
                          }}
                        >
                          <SelectTrigger className="h-8 border-slate-300 text-sm">
                            <SelectValue placeholder="Seleccionar categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map(cat => (
                              <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-3 items-end">
                        <div>
                          <Label className="text-xs font-medium text-slate-500 mb-1 block">Hora inicio</Label>
                          <Input
                            type="time"
                            value={entry.startTime}
                            onChange={e => updateIncEntry(entry.id, 'startTime', e.target.value)}
                            className="h-8 border-slate-300 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-xs font-medium text-slate-500 mb-1 block">Hora fin</Label>
                          <Input
                            type="time"
                            value={entry.endTime}
                            onChange={e => updateIncEntry(entry.id, 'endTime', e.target.value)}
                            className="h-8 border-slate-300 text-sm"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <Switch
                          checked={entry.paid}
                          onCheckedChange={(v) => updateIncEntry(entry.id, 'paid', v)}
                        />
                        <span className="text-xs text-slate-500">Incidencia remunerada</span>
                      </div>
                    </div>
                  ))}
                </div>

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-slate-700">Estado</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-10 border-slate-300">
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
                  <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="px-8 h-10">
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="px-8 h-10 bg-brand-primary text-white">
                    {isSubmitting
                      ? <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando...</div>
                      : isEdit ? "Actualizar Registro" : "Crear Registro"
                    }
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {/* ── TAB: INCIDENCIA ── */}
          {activeTab === 'incidencia' && !isEdit && (
            <div className="space-y-5">
              {/* Empleado */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Empleado *</Label>
                <MultiCombobox
                  options={employeeOptions}
                  values={incEmployeeId}
                  onSearchChange={setEmployeeSearch}
                  onValuesChange={(v) => setIncEmployeeId(Array.isArray(v) ? v[0] : v)}
                  placeholder="Seleccionar empleado"
                  searchPlaceholder="Buscar empleado"
                  emptyMessage="No se encontraron empleados"
                  loading={employees.loading}
                  multiple={false}
                  className="w-full h-10 border-slate-300"
                />
              </div>

              {/* Categoría */}
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-slate-700">Categoría *</Label>
                <Select
                  value={incCategoryId}
                  onValueChange={(v) => {
                    setIncCategoryId(v);
                    const cat = categories.find(c => c.id === v);
                    if (cat) setIncPaid(cat.paid);
                  }}
                >
                  <SelectTrigger className="h-10 border-slate-300">
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Fecha inicio *</Label>
                  <Input type="date" value={incStartDate} onChange={e => setIncStartDate(e.target.value)} className="h-10 border-slate-300" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium text-slate-700">Fecha fin</Label>
                  <Input type="date" value={incEndDate} min={incStartDate} onChange={e => setIncEndDate(e.target.value)} className="h-10 border-slate-300" />
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Todo el día</p>
                    <p className="text-xs text-slate-500">Sin horas específicas</p>
                  </div>
                  <Switch checked={incAllDay} onCheckedChange={setIncAllDay} />
                </div>
                <div className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">Incidencia paga</p>
                    <p className="text-xs text-slate-500">Remunerada normalmente</p>
                  </div>
                  <Switch checked={incPaid} onCheckedChange={setIncPaid} />
                </div>
              </div>

              {/* Horas específicas si no es todo el día */}
              {!incAllDay && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Hora inicio</Label>
                    <Input type="time" value={incStartTime} onChange={e => setIncStartTime(e.target.value)} className="h-10 border-slate-300" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium text-slate-700">Hora fin</Label>
                    <Input type="time" value={incEndTime} onChange={e => setIncEndTime(e.target.value)} className="h-10 border-slate-300" />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-4 pt-4 border-t border-slate-200">
                <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting} className="px-8 h-10">
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleIncidenceSubmit}
                  disabled={isSubmitting || !incEmployeeId || !incCategoryId || !incStartDate}
                  className="px-8 h-10 bg-brand-primary text-white"
                >
                  {isSubmitting
                    ? <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Guardando...</div>
                    : "Crear Incidencia"
                  }
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
