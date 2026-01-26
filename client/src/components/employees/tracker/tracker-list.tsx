"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Play, Pause, Square, Clock, ArrowLeft, Edit, Trash2 } from "lucide-react";
import { TaskTracker, TaskTrackerFilters, TaskStatus } from "@/types/task-tracker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { redirect } from "next/navigation";
import { PaginatedRequestHandler } from "@/types";
import RingLoading from "../../loading/Ring";
import { 
  getTaskTrackers, 
  deleteTaskTracker, 
  startTask, 
  stopTask 
} from "@/services/task-tracker";
import TaskTrackerForm from "@/components/employees/tracker/task-tracker-form";
import { Ring, Ring2 } from "ldrs/react";

interface TaskTrackerListProps {}

export default function TaskTrackerList({}: TaskTrackerListProps) {
  const [tasks, setTasks] = useState<PaginatedRequestHandler<TaskTracker>>({ 
    data: [], 
    loading: true, 
    total_pages: 0, 
    total: 0 
  });
  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<TaskTrackerFilters>({
    page: 1,
    search,
    status: undefined,
  });
  const [runningTasks, setRunningTasks] = useState<Set<string>>(new Set());
  const [taskTimers, setTaskTimers] = useState<Map<string, number>>(new Map());

  const handleGetTasks = async (filters: TaskTrackerFilters) => {
    setTasks({ ...tasks, loading: true });
    getTaskTrackers(filters).then((response) => {
      const { data, total_pages, total } = response || {};
      setTasks({ data: data || [], loading: false, total_pages: total_pages || 0, total: total || 0 });
      
      // Identificar tareas en ejecución
      const running = new Set<string>();
      const timers = new Map<string, number>();
      
      data?.forEach((task: TaskTracker) => {
        if (task.status === "running" && task.start_time) {
          running.add(task.id);
          const startTime = new Date(task.start_time).getTime();
          const currentTime = Date.now();
          timers.set(task.id, Math.floor((currentTime - startTime) / 1000));
        }
      });
      
      setRunningTasks(running);
      setTaskTimers(timers);
    });
  };

  useEffect(() => {
    handleGetTasks(filters);
  }, [filters]);

  // Timer para actualizar contadores en tiempo real
  useEffect(() => {
    if (runningTasks.size === 0) return;

    const interval = setInterval(() => {
      setTaskTimers((prev) => {
        const newTimers = new Map(prev);
        runningTasks.forEach((taskId) => {
          const currentTime = newTimers.get(taskId) || 0;
          newTimers.set(taskId, currentTime + 1);
        });
        return newTimers;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [runningTasks]);

  const handleDeleteTask = (id: string) => {
    deleteTaskTracker(id).then(() => {
      handleGetTasks(filters);
    });
  };

  const handleStartTask = async (taskId: string) => {
    const now = new Date().toISOString();
    const result = await startTask({ task_id: taskId, start_time: now });
    if (result) {
      setRunningTasks(prev => new Set([...prev, taskId]));
      setTaskTimers(prev => new Map([...prev, [taskId, 0]]));
      handleGetTasks(filters);
    }
  };

  const handleStopTask = async (taskId: string) => {
    const now = new Date().toISOString();
    const result = await stopTask({ task_id: taskId, end_time: now });
    if (result) {
      setRunningTasks(prev => {
        const newSet = new Set(prev);
        newSet.delete(taskId);
        return newSet;
      });
      setTaskTimers(prev => {
        const newMap = new Map(prev);
        newMap.delete(taskId);
        return newMap;
      });
      handleGetTasks(filters);
    }
  };

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const handleFilterChange = (key: keyof TaskTrackerFilters, value: string | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search, page: 1 }));
    }, 500);
    return () => clearTimeout(timeout);
  }, [search]);

  const [showForm, setShowForm] = useState<{
    isOpen: boolean;
    type: "create" | "edit";
    task_id: string | null;
  }>({
    isOpen: false,
    type: "create",
    task_id: null,
  });

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: TaskStatus) => {
    const statusConfig = {
      pending: { label: "Pendiente", className: "bg-gray-100 text-gray-800" },
      running: { label: "En ejecución", className: "bg-green-100 text-green-800" },
      completed: { label: "Completada", className: "bg-blue-100 text-blue-800" },
      paused: { label: "Pausada", className: "bg-yellow-100 text-yellow-800" },
    };
    
    const config = statusConfig[status];
    return (
      <Badge className={`${config.className} flex items-center gap-2 py-1`}>
        {status === "running" && <Ring color={'var(--primary)'} size={14} stroke={2} />}
        <span className="text-sm">{config.label}</span>
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Corporativo */}
      <div className="bg-gradient-brand rounded-md p-8 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-primary rounded-md flex items-center justify-center">
              <Clock className="w-6 h-6 text-white" />
            </div>
    <div>
              <h1 className="text-2xl font-semibold">Tracker de Tareas</h1>
              <p className="text-slate-200 mt-1">Gestiona y controla el tiempo de tus tareas</p>
            </div>
          </div>
          <Button
            onClick={() => setShowForm({ isOpen: true, type: "create", task_id: null })}
            className="px-6 py-3 h-11 font-medium bg-brand-primary hover:bg-brand-primary-600 text-white border-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Tarea
          </Button>
        </div>
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => redirect('/')}
        className="rounded-md"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Volver
      </Button>

      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-slate-100 rounded-md flex items-center justify-center">
              <Clock className="w-4 h-4 text-slate-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">Lista de Tareas</h2>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Barra de búsqueda y filtros */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre o descripción"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="min-w-72 w-fit pl-10 h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <Select
                  value={filters.status || "all"}
                  onValueChange={(value) => handleFilterChange("status", value === "all" ? undefined : value as TaskStatus)}
                >
                  <SelectTrigger className="w-full h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                    <SelectItem value="running">En ejecución</SelectItem>
                    <SelectItem value="completed">Completadas</SelectItem>
                    <SelectItem value="paused">Pausadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Tabla de tareas */}
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Nombre</TableHead>
                  <TableHead className="font-semibold">Descripción</TableHead>
                  <TableHead className="font-semibold">Estado</TableHead>
                  {/* <TableHead className="font-semibold">Tiempo</TableHead> */}
                  <TableHead className="font-semibold text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-gray-500">
                      <RingLoading />
                    </TableCell>
                  </TableRow>
                ) : tasks.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No se encontraron tareas
                    </TableCell>
                  </TableRow>
                ) : (
                  tasks.data.map((task) => (
                    <TableRow key={task.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{task.name}</TableCell>
                      <TableCell>
                        <span className="text-gray-600">
                          {task.description || "Sin descripción"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(task.status)}
                      </TableCell>
                      {/* <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="font-mono text-sm">
                            {task.status === "running" && taskTimers.has(task.id)
                              ? formatTime(taskTimers.get(task.id) || 0)
                              : task.duration
                              ? formatTime(task.duration)
                              : "00:00:00"}
                          </span>
                        </div>
                      </TableCell> */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {task.status === "pending" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStartTask(task.id)}
                              className="rounded-md p-2 text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <Play className="w-4 h-4" />
                              Iniciar
                            </Button>
                          )}
                          {task.status === "running" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleStopTask(task.id)}
                              className="rounded-md p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Square className="w-4 h-4" />
                              Detener
                            </Button>
                          )}
                          {/* <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-md p-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-lg">
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Se eliminará permanentemente
                                  la tarea &quot;{task.name}&quot; y todos sus datos asociados.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-md">
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteTask(task.id)}
                                  className="rounded-md bg-red-600 hover:bg-red-700"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog> */}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Información y paginación */}
          {tasks.total_pages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(Math.max(1, filters.page - 1))}
                      className={filters.page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from({ length: tasks.total_pages }, (_, i) => i + 1).map((page) => (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => handlePageChange(page)}
                        isActive={page === filters.page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  ))}

                  <PaginationItem>
                    <PaginationNext
                      onClick={() => handlePageChange(Math.min(tasks.total_pages, filters.page + 1))}
                      className={filters.page === tasks.total_pages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      <TaskTrackerForm
        isOpen={showForm.isOpen}
        onClose={() => setShowForm({ isOpen: false, type: "create", task_id: null })}
        refetch={() => handleGetTasks(filters)}
        task_id={showForm.task_id}
      />
    </div>
  );
}