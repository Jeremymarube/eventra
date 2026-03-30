'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, MapPin, Ticket, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getBookingById } from '@/lib/api/bookings';
import { getPaymentStatus, initiateMpesaPayment } from '@/lib/api/payments';
import { useAuth } from '@/contexts/AuthContext.jsx';

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState(300); // 5 minutes in seconds
  const [paymentId, setPaymentId] = useState(null);

  const bookingId = searchParams.get('booking');

  // Fetch booking details
  const { data: booking, isLoading, error } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => getBookingById(bookingId),
    enabled: !!bookingId,
  });

  // Countdown timer
  useEffect(() => {
    if (!booking) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Handle expiry
          toast.error('Your reservation has expired. Please select seats again.');
          router.push(`/events/${booking.event.id}`);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [booking, router]);

  const handlePayment = async () => {
    if (!booking) return;

    if (paymentMethod === 'mpesa' && !phoneNumber) {
      toast.error('Please enter your M-Pesa phone number');
      return;
    }

    setIsProcessing(true);

    try {
      if (paymentMethod !== 'mpesa') {
        toast.error('Only M-Pesa is available right now');
        return;
      }

      const init = await initiateMpesaPayment({ bookingId: booking.id, phone: phoneNumber });
      const createdPaymentId = init?.payment_id;
      if (!createdPaymentId) {
        throw new Error('Payment initiation succeeded but payment id was missing');
      }
      setPaymentId(createdPaymentId);
      toast.success('STK push sent. Complete payment on your phone.');

      // Poll for payment status
      const startedAt = Date.now();
      const timeoutMs = 120000;
      const intervalMs = 3000;

      while (Date.now() - startedAt < timeoutMs) {
        const status = await getPaymentStatus(createdPaymentId);
        const paymentStatus = status?.status;

        if (paymentStatus === 'success') {
          router.push(`/booking/success?booking=${booking.id}`);
          return;
        }

        if (paymentStatus === 'failed') {
          toast.error('Payment failed. Please try again.');
          return;
        }

        await new Promise((resolve) => setTimeout(resolve, intervalMs));
      }

      toast.message('Waiting for M-Pesa confirmation. You can keep this page open and it will update once confirmed.');
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error?.response?.data?.error || error?.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading || !booking) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
          <Skeleton className="h-12 w-1/3 mb-8" />
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <Skeleton className="h-8 w-1/2" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold text-destructive mb-4">
          {error.message || 'Booking not found'}
        </h2>
        <Button onClick={() => router.push('/events')}>
          Back to Events
        </Button>
      </div>
    );
  }

  const { event, seats, total_amount, quantity } = booking;
  // seats array will be empty for general admission bookings; backend returns
  // total_amount in the response so prefer that value when available.
  const totalAmount = typeof total_amount === 'number'
    ? total_amount
    : (seats.length * event.price);

  const ticketCount = seats.length > 0 ? seats.length : (quantity || 1);
  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Complete Your Booking</h1>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Payment Form */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="payment-method">Payment Method</Label>
                    <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mpesa">M-Pesa</SelectItem>
                        <SelectItem value="card" disabled>Credit/Debit Card (Coming soon)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {paymentMethod === 'mpesa' && (
                    <div className="space-y-2">
                      <Label htmlFor="phone">M-Pesa Phone Number</Label>
                      <Input 
                        id="phone" 
                        placeholder="e.g., 0712345678" 
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                      />
                      <p className="text-sm text-muted-foreground">
                        You'll receive a payment prompt on this number
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Name</Label>
                  <Input value={user?.name || ''} disabled />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input value={user?.email || ''} disabled />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">{event.title}</h4>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(event.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-2" />
                    {event.venue}
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span>Tickets ({ticketCount})</span>
                    <span>${event.price.toFixed(2)} × {ticketCount}</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Total</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-4 text-sm">
                    <span className="text-muted-foreground">Time remaining:</span>
                    <span className="font-mono">
                      {minutes}:{seconds < 10 ? '0' : ''}{seconds}
                    </span>
                  </div>
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handlePayment}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      `Pay $${totalAmount.toFixed(2)}`
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
