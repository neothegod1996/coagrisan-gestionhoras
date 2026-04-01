"use client";

import { es as esLocale } from "date-fns/locale";
import { useState, useEffect } from "react";
import { CalendarIcon, Search, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { PaginatedRequestHandler } from "@/types";
import { TimeTrackingFilters } from "@/types/time-tracking";
import { Employee } from "@/types/employee";
import { Location } from "@/types/location";
import { Profile } from "@/types/profile";
import { MultiCombobox } from "../ui/multi-combobox";
import { getProfiles } from "@/services/profile";
import { getEmployees } from "@/services/employee";
import { getLocations } from "@/services/location";
import dayjs from "dayjs";
import es from "dayjs/locale/es";
dayjs.locale(es);

interface TimeTrackingFiltersProps {
  filters: TimeTrackingFilters;
  onFiltersChange: (filters: TimeTrackingFilters) => void;
  isLoading?: boolean;
}

export default function TimeTrackingFiltersComponent({
  filters,
  onFiltersChange,
  isLoading = false
}: TimeTrackingFiltersProps) {
  const [localFilters, setLocalFilters] = useState<TimeTrackingFilters>(filters);
  const [showFromCalendar, setShowFromCalendar] = useState(false);
  const [showToCalendar, setShowToCalendar] = useState(false);

  const [profiles, setProfiles] = useState<PaginatedRequestHandler<Profile>>({ data: [], loading: true, total_pages: 0, total: 0 });
  const [locations, setLocations] = useState<PaginatedRequestHandler<Location>>({ data: [], loading: true, total_pages: 0, total: 0 });
  const [employees, setEmployees] = useState<PaginatedRequestHandler<Employee>>({ data: [], loading: true, total_pages: 0, total: 0 });
  const [employeeSearch, setEmployeeSearch] = useState<string>("");
  const [locationSearch, setLocationSearch] = useState<string>("");
  const [profileSearch, setProfileSearch] = useState<string>("");

  const handleFilterChange = (key: keyof TimeTrackingFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
  };

  const selectedEmployee = employees.data.find(emp => emp.id === localFilters.employee_id);
  const selectedLocation = locations.data.find(loc => loc.id === localFilters.location_id);
  const selectedProfile = profiles.data.find(profile => profile.id === localFilters.profile_id);

  async function handleGetEmployees(search: string) {
    setEmployees({ data: [], loading: true, total_pages: 0, total: 0 });
    getEmployees({ page: 1, search: search }).then((res) => {
      const { data, total, total_pages } = res || {};
      setEmployees({ data: data || [], loading: false, total: total || 0, total_pages: total_pages || 1 });
    });
  }
  useEffect(() => {
    const timeout = setTimeout(() => {
      handleGetEmployees(employeeSearch);
    }, 500);
    return () => clearTimeout(timeout);
  }, [employeeSearch]);

  async function handleGetLocations(search: string) {
    setLocations({ data: [], loading: true, total_pages: 0, total: 0 });
    getLocations({ page: 1, search: search }).then((res) => {
      const { data, total, total_pages } = res || {};
      setLocations({ data: data || [], loading: false, total: total || 0, total_pages: total_pages || 1 });
    });
  }
  useEffect(() => {
    const timeout = setTimeout(() => {
      handleGetLocations(locationSearch);
    }, 500);
    return () => clearTimeout(timeout);
  }, [locationSearch]);

  async function handleGetProfiles(search: string) {
    setProfiles({ data: [], loading: true, total_pages: 0, total: 0 });
    getProfiles({ page: 1, search: search }).then((res) => {
      const { data, total, total_pages } = res || {};
      setProfiles({ data: data || [], loading: false, total: total || 0, total_pages: total_pages || 1 });
    });
  }
  useEffect(() => {
    const timeout = setTimeout(() => {
      handleGetProfiles(profileSearch);
    }, 500);
    return () => clearTimeout(timeout);
  }, [profileSearch]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Empleado Desde */}
        <div className="space-y-2">
          <Label htmlFor="employee-from" className="text-sm font-medium text-slate-700">
            Empleado
          </Label>
          <MultiCombobox
            options={employees.data.map((employee: Employee) => ({
              value: employee.id,
              label: `${employee.first_name} ${employee.last_name}`
            }))}
            values={localFilters.employee_id || []}
            onSearchChange={setEmployeeSearch}
            onValuesChange={(value) => handleFilterChange('employee_id', value || undefined)}
            placeholder="Seleccionar empleado"
            searchPlaceholder="Buscar empleados por nombre"
            emptyMessage="No se encontraron empleados"
            loading={employees.loading}
            className="w-full h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
            multiple={false}
          />
        </div>

        {/* Ubicación */}
        <div className="space-y-2">
          <Label htmlFor="location" className="text-sm font-medium text-slate-700">
            Ubicación
          </Label>
          <MultiCombobox
            options={locations.data.map((location: Location) => ({
              value: location.id,
              label: location.name
            }))}
            values={localFilters.location_id || []}
            onSearchChange={setLocationSearch}
            onValuesChange={(value) => handleFilterChange('location_id', value || undefined)}
            placeholder="Seleccionar ubicación"
            searchPlaceholder="Buscar ubicaciones por nombre"
            emptyMessage="No se encontraron ubicaciones"
            loading={locations.loading}
            className="w-full h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
            multiple={false}
          />
        </div>

        {/* Centro */}
        <div className="space-y-2">
          <Label htmlFor="center" className="text-sm font-medium text-slate-700">
            Categoría
          </Label>
          <MultiCombobox
            options={profiles.data.map((profile: Profile) => ({
              value: profile.id,
              label: profile.name
            }))}
            values={localFilters.profile_id || []}
            onSearchChange={setProfileSearch}
            onValuesChange={(value) => handleFilterChange('profile_id', value || undefined)}
            placeholder="Seleccionar categoría"
            searchPlaceholder="Buscar categorías por nombre"
            emptyMessage="No se encontraron categorías"
            loading={profiles.loading}
            className="w-full h-10 border-slate-300 focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
            multiple={false}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fecha Desde */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">
            Fecha Desde
          </Label>
          <Popover open={showFromCalendar} onOpenChange={setShowFromCalendar}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {localFilters.start_date ? (
                  dayjs(localFilters.start_date).format("DD [de] MMMM, YYYY")
                ) : (
                  <span>Seleccionar fecha...</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={localFilters.start_date}
                onSelect={(date) => {
                  if (date) {
                    handleFilterChange('start_date', date);
                    setShowFromCalendar(false);
                  }
                }}
                locale={esLocale}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Fecha Hasta */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">
            Fecha Hasta
          </Label>
          <Popover open={showToCalendar} onOpenChange={setShowToCalendar}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {localFilters.end_date ? (
                  dayjs(localFilters.end_date).format("DD [de] MMMM, YYYY")
                ) : (
                  <span>Seleccionar fecha...</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={localFilters.end_date}
                onSelect={(date) => {
                  if (date) {
                    handleFilterChange('end_date', date);
                    setShowToCalendar(false);
                  }
                }}
                locale={esLocale}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Checkbox para limitar a 8 horas */}
      {/* <div className="flex items-center space-x-2">
        <Checkbox
          id="limit-to-8-hours"
          checked={localFilters.limit_to_8_hours || false}
          onCheckedChange={(checked) => handleFilterChange('limit_to_8_hours', checked)}
        />
        <Label htmlFor="limit-to-8-hours" className="text-sm font-medium text-slate-700">
          Limitar a 8 horas máximo
        </Label>
      </div> */}

      {/* Botones de acción */}
      <div className="flex items-center gap-3 pt-4 border-t border-slate-200">
        <Button
          onClick={applyFilters}
          disabled={isLoading}
          className="bg-brand-primary hover:bg-brand-primary-600"
        >
          <Search className="w-4 h-4 mr-2" />
          {isLoading ? 'Buscando...' : 'Buscar'}
        </Button>
      </div>

      {/* Resumen de filtros aplicados */}
      {(localFilters.employee_id || localFilters.location_id || localFilters.profile_id) && (
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <h4 className="text-sm font-medium text-slate-700 mb-2">Filtros aplicados:</h4>
          <div className="flex flex-wrap gap-2">
            {localFilters.employee_id && selectedEmployee && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-brand-primary-100 text-brand-primary">
                Empleado: {selectedEmployee.first_name} {selectedEmployee.last_name}
              </span>
            )}
            {localFilters.location_id && selectedLocation && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-800">
                Ubicación: {selectedLocation.name}
              </span>
            )}
            {localFilters.profile_id && selectedProfile && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-green-100 text-green-800">
                Categoría: {selectedProfile.name}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
