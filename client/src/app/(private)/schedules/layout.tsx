import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Horarios",
  description: "Gestión de horarios",
};

export default function SchedulesLayout({
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
