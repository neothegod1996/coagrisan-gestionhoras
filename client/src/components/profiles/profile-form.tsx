"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { User } from "lucide-react";
import { Profile } from "@/types/profile";
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
import { createProfile, getProfile, updateProfile } from "@/services/profile";
import toast from "react-hot-toast";
import RingLoading from "../loading/Ring";
import { profileFormSchema, ProfileFormValues } from "@/zod/profile";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProfileFormProps {
  isOpen: boolean;
  onClose: () => void;
  refetch: () => void;
  profile_id?: string | null;
}

export default function ProfileForm({
  isOpen,
  onClose,
  refetch,
  profile_id
}: ProfileFormProps) {
  const [profile, setProfile] = useState<RequestHandler<Profile | null>>({ data: null, loading: true });

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      status: "active"
    },
  });

  useEffect(() => {
    if (isOpen && !profile.data?.id) {
      form.reset({
        name: '',
        status: "active"
      });
    }
  }, [isOpen, profile.data?.id]);

  useEffect(() => {
    if (isOpen && !profile_id) {
      setProfile({ data: null, loading: false });
      return;
    }
    if (!isOpen || !profile_id) return;

    setProfile({ data: null, loading: true });
    getProfile(profile_id).then((res) => {
      const { data } = res || {};
      setProfile({ data: data || null, loading: false });
      form.reset({
        name: data?.name,
        status: data?.status
      });
    });
  }, [isOpen, profile_id]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (values: ProfileFormValues) => {
    setIsSubmitting(true);
    try {
      if (profile_id) {
        await updateProfile(profile_id, values);
      } else {
        await createProfile(values);
      }
      toast.success("Categoría guardada correctamente");
      refetch();
      onClose();
      setProfile({ data: null, loading: true });
    } catch (error) {
      console.error(error);
      toast.error("Hubo un error al guardar la categoría, por favor intente nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
    setProfile({ data: null, loading: true });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 bg-white dialog-close-btn-white">
        <DialogHeader className="px-8 py-6 bg-gradient-brand text-white">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-primary rounded-md flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            {profile_id ? "Editar Categoría" : "Nueva Categoría"}
          </DialogTitle>
          <DialogDescription className="text-slate-200 mt-2">
            {profile_id
              ? "Modifica los datos de la categoría seleccionada"
              : "Completa todos los campos para crear una nueva categoría"
            }
          </DialogDescription>
        </DialogHeader>

        {profile.loading ? (
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
                  <h3 className="text-lg font-semibold text-slate-800">Información de la Categoría</h3>
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700">Nombre *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Administrador, Usuario, etc."
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
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700">Estado *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl className={'w-full'}>
                            <SelectTrigger className="h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary">
                              <SelectValue placeholder="Selecciona un estado" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">Activo</SelectItem>
                            <SelectItem value="inactive">Inactivo</SelectItem>
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
                  disabled={isSubmitting || profile.loading}
                  className="px-8 py-2 h-10 font-medium bg-brand-primary hover:bg-brand-primary-700 text-white"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Guardando...
                    </div>
                  ) : profile_id ? "Actualizar Categoría" : "Crear Categoría"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
