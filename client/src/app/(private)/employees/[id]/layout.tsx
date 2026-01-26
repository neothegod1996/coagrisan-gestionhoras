import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Empleados",
  description: "Gestión de empleados",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}