import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seguimiento de tareas",
  description: "Seguimiento de tareas para los empleados",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}