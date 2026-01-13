import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
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
} from 'lucide-react';
import MainHeader from '@/components/main-header';
import { FirebaseClientProvider } from '@/firebase';

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
    'https://storage.googleapis.com/project-os-prod-public/a6198642-8872-4665-9114-15c99d21d51a.png';
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
                <SidebarMenuButton asChild tooltip="Records">
                  <Link href="/records">
                    <AppWindow />
                    <span>Service Records</span>
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
                <SidebarMenuButton asChild tooltip="Customers">
                  <Link href="/customers">
                    <Users />
                    <span>Customers</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Invoices">
                  <Link href="/invoices">
                    <FileText />
                    <span>Invoices</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Jobs">
                  <Link href="/jobs">
                    <CalendarCheck />
                    <span>Jobs</span>
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
                <SidebarMenuButton asChild tooltip="Orders">
                  <Link href="/orders">
                    <ShoppingCart />
                    <span>Orders</span>
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
        <Toaster />
      </body>
    </html>
  );
}
