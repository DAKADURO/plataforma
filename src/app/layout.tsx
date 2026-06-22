import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import { headers } from "next/headers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Plataforma de Gestión Empresarial",
  description: "Sistema de gestión empresarial integrado: almacén, proyectos, documentos y más.",
};

// Routes that should NOT have the AppShell (no navbar)
const BARE_ROUTES = ['/login', '/visor'];

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get('x-invoke-path') ?? headersList.get('x-pathname') ?? '';
  const isBareRoute = BARE_ROUTES.some(route => pathname.startsWith(route));

  let userInfo: { email: string; role: string } | null = null;

  if (!isBareRoute) {
    try {
      const supabase = await createSupabaseServerClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Look up role in Prisma (upsert ensures the user record exists)
        const dbUser = await prisma.user.upsert({
          where: { email: user.email! },
          update: {},
          create: { email: user.email!, role: 'TECNICO' },
        });
        userInfo = { email: user.email!, role: dbUser.role };
      }
    } catch {
      // If Prisma fails (e.g. on login page load), just skip
    }
  }

  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {userInfo && !isBareRoute ? (
          <AppShell user={userInfo}>
            {children}
          </AppShell>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
