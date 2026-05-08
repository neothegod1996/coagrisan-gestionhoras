"use client";

import { es as esLocale } from "date-fns/locale";
import { useState, useEffect } from "react";
import { CalendarIcon, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { PaginatedRequestHandler } from "@/types";
import { TimeTrackingFilters } from "@/types/time-tracking";
import { Employee } from "@/types/employee";
import { Location } from "@/types/location";
import { Profile } from "@/types/profile";
import { Agreement } from "@/types/agreement";
import { MultiCombobox } from "../ui/multi-combobox";
import { getProfiles } from "@/services/profile";
import { getEmployees } from "@/services/employee";
import { getLocations } from "@/services/location";
import { getAgreements } from "@/services/agreement";
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
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [employeeSearch, setEmployeeSearch] = useState<string>("");
  const [locationSearch, setLocationSearch] = useState<string>("");
  const [profileSearch, setProfileSearch] = useState<string>("");

  const handleFilterChange = (key: keyof TimeTrackingFilters, value: any) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
  };

  const selectedEmployee = employees.data.find(emp => emp.id === localFilters.employee_id);
  const selectedLocation = locations.data.find(loc => loc.id === localFilters.location_id);
  const selectedProfile = profiles.data.find(profile => profile.id === localFilters.profile_id);

  async function handleGetEmployees(search: string) {
    setEmployees(prev => ({ ...prev, loading: true }));
    getEmployees({ page: 1, search }).then((res) => {
      const { data, total, total_pages } = res || {};
      setEmployees({ data: data || [], loading: false, total: total || 0, total_pages: total_pages || 1 });
    });
  }

  async function handleGetLocations(search: string) {
    setLocations(prev => ({ ...prev, loading: true }));
    getLocations({ page: 1, search }).then((res) => {
      const { data, total, total_pages } = res || {};
      setLocations({ data: data || [], loading: false, total: total || 0, total_pages: total_pages || 1 });
    });
  }

  async function handleGetProfiles(search: string) {
    setProfiles(prev => ({ ...prev, loading: true }));
    getProfiles({ page: 1, search }).then((res) => {
      const { data, total, total_pages } = res || {};
      setProfiles({ data: data || [], loading: false, total: total || 0, total_pages: total_pages || 1 });
    });
  }

  useEffect(() => {
    const t = setTimeout(() => handleGetEmployees(employeeSearch), 500);
    return () => clearTimeout(t);
  }, [employeeSearch]);

  useEffect(() => {
    const t = setTimeout(() => handleGetLocations(locationSearch), 500);
    return () => clearTimeout(t);
  }, [locationSearch]);

  useEffect(() => {
    const t = setTimeout(() => handleGetProfiles(profileSearch), 500);
    return () => clearTimeout(t);
  }, [profileSearch]);

  useEffect(() => {
    getAgreements({ page: 1, limit: 100 }).then((res) => {
      setAgreements(res?.data || []);
    });
  }, []);

  return (
    <div className="space-y-5">
      {/* Tipo de Listado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Tipo de Listado</Label>
          <Select
            value={localFilters.report_type || 'normal_extra'}
            onValueChange={(v) => handleFilterChange('report_type', v)}
          >
            <SelectTrigger className="h-10 border-slate-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal_extra">Normales / Extras</SelectItem>
              <SelectItem value="incidences">Incidencias</SelectItem>
              <SelectItem value="times_costs">Tiempos y Costes</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Tipo de Desglose</Label>
          <Select
            value={localFilters.breakdown_type || 'weekly'}
            onValueChange={(v) => handleFilterChange('breakdown_type', v)}
          >
            <SelectTrigger className="h-10 border-slate-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Diario</SelectItem>
              <SelectItem value="weekly">Semanal</SelectItem>
              <SelectItem value="monthly">Mensual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Redondeo de Fichajes</Label>
          <Select
            value={localFilters.rounding || 'none'}
            onValueChange={(v) => handleFilterChange('rounding', v)}
          >
            <SelectTrigger className="h-10 border-slate-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin redondeo</SelectItem>
              <SelectItem value="15">15 minutos</SelectItem>
              <SelectItem value="30">30 minutos</SelectItem>
              <SelectItem value="60">1 hora</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Personal y Convenio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Empleado</Label>
          <MultiCombobox
            options={employees.data.map((e: Employee) => ({ value: e.id, label: `${e.first_name} ${e.last_name}` }))}
            values={localFilters.employee_id || []}
            onSearchChange={setEmployeeSearch}
            onValuesChange={(v) => handleFilterChange('employee_id', v || undefined)}
            placeholder="Seleccionar empleado"
            searchPlaceholder="Buscar empleados"
            emptyMessage="No se encontraron empleados"
            loading={employees.loading}
            className="w-full h-10 border-slate-300"
            multiple={false}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Ubicación</Label>
          <MultiCombobox
            options={locations.data.map((l: Location) => ({ value: l.id, label: l.name }))}
            values={localFilters.location_id || []}
            onSearchChange={setLocationSearch}
            onValuesChange={(v) => handleFilterChange('location_id', v || undefined)}
            placeholder="Seleccionar ubicación"
            searchPlaceholder="Buscar ubicaciones"
            emptyMessage="No se encontraron ubicaciones"
            loading={locations.loading}
            className="w-full h-10 border-slate-300"
            multiple={false}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Categoría / Centro</Label>
          <MultiCombobox
            options={profiles.data.map((p: Profile) => ({ value: p.id, label: p.name }))}
            values={localFilters.profile_id || []}
            onSearchChange={setProfileSearch}
            onValuesChange={(v) => handleFilterChange('profile_id', v || undefined)}
            placeholder="Seleccionar categoría"
            searchPlaceholder="Buscar categorías"
            emptyMessage="No se encontraron categorías"
            loading={profiles.loading}
            className="w-full h-10 border-slate-300"
            multiple={false}
          />
        </div>
      </div>

      {/* Convenio y rango de empleados */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Convenio</Label>
          <Select
            value={localFilters.agreement_id || '__all__'}
            onValueChange={(v) => handleFilterChange('agreement_id', v === '__all__' ? undefined : v)}
          >
            <SelectTrigger className="h-10 border-slate-300">
              <SelectValue placeholder="Todos los convenios" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todos los convenios</SelectItem>
              {agreements.map(a => (
                <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Nº Empleado Desde</Label>
          <Input
            placeholder="Código desde"
            value={localFilters.employee_from || ''}
            onChange={(e) => handleFilterChange('employee_from', e.target.value || undefined)}
            className="h-10 border-slate-300"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Nº Empleado Hasta</Label>
          <Input
            placeholder="Código hasta"
            value={localFilters.employee_to || ''}
            onChange={(e) => handleFilterChange('employee_to', e.target.value || undefined)}
            className="h-10 border-slate-300"
          />
        </div>
      </div>

      {/* Fechas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Fecha Desde</Label>
          <Popover open={showFromCalendar} onOpenChange={setShowFromCalendar}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {localFilters.start_date
                  ? dayjs(localFilters.start_date).format("DD [de] MMMM, YYYY")
                  : <span>Seleccionar fecha...</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={localFilters.start_date}
                onSelect={(date) => { if (date) { handleFilterChange('start_date', date); setShowFromCalendar(false); } }}
                locale={esLocale}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium text-slate-700">Fecha Hasta</Label>
          <Popover open={showToCalendar} onOpenChange={setShowToCalendar}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {localFilters.end_date
                  ? dayjs(localFilters.end_date).format("DD [de] MMMM, YYYY")
                  : <span>Seleccionar fecha...</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={localFilters.end_date}
                onSelect={(date) => { if (date) { handleFilterChange('end_date', date); setShowToCalendar(false); } }}
                locale={esLocale}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Opciones de Totalización */}
      <div className="space-y-2">
        <Label className="text-sm font-medium text-slate-700">Opciones de Totalización</Label>
        <div className="flex flex-wrap gap-6 pt-1">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="total-weekly"
              checked={localFilters.totalize_weekly ?? true}
              onCheckedChange={(v) => handleFilterChange('totalize_weekly', !!v)}
            />
            <Label htmlFor="total-weekly" className="text-sm text-slate-600 cursor-pointer">Semanal</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="total-monthly"
              checked={localFilters.totalize_monthly ?? false}
              onCheckedChange={(v) => handleFilterChange('totalize_monthly', !!v)}
            />
            <Label htmlFor="total-monthly" className="text-sm text-slate-600 cursor-pointer">Mensual</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="total-employee"
              checked={localFilters.totalize_by_employee ?? true}
              onCheckedChange={(v) => handleFilterChange('totalize_by_employee', !!v)}
            />
            <Label htmlFor="total-employee" className="text-sm text-slate-600 cursor-pointer">Por empleado</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="total-report"
              checked={localFilters.totalize_by_report ?? false}
              onCheckedChange={(v) => handleFilterChange('totalize_by_report', !!v)}
            />
            <Label htmlFor="total-report" className="text-sm text-slate-600 cursor-pointer">Por reporte</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="limit-8h"
              checked={localFilters.limit_to_8_hours ?? false}
              onCheckedChange={(v) => handleFilterChange('limit_to_8_hours', !!v)}
            />
            <Label htmlFor="limit-8h" className="text-sm text-slate-600 cursor-pointer">Limitar a 8 horas</Label>
          </div>
        </div>
      </div>

      {/* Botón buscar */}
      <div className="flex items-center gap-3 pt-2 border-t border-slate-200">
        <Button
          onClick={applyFilters}
          disabled={isLoading}
          className="bg-brand-primary hover:bg-brand-primary-600"
        >
          <Search className="w-4 h-4 mr-2" />
          {isLoading ? 'Buscando...' : 'Generar Listado'}
        </Button>
      </div>

      {/* Chips de filtros activos */}
      {(localFilters.employee_id || localFilters.location_id || localFilters.profile_id || localFilters.agreement_id) && (
        <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
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
            {localFilters.agreement_id && agreements.find(a => a.id === localFilters.agreement_id) && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-purple-100 text-purple-800">
                Convenio: {agreements.find(a => a.id === localFilters.agreement_id)?.name}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
