"use client";

import { useEffect, useState } from "react";
import { getIncidenceSummary } from "@/services/incidence";
import { IncidenceType, IncidenceTypeEnum } from "@/types/incidence";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import RingLoading from "../loading/Ring";

interface IncidenceSummaryProps {
  employeeId: string;
}

interface SummaryItem {
  type: string;
  total_hours: number;
}

export default function IncidenceSummary({ employeeId }: IncidenceSummaryProps) {
  const [summary, setSummary] = useState<SummaryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!employeeId) return;

    setLoading(true);
    getIncidenceSummary(employeeId)
      .then((res) => {
        if (res?.success) {
          setSummary(res.data);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, [employeeId]);

  if (loading) {
    return (
      <Card className="rounded-lg shadow-md">
        <CardContent className="flex items-center justify-center py-10">
          <RingLoading />
        </CardContent>
      </Card>
    );
  }

  if (summary.length === 0) {
    return null;
  }

  return (
    <Card className="rounded-lg shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="w-5 h-5 text-brand-primary" />
          Resumen de Incidencias (Horas)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {summary.map((item) => {
            const typeConfig = IncidenceType[item.type as IncidenceTypeEnum] || 
                               IncidenceType[IncidenceTypeEnum.Other];
            
            return (
              <div 
                key={item.type} 
                className="flex items-center justify-between p-3 rounded-md bg-slate-50 border border-slate-100"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className={`w-3 h-3 rounded-full`} 
                    style={{ backgroundColor: typeConfig.bgHex }}
                  />
                  <span className="text-sm font-medium text-slate-700">
                    {typeConfig.label}
                  </span>
                </div>
                <span className="text-sm font-bold text-slate-900 bg-white px-2 py-1 rounded border border-slate-200">
                  {item.total_hours}h
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
