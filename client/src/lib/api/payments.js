import { api } from './api';

export async function initiateMpesaPayment({ bookingId, phone }) {
  if (!bookingId) throw new Error('bookingId is required');
  if (!phone) throw new Error('phone is required');

  const response = await api.post('/payments/mpesa/initiate', {
    booking_id: bookingId,
    phone,
  });

  return response.data;
}

export async function getPaymentStatus(paymentId) {
  if (!paymentId) throw new Error('paymentId is required');

  const response = await api.get(`/payments/status/${paymentId}`);
  return response.data;
}
