"use client";

import { Clock, Users, TrendingUp, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ReportStatistics } from "@/types/report";

interface TimeTrackingSummaryProps {
  summary: ReportStatistics;
}

export default function TimeTrackingSummaryComponent({ summary }: TimeTrackingSummaryProps) {
  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total de Empleados */}
      <Card className="flex justify-center border border-slate-200 p-0 h-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Empleados</p>
              <p className="text-2xl font-bold text-slate-900">{summary.total_employees}</p>
            </div>
            <div className="w-10 h-10 bg-brand-primary-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-brand-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Total de Horas */}
      <Card className="flex justify-center border border-slate-200 p-0 h-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Total Horas</p>
              <p className="text-2xl font-bold text-slate-900">{formatHours(summary.total_hours)}</p>
            </div>
            <div className="w-10 h-10 bg-brand-primary-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-brand-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Horas Regulares vs Extras */}
      <Card className="flex justify-center border border-slate-200 p-0 h-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Horas Regulares</p>
              <p className="text-2xl font-bold text-slate-900">{formatHours(summary.normal_hours)}</p>
              <p className="text-xs text-slate-500 mt-1">
                Extra: {formatHours(summary.extra_hours)}
              </p>
            </div>
            <div className="w-10 h-10 bg-brand-primary-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-brand-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Promedio por Empleado */}
      <Card className="flex justify-center border border-slate-200 p-0 h-auto">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Promedio/Empleado</p>
              <p className="text-2xl font-bold text-slate-900">{formatHours(summary.average_hours_per_employee)}</p>
            </div>
            <div className="w-10 h-10 bg-brand-primary-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-brand-primary" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
