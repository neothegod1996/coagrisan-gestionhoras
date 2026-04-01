"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Edit, Trash2, User, ArrowLeft } from "lucide-react";
import { Profile, ProfileFilters } from "@/types/profile";
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
import { deleteProfile, getProfiles } from "@/services/profile";
import RingLoading from "../loading/Ring";
import ProfileForm from "./profile-form";

interface Props {
  
}
export default function ProfilesList({}: Props) {
  const [profiles, setProfiles] = useState<PaginatedRequestHandler<Profile>>({ data: [], loading: true, total_pages: 0, total: 0 });
  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<ProfileFilters>({
    page: 1,
    search,
    status: undefined
  });

  const handleGetProfiles = async (filters: ProfileFilters) => {
    setProfiles({ ...profiles, loading: true });
    getProfiles(filters).then((response) => {
      const { data, total_pages, total } = response || {};
      setProfiles({ data: data || [], loading: false, total_pages: total_pages || 0, total: total || 0 });
    });
  }

  useEffect(() => {
    handleGetProfiles(filters);
  }, [filters])

  const handleDeleteProfile = (id: string) => {
    deleteProfile(id).then(() => {
      handleGetProfiles(filters);
    });
  }

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };
  const handleFilterChange = (key: keyof ProfileFilters, value: string | boolean | undefined) => {
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
    profile_id: string | null;
  }>({
    isOpen: false,
    type: "create",
    profile_id: null,
  });

  return (
    <div className="space-y-6">
      {/* Header Corporativo */}
      <div className="bg-gradient-brand rounded-md p-8 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-primary rounded-md flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Gestión de Categorías</h1>
              <p className="text-slate-200 mt-1">Administra las categorías de usuario</p>
            </div>
          </div>
          <Button
            onClick={() => setShowForm({ isOpen: true, type: "create", profile_id: null })}
            className="px-6 py-3 h-11 font-medium bg-brand-primary hover:bg-brand-primary-600 text-white border-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Categoría
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
              <User className="w-4 h-4 text-slate-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">Lista de Categorías</h2>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Barra de búsqueda y filtros */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="min-w-72 w-fit pl-10 h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <Select
                  value={filters.status?.toString() || "all"}
                  onValueChange={(value) =>
                    handleFilterChange("status", value === "all" ? undefined : value)
                  }
                >
                  <SelectTrigger className="w-full h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="active">Activos</SelectItem>
                    <SelectItem value="inactive">Inactivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Tabla de perfiles */}
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Código</TableHead>
                  <TableHead className="font-semibold">Nombre</TableHead>
                  <TableHead className="font-semibold">Estado</TableHead>
                  <TableHead className="font-semibold text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {profiles.loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-20 text-gray-500">
                      <RingLoading />
                    </TableCell>
                  </TableRow>
                ) : profiles.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No se encontraron categorías
                    </TableCell>
                  </TableRow>
                ) : (
                  profiles.data.map((profile) => (
                    <TableRow key={profile.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{profile.id.slice(-10)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{profile.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          className={`${profile.status === "active" ? "bg-brand-primary-100 text-brand-primary" : "bg-gray-100 text-gray-800"}`}
                        >
                          {profile.status === "active" ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowForm({ isOpen: true, type: "edit", profile_id: profile.id })}
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
                                <AlertDialogTitle>¿Eliminar categoría?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Se eliminará permanentemente
                                  la categoría {profile.name} y todos sus datos asociados.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-md">
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteProfile(profile.id)}
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

          {profiles.total_pages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(Math.max(1, filters.page - 1))}
                      className={filters.page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from({ length: profiles.total_pages }, (_, i) => i + 1).map((page) => (
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
                      onClick={() => handlePageChange(Math.min(profiles.total_pages, filters.page + 1))}
                      className={filters.page === profiles.total_pages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      <ProfileForm
        isOpen={showForm.isOpen}
        onClose={() => setShowForm({ isOpen: false, type: "create", profile_id: null })}
        profile_id={showForm.profile_id}
        refetch={() => handleGetProfiles(filters)}
      />
    </div>
  );
}
