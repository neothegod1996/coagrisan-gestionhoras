import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Altas y bajas de empleados",
  description: "Gestión de altas y bajas de empleados",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}