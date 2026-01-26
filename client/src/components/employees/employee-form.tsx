"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarDays, User, Phone, Building2 } from "lucide-react";
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
  const [profileSearch, setProfileSearch] = useState("");
  const [scheduleSearch, setScheduleSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeFormSchema),
  });
  const first_name = form.watch('first_name');

  useEffect(() => {
    if (isOpen && !employee.data?.id) {
      form.reset({
        card_id: '',
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
        is_responsible: false,
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
        is_responsible: data?.is_responsible || false,
      });
    });
  }, [isOpen, employee_id]);

  useEffect(() => {
    if (!employee.data?.id || !profiles.data?.length || !schedules.data?.length || !locations.data?.length) return;
    form.reset({
      profile_id: employee?.data?.profile?.id || '',
      schedule_id: employee?.data?.schedule?.id || '',
      location_id: employee?.data?.location?.id || ''
    });
  }, [employee.data, profiles.data, schedules.data, locations.data])

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
      console.log(error);
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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto p-0 bg-white dialog-close-btn-white">
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
                  <FormField
                    control={form.control}
                    name="schedule_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700">Horario *</FormLabel>
                        <FormControl>
                          <MultiCombobox
                            options={schedules.data.map((schedule) => ({
                              value: schedule.id,
                              label: schedule.name
                            }))}
                            values={field.value || ""}
                            onSearchChange={setScheduleSearch}
                            onValuesChange={field.onChange}
                            placeholder="Seleccionar horario"
                            searchPlaceholder="Buscar horarios por nombre"
                            emptyMessage="No se encontraron horarios"
                            loading={schedules.loading}
                            multiple={false}
                            className="w-full h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="profile_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700">Perfil *</FormLabel>
                        <FormControl>
                          <MultiCombobox
                            options={profiles.data.map((profile) => ({
                              value: profile.id,
                              label: profile.name
                            }))}
                            values={field.value || ""}
                            onSearchChange={setProfileSearch}
                            onValuesChange={field.onChange}
                            placeholder="Seleccionar perfil"
                            searchPlaceholder="Buscar perfiles por nombre"
                            emptyMessage="No se encontraron perfiles"
                            loading={profiles.loading}
                            multiple={false}
                            className="w-full h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="location_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700">Ubicación *</FormLabel>
                        <FormControl>
                          <MultiCombobox
                            options={locations.data.map((location) => ({
                              value: location.id,
                              label: location.name
                            }))}
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
                    )}
                  />
                </div>
              </div>

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
