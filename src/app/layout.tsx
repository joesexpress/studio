
import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarFooter,
} from '@/components/ui/sidebar';
import {
  AppWindow,
  BarChart3,
  Settings,
  Users,
  CalendarCheck,
  FileText,
  Book,
  ClipboardPen,
  Link2,
  Clock,
  ShoppingCart,
  Quote,
  Map,
} from 'lucide-react';
import MainHeader from '@/components/main-header';
import { FirebaseClientProvider } from '@/firebase';
import { ToasterProvider } from '@/components/toaster-provider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});


export const metadata: Metadata = {
  title: 'HVAC Service Records Analyzer',
  description: 'Analyze and manage your HVAC service records with ease.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const logoUrl =
    'https://storage.googleapis.com/project-os-prod-public/dadd1530-9983-4015-9a25-97f439a3f283.png';
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("font-body antialiased", inter.variable, 'bg-background')}>
        <FirebaseClientProvider>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center justify-center p-4">
              <Image
                src={logoUrl}
                alt="K & D Refrigeration & Heating"
                width={180}
                height={50}
                className="w-auto h-auto"
                unoptimized
              />
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Master Job Sheet">
                  <Link href="/records">
                    <AppWindow />
                    <span>Master Job Sheet</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Quotes">
                  <Link href="/quotes">
                    <Quote />
                    <span>Quotes</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Dashboard">
                  <Link href="/dashboard">
                    <BarChart3 />
                    <span>Dashboard</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Customers & Jobs">
                  <Link href="/customers">
                    <Users />
                    <span>Customers & Jobs</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Accounts Receivable">
                  <Link href="/invoices">
                    <FileText />
                    <span>Accounts Receivable</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Tasks/Calendar">
                  <Link href="/jobs">
                    <CalendarCheck />
                    <span>Tasks/Calendar</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Time Clock">
                  <Link href="/time-clock">
                    <Clock />
                    <span>Time Clock</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Shopping List">
                  <Link href="/orders">
                    <ShoppingCart />
                    <span>Shopping List</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Expenses">
                  <Link href="/expenses">
                    <ClipboardPen />
                    <span>Expenses</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Price Book">
                  <Link href="/price-book">
                    <Book />
                    <span>Price Book</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Company Drive">
                  <a href="https://drive.google.com/drive/folders/1sGSRgseVIoXM6POdzyvti4qh88iHimS6" target="_blank" rel="noopener noreferrer">
                    <Link2 />
                    <span>Company Drive</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Settings">
                  <Link href="#">
                    <Settings />
                    <span>Settings</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex flex-col">
          <MainHeader />
          <main className="relative flex-1 overflow-y-auto p-4 lg:p-6">
            <div
              className="absolute inset-0 z-0 bg-contain bg-center bg-no-repeat opacity-5"
              style={{
                backgroundImage: `url(${logoUrl})`,
              }}
            />
            <div className="relative z-10">{children}</div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </FirebaseClientProvider>
        <ToasterProvider />
      </body>
    </html>
  );
}
