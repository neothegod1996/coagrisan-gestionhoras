"use client";

import { useEffect, useState } from "react";
import { X, Save } from "lucide-react";
import { TaskTracker, CreateTaskTrackerRequest, UpdateTaskTrackerRequest } from "@/types/task-tracker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createTaskTracker, updateTaskTracker, getTaskTrackers } from "@/services/task-tracker";
import { useAuthStore } from "@/store/useAuthStore";

interface TaskTrackerFormProps {
  isOpen: boolean;
  onClose: () => void;
  refetch: () => void;
  task_id: string | null;
}

export default function TaskTrackerForm({ 
  isOpen, 
  onClose, 
  refetch, 
  task_id 
}: TaskTrackerFormProps) {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "Jornada de trabajo",
    description: "",
  });

  const isEditing = task_id !== null;

  useEffect(() => {
    if (isOpen && !isEditing) {
      // Resetear formulario para nueva tarea
      setFormData({
        name: "Jornada de trabajo",
        description: "",
      });
    }
  }, [isOpen, isEditing, task_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    if (!user?.id) {
      console.error("Usuario no autenticado");
      return;
    }

    try {
      setLoading(true);

      if (isEditing && task_id) {
        const updateData: UpdateTaskTrackerRequest = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        };
        
        const result = await updateTaskTracker(task_id, updateData);
        if (result) {
          refetch();
          onClose();
        }
      } else {
        // Capture Geolocation for new tasks
        let latitude: number | undefined;
        let longitude: number | undefined;

        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              enableHighAccuracy: true,
            });
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        } catch (geoError) {
          console.warn("Geolocation permission denied or timed out:", geoError);
        }

        const createData: CreateTaskTrackerRequest = {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          employee_id: user.id,
          latitude,
          longitude,
        };
        
        const result = await createTaskTracker(createData);
        if (result) {
          refetch();
          onClose();
        }
      }
    } catch (error) {
      console.error("Error saving task:", error);
    } finally {
      setFormData({
        name: "Jornada de trabajo",
        description: "",
      });
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {isEditing ? "Editar Tarea" : "Nueva Tarea"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Modifica los datos de la tarea existente."
              : "Crea una nueva tarea para hacer seguimiento del tiempo."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nombre de la tarea *
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Ej: Desarrollo de funcionalidad X"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                required
                disabled={loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Descripción
              </Label>
              <Textarea
                id="description"
                placeholder="Describe brevemente qué incluye esta tarea..."
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className="min-h-[80px] border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary resize-none"
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter className="gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="rounded-md"
            >
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.name.trim()}
              className="rounded-md bg-brand-primary hover:bg-brand-primary-600 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
