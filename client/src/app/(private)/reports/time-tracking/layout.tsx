import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Reporte de Fichajes",
    description: "Reporte de fichajes de los empleados",
};

export default function LocationsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
