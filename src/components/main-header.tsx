'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Search, LogOut } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from './ui/button';
import { getPlaceholderImage } from '@/lib/placeholder-data';
import Image from 'next/image';
import { useFirebase } from '@/firebase';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut } from 'firebase/auth';

export default function MainHeader() {
  const { user, auth } = useFirebase();
  const userAvatar = getPlaceholderImage('user-avatar');

  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
      <SidebarTrigger className="md:hidden" />

      <div className="relative flex-1">
        {/* Search input can be re-enabled later if needed */}
        {/* <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search records..."
          className="w-full rounded-lg bg-background pl-8 md:w-[280px] lg:w-[320px]"
        /> */}
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                <Avatar className="h-9 w-9">
                  {userAvatar && (
                    <AvatarImage asChild src={userAvatar.imageUrl} alt={userAvatar.description}>
                      <Image 
                          src={userAvatar.imageUrl} 
                          alt={userAvatar.description} 
                          width={40} 
                          height={40}
                          data-ai-hint={userAvatar.imageHint}
                      />
                    </AvatarImage>
                  )}
                  <AvatarFallback>{user.email?.charAt(0).toUpperCase() || 'G'}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">Guest</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut(auth)}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
           <Avatar className="h-9 w-9">
              <AvatarFallback>G</AvatarFallback>
            </Avatar>
        )}
      </div>
    </header>
  );
}
