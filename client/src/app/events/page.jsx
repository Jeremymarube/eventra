'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Ticket } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext.jsx';
import eventService from '@/lib/api/events';

export default function EventsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';

  // Fetch events with filters
  const { data: events = [], isLoading: loadingEvents } = useQuery({
    queryKey: ['events', { category, search, dateFilter, userId: user?.id }],
    queryFn: () =>
      eventService.getEvents({
        ...(category !== 'all' && { category }),
        ...(search && { search }),
        ...(dateFilter !== 'all' && { date: dateFilter }),
        all: true,
      }),
  });

  const categories = Array.isArray(events)
    ? Array.from(
        new Map(
          events
            .filter((e) => e?.category?.id)
            .map((e) => [e.category.id, e.category])
        ).values()
      )
    : [];

  const handleEventClick = (eventId) => {
    router.push(`/events/${eventId}`);
  };

  const isCreator = (event) => {
    return user && String(user.id) === String(event.created_by);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">Events</h1>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-md"
          />
          
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id.toString()}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Dates</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="tomorrow">Tomorrow</SelectItem>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="this_weekend">This Weekend</SelectItem>
              <SelectItem value="next_week">Next Week</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Events Grid */}
        {loadingEvents ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        ) : events.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card 
                key={event.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => handleEventClick(event.id)}
              >
                {event.image_url ? (
                  <div className="relative h-48 overflow-hidden bg-slate-800 rounded-t-lg">
                    <img
                      src={`${base}${event.image_url}`}
                      alt={event.title}
                      className="w-full h-full object-cover transition-transform duration-300"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                ) : (
                  <div className="relative h-48 overflow-hidden bg-muted rounded-t-lg flex items-center justify-center text-muted-foreground">
                    No Image
                  </div>
                )}
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <CardTitle className="text-lg">{event.title}</CardTitle>
                    <Badge variant="secondary">{event.category?.name || 'General'}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    {format(new Date(event.date), 'PPPpp')}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2" />
                    {event.venue}
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between items-center">
                  <div className="flex items-center text-sm font-medium">
                    <Ticket className="h-4 w-4 mr-1" />
                    {event.available_seats} tickets left
                  </div>
                  <div className="flex gap-2">
                    {isCreator(event) && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/events/${event.id}/edit`);
                        }}
                      >
                        Edit
                      </Button>
                    )}
                    <Button size="sm">View Details</Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium">No events found</h3>
            <p className="text-muted-foreground mt-2">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
