import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Centros",
  description: "Gestión de centros de trabajo",
};

export default function CentersLayout({
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
