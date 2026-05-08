"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { createIncidenceCategory, updateIncidenceCategory, getIncidenceCategories } from "@/services/incidence-category";
import { IncidenceTypeEnum, IncidenceType } from "@/types/incidence";
import toast from "react-hot-toast";

const incidenceCategorySchema = z.object({
  name: z.string().min(1, "El nombre es obligatorio"),
  code: z.string().optional(),
  paid: z.boolean(),
  type: z.nativeEnum(IncidenceTypeEnum),
});

type IncidenceCategoryValues = z.infer<typeof incidenceCategorySchema>;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  refetch: () => void;
  category_id?: string | null;
}

export default function IncidenceCategoryForm({
  isOpen,
  onClose,
  refetch,
  category_id,
}: Props) {
  const isEdit = !!category_id;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<IncidenceCategoryValues>({
    resolver: zodResolver(incidenceCategorySchema),
    defaultValues: {
      name: "",
      code: "",
      paid: false,
      type: IncidenceTypeEnum.Other,
    },
  });

  useEffect(() => {
    if (isOpen && isEdit && category_id) {
        // En un proyecto real haríamos fetchById, aquí lo buscamos de la lista o fetch
        // Por simplicidad si no tenemos getById, podemos filtrar de la lista pero es mejor añadir el service
        import("@/services/incidence-category").then(async (service) => {
            const res = await service.getIncidenceCategories() as any;
            if (res.success) {
                const cat = res.data.find((c: any) => c.id === category_id);
                if (cat) {
                    form.reset({
                        name: cat.name,
                        code: cat.code || "",
                        paid: cat.paid,
                        type: cat.type ?? IncidenceTypeEnum.Other,
                    });
                }
            }
        });
    } else if (isOpen) {
      form.reset({
        name: "",
        code: "",
        paid: false,
        type: IncidenceTypeEnum.Other,
      });
    }
  }, [isOpen, category_id]);

  const onSubmit = async (values: IncidenceCategoryValues) => {
    setIsSubmitting(true);
    try {
      const payload = {
        ...values,
        partner_id: localStorage.getItem('partner_id'),
      };
      
      if (isEdit && category_id) {
        await updateIncidenceCategory(category_id, payload);
        toast.success("Categoría actualizada");
      } else {
        await createIncidenceCategory(payload);
        toast.success("Categoría creada");
      }
      refetch();
      onClose();
    } catch (error) {
      toast.error("Error al guardar la categoría");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0 bg-white">
        <DialogHeader className="px-6 py-4 bg-gradient-brand text-white">
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5" />
            {isEdit ? "Editar Categoría" : "Nueva Categoría"}
          </DialogTitle>
          <DialogDescription className="text-slate-200">
            Define el comportamiento de este tipo de incidencia
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ej: Vacaciones, Baja Médica..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código (Opcional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ej: VAC, BAJA..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="paid"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>¿Es remunerada?</FormLabel>
                    <div className="text-[0.7rem] text-muted-foreground">
                      Si se marca, las horas de esta incidencia se contarán como pagadas.
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

            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comportamiento en cálculos</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.entries(IncidenceType).map(([value, meta]) => (
                        <SelectItem key={value} value={value}>
                          {meta.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting} className="bg-brand-primary text-white">
                {isSubmitting ? "Guardando..." : "Guardar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
