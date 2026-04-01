'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const HIDDEN_PATHS = new Set(['/', '/home']);

export default function BackToHomeButton() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!pathname || HIDDEN_PATHS.has(pathname)) {
    return null;
  }

  const homeHref = user ? '/home' : '/';

  return (
    <Button
      variant="ghost"
      size="sm"
      asChild
      className="fixed left-4 top-20 z-40 border border-border/70 bg-background/90 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/80"
    >
      <Link href={homeHref} className="gap-2 text-sm">
        <ArrowLeft className="h-4 w-4" />
        <span>Back to home</span>
      </Link>
    </Button>
  );
}
