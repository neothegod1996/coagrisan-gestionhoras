import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Categorías",
  description: "Gestión de categorías de los empleados",
};

export default function ProfilesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
