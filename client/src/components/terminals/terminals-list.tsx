"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Edit, Trash2, Monitor, ArrowLeft } from "lucide-react";
import { Terminal, TerminalFilters } from "@/types/terminal";
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
import { deleteTerminal, getTerminals } from "@/services/terminal";
import RingLoading from "../loading/Ring";
import TerminalForm from "./terminal-form";

interface Props {
  
}
export default function TerminalsList({}: Props) {
  const [terminals, setTerminals] = useState<PaginatedRequestHandler<Terminal>>({ data: [], loading: true, total_pages: 0, total: 0 });
  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<TerminalFilters>({
    page: 1,
    search,
    connection_status: undefined
  });

  const handleGetTerminals = async (filters: TerminalFilters) => {
    setTerminals({ ...terminals, loading: true });
    getTerminals(filters).then((response) => {
      const { data, total_pages, total } = response || {};
      setTerminals({ data: data || [], loading: false, total_pages: total_pages || 0, total: total || 0 });
    });
  }

  useEffect(() => {
    handleGetTerminals(filters);
  }, [filters])

  const handleDeleteTerminal = (id: string) => {
    deleteTerminal(id).then(() => {
      handleGetTerminals(filters);
    });
  }

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };
  const handleFilterChange = (key: keyof TerminalFilters, value: string | boolean | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search, page: 1 }));
    }, 500);
    return () => clearTimeout(timeout);
  }, [search])

  const [showForm, setShowForm] = useState<{
    isOpen: boolean;
    type: "create" | "edit";
    terminal_id: string | null;
  }>({
    isOpen: false,
    type: "create",
    terminal_id: null,
  });

  const getConnectionStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return "bg-green-100 text-green-800";
      case "failed":
        return "bg-red-100 text-red-800";
      case "disconnected":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getConnectionStatusText = (status: string) => {
    switch (status) {
      case "connected":
        return "Conectado";
      case "failed":
        return "Fallido";
      case "disconnected":
        return "Desconectado";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Corporativo */}
      <div className="bg-gradient-brand rounded-md p-8 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-primary rounded-md flex items-center justify-center">
              <Monitor className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Gestión de Terminales</h1>
              <p className="text-slate-200 mt-1">Administra los terminales de fichaje</p>
            </div>
          </div>
          <Button
            onClick={() => setShowForm({ isOpen: true, type: "create", terminal_id: null })}
            className="px-6 py-3 h-11 font-medium bg-brand-primary hover:bg-brand-primary-600 text-white border-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Terminal
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
              <Monitor className="w-4 h-4 text-slate-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">Lista de Terminales</h2>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Barra de búsqueda y filtros */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre o código"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="min-w-72 w-fit pl-10 h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <Select
                  value={filters.connection_status?.toString() || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("connection_status", value === "all" ? undefined : value)
                  }
                >
                  <SelectTrigger className="w-full h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary">
                    <SelectValue placeholder="Estado de conexión" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="connected">Conectado</SelectItem>
                    <SelectItem value="failed">Fallido</SelectItem>
                    <SelectItem value="disconnected">Desconectado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Tabla de terminales */}
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Código</TableHead>
                  <TableHead className="font-semibold">Nombre</TableHead>
                  <TableHead className="font-semibold">Estado de Conexión</TableHead>
                  <TableHead className="font-semibold text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {terminals.loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-20 text-gray-500">
                      <RingLoading />
                    </TableCell>
                  </TableRow>
                ) : terminals.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No se encontraron terminales
                    </TableCell>
                  </TableRow>
                ) : (
                  terminals.data.map((terminal) => (
                    <TableRow key={terminal.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{terminal.id.slice(-10)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{terminal.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={getConnectionStatusBadge(terminal.connection_status)}
                        >
                          {getConnectionStatusText(terminal.connection_status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowForm({ isOpen: true, type: "edit", terminal_id: terminal.id })}
                            className="rounded-md p-2"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
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
                                <AlertDialogTitle>¿Eliminar terminal?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Se eliminará permanentemente
                                  el terminal {terminal.name} y todos sus datos asociados.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-md">
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteTerminal(terminal.id)}
                                  className="rounded-md bg-red-600 hover:bg-red-700"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {terminals.total_pages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(Math.max(1, filters.page - 1))}
                      className={filters.page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from({ length: terminals.total_pages }, (_, i) => i + 1).map((page) => (
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
                      onClick={() => handlePageChange(Math.min(terminals.total_pages, filters.page + 1))}
                      className={filters.page === terminals.total_pages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      <TerminalForm
        isOpen={showForm.isOpen}
        onClose={() => setShowForm({ isOpen: false, type: "create", terminal_id: null })}
        terminal_id={showForm.terminal_id}
        refetch={() => handleGetTerminals(filters)}
      />
    </div>
  );
}
