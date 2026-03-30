import { api } from './api';

export async function getBookingById(bookingId) {
  if (!bookingId) {
    throw new Error('Booking ID is required');
  }
  const response = await api.get(`/bookings/${bookingId}`);
  return response.data;
}

export async function getMyBookings(status) {
  const response = await api.get('/bookings');
  const bookings = response.data;
  if (!status) return bookings;
  if (!Array.isArray(bookings)) return bookings;

  const normalized = status.toLowerCase();
  if (normalized === 'upcoming') {
    return bookings.filter((b) => {
      const eventDate = b?.event?.date ? new Date(b.event.date) : null;
      return eventDate && eventDate >= new Date() && b?.status !== 'cancelled';
    });
  }

  if (normalized === 'past') {
    return bookings.filter((b) => {
      const eventDate = b?.event?.date ? new Date(b.event.date) : null;
      return eventDate && eventDate < new Date() && b?.status !== 'cancelled';
    });
  }

  if (normalized === 'cancelled') {
    return bookings.filter((b) => b?.status === 'cancelled');
  }

  return bookings;
}

export async function reserveSeats({ eventId, seatIds, quantity }) {
  if (!eventId) throw new Error('eventId is required');

  // general admission booking uses quantity instead of seatIds
  if (quantity !== undefined) {
    if (typeof quantity !== 'number' || quantity <= 0) {
      throw new Error('quantity must be a positive number');
    }
    const response = await api.post('/seats/reserve', {
      event_id: eventId,
      quantity,
    });
    return response.data;
  }

  if (!Array.isArray(seatIds) || seatIds.length === 0) throw new Error('seatIds are required');

  const response = await api.post('/seats/reserve', {
    event_id: eventId,
    seat_ids: seatIds,
  });
  return response.data;
}
