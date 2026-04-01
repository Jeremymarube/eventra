'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Search,
  Bell,
  User,
  Calendar,
  Compass,
  Plus,
  Settings,
  LogOut,
  Ticket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import {
  loadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  subscribeNotifications,
} from '@/lib/notifications';
import {
  loadProfileImage,
  subscribeProfileImageChanges,
} from '@/lib/profileImage';

export default function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [profileImage, setProfileImage] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const isHomepage = pathname === '/';

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const guestRoutes = ['/events', '/discover', '/categories', '/login', '/register'];
    const signedInRoutes = ['/home', '/discover', '/events/new', '/home/calendars', '/profile'];
    const routesToPrefetch = user ? signedInRoutes : guestRoutes;

    routesToPrefetch.forEach((route) => {
      router.prefetch(route);
    });
  }, [router, user]);

  useEffect(() => {
    if (!user) {
      setProfileImage(null);
      return;
    }

    const savedImage = loadProfileImage(user.id);
    setProfileImage(savedImage || user.profileImage || null);

    const unsubscribe = subscribeProfileImageChanges(user.id, (nextImage) => {
      setProfileImage(nextImage);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    const loadCurrentNotifications = () => {
      setNotifications(loadNotifications(user.id));
    };

    loadCurrentNotifications();

    const unsubscribe = subscribeNotifications(user.id, setNotifications);
    return () => unsubscribe();
  }, [user]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (notificationId, url) => {
    if (!user) return;
    markNotificationRead(user.id, notificationId);
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === notificationId ? { ...notification, read: true } : notification
      )
    );
    if (url) {
      router.push(url);
    }
  };

  const markAllAsRead = () => {
    if (!user) return;
    markAllNotificationsRead(user.id);
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
  };

  const navigationItems = user
    ? [
        { label: 'Events', href: '/home', icon: Calendar },
        { label: 'Calendars', href: '/home/calendars', icon: Calendar },
        { label: 'Discover', href: '/discover', icon: Compass },
      ]
    : [
        { label: 'Explore Events', href: '/events', icon: Ticket },
        { label: 'Discover', href: '/discover', icon: Compass },
      ];

  return (
    <header className={`sticky top-0 z-50 w-full border-b border-blue-900 ${
      isHomepage ? 'bg-black' : 'bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'
    }`}>
      <div className="container flex h-16 items-center justify-between px-4 relative">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <span className="text-white font-black text-xl drop-shadow-sm">E</span>
            </div>
            <span className="font-bold text-xl text-sky-400">Eventra</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center space-x-6">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                className="flex items-center space-x-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center space-x-4">
          {user ? (
            <>
              <div className="hidden md:block text-sm text-muted-foreground">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} GMT
              </div>

              <Button
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white"
                onClick={() => router.push('/events/new')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0"
                  >
                    <Search className="h-6 w-6" />
                    <span className="sr-only">Shortcuts</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 bg-black border-slate-700">
                  <div className="p-4 border-b border-slate-700">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search events..."
                        className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-md text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        autoFocus
                      />
                    </div>
                  </div>
                  <div className="p-2 border-b border-slate-700">
                    <h3 className="font-medium text-white text-sm px-2 py-1">Shortcuts</h3>
                  </div>
                  <DropdownMenuItem
                    onClick={() => router.push('/events/new')}
                    className="text-slate-200 hover:bg-slate-800 focus:bg-slate-800"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create Event
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push('/home')}
                    className="text-slate-200 hover:bg-slate-800 focus:bg-slate-800"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Open Home
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push('/home/calendars')}
                    className="text-slate-200 hover:bg-slate-800 focus:bg-slate-800"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Open Calendars
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push('/discover')}
                    className="text-slate-200 hover:bg-slate-800 focus:bg-slate-800"
                  >
                    <Compass className="mr-2 h-4 w-4" />
                    Open Discover
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => router.push('/help')}
                    className="text-slate-200 hover:bg-slate-800 focus:bg-slate-800"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Open Help
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-700" />
                  <DropdownMenuItem
                    onClick={() => router.push('/events?filter=attending')}
                    className="text-slate-200 hover:bg-slate-800 focus:bg-slate-800"
                  >
                    <Ticket className="mr-2 h-4 w-4" />
                    Attending
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0 relative">
                    <Bell className="h-6 w-6" />
                    <span className="sr-only">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 bg-black border-slate-700">
                  <div className="flex items-center justify-between p-4 border-b border-slate-700">
                    <h3 className="font-medium text-white">Notifications</h3>
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Mark all read
                      </Button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 border-b border-slate-800 hover:bg-slate-900 cursor-pointer transition-colors ${
                            !notification.read ? 'bg-slate-900/50' : ''
                          }`}
                          onClick={() => markAsRead(notification.id, notification.url)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              notification.type === 'event_reminder' ? 'bg-orange-500' :
                              notification.type === 'booking_confirmation' ? 'bg-green-500' :
                              notification.type === 'payment_received' ? 'bg-blue-500' :
                              'bg-gray-500'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-white truncate">
                                {notification.title}
                              </p>
                              <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-slate-500 mt-1">
                                {new Date(notification.timestamp).toLocaleString()}
                              </p>
                            </div>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-slate-400">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No notifications yet</p>
                      </div>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="p-2 border-t border-slate-700">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full text-xs text-slate-400 hover:text-white"
                        onClick={() => router.push('/notifications')}
                      >
                        View all notifications
                      </Button>
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-9 w-9 p-0 rounded-full bg-slate-700 hover:bg-slate-600">
                    <Avatar className="h-8 w-8 rounded-full">
                      <AvatarImage src={profileImage} />
                      <AvatarFallback className="bg-slate-600 text-white text-xs rounded-full">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="sr-only">Profile</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-black border-slate-700">
                  <div className="flex items-center justify-start gap-2 p-2 border-b border-slate-700">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profileImage} />
                      <AvatarFallback className="bg-slate-600 text-white text-xs">
                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium text-white">{user.name}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                  </div>
                  <DropdownMenuSeparator className="bg-slate-700" />
                  <DropdownMenuItem onClick={() => router.push('/profile')} className="text-slate-200 hover:bg-slate-800 focus:bg-slate-800">
                    <User className="mr-2 h-4 w-4" />
                    View Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/settings')} className="text-slate-200 hover:bg-slate-800 focus:bg-slate-800">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-slate-700" />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-400 hover:bg-red-900/20 focus:bg-red-900/20">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white flex items-center space-x-2"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('redirectAfterLogin', '/events/new');
                  }
                  router.push('/login');
                }}
              >
                <Plus className="h-4 w-4" />
                <span>Create Event</span>
              </Button>

              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Sign In
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
