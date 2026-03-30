'use client';
import Link from 'next/link';

export const Navbar = () => {
  return (
    <nav className="fixed top-0 w-full z-50 border-b border-border/40 bg-[#050c1a] backdrop-blur">
  <div className="container mx-auto px-4 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <span className="text-primary text-3xl">🎫</span>
          <span>Eventra</span>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          {/* <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
            Home
          </Link> */}
          <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
            Events
          </Link>
          <Link href="/admin" className="text-muted-foreground hover:text-foreground transition-colors">
            Admin
          </Link>
        </div>

        {/* Auth Controls */}
        <div className="flex items-center gap-4">
          <Link href="/signin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Sign In
          </Link>

          {/* <Link href="/signup" className="hidden sm:inline text-sm text-muted-foreground hover:text-foreground transition-colors">
            Sign Up
          </Link> */}

          <Link href="/signup">
            {/* <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors">
              Get Started
            </button> */}
            <button className="px-4 py-2 bg-orange-500 text-white rounded-md font-medium hover:bg-orange-600 transition-colors">
  Get Started
</button>
          </Link>
        </div>
      </div>
    </nav>
  );
};
