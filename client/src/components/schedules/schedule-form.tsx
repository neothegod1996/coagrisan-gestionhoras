"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Clock, Clock4 } from "lucide-react";
import { Schedule, ScheduleFormData, ShiftTypeEnum, DaysEnum, Days } from "@/types/schedule";
import { scheduleFormSchema, ScheduleFormValues } from "@/zod/schedule";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
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
  FormDescription,
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
import { createSchedule, getSchedule, updateSchedule } from "@/services/schedule";
import { toast } from "react-hot-toast";
import { RequestHandler } from "@/types";
import RingLoading from "../loading/Ring";
import dayjs from "dayjs";


interface ScheduleFormProps {
  isOpen: boolean;
  onClose: () => void;
  schedule_id?: string | null;
  refetch: () => void;
}

export default function ScheduleForm({
  isOpen,
  onClose,
  schedule_id,
  refetch,
}: ScheduleFormProps) {
  const [schedule, setSchedule] = useState<RequestHandler<Schedule | null>>({ data: null, loading: true });

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: {
      name: "",
      description: "",
      sessions: [
        {
          start_time: "09:00",
          end_time: "17:00",
          shift_type: ShiftTypeEnum.Morning,
          has_break: false,
        }
      ],
      days: [DaysEnum.Monday],
    },
  });

  useEffect(() => {
    if (schedule_id && schedule) {
      form.reset({
        name: schedule.data?.name,
        description: schedule.data?.description || "",
        sessions: schedule.data?.sessions.map(session => ({
          id: session.id,
          start_time: session.start_time ? dayjs(session.start_time).format('HH:mm') : undefined,
          end_time: session.end_time ? dayjs(session.end_time).format('HH:mm') : undefined,
          total_time: session.total_time,
          shift_type: session.shift_type,
          has_break: session.has_break,
          break_start_time: session.break_start_time ? dayjs(session.break_start_time).format('HH:mm') : undefined,
          break_end_time: session.break_end_time ? dayjs(session.break_end_time).format('HH:mm') : undefined,
        })),
        days: schedule.data?.days,
      });
    } else if (!schedule_id) {
      form.reset({
        name: "",
        description: "",
        sessions: [
          {
            start_time: "09:00",
            end_time: "17:00",
            shift_type: ShiftTypeEnum.Morning,
            has_break: false,
          }
        ],
        days: [DaysEnum.Monday],
      });
    }
  }, [schedule, schedule_id, form]);

  useEffect(() => {
    if (isOpen && !schedule_id) {
      setSchedule({ data: null, loading: false });
      return;
    }
    if (!isOpen || !schedule_id) return;

    setSchedule({ data: null, loading: true });
    getSchedule(schedule_id).then((res) => {
      const { data } = res || {};
      setSchedule({ data: data || null, loading: false });
      form.reset({
        name: data?.name,
        description: data?.description || "",
        sessions: data?.sessions.map(session => ({
          id: session.id,
          start_time: session.start_time ? dayjs(session.start_time).format('HH:mm') : undefined,
          end_time: session.end_time ? dayjs(session.end_time).format('HH:mm') : undefined,
          total_time: session.total_time || undefined,
          shift_type: session.shift_type,
          has_break: session.has_break,
          break_start_time: session.break_start_time ? dayjs(session.break_start_time).format('HH:mm') : undefined,
          break_end_time: session.break_end_time ? dayjs(session.break_end_time).format('HH:mm') : undefined,
        })),
        days: data?.days,
      });
    });
  }, [isOpen, schedule_id]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (values: ScheduleFormValues) => {
    setIsSubmitting(true);

    try {
      const formData: ScheduleFormData = {
        id: schedule_id || undefined,
        name: values.name,
        description: values.description,
        sessions: values.sessions,
        days: values.days,
      };

      if(schedule_id) {
        await updateSchedule(schedule_id, formData);
      } else {
        await createSchedule(formData);
      }
      toast.success("Horario guardado correctamente");
      
      onClose();
      refetch();
    } catch (error) {
      toast.error("Hubo un error al guardar el horario, por favor intente nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const sessions = form.watch("sessions") || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 bg-white dialog-close-btn-white">
        <DialogHeader className="px-8 py-6 bg-gradient-brand text-white">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-primary rounded-md flex items-center justify-center">
              <Clock4 className="w-5 h-5 text-white" />
            </div>
            {schedule_id ? "Editar Horario" : "Nuevo Horario"}
          </DialogTitle>
          <DialogDescription className="text-slate-200 mt-2">
            {schedule_id
              ? "Modifica los datos del horario seleccionado"
              : "Completa todos los campos para crear un nuevo horario"
            }
          </DialogDescription>
        </DialogHeader>

        {schedule.loading ? (
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
                      <Clock4 className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800">Información del Horario</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nombre del Horario *</FormLabel>
                          <FormControl>
                            <Input placeholder="Ej: Turno Mañana" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción</FormLabel>
                          <FormControl>
                            <Input placeholder="Descripción opcional del horario" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Días de la Semana */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                    <div className="w-8 h-8 bg-brand-primary rounded-md flex items-center justify-center">
                      <Clock4 className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800">Días de la Semana</h3>
                  </div>

                  <FormField
                    control={form.control}
                    name="days"
                    render={() => (
                      <FormItem>
                        <div className="grid grid-cols-7 gap-2">
                          {Object.entries(DaysEnum).map(([key, value]) => (
                            <FormField
                              key={value}
                              control={form.control}
                              name="days"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={value}
                                    className="flex flex-row items-center space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(value)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, value])
                                            : field.onChange(
                                              field.value?.filter(
                                                (day) => day !== value
                                              )
                                            )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal cursor-pointer">
                                      {Days[value].label}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Sesiones */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                    <div className="w-8 h-8 bg-brand-primary rounded-md flex items-center justify-center">
                      <Clock4 className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800">Sesiones de Trabajo</h3>
                  </div>

                  {(sessions || []).map((session, index) => (
                    <div key={index} className="border border-slate-200 rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-md font-medium text-slate-700">
                          Sesión {index + 1}
                        </h4>
                        {(sessions || []).length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newSessions = (sessions || []).filter((_, i) => i !== index);
                              form.setValue("sessions", newSessions);
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            Eliminar
                          </Button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name={`sessions.${index}.start_time`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hora de Entrada *</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="time"
                                  placeholder="08:00"
                                  className="rounded-md"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`sessions.${index}.end_time`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hora de Salida *</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="time"
                                  placeholder="14:00"
                                  className="rounded-md"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                      </div>
                      <FormField
                        control={form.control}
                        name={`sessions.${index}.shift_type`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Turno</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={ShiftTypeEnum.Morning}>Mañana</SelectItem>
                                <SelectItem value={ShiftTypeEnum.Afternoon}>Tarde</SelectItem>
                                <SelectItem value={ShiftTypeEnum.Night}>Noche</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Descanso para esta sesión */}
                      <FormField
                        control={form.control}
                        name={`sessions.${index}.has_break`}
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>Habilitar Descanso</FormLabel>
                              <FormDescription>
                                Pausa durante esta sesión
                              </FormDescription>
                            </div>
                          </FormItem>
                        )}
                      />

                      {session.has_break && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name={`sessions.${index}.break_start_time`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Hora de Inicio del Descanso</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="time"
                                    placeholder="10:30"
                                    className="rounded-md"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`sessions.${index}.break_end_time`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>
                                  Hora de Fin del Descanso
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="time"
                                    placeholder="10:45"
                                    className="rounded-md"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      )}
                    </div>
                  ))}

                  {(sessions || []).length < 3 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const newSessions = [
                          ...(sessions || []),
                          {
                            start_time: "15:00",
                            end_time: "17:00",
                            total_time: 2,
                            shift_type: ShiftTypeEnum.Afternoon,
                            has_break: false,
                          }
                        ];
                        form.setValue("sessions", newSessions);
                      }}
                      className="w-full"
                    >
                      Agregar Sesión
                    </Button>
                  )}
                </div>

                <div className="flex justify-end gap-4 pt-8">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-8 py-2 h-10 font-medium border-slate-300 hover:bg-slate-50"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || schedule.loading}
                    className="px-8 py-2 h-10 font-medium bg-brand-primary hover:bg-brand-primary-700 text-white"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Guardando...
                      </div>
                    ) : schedule_id ? "Actualizar Horario" : "Crear Horario"}
                  </Button>
                </div>
              </form>
            </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}