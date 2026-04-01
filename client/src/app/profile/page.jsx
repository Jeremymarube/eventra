'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Ticket, User, Mail, Phone } from 'lucide-react';
import Link from 'next/link';
import {
  loadProfileImage,
  saveProfileImage,
  subscribeProfileImageChanges,
} from '@/lib/profileImage';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    profileImage: user?.profileImage || null,
  });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [imagePreview, setImagePreview] = useState(null);

  useEffect(() => {
    if (!user) return;

    const savedImage = loadProfileImage(user.id);
    setProfileData({
      name: user.name || user.full_name || '',
      email: user.email || '',
      phone: user.phone || '',
      profileImage: savedImage || user.profileImage || null,
    });

    const unsubscribe = subscribeProfileImageChanges(user.id, (nextImage) => {
      setProfileData((prev) => ({
        ...prev,
        profileImage: nextImage,
      }));
    });

    return () => unsubscribe();
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveProfile = async () => {
    try {
      // In a real app, you'd send the profile data and image to your backend
      console.log('Saving profile:', profileData);

      if (user?.id) {
        if (profileData.profileImage instanceof File) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target.result;
            saveProfileImage(user.id, dataUrl);
            setProfileData((prev) => ({ ...prev, profileImage: dataUrl }));
            setImagePreview(null);
          };
          reader.readAsDataURL(profileData.profileImage);
        } else if (profileData.profileImage) {
          saveProfileImage(user.id, profileData.profileImage);
        }
      }

      alert('Profile updated successfully!');

      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
        setImagePreview(null);
      }
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert('Failed to save profile. Please try again.');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setProfileData(prev => ({
        ...prev,
        profileImage: file,
      }));

      const reader = new FileReader();
      reader.onload = (loadEvent) => {
        const dataUrl = loadEvent.target.result;
        if (user?.id) {
          saveProfileImage(user.id, dataUrl);
        }
        setProfileData(prev => ({
          ...prev,
          profileImage: dataUrl,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    const loadBookings = async () => {
      if (!user) return;
      try {
        const { getMyBookings } = await import('@/lib/api/bookings');
        const data = await getMyBookings();
        setBookings(data || []);
      } catch (err) {
        console.error('Failed to load bookings:', err);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };
    loadBookings();
  }, [user]);

  // Cleanup image preview URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <main className="container mx-auto px-6 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Please sign in to view your profile</h1>
            <Button asChild>
              <Link href="/login">Sign In</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="container mx-auto px-6 py-8">
        <div className="max-w-4xl mx-auto bg-slate-950">
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="bookings">My Bookings</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Profile Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col items-center gap-4">
                      <Avatar className="h-28 w-28">
                        <AvatarImage src={imagePreview || (profileData.profileImage instanceof File ? '' : profileData.profileImage)} />
                        <AvatarFallback className="text-lg">
                          {profileData.name?.charAt(0)?.toUpperCase() || user.name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="text-center">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                          id="profile-image-upload"
                        />
                        <label
                          htmlFor="profile-image-upload"
                          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-600 rounded-lg hover:bg-slate-700 cursor-pointer transition-colors"
                        >
                          <User className="h-4 w-4" />
                          Change Photo
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            if (!user) return;
                            if (imagePreview) {
                              URL.revokeObjectURL(imagePreview);
                            }
                            saveProfileImage(user.id, null);
                            setProfileData((prev) => ({
                              ...prev,
                              profileImage: null,
                            }));
                            setImagePreview(null);
                          }}
                          className="inline-flex items-center gap-2 px-3 py-2 ml-3 text-sm font-medium text-slate-300 bg-slate-800 border border-slate-600 rounded-lg hover:bg-slate-700 transition-colors"
                        >
                          Remove Photo
                        </button>
                        <p className="text-xs text-slate-500 mt-1">
                          JPG, PNG up to 5MB
                        </p>
                      </div>
                    </div>

                    <div className="flex-1">
                      <h2 className="text-2xl font-bold">{user.name}</h2>
                      <p className="text-muted-foreground">{user.email}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary">Member since {new Date(user.createdAt || Date.now()).getFullYear()}</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Full Name
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={profileData.name}
                        onChange={handleProfileChange}
                        placeholder="Enter your full name"
                        className="text-white placeholder:text-slate-500 bg-slate-800 border-slate-600 focus:border-orange-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        value={profileData.email}
                        onChange={handleProfileChange}
                        placeholder="Enter your email address"
                        className="text-white placeholder:text-slate-500 bg-slate-800 border-slate-600 focus:border-orange-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Phone
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleProfileChange}
                        placeholder="Enter your phone number"
                        className="text-white placeholder:text-slate-500 bg-slate-800 border-slate-600 focus:border-orange-500"
                      />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                      <Label>Account Status</Label>
                      <div className="flex items-center gap-2">
                        <Badge className={getStatusColor(user.status || 'active')}>
                          {user.status || 'Active'}
                        </Badge>
                        {user.is_admin && (
                          <Badge variant="destructive">Admin</Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Button onClick={saveProfile} className="bg-orange-500 hover:bg-orange-600 text-white">
                      Save Profile
                    </Button>
                    <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800">
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bookings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5" />
                    My Bookings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-20 bg-gray-200 rounded"></div>
                        </div>
                      ))}
                    </div>
                  ) : bookings.length > 0 ? (
                    <div className="space-y-4">
                      {bookings.map((booking) => (
                        <div key={booking.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-medium text-lg">{booking.event.title}</h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{new Date(booking.event.date).toLocaleDateString()}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  <span>{booking.event.venue}</span>
                                </div>
                              </div>
                            </div>
                            <Badge className={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                          </div>

                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-sm text-muted-foreground">
                                Seats: {Array.isArray(booking.seats)
                                  ? booking.seats
                                      .map((seat) => typeof seat === 'string' ? seat : seat.seat_number || seat.seatNumber || '')
                                      .filter(Boolean)
                                      .join(', ')
                                  : 'N/A'}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Booked on {new Date(booking.created_at || booking.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-primary">
                                KSh {booking.total_amount ?? booking.totalAmount}
                              </p>
                              <Button variant="outline" size="sm" className="mt-2">
                                View Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Ticket className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-medium mb-2">No bookings yet</h3>
                      <p className="mb-4">Start exploring events and make your first booking!</p>
                      <Button asChild>
                        <Link href="/events">Browse Events</Link>
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="notifications">Email Notifications</Label>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="notifications" defaultChecked />
                      <Label htmlFor="notifications">Receive booking confirmations and updates</Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="marketing">Marketing Communications</Label>
                    <div className="flex items-center space-x-2">
                      <input type="checkbox" id="marketing" />
                      <Label htmlFor="marketing">Receive news about upcoming events and promotions</Label>
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button variant="outline" onClick={logout} className="text-red-600 hover:text-red-700">
                      Sign Out
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
