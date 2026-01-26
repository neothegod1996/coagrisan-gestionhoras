import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { getProfile } from "@/services/auth";
import AuthProvider from "@/components/layout/auth-provider";
import RoleGuard from "@/components/layout/role-guard";

export const metadata: Metadata = {
  title: {
    default: "Sistema de fichajes",
    template: "%s | Sistema de fichajes",
  },
  description: "Sistema de fichajes para Coagrisan",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const profile = await getProfile();
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`antialiased`}
      >
        <AuthProvider user={profile?.data || null} />
        <RoleGuard>
          {children}
        </RoleGuard>
        <Toaster position={'top-right'} />
      </body>
    </html>
  );
}