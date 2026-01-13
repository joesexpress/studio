'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';

export default function MainHeader() {
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
      <SidebarTrigger className="md:hidden" />

      <div className="relative flex-1">
        {/* Search input can be re-enabled later if needed */}
      </div>

      <div className="flex items-center gap-4">
        {/* User avatar and menu removed as there is no login */}
      </div>
    </header>
  );
}
