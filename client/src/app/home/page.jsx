'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/api';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Plus, TrendingUp, Users, MapPin, Clock, CalendarPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext.jsx';

export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    upcomingEvents: 0,
    totalAttendees: 0
  });
  const [loading, setLoading] = useState(true);
  const [calendars, setCalendars] = useState({
    created: [],
    subscribed: []
  });
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
  const { user, isLoading: authLoading } = useAuth();

  useEffect(() => {
    // only fetch after auth check completes; if user changes (login) we
    // want to re-run to pull creator events correctly.
    if (authLoading) return;

    const fetchData = async () => {
      try {
        // request `all=true` so creators see their own events regardless of
        // date; limit is still applied client‑side afterwards
        const eventsResponse = await api.get('/events?limit=6&all=true');
        setEvents(Array.isArray(eventsResponse.data) ? eventsResponse.data : []);
      } catch (err) {
        console.error('Error fetching events:', err);
        setEvents([]);
      }

      try {
        const statsResponse = await api.get('/events/stats');
        if (statsResponse.data) {
          setStats({
            totalEvents: statsResponse.data.total_events || 0,
            upcomingEvents: statsResponse.data.upcoming_events || 0,
            totalAttendees:
              statsResponse.data.total_attendees ??
              statsResponse.data.reserved_seats ??
              0,
          });
        }
      } catch (err) {
        console.warn('Stats endpoint failed, using defaults:', err);
        setStats({
          totalEvents: 0,
          upcomingEvents: 0,
          totalAttendees: 0
        });
      }

      setCalendars({
        created: [],
        subscribed: []
      });

      setLoading(false);
    };

    fetchData();
  }, [authLoading, user]);

  return (
    <div className="min-h-screen bg-slate-950 text-foreground">
      <Header />

      <main className="container mx-auto px-6 py-8">
        <div className="flex flex-col gap-8">
          {/* Welcome Section */}
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold">Welcome back!</h1>
            <p className="text-muted-foreground">
              Manage your events and discover what's happening in your area.
            </p>
          </div>

          {/* Quick Stats */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalEvents}</div>
                <p className="text-xs text-muted-foreground">
                  Events you've created
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.upcomingEvents}</div>
                <p className="text-xs text-muted-foreground">
                  Events happening soon
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalAttendees}</div>
                <p className="text-xs text-muted-foreground">
                  People attending your events
                </p>
              </CardContent>
            </Card>
          </div>


          {/* Recent Events */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Your Recent Events</h2>
              <Button variant="ghost" asChild>
                <Link href="/events">View all</Link>
              </Button>
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
            ) : events.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {events.slice(0, 6).map((event) => (
                  <Card key={event.id} className="hover:shadow-lg transition-shadow">
                    {event.image_url ? (
                      <div className="relative h-44 overflow-hidden rounded-t-lg bg-slate-800">
                        <img
                          src={`${base}${event.image_url}`}
                          alt={event.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="relative h-44 overflow-hidden rounded-t-lg bg-muted flex items-center justify-center text-muted-foreground">
                        No Image
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex justify-between items-start mb-2">
                        <CardTitle className="text-lg">{event.title}</CardTitle>
                        <Badge variant="secondary">{event.category?.name}</Badge>
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground gap-4">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          <span>{event.venue}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(event.date).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                        {event.description}
                      </p>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-2xl font-bold text-primary">
                          {event.price === 0 ? 'Free' : `KSh ${event.price}`}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {event.available_seats} seats left
                        </span>
                      </div>
                      <Button asChild className="w-full">
                        <Link href={`/events/${event.id}`}>
                          View Details
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-muted-foreground mb-4">
                  <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No events yet</h3>
                  {/* <p>Create your first event to get started!</p> */}
                </div>
                <Button asChild className="mt-4">
                  <Link href="/events/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Event
                  </Link>
                </Button>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
