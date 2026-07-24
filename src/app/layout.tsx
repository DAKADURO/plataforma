import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";
import AppShell from "@/components/layout/AppShell";
import { headers } from "next/headers";
import { getAccountsReceivable } from "@/app/actions/payments";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const jakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "800"],
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
  let paymentAlerts: { id: string; concept: string; amount: number; dueDate: Date | null; projectId: string; projectName: string }[] = [];

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

        // Alertas de cobro (vencido o vence en 7 días): solo para roles financieros,
        // para no pagar esta consulta en cada carga de página de un TECNICO.
        if (dbUser.role === 'ADMIN' || dbUser.role === 'GERENTE') {
          const receivable = await getAccountsReceivable();
          if (receivable.success && receivable.summary) {
            const soon = new Date();
            soon.setDate(soon.getDate() + 7);
            paymentAlerts = receivable.summary.pending
              .filter(p => p.dueDate && new Date(p.dueDate) <= soon)
              .map(p => ({
                id: p.id,
                concept: p.concept,
                amount: p.amount,
                dueDate: p.dueDate,
                projectId: p.project.id,
                projectName: p.project.name
              }));
          }
        }
      }
    } catch {
      // If Prisma fails (e.g. on login page load), just skip
    }
  }

  return (
    <html
      lang="es"
      className={`${inter.variable} ${jakartaSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* Initialize theme before first paint to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        {userInfo && !isBareRoute ? (
          <AppShell user={userInfo} paymentAlerts={paymentAlerts}>
            {children}
          </AppShell>
        ) : (
          children
        )}
      </body>
    </html>
  );
}
