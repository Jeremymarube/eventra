'use client';

import { useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Ticket, 
  Loader2, 
  AlertCircle,
  Users,
  Settings,
  Share2,
  Edit,
  Eye,
  Globe,
  Mail,
  UserPlus,
  Crown,
  Copy,
  ExternalLink,
  MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { SeatSelector } from '@/components/events/SeatSelector';
import { eventService } from '@/lib/api/events';
import { reserveSeats } from '@/lib/api/bookings';

// legacy fetch wrapper removed; use eventService.getSeats via React Query instead

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.id;

  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Overview'); // Move this to top level
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const {
    data: event,
    isLoading: loadingEvent,
    error: eventError,
  } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventService.getEventById(eventId),
    enabled: !!eventId,
  });

  const isCreator = user && event && (String(user.id) === String(event.created_by) || user.is_admin);
  const isAdmin = user && user.is_admin;
  const needsSeatData = Boolean(eventId && event && !isCreator && !isAdmin && Number(event.total_seats) > 0);
  const hasLocationMap = Boolean(event?.show_location_map && event?.location_latitude != null && event?.location_longitude != null);
  const locationMapUrl = hasLocationMap
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${Number(event.location_longitude) - 0.01}%2C${Number(event.location_latitude) - 0.01}%2C${Number(event.location_longitude) + 0.01}%2C${Number(event.location_latitude) + 0.01}&layer=mapnik&marker=${event.location_latitude}%2C${event.location_longitude}`
    : null;
  const frontendBase = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const eventShareUrl = `${frontendBase}/events/${eventId}`;
  const whatsappText = event
    ? (event.status === 'cancelled'
        ? `The event "${event.title}" has been cancelled. Details: ${eventShareUrl}`
        : `Check out this event on Eventra: ${event.title} ${eventShareUrl}`)
    : `Check out this event on Eventra: ${eventShareUrl}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`;

  const {
    data: seats = [],
    isLoading: loadingSeats,
    error: seatsError,
  } = useQuery({
    queryKey: ['event-seats', eventId],
    queryFn: () => eventService.getSeats(eventId),
    enabled: needsSeatData,
  });

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [isReserving, setIsReserving] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const selectedSeatObjects = useMemo(() => {
    if (!Array.isArray(seats) || seats.length === 0) return [];
    const selected = new Set(selectedSeats);
    return seats.filter((s) => selected.has(s.id));
  }, [seats, selectedSeats]);

  const totalAmount = useMemo(() => {
    const price = Number(event?.price || 0);
    if (event?.total_seats === 0) {
      // general admission defaults to 1 ticket for now
      return price;
    }
    return selectedSeatObjects.length * price;
  }, [event?.price, event?.total_seats, selectedSeatObjects.length]);

  const onSeatToggle = (seatId) => {
    setSelectedSeats((prev) =>
      prev.includes(seatId) ? prev.filter((id) => id !== seatId) : [...prev, seatId]
    );
  };

  const handleReserve = async () => {
    if (!eventId) return;

    // general admission events don't require seat selection
    const isGA = event?.total_seats === 0;
    if (!isGA && selectedSeats.length === 0) {
      toast.error('Select at least one seat');
      return;
    }

    // Check if user is authenticated
    if (!user) {
      toast.error('Please login to reserve seats');
      router.push(`/login?redirect=/events/${eventId}`);
      return;
    }

    setIsReserving(true);
    try {
      const booking = await reserveSeats({
        eventId,
        ...(isGA ? { quantity: 1 } : { seatIds: selectedSeats }),
      });
      const bookingId = booking?.booking_id;
      if (!bookingId) {
        throw new Error('Reservation succeeded but booking id was missing');
      }
      router.push(`/checkout?booking=${bookingId}`);
    } catch (err) {
      console.error('Reserve seats error:', err);
      toast.error(err?.response?.data?.error || err?.message || 'Failed to reserve seats');
    } finally {
      setIsReserving(false);
    }
  };

  const handleOpenImagePicker = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageSelected = async (event) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file || !eventId) return;

    setIsUploadingImage(true);
    try {
      await eventService.updateEvent(eventId, { image: file });
      toast.success('Cover image updated successfully');
      queryClient.invalidateQueries(['event', eventId]);
    } catch (err) {
      console.error('Upload cover image error:', err);
      toast.error(err?.response?.data?.error || err?.message || 'Failed to update cover image');
    } finally {
      setIsUploadingImage(false);
      input.value = '';
    }
  };

  const handleCancelEvent = async () => {
    if (!eventId) return;


    // Confirm cancellation
    const confirmed = window.confirm(
      'Are you sure you want to cancel this event? This action cannot be undone and will notify all registered guests.'
    );
    
    if (!confirmed) return;

    setIsCancelling(true);
    try {
      const result = await eventService.cancelEvent(eventId);
      const notificationsSent = result?.notifications_sent ?? 0;
      toast.success(
        notificationsSent > 0
          ? `Event cancelled and ${notificationsSent} attendee email${notificationsSent === 1 ? '' : 's'} sent.`
          : 'Event cancelled successfully'
      );
      
      router.push('/home');
    } catch (err) {
      console.error('Cancel event error:', err);
      toast.error(err?.response?.data?.error || err?.message || 'Failed to cancel event');
    } finally {
      setIsCancelling(false);
    }
  };

  if (loadingEvent || (needsSeatData && loadingSeats)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-6 w-1/3" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="h-[420px] w-full" />
            </div>
            <Skeleton className="h-[420px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (eventError || (needsSeatData && seatsError) || !event) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Unable to load event</h2>
          <p className="text-muted-foreground mb-6">
            {eventError?.message || seatsError?.message || 'Please try again.'}
          </p>
          <Button onClick={() => router.push('/events')}>Back to Events</Button>
        </div>
      </div>
    );
  }

  // Show management interface for event creators
  if (isCreator || isAdmin) {
    const tabs = [
      { name: 'Overview', current: activeTab === 'Overview' },
      { name: 'Guests', current: activeTab === 'Guests' },
      { name: 'Registration', current: activeTab === 'Registration' },
      { name: 'Blasts', current: activeTab === 'Blasts' },
      { name: 'Insights', current: activeTab === 'Insights' },
      { name: 'More', current: activeTab === 'More' }
    ];

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelected}
        />
        {/* Navigation Tabs */}
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-8 py-6">
              {tabs.map((tab) => (
                <button
                  key={tab.name}
                  onClick={() => setActiveTab(tab.name)}
                  className={`relative px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                    tab.current
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                  }`}
                >
                  {tab.name}
                  {tab.current && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-white rounded-full"></div>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Overview Tab Content */}
              {activeTab === 'Overview' && (
                <>
                  {/* Cover Image */}
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 overflow-hidden backdrop-blur-sm">
                    {event.image_url ? (
                      <div className="relative h-64 bg-gradient-to-br from-blue-400 to-purple-500">
                        <img
                          src={`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000'}${event.image_url}`}
                          alt="Cover Image for Seminar"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                        <div className="absolute top-4 right-4">
                          <Button
                            type="button"
                            onClick={handleOpenImagePicker}
                            variant="outline"
                            size="sm"
                            className="bg-white/90 backdrop-blur-md border-white/50 text-gray-800 hover:bg-white"
                            disabled={isUploadingImage}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            {isUploadingImage ? 'Uploading...' : 'Change Photo'}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="h-64 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center relative">
                        <div className="absolute inset-0 bg-black/10"></div>
                        <div className="text-center text-white relative z-10">
                          <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                            <Calendar className="h-10 w-10" />
                          </div>
                          <p className="text-xl font-medium">Cover Image for Seminar</p>
                          <div className="mt-6 flex justify-center">
                            <Button
                              type="button"
                              onClick={handleOpenImagePicker}
                              variant="outline"
                              size="sm"
                              className="bg-white/90 backdrop-blur-md border-white/50 text-gray-800 hover:bg-white"
                              disabled={isUploadingImage}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              {isUploadingImage ? 'Uploading...' : 'Upload Photo'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Event Title and Host */}
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-8 backdrop-blur-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <h1 className="text-4xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                          {event.title}
                        </h1>
                        <div className="flex items-center gap-3 text-gray-600">
                          <span className="text-lg">Hosted By</span>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg shadow-lg">
                              {user?.full_name?.charAt(0) || 'J'}
                            </div>
                            <div>
                              <span className="font-semibold text-gray-900">{user?.full_name || 'Jeremy'}</span>
                              <div className="text-sm text-gray-500">Creator</div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-3">
                        <Button variant="outline" size="sm" className="border-gray-300 hover:bg-gray-50">
                          <Share2 className="h-4 w-4 mr-2" />
                          Share Event
                        </Button>
                        <Button variant="outline" size="sm" className="border-gray-300 hover:bg-gray-50">
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                        <Button asChild variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-50">
                          <a href={whatsappUrl} target="_blank" rel="noreferrer">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            WhatsApp
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Date and Time */}
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-8 backdrop-blur-sm">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200/50">
                        <div className="w-14 h-14 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                          <Calendar className="h-7 w-7 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-700 mb-1">Date</p>
                          <p className="text-lg font-semibold text-gray-900">Feb 28, Saturday</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200/50">
                        <div className="w-14 h-14 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                          <Clock className="h-7 w-7 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-green-700 mb-1">Time</p>
                          <p className="text-lg font-semibold text-gray-900">8:30 AM - Mar 1, 5:30 AM</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Registration Section */}
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-8 backdrop-blur-sm">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Registration</h2>
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl p-6">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                          <Users className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <span className="font-semibold text-blue-900 text-lg">Welcome! To join the event, please register below.</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-blue-800 mb-4">
                        <div className="w-8 h-8 bg-blue-200 rounded-full flex items-center justify-center text-sm font-medium">
                          {user?.full_name?.charAt(0) || 'J'}
                        </div>
                        <span className="font-medium">{user?.full_name || 'Jeremy'}</span>
                        <span>•</span>
                        <span>{user?.email || 'jeremymarube1@gmail.com'}</span>
                      </div>
                      <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg">
                        One-Click RSVP
                      </Button>
                    </div>
                  </div>

                  {/* About Event */}
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-8 backdrop-blur-sm">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">About Event</h2>
                    <p className="text-gray-700 text-lg leading-relaxed">{event.description || 'Seminar for youths'}</p>
                    <div className="mt-6 flex items-center gap-3 text-blue-600 bg-blue-50 rounded-lg p-4 border border-blue-200/50">
                      <ExternalLink className="h-5 w-5" />
                      <span className="font-medium">eventra.com/v1mp6ysu</span>
                    </div>
                  </div>
                </>
              )}

              {/* Guests Tab Content */}
              {activeTab === 'Guests' && (
                <div className="space-y-8">
                  {/* At a Glance */}
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-8 backdrop-blur-sm">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">At a Glance</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200/50">
                        <div className="text-5xl font-bold text-blue-600 mb-2">0</div>
                        <div className="text-lg text-blue-700 font-medium">Going</div>
                      </div>
                      <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200/50">
                        <div className="text-2xl font-bold text-purple-600 mb-2">Guest List</div>
                        <div className="text-purple-700">View all attendees</div>
                      </div>
                    </div>
                  </div>

                  {/* No Guests Yet */}
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-12 text-center backdrop-blur-sm">
                    <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                      <Users className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">No Guests Yet</h3>
                    <p className="text-gray-600 text-lg mb-8">Share the event or invite people to get started!</p>
                    <div className="flex gap-4 justify-center">
                      <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg">
                        <Share2 className="h-5 w-5 mr-2" />
                        Share Event
                      </Button>
                      <Button variant="outline" className="border-gray-300 hover:bg-gray-50 font-semibold px-6 py-3 rounded-xl">
                        <Mail className="h-5 w-5 mr-2" />
                        Invite Guests
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Registration Tab Content */}
              {activeTab === 'Registration' && (
                <div className="space-y-8">
                  {/* Tickets Section */}
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-8 backdrop-blur-sm">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Tickets</h2>

                    {/* New Ticket Type Button */}
                    <div className="mb-8">
                      <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg">
                        <Ticket className="h-5 w-5 mr-2" />
                        New Ticket Type
                      </Button>
                    </div>

                    {/* Payment Setup Info */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl p-6 mb-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                          <Settings className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-blue-900 text-lg mb-2">
                            Start Selling. Collect payments by creating a Stripe account. Receive payouts daily. Set up in under 5 minutes.
                          </p>
                          <Button variant="outline" size="sm" className="border-blue-300 text-blue-700 hover:bg-blue-100 font-medium">
                            Get Started
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* M-Pesa Setup Info */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-xl p-6 mb-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                          <Settings className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-green-900 text-lg mb-2">
                            Accept M-Pesa payments. Set up M-Pesa integration for seamless mobile payments in Kenya and East Africa.
                          </p>
                          <Button variant="outline" size="sm" className="border-green-300 text-green-700 hover:bg-green-100 font-medium">
                            Setup M-Pesa
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Standard Ticket */}
                    <div className="border border-gray-200/50 rounded-xl p-6 bg-gray-50/50">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold text-gray-900">Standard</h3>
                        <span className="text-lg text-gray-600 font-medium">Free</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700">0 available</span>
                        <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Registration Email */}
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-8 backdrop-blur-sm">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Registration Email</h2>
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-200/50">
                      <div className="flex items-start gap-4 mb-4">
                        <Mail className="h-6 w-6 text-gray-500 mt-1 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-gray-900 text-lg mb-2">
                            Upon registration, we send guests a confirmation email that includes a calendar invite. You can add a custom message to the email.
                          </p>
                          <Button variant="outline" className="border-gray-300 hover:bg-gray-50 mt-2">
                            <Edit className="h-4 w-4 mr-2" />
                            Customize Email
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Registration Questions */}
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-8 backdrop-blur-sm">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Registration Questions</h2>
                    <p className="text-gray-600 text-lg mb-8">
                      We will ask guests the following questions when they register for the event.
                    </p>

                    {/* Personal Information */}
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold text-gray-900 mb-6">Personal Information</h3>
                      <div className="space-y-4">
                        {/* Name */}
                        <div className="flex items-center justify-between py-4 px-6 bg-gray-50 rounded-xl border border-gray-200/50">
                          <div>
                            <p className="font-semibold text-gray-900 text-lg">Name</p>
                            <p className="text-gray-600">Full Name</p>
                          </div>
                          <span className="text-green-600 font-semibold text-sm bg-green-100 px-3 py-1 rounded-full">Required</span>
                        </div>

                        {/* Email */}
                        <div className="flex items-center justify-between py-4 px-6 bg-gray-50 rounded-xl border border-gray-200/50">
                          <div>
                            <p className="font-semibold text-gray-900 text-lg">Email</p>
                            <p className="text-gray-600">Required</p>
                          </div>
                          <span className="text-green-600 font-semibold text-sm bg-green-100 px-3 py-1 rounded-full">Required</span>
                        </div>

                        {/* Phone */}
                        <div className="flex items-center justify-between py-4 px-6 bg-gray-50 rounded-xl border border-gray-200/50">
                          <div>
                            <p className="font-semibold text-gray-900 text-lg">Phone</p>
                            <p className="text-gray-600">Off</p>
                          </div>
                          <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                            <Settings className="h-4 w-4 mr-2" />
                            Configure
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Web3 Identity */}
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold text-gray-900 mb-6">Web3 Identity</h3>
                      <div className="space-y-4">
                        {/* ETH Address */}
                        <div className="flex items-center justify-between py-4 px-6 bg-gray-50 rounded-xl border border-gray-200/50">
                          <div>
                            <p className="font-semibold text-gray-900 text-lg">ETH Address</p>
                            <p className="text-gray-600">Off</p>
                          </div>
                          <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                            <Settings className="h-4 w-4 mr-2" />
                            Enable
                          </Button>
                        </div>

                        {/* SOL Address */}
                        <div className="flex items-center justify-between py-4 px-6 bg-gray-50 rounded-xl border border-gray-200/50">
                          <div>
                            <p className="font-semibold text-gray-900 text-lg">SOL Address</p>
                            <p className="text-gray-600">Off</p>
                          </div>
                          <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                            <Settings className="h-4 w-4 mr-2" />
                            Enable
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Custom Questions */}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-6">Custom Questions</h3>
                      <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                        <div className="text-gray-400 mb-4">
                          <Settings className="h-12 w-12 mx-auto mb-4" />
                        </div>
                        <p className="text-gray-600 text-lg mb-6">Add custom questions for your event registration</p>
                        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg">
                          <UserPlus className="h-5 w-5 mr-2" />
                          Add Question
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Seat Selection Setup */}
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-8 backdrop-blur-sm">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Seat Selection</h2>
                    <p className="text-gray-600 text-lg mb-8">
                      Configure seat selection for your event attendees. Choose between manual assignment or let attendees select their own seats.
                    </p>

                    {/* Seat Selection Mode */}
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Selection Mode</h3>
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            id="auto-assign"
                            name="seat-mode"
                            value="auto"
                            defaultChecked
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <label htmlFor="auto-assign" className="text-gray-900 font-medium">
                            Auto-assign seats
                          </label>
                          <span className="text-sm text-gray-500">System assigns seats automatically</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <input
                            type="radio"
                            id="manual-select"
                            name="seat-mode"
                            value="manual"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <label htmlFor="manual-select" className="text-gray-900 font-medium">
                            Let attendees select seats
                          </label>
                          <span className="text-sm text-gray-500">Attendees choose their preferred seats</span>
                        </div>
                      </div>
                    </div>

                    {/* Seat Layout Preview */}
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Seat Layout Preview</h3>
                      <div className="bg-gray-50 rounded-xl p-6 border border-gray-200/50">
                        <div className="text-center text-gray-500 mb-4">
                          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Settings className="h-8 w-8 text-gray-400" />
                          </div>
                          <p className="text-lg font-medium">No seats configured yet</p>
                          <p className="text-sm">Set up your venue layout to enable seat selection</p>
                        </div>
                        <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg">
                          <Settings className="h-5 w-5 mr-2" />
                          Configure Venue Layout
                        </Button>
                      </div>
                    </div>

                    {/* Seat Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200/50">
                        <div className="text-3xl font-bold text-blue-600 mb-2">0</div>
                        <div className="text-blue-700 font-medium">Total Seats</div>
                      </div>
                      <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200/50">
                        <div className="text-3xl font-bold text-green-600 mb-2">0</div>
                        <div className="text-green-700 font-medium">Available</div>
                      </div>
                      <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200/50">
                        <div className="text-3xl font-bold text-orange-600 mb-2">0</div>
                        <div className="text-orange-700 font-medium">Reserved</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Blasts Tab Content */}
              {activeTab === 'Blasts' && (
                <div className="space-y-8">
                  {/* Profile Picture and Send Blast */}
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-8 backdrop-blur-sm">
                    <div className="flex items-start gap-6 mb-8">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl">
                        {user?.full_name?.charAt(0) || 'J'}
                      </div>
                      <div className="flex-1">
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">Send a blast to your guests…</h2>
                        <p className="text-gray-600 text-lg mb-6">
                          Share updates with your guests via email, SMS, and push notifications.
                        </p>
                        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg">
                          <Mail className="h-5 w-5 mr-3" />
                          Send Blasts
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* System Messages */}
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-8 backdrop-blur-sm">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">System Messages</h2>

                    {/* Event Reminders */}
                    <div className="border border-gray-200/50 rounded-xl p-6 mb-6 bg-gradient-to-r from-blue-50 to-indigo-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                            <Clock className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Event Reminders</h3>
                            <p className="text-gray-700 text-lg">
                              Reminders are sent automatically via email, SMS, and push notification.
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100 font-medium">
                          Manage
                        </Button>
                      </div>
                    </div>

                    {/* Post-Event Feedback */}
                    <div className="border border-gray-200/50 rounded-xl p-6 bg-gradient-to-r from-green-50 to-emerald-50">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                            <Settings className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-3">Post-Event Feedback</h3>
                            <p className="text-gray-700 text-lg">
                              Schedule a feedback email to go out after the event.
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-100 font-medium">
                          Schedule
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Insights Tab Content */}
              {activeTab === 'Insights' && (
                <div className="space-y-8">
                  {/* Page Views */}
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-8 backdrop-blur-sm">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">Page Views</h2>

                    {/* Past 7 Days Chart */}
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold text-gray-900 mb-6">Past 7 Days</h3>
                      <p className="text-gray-600 text-lg mb-6">See recent page views of the event page.</p>

                      {/* Simple chart visualization */}
                      <div className="h-40 flex items-end justify-between space-x-3 mb-6">
                        <div className="flex flex-col items-center flex-1">
                          <div className="bg-gradient-to-t from-blue-200 to-blue-400 w-full rounded-t-lg mb-3" style={{height: '25px'}}></div>
                          <span className="text-sm text-gray-600 font-medium">0</span>
                        </div>
                        <div className="flex flex-col items-center flex-1">
                          <div className="bg-gradient-to-t from-blue-400 to-blue-600 w-full rounded-t-lg mb-3" style={{height: '75px'}}></div>
                          <span className="text-sm text-gray-600 font-medium">1</span>
                        </div>
                        <div className="flex flex-col items-center flex-1">
                          <div className="bg-gradient-to-t from-blue-200 to-blue-400 w-full rounded-t-lg mb-3" style={{height: '25px'}}></div>
                          <span className="text-sm text-gray-600 font-medium">0</span>
                        </div>
                        <div className="flex flex-col items-center flex-1">
                          <div className="bg-gradient-to-t from-blue-200 to-blue-400 w-full rounded-t-lg mb-3" style={{height: '25px'}}></div>
                          <span className="text-sm text-gray-600 font-medium">0</span>
                        </div>
                        <div className="flex flex-col items-center flex-1">
                          <div className="bg-gradient-to-t from-blue-400 to-blue-600 w-full rounded-t-lg mb-3" style={{height: '75px'}}></div>
                          <span className="text-sm text-gray-600 font-medium">1</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600 mb-8">
                        <span className="font-medium">Thu, Feb 19</span>
                        <span className="font-medium">Sat, Feb 21</span>
                        <span className="font-medium">Mon, Feb 23</span>
                        <span className="font-medium">Wed, Feb 25</span>
                      </div>
                    </div>

                    {/* Page Views Metrics */}
                    <div className="grid grid-cols-3 gap-6">
                      <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200/50">
                        <div className="text-3xl font-bold text-blue-600 mb-2">1</div>
                        <div className="text-blue-700 font-medium">24 hours</div>
                      </div>
                      <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200/50">
                        <div className="text-3xl font-bold text-purple-600 mb-2">1</div>
                        <div className="text-purple-700 font-medium">7 days</div>
                      </div>
                      <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200/50">
                        <div className="text-3xl font-bold text-green-600 mb-2">1</div>
                        <div className="text-green-700 font-medium">30 days</div>
                      </div>
                    </div>
                  </div>

                  {/* Live Traffic */}
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-8 backdrop-blur-sm">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">Live Traffic</h2>
                    <div className="flex items-center gap-4 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-xl">
                      <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center shadow-lg">
                        <Eye className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-green-900 text-lg">Visitor from Eventra</p>
                        <p className="text-green-700">Eldoret, Uasin Gishu County</p>
                      </div>
                      <div className="text-green-600 font-medium">
                        5m
                      </div>
                    </div>
                  </div>

                  {/* Sources */}
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-8 backdrop-blur-sm">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">Sources</h2>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200/50">
                        <span className="text-lg text-gray-900 font-medium">Eventra</span>
                        <span className="text-lg text-gray-700 font-semibold">100%</span>
                      </div>
                    </div>
                  </div>

                  {/* Cities */}
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-8 backdrop-blur-sm">
                    <h2 className="text-2xl font-bold text-gray-900 mb-8">Cities</h2>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200/50">
                        <span className="text-lg text-gray-900 font-medium">Eldoret, KE</span>
                        <span className="text-lg text-gray-700 font-semibold">100%</span>
                      </div>
                    </div>
                  </div>

                  {/* UTM Sources */}
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-8 backdrop-blur-sm">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">UTM Sources</h2>
                    <p className="text-gray-600 text-lg mb-8">
                      Set up a tracking link by adding ?utm_source=your-link-name to your URL.
                    </p>
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-gray-200/50">
                      <Settings className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg">No UTM sources tracked yet</p>
                    </div>
                  </div>

                  {/* Registration Referrals */}
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-8 backdrop-blur-sm">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Registration Referrals</h2>
                    <p className="text-gray-600 text-lg mb-6">
                      Each guest has a unique referral link to invite friends. <a href="#" className="text-blue-600 hover:underline font-medium">Learn More</a>
                    </p>
                    <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl border border-gray-200/50">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p className="text-lg mb-2">No Referrals</p>
                      <p>Referrals will start showing up here once guests start inviting their friends.</p>
                    </div>
                  </div>

                  {/* Event Feedback */}
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-8 backdrop-blur-sm">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Event Feedback</h2>
                    <p className="text-gray-600 text-lg mb-8">
                      See how much your guests enjoyed the event.
                    </p>

                    <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200/50 rounded-xl p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-yellow-500 rounded-xl flex items-center justify-center shadow-lg">
                          <Mail className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-yellow-900 text-lg mb-3">No Post-Event Email Scheduled</p>
                          <p className="text-yellow-800 mb-4">
                            To collect feedback, schedule a post-event thank you email. We will take care of the rest!
                          </p>
                          <Button className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white font-semibold px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg">
                            Schedule Feedback Email
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* More Tab Content */}
              {activeTab === 'More' && (
                <div className="space-y-8">
                  {/* Clone Event */}
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-8 backdrop-blur-sm">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Clone Event</h2>
                    <p className="text-gray-600 text-lg mb-8">
                      Create a new event with the same information as this one. Everything except the guest list and event blasts will be copied over.
                    </p>
                    <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg">
                      <Copy className="h-5 w-5 mr-3" />
                      Clone Event
                    </Button>
                  </div>

                  {/* Event Page */}
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-8 backdrop-blur-sm">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Event Page</h2>
                    <div className="space-y-8">
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200/50 rounded-xl p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                            <AlertCircle className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-yellow-900 text-lg mb-2">
                              When you choose a new URL, the current one will no longer work. Do not change your URL if you have already shared the event.
                            </p>
                            <p className="text-yellow-800">
                              Upgrade to Eventra Plus to set a custom URL for this event. <a href="#" className="underline font-medium">Learn More</a>
                            </p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <label className="block text-lg font-semibold text-gray-900 mb-4">Public URL</label>
                        <div className="flex gap-3">
                          <div className="flex-1 flex">
                            <span className="inline-flex items-center px-4 py-3 text-sm text-gray-500 bg-gray-50 border border-r-0 border-gray-300 rounded-l-xl">
                              lu.ma/
                            </span>
                            <input
                              type="text"
                              value="v1mp6ysu"
                              readOnly
                              className="flex-1 min-w-0 block w-full px-4 py-3 border border-gray-300 rounded-none rounded-r-xl bg-gray-50 text-gray-500 text-lg font-medium"
                            />
                          </div>
                          <Button variant="outline" className="border-gray-300 hover:bg-gray-50 px-6">
                            Update
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Embed Event */}
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-200/50 p-8 backdrop-blur-sm">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Embed Event</h2>
                    <p className="text-gray-600 text-lg mb-8">
                      Have your own site? Embed the event to let visitors know about it.
                    </p>

                    <div className="mb-8">
                      <p className="text-gray-700 font-medium mb-4">
                        Paste the following HTML code snippet to your page:
                      </p>
                      <div className="bg-gray-50 border border-gray-200/50 rounded-xl p-6 font-mono text-sm">
                        <pre className="text-gray-800 overflow-x-auto leading-relaxed">
{`<a href="https://eventra.com/event/evt-8YX76gNLlZd5537" class="eventra-checkout--button" data-eventra-action="checkout" data-eventra-event-id="evt-8YX76gNLlZd5537">Register for Event</a><script id="eventra-checkout" src="https://embed.ev.ma/checkout-button.js"></script>`}
                        </pre>
                      </div>
                      <div className="flex gap-3 mt-4">
                        <Button variant="outline" className="border-gray-300 hover:bg-gray-50">
                          <Copy className="h-4 w-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                    </div>

                    <div className="border-t border-gray-200/50 pt-8">
                      <p className="text-gray-700 font-medium mb-6">
                        This gives you the following button. Click it to see it in action!
                      </p>
                      <div className="flex justify-center mb-6">
                        <button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg">
                          Register for Event
                        </button>
                      </div>
                      <p className="text-gray-600 mb-3">
                        If you want to use your own styling for the button, simply remove the <code className="bg-gray-100 px-2 py-1 rounded font-medium">eventra-checkout--button</code> class from the snippet above.
                      </p>
                      <p className="text-gray-600">
                        For advanced usage, check out our <a href="#" className="text-blue-600 hover:underline font-medium">example code and documentation</a>.
                      </p>
                    </div>
                  </div>

                  {/* Cancel Event */}
                  <div className="bg-white rounded-2xl shadow-xl border border-red-200/50 p-8 backdrop-blur-sm">
                    <h2 className="text-2xl font-bold text-red-900 mb-6">Cancel Event</h2>
                    {event.status === 'cancelled' ? (
                      <div className="text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                          <AlertCircle className="h-8 w-8 text-red-600" />
                        </div>
                        <p className="text-red-800 text-lg mb-4">
                          This event has been cancelled.
                        </p>
                        <p className="text-gray-600">
                          All registered guests have been notified.
                        </p>
                      </div>
                    ) : (
                      <>
                        <p className="text-red-800 text-lg mb-8">
                          Cancel and permanently delete this event. This operation cannot be undone. If there are any registered guests, we will notify them that the event has been canceled.
                        </p>
                        <Button 
                          variant="destructive" 
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg"
                          onClick={handleCancelEvent}
                          disabled={isCancelling}
                        >
                          {isCancelling ? (
                            <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                          ) : (
                            <AlertCircle className="h-5 w-5 mr-3" />
                          )}
                          {isCancelling ? 'Cancelling...' : 'Cancel Event'}
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* When & Where */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">When & Where</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-gray-900">Feb 28</p>
                      <p className="text-sm text-gray-600">Saturday, Feb 28</p>
                      <p className="text-sm text-gray-600">8:30 AM - Mar 1, 5:30 AM GMT+3</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="w-full">
                      <p className="font-medium text-gray-900">{event.venue || 'Location missing'}</p>
                      <p className="text-sm text-gray-600">
                        {hasLocationMap ? 'Attendees will also see the shared map below.' : 'Turn on location sharing in the event form to show a map here.'}
                      </p>
                      {hasLocationMap && (
                        <div className="mt-3 overflow-hidden rounded-xl border border-gray-200">
                          <iframe
                            title={`Map for ${event.title}`}
                            src={locationMapUrl}
                            className="h-64 w-full"
                            loading="lazy"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <Button type="button" variant="outline" className="w-full mt-4 bg-blue-600 text-white hover:bg-blue-700 border-transparent" onClick={() => toast('Edit Event is not implemented yet.') }>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Event
                </Button>
              </div>

              {/* Invites */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Invites</h3>
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Invite Guests</h4>
                  <p className="text-sm text-gray-500 mb-4">
                    Invite subscribers, contacts and past guests via email or SMS.
                  </p>
                  <p className="text-sm text-gray-400 mb-4">No Invites Sent</p>
                  <p className="text-sm text-gray-500">
                    You can invite subscribers, contacts and past guests to the event.
                  </p>
                </div>
              </div>

              {/* Hosts */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Hosts</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                      {user?.full_name?.charAt(0) || 'J'}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{user?.full_name || 'Jeremy'}</p>
                      <p className="text-sm text-gray-500">{user?.email || 'jeremymarube1@gmail.com'}</p>
                    </div>
                    <div className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      Creator
                    </div>
                  </div>
                </div>
                <Button type="button" variant="outline" className="w-full mt-4 bg-emerald-500 text-white hover:bg-emerald-600 border-transparent" onClick={() => toast('Add Host is not implemented yet.') }>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Host
                </Button>
                <Button type="button" variant="outline" className="w-full mt-2 bg-indigo-500 text-white hover:bg-indigo-600 border-transparent" onClick={() => toast('Manage check-in staff is not implemented yet.') }>
                  <Settings className="h-4 w-4 mr-2" />
                  Manage check-in staff and options
                </Button>
              </div>

              {/* Visibility & Discovery */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Visibility & Discovery</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Globe className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Public</p>
                      <p className="text-sm text-gray-500">This event is listed on your profile page.</p>
                    </div>
                  </div>
                  <Button type="button" variant="outline" className="w-full bg-amber-500 text-white hover:bg-amber-600 border-transparent" onClick={() => toast('Change Visibility is not implemented yet.') }>
                    Change Visibility
                  </Button>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-600 mb-3">
                    You can submit the event to a relevant Eventra discovery page or other community calendars for a chance to be featured, so it can be discovered more easily.
                  </p>
                  <Button type="button" variant="outline" className="w-full bg-violet-500 text-white hover:bg-violet-600 border-transparent" onClick={() => toast('Transfer Calendar is not implemented yet.') }>
                    Transfer Calendar
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show attendee interface (seat selection)
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Event Cancelled Banner */}
          {event.status === 'cancelled' && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-2xl p-6 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-red-300">Event Cancelled</h2>
                  <p className="text-red-200">This event has been cancelled. All registered guests have been notified.</p>
                </div>
              </div>
            </div>
          )}

          {/* Event Header */}
          <div className="relative">
            {event.image_url && (
              <div className="w-full h-80 md:h-96 overflow-hidden rounded-2xl relative group">
                <img
                  src={`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000'}${event.image_url}`}
                  alt={event.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-2xl" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="px-3 py-1 bg-orange-500/90 backdrop-blur-sm rounded-full text-xs font-medium text-white">
                      EVENT
                    </div>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">
                    {event.title}
                  </h1>
                </div>
              </div>
            )}

            {!event.image_url && (
              <div className="w-full h-48 bg-gradient-to-r from-orange-500 to-pink-600 rounded-2xl flex items-center justify-center">
                <h1 className="text-4xl md:text-5xl font-bold text-white drop-shadow-lg">
                  {event.title}
                </h1>
              </div>
            )}
          </div>

          {/* Event Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Side - Seat Selection */}
            <div className="lg:col-span-2 space-y-6">
              {seats && seats.length > 0 ? (
                <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50 shadow-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-3 text-xl text-white">
                      <div className="w-2 h-8 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full"></div>
                      Select Your Seats
                    </CardTitle>
                    <p className="text-slate-400 text-sm">
                      Choose your preferred seats for this event
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700/50">
                      <SeatSelector
                        seats={seats}
                        selectedSeats={selectedSeats}
                        onSeatToggle={onSeatToggle}
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50 shadow-2xl">
                  <CardContent className="p-6 text-center">
                    <p className="text-white">This event uses general admission – no assigned seats.</p>
                    <p className="text-slate-400 mt-2">Proceed to reserve tickets without choosing specific seats.</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Side - Event Info & Summary */}
            <div className="space-y-6">
              {/* Event Information */}
              <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg text-white">
                    <div className="w-2 h-6 bg-gradient-to-b from-blue-400 to-blue-600 rounded-full"></div>
                    Event Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/30">
                    <Calendar className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-300">Date</p>
                      <p className="text-white">{new Date(event.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/30">
                    <Clock className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-slate-300">Time</p>
                      <p className="text-white">{new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg border border-slate-700/30">
                    <MapPin className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="w-full">
                      <p className="text-sm font-medium text-slate-300">Venue</p>
                      <p className="text-white">{event.venue}</p>
                      {hasLocationMap && (
                        <div className="mt-3 overflow-hidden rounded-lg border border-slate-700/50">
                          <iframe
                            title={`Map for ${event.title}`}
                            src={locationMapUrl}
                            className="h-64 w-full"
                            loading="lazy"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Booking Summary */}
              <Card className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm border-slate-700/50 shadow-xl">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-3 text-lg text-white">
                    <div className="w-2 h-6 bg-gradient-to-b from-purple-400 to-purple-600 rounded-full"></div>
                    Booking Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-slate-700/30">
                      <span className="text-slate-300">
                        {event?.total_seats === 0 ? 'Quantity' : 'Tickets Selected'}
                      </span>
                      <span className="text-white font-medium">
                        {event?.total_seats === 0 ? 1 : selectedSeatObjects.length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-slate-700/30">
                      <span className="text-slate-300">Price per Ticket</span>
                      <span className="text-white font-medium">${Number(event.price).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between py-3 border-b-2 border-slate-600/50">
                      <span className="text-lg font-semibold text-white">Total Amount</span>
                      <span className="text-xl font-bold text-orange-400">${totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-3 rounded-xl transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    size="lg"
                    onClick={handleReserve}
                    disabled={
                      isReserving ||
                      (seats.length > 0 && selectedSeats.length === 0) ||
                      event.status === 'cancelled'
                    }
                  >
                    {event.status === 'cancelled' ? (
                      <>
                        <AlertCircle className="mr-2 h-5 w-5" />
                        Event Cancelled
                      </>
                    ) : isReserving ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Ticket className="mr-2 h-5 w-5" />
                        Reserve & Checkout
                      </>
                    )}
                  </Button>

                  {/* message removed to match eventra.com style */}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}









