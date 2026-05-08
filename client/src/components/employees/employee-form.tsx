"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarDays, User, Phone, Building2, History as HistoryIcon, Plus, Trash2, Calendar, AlertTriangle } from "lucide-react";
import { EmployeeFormData, FullEmployee } from "@/types/employee";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultiCombobox } from "@/components/ui/multi-combobox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { employeeFormSchema } from "@/zod/employee";
import { PaginatedRequestHandler, RequestHandler } from "@/types";
import { Profile } from "@/types/profile";
import { Schedule } from "@/types/schedule";
import { Location } from "@/types/location";
import { getProfiles } from "@/services/profile";
import { getSchedules } from "@/services/schedule";
import { getLocations } from "@/services/location";
import { getAgreements } from "@/services/agreement";
import { createEmployee, getEmployee, updateEmployee } from "@/services/employee";
import RingLoading from "../loading/Ring";
import dayjs from "dayjs";
import es from "dayjs/locale/es";
import { toast } from "react-hot-toast";
import { Switch } from "@/components/ui/switch";
dayjs.locale(es);

type EmployeeFormValues = z.infer<typeof employeeFormSchema>;

interface EmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  refetch: () => void;
  employee_id?: string | null;
}

export default function EmployeeForm({
  isOpen,
  onClose,
  refetch,
  employee_id,
}: EmployeeFormProps) {
  const [employee, setEmployee] = useState<RequestHandler<FullEmployee | null>>({ data: null, loading: true });
  const [profiles, setProfiles] = useState<PaginatedRequestHandler<Profile>>({ data: [], loading: false, total_pages: 0, total: 0 });
  const [schedules, setSchedules] = useState<PaginatedRequestHandler<Schedule>>({ data: [], loading: false, total_pages: 0, total: 0 });
  const [locations, setLocations] = useState<PaginatedRequestHandler<Location>>({ data: [], loading: false, total_pages: 0, total: 0 });
  const [agreements, setAgreements] = useState<PaginatedRequestHandler<any>>({ data: [], loading: false, total_pages: 0, total: 0 });
  const [profileSearch, setProfileSearch] = useState("");
  const [scheduleSearch, setScheduleSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [agreementSearch, setAgreementSearch] = useState("");
  const [isTurnoverModalOpen, setIsTurnoverModalOpen] = useState(false);

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "schedules_history",
  });
  const first_name = form.watch('first_name');

  useEffect(() => {
    if (isOpen && !employee.data?.id) {
      form.reset({
        card_id: '',
        employee_code: '',
        device_pin: '',
        first_name: '',
        last_name: '',
        dni: '',
        birth_date: dayjs().toDate(),
        address: '',
        postal_code: '',
        province: '',
        population: '',
        phone_number: '',
        mobile_number: '',
        email: '',
        alias: '',
        profile_id: '',
        schedule_id: '',
        location_id: '',
        agreement_ids: [],
        is_responsible: false,
        status: 'active',
        schedules_history: [],
        turnover_date: dayjs().toDate(),
        turnover_reason: '',
        turnover_comment: '',
      });
    }
  }, [isOpen, employee.data?.id]);

  useEffect(() => {
    if (isOpen && !employee_id) {
      setEmployee({ data: null, loading: false });
      return;
    }
    if (!isOpen || !employee_id) return;

    setEmployee({ data: null, loading: true });
    getEmployee(employee_id).then((res) => {
      const { data } = res || {};
      setEmployee({ data: data || null, loading: false });

      const birthDate = data?.birth_date ? dayjs(data.birth_date).toDate() : dayjs().toDate();

      form.reset({
        card_id: data?.card_id || '',
        employee_code: data?.employee_code || '',
        device_pin: data?.device_pin || '',
        first_name: data?.first_name || '',
        last_name: data?.last_name || '',
        dni: data?.dni || '',
        birth_date: birthDate,
        address: data?.address || '',
        postal_code: data?.postal_code || '',
        province: data?.province || '',
        phone_number: data?.phone_number || '',
        population: data?.population || '',
        mobile_number: data?.mobile_number || '',
        email: data?.email || '',
        alias: data?.alias || data?.first_name.toUpperCase(),
        profile_id: data?.profile?.id || '',
        schedule_id: data?.schedule?.id || '',
        location_id: data?.location?.id || '',
        agreement_ids: data?.agreements?.map((ea: any) => ea.agreement.id) || [],
        is_responsible: data?.is_responsible || false,
        status: data?.status || 'active',
        schedules_history: data?.schedules_history?.map((sh: any) => ({
          schedule_id: sh.schedule_id,
          start_date: dayjs(sh.start_date).toDate(),
          end_date: sh.end_date ? dayjs(sh.end_date).toDate() : null,
        })) || [],
        turnover_date: dayjs().toDate(),
        turnover_reason: '',
        turnover_comment: '',
      });
    });
  }, [isOpen, employee_id]);

  useEffect(() => {
    if (!employee.data?.id || !profiles.data?.length || !schedules.data?.length || !locations.data?.length) return;
    form.reset({
      ...form.getValues(),
      profile_id: employee?.data?.profile?.id || '',
      schedule_id: employee?.data?.schedule?.id || '',
      location_id: employee?.data?.location?.id || '',
      agreement_ids: (employee?.data as any)?.agreements?.map((ea: any) => ea.agreement.id) || [],
    });
  }, [employee.data, profiles.data, schedules.data, locations.data, agreements.data])

  useEffect(() => {
    if (!isOpen) return;

    setProfiles(prev => ({ ...prev, loading: true }));
    getProfiles({ page: 1, limit: 1000, search: profileSearch }).then((res) => {
      const { data, total, total_pages } = res || {};
      setProfiles({ data: data || [], loading: false, total: total || 0, total_pages: total_pages || 1 });
    });
  }, [isOpen, profileSearch]);

  useEffect(() => {
    if (!isOpen) return;

    setSchedules(prev => ({ ...prev, loading: true }));
    getSchedules({ page: 1, limit: 1000, search: scheduleSearch }).then((res) => {
      const { data, total, total_pages } = res || {};
      setSchedules({ data: data || [], loading: false, total: total || 0, total_pages: total_pages || 1 });
    });
  }, [isOpen, scheduleSearch]);

  useEffect(() => {
    if (!isOpen) return;

    setLocations(prev => ({ ...prev, loading: true }));
    getLocations({ page: 1, limit: 1000, search: locationSearch }).then((res) => {
      const { data, total, total_pages } = res || {};
      setLocations({ data: data || [], loading: false, total: total || 0, total_pages: total_pages || 1 });
    });
  }, [isOpen, locationSearch]);

  useEffect(() => {
    if (!isOpen) return;

    setAgreements(prev => ({ ...prev, loading: true }));
    getAgreements({ page: 1, limit: 1000, search: agreementSearch }).then((res) => {
      const { data, total, total_pages } = res || {};
      setAgreements({ data: data || [], loading: false, total: total || 0, total_pages: total_pages || 1 });
    });
  }, [isOpen, agreementSearch]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: EmployeeFormValues) => {
    setIsSubmitting(true);
    try {
      if (employee_id) {
        await updateEmployee(employee_id, values);
      } else {
        await createEmployee(values);
      }
      toast.success("Empleado guardado correctamente");
      refetch();
      onClose();
      setEmployee({ data: null, loading: true });
    } catch (error) {
      console.error(error);
      toast.error("Hubo un error al guardar el empleado, por favor intente nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
    setEmployee({ data: null, loading: true });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent style={{ minWidth: "1000px" }} className="max-w-[1400px] w-[95vw] max-h-[90vh] overflow-y-auto p-0 bg-white dialog-close-btn-white">
        <DialogHeader className="px-8 py-6 bg-gradient-brand text-white">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-primary rounded-md flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            {employee_id ? "Editar Empleado" : "Nuevo Empleado"}
          </DialogTitle>
          <DialogDescription className="text-slate-200 mt-2">
            {employee_id
              ? "Modifica los datos del empleado seleccionado"
              : "Completa todos los campos para crear un nuevo empleado"
            }
          </DialogDescription>
        </DialogHeader>

        {employee.loading ? (
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
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">Información Básica</h3>
                </div>

                <FormField
                  control={form.control}
                  name="card_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-slate-700">Número de Tarjeta *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="123456789"
                          {...field}
                          className="h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="device_pin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-slate-700">PIN Dispositivo (ZKTeco)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: 2 o 1234"
                          {...field}
                          className="h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="employee_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-slate-700">Código de Empleado</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ej: EMP001"
                          {...field}
                          className="h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-4">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700">Nombre *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Juan"
                            {...field}
                            className="h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700">Apellidos *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="García López"
                            {...field}
                            className="h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dni"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700">NIF/DNI *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="12345678X"
                            {...field}
                            className="h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="alias"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700">Alias *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="JuanG"
                            {...field}
                            value={employee?.data?.alias || first_name?.toUpperCase()}
                            disabled
                            className="h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="birth_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-slate-700">Fecha de Nacimiento *</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                dayjs(field.value).format("DD [de] MMMM, YYYY")
                              ) : (
                                <span>Selecciona una fecha</span>
                              )}
                              <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            key={field.value ? dayjs(field.value).format('YYYY-MM-DD') : 'no-date'}
                            mode="single"
                            selected={field.value || undefined}
                            defaultMonth={field.value || dayjs().toDate()}
                            onSelect={field.onChange}
                            captionLayout={'dropdown'}
                            disabled={(date) =>
                              date > dayjs().toDate() || date < dayjs("1900-01-01").toDate()
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Información de Contacto */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                  <div className="w-8 h-8 bg-brand-primary-600 rounded-md flex items-center justify-center">
                    <Phone className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">Información de Contacto</h3>
                </div>
                <div className="space-y-6">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700">Dirección *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Calle Principal, 123, 1º A"
                            {...field}
                            className="h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-4">
                    <FormField
                      control={form.control}
                      name="postal_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-slate-700">Código Postal *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="28001"
                              {...field}
                              className="h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="province"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-slate-700">Provincia *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Madrid"
                              {...field}
                              className="h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="population"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-slate-700">Población *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Madrid"
                              {...field}
                              className="h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-slate-700">Teléfono</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="914567890"
                              {...field}
                              className="h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mobile_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-slate-700">Móvil *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="678901234"
                              {...field}
                              className="h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-slate-700">Email *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="juan.garcia@empresa.com"
                              type="email"
                              {...field}
                              className="h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Información Laboral */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                  <div className="w-8 h-8 bg-brand-primary-700 rounded-md flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">Información Laboral</h3>
                </div>

                <FormField
                  control={form.control}
                  name="is_responsible"
                  render={({ field }) => (
                    <FormItem className={'flex'}>
                      <FormLabel className="text-sm font-medium text-slate-700">Es responsable</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        // className="h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-4">
                  {/* Sección de Horarios con Historial */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                        <HistoryIcon className="w-4 h-4" />
                        Planificación de Horarios
                      </FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => append({ schedule_id: "", start_date: new Date(), end_date: null })}
                        className="text-xs h-8 border-brand-primary text-brand-primary hover:bg-brand-primary/5"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Añadir Rango
                      </Button>
                    </div>

                    <div className="space-y-3">
                      {fields.length === 0 && (
                        <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-lg bg-slate-50/50">
                          <p className="text-sm text-slate-500">No hay horarios personalizados asignados.</p>
                          <p className="text-xs text-slate-400 mt-1">Se utilizará el horario base si existe.</p>
                        </div>
                      )}

                      {fields.map((field, index) => (
                        <div
                          key={field.id}
                          className="relative p-4 border border-slate-200 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                            <div className="md:col-span-11 grid grid-cols-1 md:grid-cols-3 gap-4">
                              <FormField
                                control={form.control}
                                name={`schedules_history.${index}.schedule_id`}
                                render={({ field: subField }) => (
                                  <FormItem>
                                    <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Horario</FormLabel>
                                    <FormControl>
                                      <MultiCombobox
                                        options={schedules.data.map(s => ({ value: s.id, label: s.name }))}
                                        values={subField.value || ""}
                                        onSearchChange={setScheduleSearch}
                                        onValuesChange={subField.onChange}
                                        placeholder="Elegir horario"
                                        searchPlaceholder="Buscar..."
                                        emptyMessage="No encontrado"
                                        loading={schedules.loading}
                                        multiple={false}
                                        className="h-9 text-sm"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`schedules_history.${index}.start_date`}
                                render={({ field: subField }) => (
                                  <FormItem>
                                    <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Desde</FormLabel>
                                    <Popover>
                                      <PopoverTrigger asChild>
                                        <FormControl>
                                          <Button
                                            variant="outline"
                                            className={cn(
                                              "w-full h-9 px-3 text-left font-normal text-sm",
                                              !subField.value && "text-muted-foreground"
                                            )}
                                          >
                                            {subField.value ? dayjs(subField.value).format("DD/MM/YYYY") : "Seleccionar"}
                                            <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                          </Button>
                                        </FormControl>
                                      </PopoverTrigger>
                                      <PopoverContent className="w-auto p-0" align="start">
                                        <CalendarComponent
                                          mode="single"
                                          selected={subField.value}
                                          onSelect={subField.onChange}
                                          initialFocus
                                        />
                                      </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`schedules_history.${index}.end_date`}
                                render={({ field: subField }) => (
                                  <FormItem>
                                    <FormLabel className="text-[11px] font-bold text-slate-500 uppercase tracking-wider text-amber-600">Hasta (Opcional)</FormLabel>
                                    <div className="flex gap-2 items-center">
                                      <Popover>
                                        <PopoverTrigger asChild>
                                          <FormControl>
                                            <Button
                                              variant="outline"
                                              className={cn(
                                                "w-full h-9 px-3 text-left font-normal text-sm border-amber-100 bg-amber-50/10",
                                                !subField.value && "text-muted-foreground"
                                              )}
                                            >
                                              {subField.value ? dayjs(subField.value).format("DD/MM/YYYY") : "Actualmente activo"}
                                              <Calendar className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                          </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                          <div className="p-2 border-b border-slate-100 flex justify-end">
                                            <Button variant="ghost" size="sm" onClick={() => subField.onChange(null)}>Limpiar</Button>
                                          </div>
                                          <CalendarComponent
                                            mode="single"
                                            selected={subField.value || undefined}
                                            onSelect={subField.onChange}
                                            initialFocus
                                          />
                                        </PopoverContent>
                                      </Popover>
                                    </div>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                            <div className="md:col-span-1 flex justify-end pb-0.5">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => remove(index)}
                                className="h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="schedule_id"
                    render={({ field }) => {
                      const currentSchedule = employee.data?.schedule;
                      const scheduleOptions = [
                        ...(currentSchedule && !schedules.data.find(s => s.id === currentSchedule.id)
                          ? [{ value: currentSchedule.id, label: currentSchedule.name }] : []),
                        ...schedules.data.map(s => ({ value: s.id, label: s.name })),
                      ];
                      return (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-slate-700">Horario Base (Fallback) *</FormLabel>
                          <FormControl>
                            <MultiCombobox
                              options={scheduleOptions}
                              values={field.value || ""}
                              onSearchChange={setScheduleSearch}
                              onValuesChange={field.onChange}
                              placeholder="Seleccionar horario por defecto"
                              searchPlaceholder="Buscar..."
                              emptyMessage="No se encontraron horarios"
                              loading={schedules.loading}
                              multiple={false}
                              className="w-full h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                            />
                          </FormControl>
                          <div className="text-[11px] text-slate-400 mt-1 italic">
                            Se usará si el empleado ficha fuera de los rangos definidos arriba.
                          </div>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="profile_id"
                    render={({ field }) => {
                      const currentProfile = employee.data?.profile;
                      const profileOptions = [
                        ...(currentProfile && !profiles.data.find(p => p.id === currentProfile.id)
                          ? [{ value: currentProfile.id, label: currentProfile.name }] : []),
                        ...profiles.data.map(p => ({ value: p.id, label: p.name })),
                      ];
                      return (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-slate-700">Categoría *</FormLabel>
                          <FormControl>
                            <MultiCombobox
                              options={profileOptions}
                              values={field.value || ""}
                              onSearchChange={setProfileSearch}
                              onValuesChange={field.onChange}
                              placeholder="Seleccionar categoría"
                              searchPlaceholder="Buscar categorías por nombre"
                              emptyMessage="No se encontraron categorías"
                              loading={profiles.loading}
                              multiple={false}
                              className="w-full h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="location_id"
                    render={({ field }) => {
                      const currentLocation = employee.data?.location;
                      const locationOptions = [
                        ...(currentLocation && !locations.data.find(l => l.id === currentLocation.id)
                          ? [{ value: currentLocation.id, label: currentLocation.name }] : []),
                        ...locations.data.map(l => ({ value: l.id, label: l.name })),
                      ];
                      return (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-slate-700">Ubicación *</FormLabel>
                          <FormControl>
                            <MultiCombobox
                              options={locationOptions}
                              values={field.value || ""}
                              onSearchChange={setLocationSearch}
                              onValuesChange={field.onChange}
                              placeholder="Seleccionar ubicación"
                              searchPlaceholder="Buscar ubicaciones por nombre"
                              emptyMessage="No se encontraron ubicaciones"
                              loading={locations.loading}
                              multiple={false}
                              className="w-full h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />

                  <FormField
                    control={form.control}
                    name="agreement_ids"
                    render={({ field }) => {
                      const currentAgreements = (employee.data as any)?.agreements || [];
                      const agreementOptions = [
                        ...currentAgreements
                          .filter((ea: any) => !agreements.data.find(a => a.id === ea.agreement.id))
                          .map((ea: any) => ({ value: ea.agreement.id, label: ea.agreement.name })),
                        ...agreements.data.map(a => ({ value: a.id, label: a.name })),
                      ];
                      return (
                        <FormItem className="md:col-span-2">
                          <FormLabel className="text-sm font-medium text-slate-700">Convenio(s)</FormLabel>
                          <FormControl>
                            <MultiCombobox
                              options={agreementOptions}
                              values={Array.isArray(field.value) ? field.value : []}
                              onSearchChange={setAgreementSearch}
                              onValuesChange={field.onChange}
                              placeholder="Seleccionar convenio(s)"
                              searchPlaceholder="Buscar convenios por nombre"
                              emptyMessage="No se encontraron convenios"
                              loading={agreements.loading}
                              multiple={true}
                              className="w-full h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                </div>
              </div>

              {/* Gestión de Estado (Alta/Baja) */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                  <div className="w-8 h-8 bg-brand-primary-800 rounded-md flex items-center justify-center">
                    <HistoryIcon className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">Estado Laboral (Alta / Baja)</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-3 gap-y-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700">Estado Actual</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-10 border-slate-300">
                              <SelectValue placeholder="Seleccionar estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Alta (Activo)</SelectItem>
                            <SelectItem value="inactive">Baja (Inactivo)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Mandetary fields if status is being changed or is a new employee */}
                  {(form.watch('status') !== (employee.data?.status || 'active') || !employee_id) && (
                    <>
                      <FormField
                        control={form.control}
                        name="turnover_date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-slate-700">Fecha del Movimiento</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "w-full justify-start text-left font-normal h-10 border-slate-300",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      dayjs(field.value).format("DD [de] MMMM, YYYY")
                                    ) : (
                                      <span>Selecciona una fecha</span>
                                    )}
                                    <CalendarDays className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <CalendarComponent
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="turnover_reason"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel className="text-sm font-medium text-slate-700">Motivo</FormLabel>
                            <FormControl>
                              <Input
                                placeholder={form.watch('status') === 'active' ? 'Ej: Alta inicial, Reincorporación' : 'Ej: Fin de contrato, Renuncia'}
                                {...field}
                                className="h-10 border-slate-300"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="turnover_comment"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel className="text-sm font-medium text-slate-700">Comentarios Adicionales</FormLabel>
                            <FormControl>
                              <textarea
                                {...field}
                                className="w-full min-h-[80px] p-3 rounded-md border border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary text-sm"
                                placeholder="Cualquier detalle adicional importante sobre este movimiento..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="md:col-span-2 p-3 bg-brand-primary/5 rounded-md border border-brand-primary/20">
                        <p className="text-xs text-brand-primary-700 flex items-center gap-2">
                          <HistoryIcon className="w-3 h-3" />
                          Al guardar, se registrará automáticamente un nuevo movimiento en el historial laboral del empleado.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Historial de Altas y Bajas */}
              {employee_id && employee.data?.employee_turnover && employee.data.employee_turnover.length > 0 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-100 rounded-md flex items-center justify-center">
                        <HistoryIcon className="w-4 h-4 text-slate-600" />
                      </div>
                      <h3 className="text-lg font-semibold text-slate-800">Historial de Movimientos</h3>
                    </div>
                    {employee.data.employee_turnover.length > 3 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsTurnoverModalOpen(true)}
                        className="text-brand-primary hover:text-brand-primary-700 hover:bg-brand-primary/10"
                      >
                        Ver todo ({employee.data.employee_turnover.length})
                      </Button>
                    )}
                  </div>

                  <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Fecha</th>
                          <th className="px-4 py-3 text-center">Tipo</th>
                          <th className="px-4 py-3">Motivo</th>
                          <th className="px-4 py-3">Comentarios</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 text-slate-700">
                        {employee.data.employee_turnover.slice(0, 3).map((item) => (
                          <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap text-slate-900">
                              {dayjs(item.date).format('DD/MM/YYYY')}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {item.type === 'hiring' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200">
                                  Alta
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                                  Baja
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-800 capitalize">
                              {item.reason ? item.reason.replace(/_/g, ' ') : "-"}
                            </td>
                            <td className="px-4 py-3 text-slate-500 italic max-w-[300px] truncate">
                              {item.comment || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {employee.data.employee_turnover.length > 3 && (
                      <div className="p-3 bg-slate-50 border-t border-slate-200 text-center">
                        <p className="text-xs text-slate-500">
                          Mostrando los 3 movimientos más recientes de un total de {employee.data.employee_turnover.length}.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Modal Historial Completo */}
              <Dialog open={isTurnoverModalOpen} onOpenChange={setIsTurnoverModalOpen}>
                <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col p-0">
                  <DialogHeader className="p-6 bg-gradient-brand text-white">
                    <DialogTitle className="flex items-center gap-3 text-2xl">
                      <div className="w-10 h-10 bg-brand-primary rounded-md flex items-center justify-center">
                        <HistoryIcon className="w-5 h-5 text-white" />
                      </div>
                      Historial de Movimientos
                    </DialogTitle>
                    <DialogDescription className="text-slate-200">
                      Registro detallado de todas las altas y bajas de {employee.data?.first_name} {employee.data?.last_name}.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex-1 overflow-y-auto p-6">
                    <div className="border border-slate-200 rounded-lg overflow-hidden shadow-md">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 sticky top-0 shadow-sm">
                          <tr>
                            <th className="px-4 py-4">Fecha</th>
                            <th className="px-4 py-4 text-center">Tipo de Movimiento</th>
                            <th className="px-4 py-4">Motivo Detallado</th>
                            <th className="px-4 py-4">Comentarios del Administrador</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 text-slate-700">
                          {employee.data?.employee_turnover?.map((item) => (
                            <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="px-4 py-4 whitespace-nowrap text-slate-900 font-semibold">
                                {dayjs(item.date).format('DD/MM/YYYY')}
                              </td>
                              <td className="px-4 py-4 text-center">
                                {item.type === 'hiring' ? (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                                    ALTA
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                                    BAJA
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-4 capitalize font-medium">
                                {item.reason ? item.reason.replace(/_/g, ' ') : "-"}
                              </td>
                              <td className="px-4 py-4 text-slate-600 leading-relaxed">
                                {item.comment || "Sin comentarios adicionales."}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                    <Button variant="outline" className="px-8 border-slate-300" onClick={() => setIsTurnoverModalOpen(false)}>
                      Cerrar Historial
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <div className="flex justify-end gap-4 pt-8">
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
                  disabled={isSubmitting || employee.loading}
                  className="px-8 py-2 h-10 font-medium bg-brand-primary hover:bg-brand-primary-700 text-white"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Guardando...
                    </div>
                  ) : employee_id ? "Actualizar Empleado" : "Crear Empleado"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
