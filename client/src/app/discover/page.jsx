'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api/api';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Star } from 'lucide-react';

const toRadians = (degrees) => (degrees * Math.PI) / 180;
const getDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export default function DiscoverPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState('');
  const [locationEnabled, setLocationEnabled] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsResponse, categoriesResponse] = await Promise.all([
          api.get('/events'),
          api.get('/categories')
        ]);
        setEvents(eventsResponse.data);
        setCategories(categoriesResponse.data);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch =
        event.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.venue?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' ||
        event.category_id === parseInt(selectedCategory);

      return matchesSearch && matchesCategory;
    });
  }, [events, searchTerm, selectedCategory]);

  const eventsWithDistance = useMemo(() => {
    if (!userLocation) return [];
    return events
      .filter((event) => typeof event.latitude === 'number' && typeof event.longitude === 'number')
      .map((event) => ({
        ...event,
        distance: getDistanceKm(userLocation.lat, userLocation.lng, event.latitude, event.longitude),
      }))
      .sort((a, b) => a.distance - b.distance);
  }, [events, userLocation]);

  const mapEmbedUrl = userLocation
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${userLocation.lng - 0.05},${userLocation.lat - 0.03},${userLocation.lng + 0.05},${userLocation.lat + 0.03}&layer=mapnik&marker=${userLocation.lat},${userLocation.lng}`
    : null;

  const handleEnableLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationError('');
        setLocationEnabled(true);
      },
      (error) => {
        setLocationError(error.message || 'Unable to access location.');
        setLocationEnabled(false);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-foreground">
      <Header />

      <main className="container mx-auto px-6 py-8 space-y-10">
        <section className="space-y-4">
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl font-bold">Discover Events</h1>
            <p className="text-muted-foreground">
              Find events near you, browse by category, or explore what's happening in your city.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_2fr] items-start">
            <div className="space-y-4 max-w-xl">
              <div className="flex flex-wrap gap-3 items-center">
                <Input
                  placeholder="Search events..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="min-w-[220px]"
                />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="rounded-xl border border-slate-700 bg-slate-900 text-white px-4 py-3"
                >
                  <option value="all">All categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-1">
                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Location access
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-slate-400">
                      Turn on location to see events closest to you and view your map area.
                    </p>
                    <Button onClick={handleEnableLocation} className="w-full">
                      {locationEnabled ? 'Refresh location' : 'Enable location'}
                    </Button>
                    {locationError && <p className="text-sm text-red-400">{locationError}</p>}
                    {userLocation && (
                      <p className="text-sm text-slate-400">
                        Your location: {userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)}
                      </p>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Suggested
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm text-slate-400">
                    {userLocation ? (
                      <p>We’ll use your current location to highlight nearby events when coordinates are available.</p>
                    ) : (
                      <p>Click the button to allow location access and view your local event area.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-4">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle>Map preview</CardTitle>
                </CardHeader>
                <CardContent>
                  {mapEmbedUrl ? (
                    <iframe
                      title="Discover map"
                      src={mapEmbedUrl}
                      className="h-[40rem] w-full rounded-xl border border-slate-700"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-[40rem] items-center justify-center rounded-xl border border-dashed border-slate-700 bg-slate-900 text-slate-500">
                      Enable location to see your nearby map.
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle>Events around you</CardTitle>
                </CardHeader>
                <CardContent>
                  {userLocation ? (
                    eventsWithDistance.length > 0 ? (
                      <div className="space-y-4">
                        {eventsWithDistance.slice(0, 4).map((event) => (
                          <div key={event.id} className="rounded-2xl border border-slate-800 bg-slate-950/10 p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h3 className="font-semibold text-white">{event.title}</h3>
                                <p className="text-sm text-slate-400">{event.venue}</p>
                              </div>
                              <span className="text-xs text-slate-400">{event.distance.toFixed(1)} km</span>
                            </div>
                            <p className="mt-3 text-sm text-slate-400 line-clamp-2">{event.description}</p>
                            <Link href={`/events/${event.id}`} className="mt-3 inline-flex text-sm font-medium text-blue-300 hover:text-blue-200">
                              View event
                            </Link>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">No geotagged events are available nearby yet.</p>
                    )
                  ) : (
                    <p className="text-sm text-slate-400">Enable location to see events around you.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
