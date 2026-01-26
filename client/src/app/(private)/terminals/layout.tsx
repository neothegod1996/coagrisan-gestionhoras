import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terminales",
  description: "Gestión de terminales de fichaje",
};

export default function TerminalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
