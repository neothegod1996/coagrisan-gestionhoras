import AuthGuard from "@/components/layout/auth-guard";

export default function PrivateLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <AuthGuard>
            {children}
        </AuthGuard>
    );
}
