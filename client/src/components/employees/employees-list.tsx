"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Eye, Edit, Trash2, Users, ArrowLeft } from "lucide-react";
import { Employee, EmployeeFilters } from "@/types/employee";
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
import { Profile } from "@/types/profile";
import { Location } from "@/types/location";
import { getProfiles } from "@/services/profile";
import { getLocations } from "@/services/location";
import RingLoading from "../loading/Ring";
import { deleteEmployee, getEmployees } from "@/services/employee";
import EmployeeForm from "./employee-form";
import { MultiCombobox } from "../ui/multi-combobox";

interface EmployeesListProps {

}

export default function EmployeesList({ }: EmployeesListProps) {
  const [employees, setEmployees] = useState<PaginatedRequestHandler<Employee>>({ data: [], loading: true, total_pages: 0, total: 0 });
  const [search, setSearch] = useState<string>("");
  const [filters, setFilters] = useState<EmployeeFilters>({
    page: 1,
    search,
    profile: undefined,
    location: undefined,
  });

  const [profiles, setProfiles] = useState<PaginatedRequestHandler<Profile>>({ data: [], loading: true, total_pages: 0, total: 0 });
  const [locations, setLocations] = useState<PaginatedRequestHandler<Location>>({ data: [], loading: true, total_pages: 0, total: 0 });
  const [profileSearch, setProfileSearch] = useState("");
  const [locationSearch, setLocationSearch] = useState("");

  const handleGetEmployees = async (filters: EmployeeFilters) => {
    setEmployees({ ...employees, loading: true });
    getEmployees(filters).then((response) => {
      const { data, total_pages, total } = response || {};
      setEmployees({ data: data || [], loading: false, total_pages: total_pages || 0, total: total || 0 });
    });
  }

  useEffect(() => {
    handleGetEmployees(filters);
  }, [filters])

  const handleDeleteEmployee = (id: string) => {
    deleteEmployee(id).then(() => {
      handleGetEmployees(filters);
    });
  }

  const handleGetProfiles = async (search: string) => {
    setProfiles({ ...profiles, loading: true });
    getProfiles({ page: 1, search: search }).then((response) => {
      const { data, total_pages, total } = response || {};
      setProfiles({ data: data || [], loading: false, total_pages: total_pages || 0, total: total || 0 });
    });
  }

  const handleGetLocations = async (search: string) => {
    setLocations({ ...locations, loading: true });
    getLocations({ page: 1, search: search }).then((response) => {
      const { data, total_pages, total } = response || {};
      setLocations({ data: data || [], loading: false, total_pages: total_pages || 0, total: total || 0 });
    });
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      handleGetProfiles(profileSearch);
    }, 500);
    return () => clearTimeout(timeout);
  }, [profileSearch]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      handleGetLocations(locationSearch);
    }, 500);
    return () => clearTimeout(timeout);
  }, [locationSearch]);

  const handlePageChange = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };
  const handleFilterChange = (key: keyof EmployeeFilters, value: string | boolean | undefined) => {
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
    employee_id: string | null;
  }>({
    isOpen: false,
    type: "create",
    employee_id: null,
  });

  return (
    <div className="space-y-6">
      {/* Header Corporativo */}
      <div className="bg-gradient-brand rounded-md p-8 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-primary rounded-md flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold">Gestión de Empleados</h1>
              <p className="text-slate-200 mt-1">Administra la información de tu equipo</p>
            </div>
          </div>
          <Button
            onClick={() => setShowForm({ isOpen: true, type: "create", employee_id: null })}
            className="px-6 py-3 h-11 font-medium bg-brand-primary hover:bg-brand-primary-600 text-white border-0"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Empleado
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
              <Users className="w-4 h-4 text-slate-600" />
            </div>
            <h2 className="text-lg font-semibold text-slate-800">Lista de Empleados</h2>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Barra de búsqueda y filtros */}
          <div className="space-y-4">
            <div className={'flex items-center justify-between'}>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre, código, NIF o email"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="min-w-78 w-fit pl-10 h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
              </div>

              <div className={'grid grid-cols-2 gap-4'}>
                <MultiCombobox
                  options={profiles.data.map((profile) => ({
                    value: profile.id,
                    label: profile.name
                  }))}
                  values={filters.profile || ""}
                  onSearchChange={setProfileSearch}
                  onValuesChange={(value) => handleFilterChange("profile", value as string)}
                  placeholder="Seleccionar perfil"
                  searchPlaceholder="Buscar perfiles por nombre"
                  emptyMessage="No se encontraron perfiles"
                  loading={profiles.loading}
                  multiple={false}
                  className="w-full h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />

                <MultiCombobox
                  options={locations.data.map((location) => ({
                    value: location.id,
                    label: location.name
                  }))}
                  values={filters.location || ""}
                  onSearchChange={setLocationSearch}
                  onValuesChange={(value) => handleFilterChange("location", value as string)}
                  placeholder="Seleccionar ubicación"
                  searchPlaceholder="Buscar ubicaciones por nombre"
                  emptyMessage="No se encontraron ubicaciones"
                  loading={locations.loading}
                  multiple={false}
                  className="w-full h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
                />
              </div>
            </div>
          </div>

          {/* Tabla de empleados */}
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">Código</TableHead>
                  <TableHead className="font-semibold">Nombre Completo</TableHead>
                  <TableHead className="font-semibold">NIF/DNI</TableHead>
                  <TableHead className="font-semibold">Email</TableHead>
                  <TableHead className="font-semibold">Perfil</TableHead>
                  <TableHead className="font-semibold">Horario</TableHead>
                  <TableHead className="font-semibold">Ubicación</TableHead>
                  <TableHead className="font-semibold text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-20 text-gray-500">
                      <RingLoading />
                    </TableCell>
                  </TableRow>
                ) : employees.data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                      No se encontraron empleados
                    </TableCell>
                  </TableRow>
                ) : (
                  employees.data.map((employee) => (
                    <TableRow key={employee.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{employee.employee_code || '—'}</TableCell>
                      <TableCell>
                        <span className="font-medium">
                          {employee.first_name} {employee.last_name}
                        </span>
                      </TableCell>
                      <TableCell>{employee.dni}</TableCell>
                      <TableCell>{employee.email}</TableCell>
                      <TableCell>
                        <Badge className="rounded-full bg-brand-primary-100 text-brand-primary">
                          {employee?.profile?.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="rounded-full bg-brand-primary-100 text-brand-primary">
                          {employee?.schedule?.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className="rounded-full bg-brand-primary-100 text-brand-primary">
                          {employee?.location?.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* <Button
                            variant="outline"
                            size="sm"
                            onClick={() => redirect(`/employees/${employee.id}`)}
                            className="rounded-md p-2"
                          >
                            <Eye className="w-4 h-4" />
                          </Button> */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowForm({ isOpen: true, type: "edit", employee_id: employee.id })}
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
                                <AlertDialogTitle>¿Eliminar empleado?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. Se eliminará permanentemente
                                  el empleado {employee.first_name} {employee.last_name} y todos
                                  sus datos asociados.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-md">
                                  Cancelar
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteEmployee(employee.id)}
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

          {/* Información y paginación */}
          {employees.total_pages > 1 && (
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => handlePageChange(Math.max(1, filters.page - 1))}
                      className={filters.page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>

                  {Array.from({ length: employees.total_pages }, (_, i) => i + 1).map((page) => (
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
                      onClick={() => handlePageChange(Math.min(employees.total_pages, filters.page + 1))}
                      className={filters.page === employees.total_pages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      <EmployeeForm
        isOpen={showForm.isOpen}
        onClose={() => setShowForm({ isOpen: false, type: "create", employee_id: null })}
        refetch={() => handleGetEmployees(filters)}
        employee_id={showForm.employee_id}
      />
    </div>
  );
}
