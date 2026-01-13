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
import { AppWindow, BarChart3, Settings, Users } from 'lucide-react';
import MainHeader from '@/components/main-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getPlaceholderImage } from '@/lib/placeholder-data';
import { Button } from '@/components/ui/button';
import { FirebaseClientProvider } from '@/firebase';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const userAvatar = getPlaceholderImage('user-avatar');

  return (
    <FirebaseClientProvider>
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center justify-center p-2">
              <Image
                src="https://storage.googleapis.com/project-os-prod-public/a6198642-8872-4665-9114-15c99d21d51a.png"
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
          <main className="flex-1 overflow-y-auto p-4 lg:p-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </FirebaseClientProvider>
  );
}
