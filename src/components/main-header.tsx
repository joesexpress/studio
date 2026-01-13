'use client';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from './ui/button';
import { getPlaceholderImage } from '@/lib/placeholder-data';
import Image from 'next/image';

export default function MainHeader() {
  const userAvatar = getPlaceholderImage('user-avatar');
  return (
    <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:h-16 sm:px-6">
      <SidebarTrigger className="md:hidden" />

      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search records..."
          className="w-full rounded-lg bg-background pl-8 md:w-[280px] lg:w-[320px]"
        />
      </div>

      <div className="flex items-center gap-4">
        <Button variant="outline">Help</Button>
        {userAvatar && (
            <Avatar className="h-9 w-9">
              <AvatarImage asChild src={userAvatar.imageUrl} alt={userAvatar.description}>
                <Image 
                    src={userAvatar.imageUrl} 
                    alt={userAvatar.description} 
                    width={40} 
                    height={40}
                    data-ai-hint={userAvatar.imageHint}
                />
              </AvatarImage>
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
        )}
      </div>
    </header>
  );
}
