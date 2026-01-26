import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ubicaciones",
  description: "Gestión de ubicaciones de los centros de trabajo",
};

export default function LocationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
