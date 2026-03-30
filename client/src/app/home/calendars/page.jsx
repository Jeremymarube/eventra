'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api/api';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CalendarPlus, Users, Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function HomeCalendarsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [calendars, setCalendars] = useState({
    created: [],
    subscribed: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCalendars = async () => {
      try {
        // In absence of dedicated calendar endpoints, show upcoming events as placeholder
        const { default: eventService } = await import('@/lib/api/events');
        const events = await eventService.getEvents();
        const now = new Date();
        const calendarsData = events.map((e) => ({
          id: e.id,
          name: e.title,
          description: e.venue || '',
          color: '#'+Math.floor(Math.random()*16777215).toString(16),
          events_count: 1,
          created_at: e.date || now.toISOString(),
        }));
        setCalendars({ created: calendarsData, subscribed: [] });
      } catch (error) {
        console.error('Failed to fetch calendars/events:', error);
        setCalendars({ created: [], subscribed: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchCalendars();
  }, [user]);

  return (
    <div className="min-h-screen bg-slate-950 text-foreground">
      <Header />

      <main className="container mx-auto px-6 py-8">
        <div className="flex flex-col gap-8">
          {/* My Calendars */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-6 w-6 text-blue-400" />
              <h2 className="text-2xl font-semibold">My Calendars</h2>
              <Badge variant="secondary" className="ml-2">
                {calendars.created.length}
              </Badge>
            </div>

            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : calendars.created.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {calendars.created.map((calendar) => (
                  <Card key={calendar.id} className="hover:shadow-lg transition-shadow bg-slate-900 border-slate-700">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: calendar.color }}
                        />
                        <CardTitle className="text-lg text-white">{calendar.name}</CardTitle>
                      </div>
                      <p className="text-sm text-slate-300">{calendar.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mb-4">
                        <div className="text-sm text-slate-400">
                          {calendar.events_count} events
                        </div>
                        <div className="text-xs text-slate-500">
                          Created {new Date(calendar.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800">
                          Manage
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800">
                          View Events
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-slate-900 rounded-lg border border-slate-700">
                <div className="text-slate-400 mb-4">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No calendars yet</h3>
                  <p>Create your first calendar to organize your events!</p>
                </div>
                <Button asChild className="mt-4 bg-orange-500 hover:bg-orange-600 text-white">
                  <Link href="/calendars/new">
                    <CalendarPlus className="h-4 w-4 mr-2" />
                    Create Your First Calendar
                  </Link>
                </Button>
              </div>
            )}
          </div>

          {/* Subscribed Calendars */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2">
              <Star className="h-6 w-6 text-yellow-500" />
              <h2 className="text-2xl font-semibold">Subscribed Calendars</h2>
              <Badge variant="secondary" className="ml-2">
                {calendars.subscribed.length}
              </Badge>
            </div>

            {calendars.subscribed.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {calendars.subscribed.map((calendar) => (
                  <Card key={calendar.id} className="hover:shadow-lg transition-shadow bg-slate-900 border-slate-700">
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: calendar.color }}
                        />
                        <CardTitle className="text-lg text-white">{calendar.name}</CardTitle>
                        <Badge variant="secondary" className="ml-auto">
                          <Star className="h-3 w-3 mr-1" />
                          Subscribed
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-300">{calendar.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-4 text-sm text-slate-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{calendar.events_count} events</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            <span>{calendar.subscribers.toLocaleString()} subscribers</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-800">
                          View Calendar
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1 border-red-600 text-red-400 hover:bg-red-900/20">
                          Unsubscribe
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-900 rounded-lg border border-slate-700">
                <div className="text-slate-400 mb-4">
                  <Star className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No subscribed calendars yet</p>
                </div>
                <Button variant="outline" asChild className="border-slate-600 text-slate-300 hover:bg-slate-800">
                  <Link href="/discover">Discover Calendars</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
