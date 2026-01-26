import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calendario",
  description: "Gestión de calendario global",
};

export default function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      {children}
    </div>
  );
}
