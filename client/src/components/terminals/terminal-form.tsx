"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Monitor } from "lucide-react";
import { Terminal } from "@/types/terminal";
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
import { createTerminal, getTerminal, updateTerminal } from "@/services/terminal";
import toast from "react-hot-toast";
import RingLoading from "../loading/Ring";
import { terminalFormSchema, TerminalFormValues } from "@/zod/terminal";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TerminalFormProps {
  isOpen: boolean;
  onClose: () => void;
  refetch: () => void;
  terminal_id?: string | null;
}

export default function TerminalForm({
  isOpen,
  onClose,
  refetch,
  terminal_id
}: TerminalFormProps) {
  const [terminal, setTerminal] = useState<RequestHandler<Terminal | null>>({ data: null, loading: true });

  const form = useForm<TerminalFormValues>({
    resolver: zodResolver(terminalFormSchema),
    defaultValues: {
      external_id: "",
      name: "",
    },
  });

  useEffect(() => {
    if (isOpen && !terminal.data?.id) {
      form.reset({
        external_id: '',
        name: '',
      });
    }
  }, [isOpen, terminal.data?.id]);

  useEffect(() => {
    if (isOpen && !terminal_id) {
      setTerminal({ data: null, loading: false });
      return;
    }
    if (!isOpen || !terminal_id) return;

    setTerminal({ data: null, loading: true });
    getTerminal(terminal_id).then((res) => {
      const { data } = res || {};
      setTerminal({ data: data || null, loading: false });
      form.reset({
        external_id: data?.external_id || '',
        name: data?.name,
      });
    });
  }, [isOpen, terminal_id]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSubmit = async (values: TerminalFormValues) => {
    setIsSubmitting(true);
    try {
      if (terminal_id) {
        await updateTerminal(terminal_id, values);
      } else {
        await createTerminal(values);
      }
      toast.success("Terminal guardado correctamente");
      refetch();
      onClose();
      setTerminal({ data: null, loading: true });
    } catch (error) {
      console.log(error);
      toast.error("Hubo un error al guardar el terminal, por favor intente nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
    setTerminal({ data: null, loading: true });
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0 bg-white dialog-close-btn-white">
        <DialogHeader className="px-8 py-6 bg-gradient-brand text-white">
          <DialogTitle className="text-2xl font-semibold flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-primary rounded-md flex items-center justify-center">
              <Monitor className="w-5 h-5 text-white" />
            </div>
            {terminal_id ? "Editar Terminal" : "Nuevo Terminal"}
          </DialogTitle>
          <DialogDescription className="text-slate-200 mt-2">
            {terminal_id
              ? "Modifica los datos del terminal seleccionado"
              : "Completa todos los campos para crear un nuevo terminal"
            }
          </DialogDescription>
        </DialogHeader>

        {terminal.loading ? (
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
                    <Monitor className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">Información del Terminal</h3>
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="external_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700">ID Externo *</FormLabel>
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
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium text-slate-700">Nombre *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Terminal Principal, Terminal Almacén, etc."
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
                  disabled={isSubmitting || terminal.loading}
                  className="px-8 py-2 h-10 font-medium bg-brand-primary hover:bg-brand-primary-700 text-white"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Guardando...
                    </div>
                  ) : terminal_id ? "Actualizar Terminal" : "Crear Terminal"}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
