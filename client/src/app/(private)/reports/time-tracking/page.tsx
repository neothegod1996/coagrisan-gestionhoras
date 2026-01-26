"use client";

import { useState } from "react";
import { ArrowLeft, Users, Filter, Clock, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TimeTrackingFilters } from "@/types/time-tracking";
import TimeTrackingFiltersComponent from "@/components/time-tracking/time-tracking-filters";
import TimeTrackingTable from "@/components/time-tracking/time-tracking-table";
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

export default function TimeTrackingReportPage() {
  const [reports, setReports] = useState<RequestHandler<Report | null>>({ data: null, loading: false });

  async function handleGetReports(filters: ReportParams) {
    setReports({ data: null, loading: true });
    getReports(filters)
    .then((response) => {
      setReports({ data: response?.data || null, loading: false });
    })
    .catch(() => {
      toast.error("Hubo un error al obtener los reportes, intente nuevamente");
      setReports({ data: null, loading: false });
    });
  }

  const [filters, setFilters] = useState<TimeTrackingFilters>({
    start_date: dayjs().startOf('month').toDate(),
    end_date: dayjs().toDate()
  });
  
  const [isLoading, setIsLoading] = useState(false);

  const handleFiltersChange = (newFilters: TimeTrackingFilters) => {
    setFilters(newFilters);
    handleGetReports(newFilters);
  };

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const generatePDF = (): jsPDF | null => {
    if (!reports.data?.employees?.length) {
      return null;
    }

    const doc = new jsPDF('l', 'mm', 'a4'); // landscape orientation
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Título
    doc.setFontSize(18);
    doc.setTextColor(83, 117, 51); // brand-primary
    doc.text('Reporte de Fichajes', pageWidth / 2, 15, { align: 'center' });
    
    // Rango de fechas
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    const dateRange = `${dayjs(filters.start_date).format("DD/MM/YYYY")} - ${dayjs(filters.end_date).format("DD/MM/YYYY")}`;
    doc.text(dateRange, pageWidth / 2, 22, { align: 'center' });

    let yPosition = 30;

    // Estadísticas generales
    if (reports.data.statistics) {
      const stats = reports.data.statistics;
      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text('Resumen General', 14, yPosition);
      
      autoTable(doc, {
        startY: yPosition + 5,
        head: [['Total Empleados', 'Total Horas', 'Horas Normales', 'Horas Extras', 'Promedio Horas/Empleado']],
        body: [[
          stats.total_employees.toString(),
          formatHours(stats.total_hours),
          formatHours(stats.normal_hours),
          formatHours(stats.extra_hours),
          formatHours(stats.average_hours_per_employee)
        ]],
        theme: 'grid',
        headStyles: { fillColor: [83, 117, 51], fontSize: 10 },
        styles: { fontSize: 9, cellPadding: 3 },
        margin: { left: 14, right: 14 }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    // Datos por empleado
    reports.data.employees.forEach((employee, empIndex) => {
      // Verificar si necesitamos una nueva página
      if (yPosition > 170) {
        doc.addPage();
        yPosition = 20;
      }

      // Encabezado del empleado
      doc.setFontSize(11);
      doc.setTextColor(83, 117, 51);
      doc.text(`${employee.id.slice(-10)} - ${employee.full_name}`, 14, yPosition);
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Total: ${formatHours(employee.total_hours)} | Normales: ${formatHours(employee.normal_hours)} | Extras: ${formatHours(employee.extra_hours)}`, 14, yPosition + 5);

      yPosition += 10;

      // Tabla de semanas y días
      const tableData: any[] = [];
      
      employee.weeks.forEach((week) => {
        // Fila de semana
        tableData.push([
          { content: `Semana ${week.week_number} (${week.week_range})`, colSpan: 2, styles: { fontStyle: 'bold', fillColor: [230, 234, 217] } },
          { content: formatHours(week.total_hours), styles: { fontStyle: 'bold', fillColor: [230, 234, 217] } },
          { content: formatHours(week.normal_hours), styles: { fontStyle: 'bold', fillColor: [230, 234, 217] } },
          { content: formatHours(week.extra_hours), styles: { fontStyle: 'bold', fillColor: [230, 234, 217] } }
        ]);

        // Días de la semana
        week.days.forEach((day) => {
          const dayOfWeek = dayjs(day.date).format('ddd');
          tableData.push([
            `  ${dayjs(day.date).format('DD/MM/YYYY')} (${dayOfWeek})`,
            day.schedule_info,
            formatHours(day.total_hours),
            formatHours(day.normal_hours),
            day.extra_hours > 0 ? formatHours(day.extra_hours) : 'N/A'
          ]);

          // Sesiones del día
          day.sessions.forEach((session, sessionIndex) => {
            const scheduleTime = `${dayjs(session.schedule_start).format('HH:mm')}-${dayjs(session.schedule_end).format('HH:mm')}`;
            const clockIn = session.clock_in ? dayjs(session.clock_in).format('HH:mm') : 'N/A';
            const clockOut = session.clock_out ? dayjs(session.clock_out).format('HH:mm') : 'N/A';
            tableData.push([
              `    Sesión ${sessionIndex + 1}`,
              `${scheduleTime} | E:${clockIn} S:${clockOut}`,
              '',
              '',
              session.has_incidence ? 'Incidencia' : ''
            ]);
          });
        });
      });

      autoTable(doc, {
        startY: yPosition,
        head: [['Fecha', 'Horario/Sesión', 'Trabajo', 'Normales', 'Extras']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [83, 117, 51], fontSize: 8 },
        styles: { fontSize: 7, cellPadding: 2 },
        margin: { left: 14, right: 14 },
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 70 },
          2: { cellWidth: 25 },
          3: { cellWidth: 25 },
          4: { cellWidth: 25 }
        }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 8;
    });

    return doc;
  };

  const handleDownloadPDF = async () => {
    try {
      const doc = generatePDF();
      
      if (!doc) {
        toast.error("No hay datos para generar el reporte");
        return;
      }

      const fileName = `reporte_fichajes_${dayjs(filters.start_date).format('YYYYMMDD')}_${dayjs(filters.end_date).format('YYYYMMDD')}.pdf`;
      doc.save(fileName);
      toast.success("Reporte descargado exitosamente");
    } catch (error) {
      console.error(error);
      toast.error("Hubo un error al descargar el reporte, intente nuevamente");
    }
  };

  const handlePrint = async () => {
    try {
      const doc = generatePDF();
      
      if (!doc) {
        toast.error("No hay datos para generar el reporte");
        return;
      }

      // Abrir PDF en nueva ventana para imprimir
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.addEventListener('load', () => {
          printWindow.print();
        });
      } else {
        toast.error("No se pudo abrir la ventana de impresión. Por favor, permite las ventanas emergentes.");
      }
    } catch (error) {
      console.error(error);
      toast.error("Hubo un error al imprimir el reporte, intente nuevamente");
    }
  };

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
                <p className="text-slate-200 mt-1">Reporte de horas trabajadas de empleados</p>
              </div>
            </div>
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

        {/* Filtros */}
        <div className="mb-6">
          <Card className="border border-slate-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Filter className="w-5 h-5 text-brand-primary" />
                  Filtros de Búsqueda
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <TimeTrackingFiltersComponent
                filters={filters}
                onFiltersChange={handleFiltersChange}
                isLoading={isLoading}
              />
            </CardContent>
          </Card>
        </div>

        {reports.loading ? (
          <div className="text-center py-20">
            <RingLoading />
          </div>
        ) : reports.data?.employees?.length && reports.data?.statistics ? (
          <>
            <div className="flex justify-end gap-3 mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrint}
                  className="rounded-md"
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimir Reporte
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPDF}
                  className="rounded-md"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Descargar Reporte
                </Button>
            </div>
            <div className="mb-6">
              <TimeTrackingSummaryComponent summary={reports.data?.statistics} />
            </div>

            <div className="bg-white rounded-lg shadow-lg border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <Users className="w-5 h-5 text-brand-primary" />
                    Detalle de Fichajes
                  </h3>
                  <div className="text-sm text-slate-600">
                    {isLoading ? 'Cargando...' : `Mostrando resultados del ${dayjs(filters.start_date).format("DD [de] MMMM, YYYY")} al ${dayjs(filters.end_date).format("DD [de] MMMM, YYYY")}`}
                  </div>
                </div>
              </div>

              <div className="p-0">
                <TimeTrackingTable
                  filters={filters}
                  isLoading={isLoading}
                  reports={reports.data?.employees || []}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="text-slate-400 mb-2">
              <Clock className="w-12 h-12 mx-auto mb-4" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              Haz una búsqueda para ver los resultados
            </h3>
          </div>
        )}
      </div>
    </div>
  );
}