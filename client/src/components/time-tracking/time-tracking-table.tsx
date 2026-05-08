"use client";

import React, { useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { ChevronDown, ChevronUp, Clock, Calendar } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TimeTrackingFilters } from "@/types/time-tracking";
import { ReportEmployee, ReportWeek, ReportDay, ReportSession } from "@/types/report";

// Configurar dayjs para español
dayjs.locale('es');

interface TimeTrackingTableProps {
  filters: TimeTrackingFilters;
  isLoading?: boolean;
  reports: ReportEmployee[];
}


export default function TimeTrackingTable({ filters, isLoading = false, reports }: TimeTrackingTableProps) {
  // Procesar los datos de reportes para agruparlos por empleado y semana
  const groupedData = reports.reduce((acc, employee) => {
    const employeeKey = `${employee.id}-${employee.full_name}`;

    if (!acc[employeeKey]) {
      acc[employeeKey] = {
        employee: {
          id: employee.id,
          card_id: employee.card_id,
          name: employee.full_name,
          total_hours: employee.total_hours,
          normal_hours: employee.normal_hours,
          extra_hours: employee.extra_hours
        },
        weeks: {}
      };
    }

    // Procesar cada semana del empleado
    employee.weeks.forEach((week) => {
      const weekStart = dayjs(week.week_range.split(' - ')[0]);
      const weekKey = `${weekStart.format('YYYY-MM-DD')}-${week.week_number}-${week.year}`;

      // Siempre crear una nueva entrada para cada semana
      acc[employeeKey].weeks[weekKey] = {
        weekStart,
        weekData: week,
        days: [...week.days] // Copiar todos los días de la semana
      };
    });

    return acc;
  }, {} as Record<string, {
    employee: {
      id: string;
      card_id: string | null;
      name: string;
      total_hours: number;
      normal_hours: number;
      extra_hours: number;
    }; 
    weeks: Record<string, { 
      weekStart: dayjs.Dayjs; 
      weekData: ReportWeek; 
      days: ReportDay[]; 
    }> 
  }>);

  // Inicializar todos los empleados como expandidos por defecto
  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(
    new Set(Object.keys(groupedData))
  );

  // Inicializar todas las semanas como expandidas por defecto
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(
    new Set(
      Object.values(groupedData).flatMap(employee =>
        Object.keys(employee.weeks).map(weekKey =>
          Object.keys(groupedData).map(empKey => `${empKey}-${weekKey}`)
        ).flat()
      ).flat()
    )
  );

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    // format: hh:mm
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const toggleEmployeeExpansion = (employeeKey: string) => {
    const newExpanded = new Set(expandedEmployees);
    if (newExpanded.has(employeeKey)) {
      newExpanded.delete(employeeKey);
    } else {
      newExpanded.add(employeeKey);
    }
    setExpandedEmployees(newExpanded);
  };

  const toggleWeekExpansion = (weekKey: string) => {
    const newExpanded = new Set(expandedWeeks);
    if (newExpanded.has(weekKey)) {
      newExpanded.delete(weekKey);
    } else {
      newExpanded.add(weekKey);
    }
    setExpandedWeeks(newExpanded);
  };

  // Calcular totales por semana usando los datos de ReportWeek
  const calculateWeekTotals = (weekData: ReportWeek) => {
    return {
      worked: weekData.total_hours,
      regular: weekData.normal_hours,
      overtime: weekData.extra_hours
    };
  };

  // Calcular totales por empleado usando los datos de ReportEmployee
  const calculateEmployeeTotals = (employee: { total_hours: number; normal_hours: number; extra_hours: number }) => {
    return {
      worked: employee.total_hours,
      regular: employee.normal_hours,
      overtime: employee.extra_hours
    };
  };

  // Calcular totales generales
  const calculateGrandTotals = () => {
    return reports.reduce((acc, employee) => {
      return {
        worked: acc.worked + employee.total_hours,
        regular: acc.regular + employee.normal_hours,
        overtime: acc.overtime + employee.extra_hours
      };
    }, { worked: 0, regular: 0, overtime: 0 });
  };

  const grandTotals = calculateGrandTotals();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="min-w-[120px]">Fecha</TableHead>
              <TableHead className="min-w-[180px]">Horario/Incidencia</TableHead>
              <TableHead className="min-w-[120px]">Trabajo</TableHead>
              <TableHead className="min-w-[120px]">Horas Normales</TableHead>
              <TableHead className="min-w-[120px]">Horas Extras</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(groupedData)
              .sort(([, a], [, b]) => a.employee.name.localeCompare(b.employee.name))
              .map(([employeeKey, employeeData]) => {
                const isEmployeeExpanded = expandedEmployees.has(employeeKey);
                const employeeTotals = calculateEmployeeTotals(employeeData.employee);

                return (
                  <React.Fragment key={employeeKey}>
                    {/* Fila de encabezado del empleado */}
                    <TableRow className="bg-slate-100 hover:bg-slate-200 border-b-2 border-slate-200">
                      <TableCell
                        colSpan={5}
                        className="p-4 cursor-pointer"
                        onClick={() => toggleEmployeeExpansion(employeeKey)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Button variant="ghost" size="sm" className="p-1 h-6 w-6">
                              {isEmployeeExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronUp className="w-4 h-4" />
                              )}
                            </Button>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-brand-primary-800 text-lg">
                                {employeeData.employee.card_id ? `${employeeData.employee.card_id} - ` : ''}{employeeData.employee.name}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 text-sm">
                            <div className="text-right">
                              <div className="text-brand-primary-600">Total Trabajo</div>
                              <div className="font-semibold text-brand-primary-800">{formatHours(employeeTotals.worked)}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-brand-primary-600">Horas Normales</div>
                              <div className="font-semibold text-brand-primary-800">{formatHours(employeeTotals.regular)}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-brand-primary-600">Horas Extras</div>
                              <div className="font-semibold text-brand-primary-800">{formatHours(employeeTotals.overtime)}</div>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>

                    {/* Semanas del empleado (solo si está expandido) */}
                    {isEmployeeExpanded && Object.entries(employeeData.weeks)
                      .sort(([, a], [, b]) => a.weekStart.valueOf() - b.weekStart.valueOf())
                      .map(([weekKey, weekData]) => {
                        const weekTotals = calculateWeekTotals(weekData.weekData);
                        const weekKeyForExpansion = `${employeeKey}-${weekKey}`;
                        const isWeekExpanded = expandedWeeks.has(weekKeyForExpansion);
                        const weekEnd = weekData.weekStart.endOf('week');

                        return (
                          <React.Fragment key={weekKeyForExpansion}>
                            {/* Fila de encabezado de semana */}
                            <TableRow className="bg-slate-100 hover:bg-slate-100 border-b border-brand-primary-200">
                              <TableCell
                                colSpan={5}
                                className="p-3 cursor-pointer pl-12"
                                onClick={() => toggleWeekExpansion(weekKeyForExpansion)}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <Button variant="ghost" size="sm" className="p-1 h-5 w-5">
                                      {isWeekExpanded ? (
                                        <ChevronDown className="w-3 h-3" />
                                      ) : (
                                        <ChevronUp className="w-3 h-3" />
                                      )}
                                    </Button>
                                    <Calendar className="w-4 h-4 text-slate-600" />
                                    <span className="font-medium text-slate-800">
                                      Semana {weekData.weekData.week_range} (Semana {weekData.weekData.week_number}, {weekData.weekData.year})
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-6 text-sm">
                                    <div className="text-right">
                                      <div className="text-slate-600">Total Trabajo</div>
                                      <div className="font-semibold text-slate-800">{formatHours(weekTotals.worked)}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-slate-600">Horas Normales</div>
                                      <div className="font-semibold text-slate-800">{formatHours(weekTotals.regular)}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-slate-600">Horas Extras</div>
                                      <div className="font-semibold text-slate-800">{formatHours(weekTotals.overtime || 0)}</div>
                                    </div>
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>

                            {/* Filas de días de la semana (solo si está expandido) */}
                            {isWeekExpanded && weekData.days
                              .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf())
                              .map((day) => (
                                <React.Fragment key={`${employeeData.employee.id}-${day.date}-day`}>
                                  {/* Fila principal del día */}
                                  <TableRow className="hover:bg-slate-50 border-b border-slate-300 bg-slate-50/80">
                                    <TableCell className="pl-20 py-2 text-slate-900 font-medium">
                                      <div className="flex items-center gap-2">
                                        <div className="w-1 h-5 bg-brand-primary rounded-full"></div>
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold text-sm">
                                            {dayjs(day.date).format('DD/MM')}
                                          </span>
                                          <span className="text-xs text-slate-500 capitalize">
                                            {dayjs(day.date).format('ddd')}
                                          </span>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-2">
                                      <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="text-xs">
                                          {day.schedule_info}
                                        </Badge>
                                      </div>
                                    </TableCell>
                                    <TableCell className="py-2">
                                      <div className="flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-brand-primary" />
                                        <span className="font-semibold text-slate-900">
                                          {formatHours(day.total_hours)}
                                        </span>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-slate-700 font-medium py-2">
                                      {formatHours(day.normal_hours)}
                                    </TableCell>
                                    <TableCell className="font-medium py-2">
                                      {day.extra_hours > 0 ? (
                                        <span className="text-orange-600 font-semibold">
                                          {formatHours(day.extra_hours)}
                                        </span>
                                      ) : (
                                        <span className="text-slate-400">N/A</span>
                                      )}
                                    </TableCell>
                                  </TableRow>

                                  {day.sessions.map((session, index) => (
                                    <TableRow
                                      key={`${employeeData.employee.id}-${day.date}-session-${index}`}
                                      className="bg-white border-b border-slate-50 hover:bg-slate-25"
                                    >
                                      <TableCell className="pl-24 py-1">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-medium text-slate-600">
                                            Sesión {index + 1}
                                          </span>
                                        </div>
                                      </TableCell>
                                      <TableCell className="py-1">
                                        <div className="flex items-center gap-3 text-xs">
                                          <div className="flex items-center gap-1">
                                            <span className="font-medium">
                                              {dayjs(session.schedule_start).format('HH:mm')} - {dayjs(session.schedule_end).format('HH:mm')}
                                            </span>
                                          </div>
                                        </div>
                                      </TableCell>
                                      <TableCell colSpan={3} className="py-1 text-xs text-slate-500">
                                        <div className="flex items-center gap-4">
                                          <span>Entrada: {session.clock_in ? dayjs(session.clock_in).format('HH:mm') : 'N/A'}</span>
                                          <span>Salida: {session.clock_out ? dayjs(session.clock_out).format('HH:mm') : 'N/A'}</span>
                                          {/* <span>Horas: {formatHours(session.hours)}</span> */}
                                          {session.has_incidence && (
                                            <Badge className="text-xs bg-brand-primary-100 text-brand-primary-800">
                                              Con incidencia
                                            </Badge>
                                          )}
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </React.Fragment>
                              ))}
                          </React.Fragment>
                        );
                      })}

                    {/* Fila de totales del empleado */}
                    {isEmployeeExpanded && (
                      <TableRow className="bg-slate-200 hover:bg-slate-200 border-t-2 border-slate-300">
                        <TableCell colSpan={5} className="p-3 pl-12">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Clock className="w-4 h-4 text-slate-700" />
                              <span className="font-bold text-slate-900">
                                TOTAL {employeeData.employee.name.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex items-center gap-6 text-sm">
                              <div className="text-right">
                                <div className="text-brand-primary-600 font-medium">Total Trabajo</div>
                                <div className="font-bold text-brand-primary-800">{formatHours(employeeTotals.worked)}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-brand-primary-600 font-medium">Horas Normales</div>
                                <div className="font-bold text-brand-primary-800">{formatHours(employeeTotals.regular)}</div>
                              </div>
                              {employeeTotals.overtime > 0 && (
                                <div className="text-right">
                                  <div className="text-brand-primary-600 font-medium">Horas Extras</div>
                                  <div className="font-bold text-brand-primary-800">{formatHours(employeeTotals.overtime)}</div>
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
          </TableBody>
        </Table>
      </div>

      {Object.keys(groupedData).length === 0 && (
        <div className="text-center py-12">
          <div className="text-slate-400 mb-2">
            <Clock className="w-12 h-12 mx-auto mb-4" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            No se encontraron registros
          </h3>
          <p className="text-slate-600">
            Ajusta los filtros para ver los datos de fichajes
          </p>
        </div>
      )}
    </div>
  );
}
