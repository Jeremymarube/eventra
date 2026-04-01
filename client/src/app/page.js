'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/api';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import Footer from '@/components/Footer';

export default function HomePage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.get('/events?limit=3');
        setEvents(response.data);
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-foreground">
      <Header />

      <main className="mx-auto max-w-5xl px-6 py-16">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <h1 className="text-4xl font-semibold tracking-tight">Discover Amazing Events</h1>
            <p className="text-base text-muted-foreground max-w-2xl">
              Find and book tickets for the best events in your area. Choose your seats, pay securely with M-Pesa, and get your QR code tickets instantly.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 py-8">
            <h2 className="text-2xl font-semibold">Ready to host an event?</h2>
            <p className="text-muted-foreground text-center max-w-md">
              Create your first event and start connecting with attendees. Join thousands of event organizers using Eventra.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/events"
                className="inline-flex items-center justify-center rounded-md border border-border bg-background px-8 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors"
              >
                Explore Events
              </Link>
              <Link
                href={user ? '/events/new' : '/register'}
                className="inline-flex items-center justify-center rounded-md bg-orange-500 px-8 py-3 text-sm font-medium text-white hover:bg-orange-600 transition-colors"
              >
                Create Your First Event
              </Link>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-border p-5">
              <div className="text-sm font-medium">Real-time Seat Selection</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Choose available seats instantly with live updates.
              </div>
            </div>
            <div className="rounded-lg border border-border p-5">
              <div className="text-sm font-medium">Instant Reservation</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Your seats are held securely during checkout.
              </div>
            </div>
            <div className="rounded-lg border border-border p-5">
              <div className="text-sm font-medium">M-Pesa Integration</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Pay securely using M-Pesa STK push technology.
              </div>
            </div>
          </div>

          <section className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-2xl font-semibold">Featured Events</h3>
              <Link href="/events" className="text-sm font-medium text-sky-400 hover:text-sky-300 transition-colors">
                View all events
              </Link>
            </div>

            {loading ? (
              <div className="grid gap-4 md:grid-cols-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-44 animate-pulse rounded-xl border border-slate-800 bg-slate-900" />
                ))}
              </div>
            ) : events.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-3">
                {events.map((event) => (
                  <Link
                    key={event.id}
                    href={`/events/${event.id}`}
                    className="rounded-xl border border-slate-800 bg-slate-900 p-5 transition-colors hover:border-sky-500/50 hover:bg-slate-900/80"
                  >
                    <div className="space-y-2">
                      <h4 className="text-lg font-semibold text-white line-clamp-1">{event.title}</h4>
                      <p className="text-sm text-slate-400 line-clamp-2">{event.description || 'Explore the details for this event.'}</p>
                      <div className="text-sm text-slate-500">
                        <p>{event.venue || 'Venue to be announced'}</p>
                        <p>{event.date ? new Date(event.date).toLocaleDateString() : 'Date coming soon'}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-slate-400">
                No featured events yet. Check back soon.
              </div>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
