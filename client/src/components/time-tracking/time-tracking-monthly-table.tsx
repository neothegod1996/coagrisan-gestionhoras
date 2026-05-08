"use client";

import React, { useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { ChevronDown, ChevronUp, Clock } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ReportEmployee, ReportMonth, ReportDay } from "@/types/report";

dayjs.locale("es");

interface Props {
  reports: ReportEmployee[];
  showTotalByEmployee?: boolean;
  showTotalByReport?: boolean;
}

export default function TimeTrackingMonthlyTable({
  reports,
  showTotalByEmployee = true,
  showTotalByReport = false,
}: Props) {
  const allMonthKeys = Array.from(
    new Set(reports.flatMap(e => e.months?.map(m => m.month_key) ?? []))
  ).sort();

  const monthLabels: Record<string, string> = {};
  reports.forEach(e => e.months?.forEach(m => { monthLabels[m.month_key] = m.month_label; }));

  const [expandedEmployees, setExpandedEmployees] = useState<Set<string>>(new Set());
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());

  const toggleEmployee = (id: string) => {
    setExpandedEmployees(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const toggleMonth = (key: string) => {
    setExpandedMonths(prev => {
      const s = new Set(prev);
      s.has(key) ? s.delete(key) : s.add(key);
      return s;
    });
  };

  const formatH = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  };

  const getMonthForEmployee = (employee: ReportEmployee, monthKey: string): ReportMonth | undefined =>
    employee.months?.find(m => m.month_key === monthKey);

  const grandTotals = {
    total: reports.reduce((s, e) => s + e.total_hours, 0),
    normal: reports.reduce((s, e) => s + e.normal_hours, 0),
    extra: reports.reduce((s, e) => s + e.extra_hours, 0),
  };

  if (!reports.length) return null;

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="min-w-[200px] sticky left-0 bg-slate-50 z-10 font-semibold">
              Empleado
            </TableHead>
            {allMonthKeys.map(mk => (
              <TableHead key={mk} colSpan={2} className="text-center border-l border-slate-200 min-w-[140px] font-semibold capitalize">
                {monthLabels[mk]}
              </TableHead>
            ))}
            <TableHead colSpan={2} className="text-center border-l border-slate-200 min-w-[140px] font-semibold bg-slate-100">
              Total
            </TableHead>
          </TableRow>
          <TableRow className="bg-slate-50 text-xs">
            <TableHead className="sticky left-0 bg-slate-50 z-10" />
            {allMonthKeys.map(mk => (
              <React.Fragment key={`sub-${mk}`}>
                <TableHead className="text-center border-l border-slate-200 text-slate-500">Normal</TableHead>
                <TableHead className="text-center text-slate-500">Extra</TableHead>
              </React.Fragment>
            ))}
            <TableHead className="text-center border-l border-slate-200 text-slate-500 bg-slate-100">Normal</TableHead>
            <TableHead className="text-center text-slate-500 bg-slate-100">Extra</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map(employee => {
            const isExpanded = expandedEmployees.has(employee.id);
            return (
              <React.Fragment key={employee.id}>
                {/* Fila del empleado */}
                <TableRow
                  className="hover:bg-slate-50 cursor-pointer border-b-2 border-slate-200"
                  onClick={() => toggleEmployee(employee.id)}
                >
                  <TableCell className="sticky left-0 bg-white z-10 font-medium py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" className="p-1 h-5 w-5">
                        {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </Button>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-800">{employee.full_name}</span>
                        {employee.card_id && (
                          <span className="text-xs text-slate-400">#{employee.card_id}</span>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  {allMonthKeys.map(mk => {
                    const m = getMonthForEmployee(employee, mk);
                    return (
                      <React.Fragment key={mk}>
                        <TableCell className="text-center border-l border-slate-100 py-3 font-medium">
                          {m ? formatH(m.normal_hours) : '—'}
                        </TableCell>
                        <TableCell className="text-center py-3">
                          {m && m.extra_hours > 0
                            ? <span className="text-orange-600 font-medium">{formatH(m.extra_hours)}</span>
                            : <span className="text-slate-300">—</span>}
                        </TableCell>
                      </React.Fragment>
                    );
                  })}
                  <TableCell className="text-center border-l border-slate-200 py-3 font-bold text-brand-primary-800 bg-slate-50">
                    {formatH(employee.normal_hours)}
                  </TableCell>
                  <TableCell className="text-center py-3 font-bold bg-slate-50">
                    {employee.extra_hours > 0
                      ? <span className="text-orange-600">{formatH(employee.extra_hours)}</span>
                      : <span className="text-slate-300">—</span>}
                  </TableCell>
                </TableRow>

                {/* Detalle mensual expandido */}
                {isExpanded && employee.months?.map(month => {
                  const mKey = `${employee.id}-${month.month_key}`;
                  const isMonthExpanded = expandedMonths.has(mKey);
                  return (
                    <React.Fragment key={mKey}>
                      <TableRow
                        className="bg-slate-50 hover:bg-slate-100 cursor-pointer border-b border-slate-200"
                        onClick={(e) => { e.stopPropagation(); toggleMonth(mKey); }}
                      >
                        <TableCell className="sticky left-0 bg-slate-50 z-10 pl-10 py-2">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="p-1 h-5 w-5">
                              {isMonthExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </Button>
                            <span className="text-sm font-medium text-slate-700 capitalize">{month.month_label}</span>
                          </div>
                        </TableCell>
                        {allMonthKeys.map(mk => {
                          if (mk !== month.month_key) {
                            return (
                              <React.Fragment key={mk}>
                                <TableCell className="border-l border-slate-100" />
                                <TableCell />
                              </React.Fragment>
                            );
                          }
                          return (
                            <React.Fragment key={mk}>
                              <TableCell className="text-center border-l border-slate-100 py-2 text-sm font-medium">
                                {formatH(month.normal_hours)}
                              </TableCell>
                              <TableCell className="text-center py-2 text-sm">
                                {month.extra_hours > 0
                                  ? <span className="text-orange-500">{formatH(month.extra_hours)}</span>
                                  : <span className="text-slate-300">—</span>}
                              </TableCell>
                            </React.Fragment>
                          );
                        })}
                        <TableCell className="border-l border-slate-200 bg-slate-50" />
                        <TableCell className="bg-slate-50" />
                      </TableRow>

                      {/* Días del mes */}
                      {isMonthExpanded && month.days.map(day => (
                        <TableRow key={`${mKey}-${day.date}`} className="bg-white hover:bg-slate-50 border-b border-slate-100">
                          <TableCell className="sticky left-0 bg-white z-10 pl-16 py-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-slate-600">
                                {dayjs(day.date).format('DD/MM')}
                              </span>
                              <span className="text-xs text-slate-400 capitalize">
                                {dayjs(day.date).format('ddd')}
                              </span>
                              {day.has_incidence && (
                                <Badge variant="outline" className="text-[9px] py-0 px-1 h-4">
                                  {day.schedule_info}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          {allMonthKeys.map(mk => {
                            if (mk !== month.month_key) {
                              return (
                                <React.Fragment key={mk}>
                                  <TableCell className="border-l border-slate-100" />
                                  <TableCell />
                                </React.Fragment>
                              );
                            }
                            return (
                              <React.Fragment key={mk}>
                                <TableCell className="text-center border-l border-slate-100 py-1.5 text-xs">
                                  {day.total_hours > 0 ? formatH(day.normal_hours) : <span className="text-slate-300">—</span>}
                                </TableCell>
                                <TableCell className="text-center py-1.5 text-xs">
                                  {day.extra_hours > 0
                                    ? <span className="text-orange-500">{formatH(day.extra_hours)}</span>
                                    : <span className="text-slate-200">—</span>}
                                </TableCell>
                              </React.Fragment>
                            );
                          })}
                          <TableCell className="border-l border-slate-200 bg-white" />
                          <TableCell className="bg-white" />
                        </TableRow>
                      ))}
                    </React.Fragment>
                  );
                })}
              </React.Fragment>
            );
          })}

          {/* Total general del reporte */}
          {showTotalByReport && (
            <TableRow className="bg-slate-200 border-t-2 border-slate-400 font-bold">
              <TableCell className="sticky left-0 bg-slate-200 z-10 py-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-700" />
                  <span className="text-sm font-bold text-slate-900">TOTAL REPORTE</span>
                </div>
              </TableCell>
              {allMonthKeys.map(mk => {
                const mNormal = reports.reduce((s, e) => s + (e.months?.find(m => m.month_key === mk)?.normal_hours ?? 0), 0);
                const mExtra = reports.reduce((s, e) => s + (e.months?.find(m => m.month_key === mk)?.extra_hours ?? 0), 0);
                return (
                  <React.Fragment key={mk}>
                    <TableCell className="text-center border-l border-slate-300 py-3">
                      {formatH(mNormal)}
                    </TableCell>
                    <TableCell className="text-center py-3">
                      {mExtra > 0 ? <span className="text-orange-700">{formatH(mExtra)}</span> : '—'}
                    </TableCell>
                  </React.Fragment>
                );
              })}
              <TableCell className="text-center border-l border-slate-300 py-3 text-brand-primary-900 bg-slate-300">
                {formatH(grandTotals.normal)}
              </TableCell>
              <TableCell className="text-center py-3 bg-slate-300">
                {grandTotals.extra > 0 ? <span className="text-orange-700">{formatH(grandTotals.extra)}</span> : '—'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {!reports.length && (
        <div className="text-center py-12 text-slate-400">
          <Clock className="w-12 h-12 mx-auto mb-4" />
          <p className="text-lg font-medium text-slate-900">No se encontraron registros</p>
        </div>
      )}
    </div>
  );
}
