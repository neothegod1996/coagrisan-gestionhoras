"use client";

import { useState } from "react";
import { ArrowLeft, Users, Filter, Clock, Download, Printer, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeTrackingFilters } from "@/types/time-tracking";
import TimeTrackingFiltersComponent from "@/components/time-tracking/time-tracking-filters";
import TimeTrackingTable from "@/components/time-tracking/time-tracking-table";
import TimeTrackingMonthlyTable from "@/components/time-tracking/time-tracking-monthly-table";
import TimeTrackingSummaryComponent from "@/components/time-tracking/time-tracking-summary";
import { redirect } from "next/navigation";
import dayjs from "dayjs";
import { RequestHandler } from "@/types";
import { Report, ReportParams } from "@/types/report";
import { getReports } from "@/services/report";
import { toast } from "react-hot-toast";
import RingLoading from "@/components/loading/Ring";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const formatH = (hours: number) => {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
};

export default function TimeTrackingReportPage() {
  const [reports, setReports] = useState<RequestHandler<Report | null>>({ data: null, loading: false });
  const [appliedFilters, setAppliedFilters] = useState<TimeTrackingFilters | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const [filters, setFilters] = useState<TimeTrackingFilters>({
    start_date: dayjs().startOf("month").toDate(),
    end_date: dayjs().toDate(),
    report_type: "normal_extra",
    breakdown_type: "weekly",
    rounding: "none",
    totalize_weekly: true,
    totalize_monthly: false,
    totalize_by_employee: true,
    totalize_by_report: false,
  });

  async function handleGetReports(filters: ReportParams) {
    setReports({ data: null, loading: true });
    setHasSearched(true);
    getReports(filters)
      .then((response) => {
        setReports({ data: response?.data || null, loading: false });
      })
      .catch(() => {
        toast.error("Hubo un error al obtener los reportes");
        setReports({ data: null, loading: false });
      });
  }

  const handleFiltersChange = (newFilters: TimeTrackingFilters) => {
    setFilters(newFilters);
    setAppliedFilters(newFilters);
    handleGetReports(newFilters);
  };

  // ── PDF ──────────────────────────────────────────────────────────────────────
  const generatePDF = (): jsPDF | null => {
    if (!reports.data?.employees?.length) return null;

    const doc = new jsPDF("l", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.setTextColor(83, 117, 51);
    doc.text("Reporte de Fichajes", pageWidth / 2, 15, { align: "center" });

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    const dateRange = `${dayjs(filters.start_date).format("DD/MM/YYYY")} - ${dayjs(filters.end_date).format("DD/MM/YYYY")}`;
    doc.text(dateRange, pageWidth / 2, 22, { align: "center" });

    let yPosition = 30;

    if (reports.data.statistics) {
      const stats = reports.data.statistics;
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text("Resumen General", 14, yPosition);

      autoTable(doc, {
        startY: yPosition + 5,
        head: [["Total Empleados", "Total Horas", "Horas Normales", "Horas Extras", "Promedio/Empleado"]],
        body: [[
          stats.total_employees.toString(),
          formatH(stats.total_hours),
          formatH(stats.normal_hours),
          formatH(stats.extra_hours),
          formatH(stats.average_hours_per_employee),
        ]],
        theme: "grid",
        headStyles: { fillColor: [83, 117, 51], fontSize: 10 },
        styles: { fontSize: 9, cellPadding: 3 },
        margin: { left: 14, right: 14 },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    const isMonthly = appliedFilters?.breakdown_type === "monthly";

    if (isMonthly) {
      const allMonthKeys = Array.from(
        new Set(reports.data.employees.flatMap(e => e.months?.map(m => m.month_key) ?? []))
      ).sort();

      const monthLabels: Record<string, string> = {};
      reports.data.employees.forEach(e =>
        e.months?.forEach(m => { monthLabels[m.month_key] = m.month_label; })
      );

      const head = ["Empleado", ...allMonthKeys.flatMap(mk => [`${monthLabels[mk]} Normal`, `${monthLabels[mk]} Extra`]), "Total Normal", "Total Extra"];
      const body = reports.data.employees.map(employee => [
        employee.full_name,
        ...allMonthKeys.flatMap(mk => {
          const m = employee.months?.find(mo => mo.month_key === mk);
          return [m ? formatH(m.normal_hours) : "—", m && m.extra_hours > 0 ? formatH(m.extra_hours) : "—"];
        }),
        formatH(employee.normal_hours),
        employee.extra_hours > 0 ? formatH(employee.extra_hours) : "—",
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [head],
        body,
        theme: "grid",
        headStyles: { fillColor: [83, 117, 51], fontSize: 7 },
        styles: { fontSize: 7, cellPadding: 2 },
        margin: { left: 14, right: 14 },
      });
    } else {
      reports.data.employees.forEach((employee) => {
        if (yPosition > 170) { doc.addPage(); yPosition = 20; }

        doc.setFontSize(11);
        doc.setTextColor(83, 117, 51);
        doc.text(`${employee.card_id ? `${employee.card_id} - ` : ""}${employee.full_name}`, 14, yPosition);
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Total: ${formatH(employee.total_hours)} | Normales: ${formatH(employee.normal_hours)} | Extras: ${formatH(employee.extra_hours)}`, 14, yPosition + 5);
        yPosition += 10;

        const tableData: any[] = [];
        employee.weeks.forEach((week) => {
          tableData.push([
            { content: `Semana ${week.week_number} (${week.week_range})`, colSpan: 2, styles: { fontStyle: "bold", fillColor: [230, 234, 217] } },
            { content: formatH(week.total_hours), styles: { fontStyle: "bold", fillColor: [230, 234, 217] } },
            { content: formatH(week.normal_hours), styles: { fontStyle: "bold", fillColor: [230, 234, 217] } },
            { content: formatH(week.extra_hours), styles: { fontStyle: "bold", fillColor: [230, 234, 217] } },
          ]);

          week.days.forEach((day) => {
            tableData.push([
              `  ${dayjs(day.date).format("DD/MM/YYYY")} (${dayjs(day.date).format("ddd")})`,
              day.schedule_info,
              formatH(day.total_hours),
              formatH(day.normal_hours),
              day.extra_hours > 0 ? formatH(day.extra_hours) : "N/A",
            ]);

            day.sessions.forEach((session, i) => {
              const schedTime = session.schedule_start
                ? `${dayjs(session.schedule_start).format("HH:mm")}-${dayjs(session.schedule_end).format("HH:mm")}`
                : "—";
              const clockIn = session.clock_in ? dayjs(session.clock_in).format("HH:mm") : "N/A";
              const clockOut = session.clock_out ? dayjs(session.clock_out).format("HH:mm") : "N/A";
              tableData.push([
                `    Sesión ${i + 1}`,
                `${schedTime} | E:${clockIn} S:${clockOut}`,
                "", "", session.has_incidence ? "Incidencia" : "",
              ]);
            });
          });
        });

        autoTable(doc, {
          startY: yPosition,
          head: [["Fecha", "Horario/Sesión", "Trabajo", "Normales", "Extras"]],
          body: tableData,
          theme: "striped",
          headStyles: { fillColor: [83, 117, 51], fontSize: 8 },
          styles: { fontSize: 7, cellPadding: 2 },
          margin: { left: 14, right: 14 },
          columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 70 }, 2: { cellWidth: 25 }, 3: { cellWidth: 25 }, 4: { cellWidth: 25 } },
        });

        yPosition = (doc as any).lastAutoTable.finalY + 8;
      });
    }

    return doc;
  };

  // ── Excel ─────────────────────────────────────────────────────────────────────
  const generateExcel = () => {
    if (!reports.data?.employees?.length) return null;

    const wb = XLSX.utils.book_new();
    const isMonthly = appliedFilters?.breakdown_type === "monthly";
    const dateRangeStr = `${dayjs(filters.start_date).format("DD/MM/YYYY")} al ${dayjs(filters.end_date).format("DD/MM/YYYY")}`;

    if (isMonthly) {
      const allMonthKeys = Array.from(
        new Set(reports.data.employees.flatMap(e => e.months?.map(m => m.month_key) ?? []))
      ).sort();
      const monthLabels: Record<string, string> = {};
      reports.data.employees.forEach(e => e.months?.forEach(m => { monthLabels[m.month_key] = m.month_label; }));

      const rows: any[][] = [];
      // Title
      rows.push([`Reporte de Fichajes — ${dateRangeStr}`]);
      rows.push([]);
      // Header
      rows.push([
        "Empleado", "Código",
        ...allMonthKeys.flatMap(mk => [`${monthLabels[mk]} Normal`, `${monthLabels[mk]} Extra`]),
        "Total Normal", "Total Extra",
      ]);

      reports.data.employees.forEach(employee => {
        rows.push([
          employee.full_name,
          employee.card_id ?? "",
          ...allMonthKeys.flatMap(mk => {
            const m = employee.months?.find(mo => mo.month_key === mk);
            return [m ? formatH(m.normal_hours) : "—", m && m.extra_hours > 0 ? formatH(m.extra_hours) : "—"];
          }),
          formatH(employee.normal_hours),
          employee.extra_hours > 0 ? formatH(employee.extra_hours) : "—",
        ]);
      });

      // Stats row
      const stats = reports.data.statistics;
      rows.push([]);
      rows.push(["TOTAL REPORTE", "", ...allMonthKeys.flatMap(() => ["", ""]),
        formatH(stats.normal_hours), formatH(stats.extra_hours)]);

      const ws = XLSX.utils.aoa_to_sheet(rows);
      ws["!cols"] = [{ wch: 30 }, { wch: 12 }, ...allMonthKeys.flatMap(() => [{ wch: 14 }, { wch: 14 }]), { wch: 14 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, ws, "Resumen Mensual");

    } else {
      // Sheet 1: Resumen por empleado
      const summaryRows: any[][] = [
        [`Reporte de Fichajes — ${dateRangeStr}`],
        [],
        ["Código", "Empleado", "Total Horas", "Horas Normales", "Horas Extras"],
      ];
      reports.data.employees.forEach(e => {
        summaryRows.push([e.card_id ?? "—", e.full_name, formatH(e.total_hours), formatH(e.normal_hours), formatH(e.extra_hours)]);
      });
      const stats = reports.data.statistics;
      summaryRows.push([]);
      summaryRows.push(["", "TOTAL", formatH(stats.total_hours), formatH(stats.normal_hours), formatH(stats.extra_hours)]);

      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
      wsSummary["!cols"] = [{ wch: 14 }, { wch: 30 }, { wch: 14 }, { wch: 14 }, { wch: 14 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen");

      // Sheet 2: Detalle completo
      const detailRows: any[][] = [
        [`Reporte Detallado — ${dateRangeStr}`],
        [],
        ["Empleado", "Código", "Semana", "Fecha", "Día", "Horario", "Entrada", "Salida", "Total", "Normal", "Extra", "Incidencia"],
      ];

      reports.data.employees.forEach(employee => {
        employee.weeks.forEach(week => {
          week.days.forEach(day => {
            const mainSession = day.sessions[0];
            detailRows.push([
              employee.full_name,
              employee.card_id ?? "—",
              `${week.week_number}/${week.year}`,
              dayjs(day.date).format("DD/MM/YYYY"),
              dayjs(day.date).format("dddd"),
              day.schedule_info,
              mainSession?.clock_in ? dayjs(mainSession.clock_in).format("HH:mm") : "—",
              mainSession?.clock_out ? dayjs(mainSession.clock_out).format("HH:mm") : "—",
              formatH(day.total_hours),
              formatH(day.normal_hours),
              day.extra_hours > 0 ? formatH(day.extra_hours) : "—",
              day.incidence_name || "",
            ]);
          });
        });
      });

      const wsDetail = XLSX.utils.aoa_to_sheet(detailRows);
      wsDetail["!cols"] = [
        { wch: 30 }, { wch: 12 }, { wch: 10 }, { wch: 12 }, { wch: 12 },
        { wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 25 },
      ];
      XLSX.utils.book_append_sheet(wb, wsDetail, "Detalle");
    }

    return wb;
  };

  const handleDownloadPDF = () => {
    const doc = generatePDF();
    if (!doc) { toast.error("No hay datos para generar el reporte"); return; }
    const fileName = `reporte_${dayjs(filters.start_date).format("YYYYMMDD")}_${dayjs(filters.end_date).format("YYYYMMDD")}.pdf`;
    doc.save(fileName);
    toast.success("PDF descargado correctamente");
  };

  const handlePrint = () => {
    const doc = generatePDF();
    if (!doc) { toast.error("No hay datos para generar el reporte"); return; }
    const pdfUrl = URL.createObjectURL(doc.output("blob"));
    const w = window.open(pdfUrl, "_blank");
    if (w) w.addEventListener("load", () => w.print());
    else toast.error("Permite las ventanas emergentes para imprimir");
  };

  const handleDownloadExcel = () => {
    const wb = generateExcel();
    if (!wb) { toast.error("No hay datos para generar el reporte"); return; }
    const fileName = `reporte_${dayjs(filters.start_date).format("YYYYMMDD")}_${dayjs(filters.end_date).format("YYYYMMDD")}.xlsx`;
    XLSX.writeFile(wb, fileName);
    toast.success("Excel descargado correctamente");
  };

  const isMonthlyView = appliedFilters?.breakdown_type === "monthly";
  const employeeCount = reports.data?.employees?.length ?? 0;
  const hasData = !reports.loading && employeeCount > 0;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-6 py-8 space-y-6">
        {/* Header */}
        <div className="bg-gradient-brand rounded-md p-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-primary rounded-md flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold">Listado de Fichajes</h1>
                <p className="text-slate-200 mt-1">Generación de reportes y visualización de datos</p>
              </div>
            </div>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={() => redirect("/")} className="rounded-md">
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver
        </Button>

        {/* Filtros */}
        <Card className="border border-slate-200">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="w-5 h-5 text-brand-primary" />
              Configuración del Listado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TimeTrackingFiltersComponent
              filters={filters}
              onFiltersChange={handleFiltersChange}
              isLoading={reports.loading}
            />
          </CardContent>
        </Card>

        {reports.loading ? (
          <div className="text-center py-20"><RingLoading /></div>
        ) : hasSearched && !hasData ? (
          <div className="text-center py-16 bg-white rounded-lg border border-slate-200 shadow-sm">
            <Users className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900 mb-1">
              No se encontraron empleados
            </h3>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Los filtros aplicados no devuelven resultados. Prueba a ampliar el rango de fechas o reducir los filtros de personal.
            </p>
          </div>
        ) : hasData ? (
          <>
            {/* Botones de exportación */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-md">
                <Printer className="w-4 h-4 mr-2" /> Imprimir
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadPDF} className="rounded-md">
                <Download className="w-4 h-4 mr-2" /> Descargar PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadExcel}
                className="rounded-md text-green-700 border-green-300 hover:bg-green-50"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" /> Exportar Excel
              </Button>
            </div>

            {/* Estadísticas */}
            {reports.data?.statistics && (
              <TimeTrackingSummaryComponent summary={reports.data.statistics} />
            )}

            {/* Tabla */}
            <div className="bg-white rounded-lg shadow-lg border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-brand-primary" />
                    {isMonthlyView ? "Desglose Mensual" : "Detalle de Fichajes"}
                  </h3>
                  <div className="text-sm text-slate-500">
                    {dayjs(filters.start_date).format("DD/MM/YYYY")} — {dayjs(filters.end_date).format("DD/MM/YYYY")}
                    {appliedFilters?.rounding && appliedFilters.rounding !== "none" && (
                      <span className="ml-2 px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs">
                        Redondeo: {appliedFilters.rounding} min
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-0">
                {isMonthlyView ? (
                  <TimeTrackingMonthlyTable
                    reports={reports.data?.employees || []}
                    showTotalByEmployee={appliedFilters?.totalize_by_employee ?? true}
                    showTotalByReport={appliedFilters?.totalize_by_report ?? false}
                  />
                ) : (
                  <TimeTrackingTable
                    filters={filters}
                    isLoading={false}
                    reports={reports.data?.employees || []}
                  />
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
            <h3 className="text-lg font-medium text-slate-900">
              Configura los filtros y pulsa &quot;Generar Listado&quot;
            </h3>
          </div>
        )}
      </div>
    </div>
  );
}
