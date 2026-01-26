import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Perfiles",
  description: "Gestión de perfiles de los empleados",
};

export default function ProfilesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
