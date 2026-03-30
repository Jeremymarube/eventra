'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Calendar, Clock, MapPin, Ticket, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { getMyBookings } from '@/lib/api/bookings';
import { useAuth } from '@/contexts/AuthContext.jsx';

function BookingCard({ booking }) {
  const { event, seats, status, created_at } = booking;
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    
    try {
      setIsCancelling(true);
      // In a real app, you would call an API to cancel the booking
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Booking cancelled successfully');
      // In a real app, you would invalidate the query to refetch bookings
    } catch (error) {
      console.error('Error cancelling booking:', error);
      toast.error('Failed to cancel booking');
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="md:flex">
        {event.image_url && (
          <div className="md:w-1/3 h-48 md:h-auto">
            <img 
              src={event.image_url} 
              alt={event.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${
                    status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    status === 'cancelled' ? 'bg-gray-100 text-gray-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Booked on {format(new Date(created_at), 'MMM d, yyyy')}
                  </span>
                </div>
                <CardTitle className="text-xl">{event.title}</CardTitle>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  {seats.length} {seats.length === 1 ? 'Ticket' : 'Tickets'}
                </div>
                <div className="text-lg font-bold">
                  ${(seats.length * event.price).toFixed(2)}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span>{format(new Date(event.date), 'EEEE, MMMM d, yyyy')}</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>Starts at {format(new Date(event.date), 'h:mm a')}</span>
                </div>
                <div className="flex items-start text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                  <span>{event.venue}</span>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Your Seats</h4>
                <div className="flex flex-wrap gap-2">
                  {seats.map((seat) => (
                    <div key={seat.id} className="flex items-center px-3 py-1.5 bg-gray-100 rounded-full text-sm">
                      <Ticket className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                      <span className="font-medium">{seat.seat_number}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button variant="outline" size="sm" className="flex-1">
                View Ticket
              </Button>
              {status === 'confirmed' && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 text-destructive border-destructive/50 hover:bg-destructive/5 hover:text-destructive"
                  onClick={handleCancel}
                  disabled={isCancelling}
                >
                  {isCancelling ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cancelling...
                    </>
                  ) : (
                    'Cancel Booking'
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </div>
      </div>
    </Card>
  );
}

export default function BookingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('upcoming');

  const { data: bookings = [], isLoading, error } = useQuery({
    queryKey: ['my-bookings', activeTab],
    queryFn: () => getMyBookings(activeTab),
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Sign in to view your bookings</h2>
          <p className="text-muted-foreground mb-6">
            Please sign in to see your upcoming and past event bookings.
          </p>
          <Button onClick={() => router.push('/login')}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Bookings</h1>
        <p className="text-muted-foreground">View and manage your event bookings</p>
      </div>

      <Tabs 
        defaultValue="upcoming" 
        className="space-y-6"
        onValueChange={setActiveTab}
      >
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          {isLoading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-48 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-medium text-destructive mb-2">
                Failed to load bookings
              </h3>
              <p className="text-muted-foreground mb-4">
                {error.message || 'An error occurred while loading your bookings.'}
              </p>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Try Again
              </Button>
            </div>
          ) : bookings.length > 0 ? (
            <div className="space-y-6">
              {bookings.map((booking) => (
                <BookingCard key={booking.id} booking={booking} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border rounded-lg">
              <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                {activeTab === 'upcoming' ? 'No upcoming bookings' : 
                 activeTab === 'past' ? 'No past bookings' : 'No cancelled bookings'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {activeTab === 'upcoming' 
                  ? 'You don\'t have any upcoming events. Browse events to book your next experience.'
                  : activeTab === 'past'
                    ? 'Your past event bookings will appear here.'
                    : 'You haven\'t cancelled any bookings.'}
              </p>
              {activeTab === 'upcoming' && (
                <Button onClick={() => window.location.href = '/events'}>
                  Browse Events
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
