'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Download, Share2, Calendar, MapPin, Ticket, ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { getBookingById } from '@/lib/api/bookings';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function BookingSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get('booking');

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => getBookingById(bookingId),
    enabled: !!bookingId,
  });

  const handleDownloadTickets = () => {
    // In a real app, this would generate and download PDF tickets
    toast.success('Tickets downloaded successfully!');
  };

  const handleShare = async () => {
    try {
      if (!booking?.event) {
        return;
      }
      if (navigator.share) {
        await navigator.share({
          title: `My tickets for ${booking?.event?.title}`,
          text: `I've got tickets for ${booking?.event?.title} on ${format(new Date(booking?.event?.date), 'PPP')}`,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  if (isLoading || !booking) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto space-y-8">
          <Skeleton className="h-12 w-1/3 mx-auto" />
          <Skeleton className="h-6 w-1/2 mx-auto" />
          <div className="grid md:grid-cols-2 gap-8 mt-12">
            <Skeleton className="h-64 w-full" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="pt-4 space-y-2">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { event, seats, booking_reference, quantity } = booking;
  const ticketCount = seats.length > 0 ? seats.length : (quantity || 1);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-lg text-muted-foreground mb-8">
            Your tickets for {event.title} are ready. We've sent a confirmation to your email.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="gap-2"
              onClick={handleDownloadTickets}
            >
              <Download className="h-4 w-4" />
              Download Tickets
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="gap-2"
              onClick={handleShare}
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
          </div>

          <Card className="text-left overflow-hidden">
            <div className="bg-primary p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium">Booking Reference</p>
                  <p className="text-2xl font-bold tracking-wider">{booking_reference}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Total Paid</p>
                  <p className="text-2xl font-bold">${(booking.total_amount || (seats.length * event.price)).toFixed(2)}</p>
                </div>
              </div>
            </div>
            
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-4">{event.title}</h3>
              
              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-2">
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>{format(new Date(event.date), 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{format(new Date(event.date), 'h:mm a')}</span>
                  </div>
                  <div className="flex items-start text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{event.venue}</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Your Tickets ({ticketCount})</h4>
                  <div className="space-y-2">
                    {seats.length > 0 ? (
                      seats.map((seat) => (
                        <div key={seat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                          <div className="flex items-center">
                            <Ticket className="h-4 w-4 mr-2 text-muted-foreground" />
                            <span className="font-medium">{seat.seat_number}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">${event.price.toFixed(2)}</span>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 bg-gray-50 rounded-md">
                        <p className="text-sm">
                          {ticketCount} general admission ticket{ticketCount > 1 ? 's' : ''}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h4 className="font-medium mb-4">What's next?</h4>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-medium mr-3 mt-0.5 flex-shrink-0">1</span>
                    <span>You'll receive an email confirmation with your tickets attached.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-medium mr-3 mt-0.5 flex-shrink-0">2</span>
                    <span>Present your ticket (printed or on your phone) at the venue entrance.</span>
                  </li>
                  <li className="flex items-start">
                    <span className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-medium mr-3 mt-0.5 flex-shrink-0">3</span>
                    <span>Doors open 1 hour before the event starts.</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
          
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              variant="outline" 
              onClick={() => router.push('/events')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Events
            </Button>
            <Button 
              onClick={() => router.push('/bookings')}
            >
              View My Bookings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
