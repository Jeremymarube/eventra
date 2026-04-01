'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Clock, Check, ArrowRight } from 'lucide-react';
import {
  loadNotifications,
  subscribeNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/notifications';

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user) return;

    const loadCurrent = () => {
      setNotifications(loadNotifications(user.id));
    };

    loadCurrent();
    const unsubscribe = subscribeNotifications(user.id, setNotifications);
    return () => unsubscribe();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="container mx-auto px-6 py-16 text-center">
          <h1 className="text-3xl font-semibold mb-4">Sign in to view notifications</h1>
          <p className="text-slate-400 mb-8">Your notifications are stored here once you log in and interact with Eventra.</p>
          <Button asChild>
            <Link href="/login">Sign In</Link>
          </Button>
        </main>
      </div>
    );
  }

  const unreadCount = notifications.filter((notification) => !notification.read).length;

  const handleMarkAllRead = () => {
    markAllNotificationsRead(user.id);
    setNotifications((prev) => prev.map((notification) => ({ ...notification, read: true })));
  };

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markNotificationRead(user.id, notification.id);
    }
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === notification.id ? { ...item, read: true } : item
      )
    );

    if (notification.url) {
      router.push(notification.url);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="container mx-auto px-6 py-10">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Notifications</h1>
              <p className="text-slate-400 mt-1">
                {unreadCount > 0
                  ? `You have ${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
                  : 'You are all caught up.'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm" onClick={handleMarkAllRead}>
                <Check className="mr-2 h-4 w-4" />
                Mark all read
              </Button>
              <Button variant="outline" size="sm" onClick={() => router.push('/home')}>
                <ArrowRight className="mr-2 h-4 w-4" />
                Back to home
              </Button>
            </div>
          </div>

          <div className="grid gap-4">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left rounded-2xl border p-5 transition-all hover:border-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                    notification.read ? 'border-slate-700 bg-slate-950' : 'border-blue-600 bg-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-blue-600 p-3 text-white">
                        <Bell className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-base font-medium text-white">{notification.title}</p>
                        <p className="text-sm text-slate-400 mt-1">{notification.message}</p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <Badge variant={notification.read ? 'secondary' : 'outline'}>
                        {notification.read ? 'Read' : 'New'}
                      </Badge>
                      <p className="text-xs text-slate-500">
                        {new Date(notification.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-10 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-slate-300">
                  <Clock className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-semibold mb-2">No notifications yet</h2>
                <p className="text-slate-500">Create an event, book a ticket, or stay active to receive updates.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
