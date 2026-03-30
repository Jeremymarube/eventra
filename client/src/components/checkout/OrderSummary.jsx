'use client';

export const OrderSummary = ({ event, selectedSeats, paymentMethod }) => {
  const subtotal = selectedSeats.reduce((sum, seat) => sum + seat.price, 0);
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  return (
    <div className="border border-border rounded-lg p-6 bg-card sticky top-24">
      <h3 className="text-lg font-semibold mb-6">Order Summary</h3>

      {/* Event Info */}
      {event && (
        <div className="mb-6 pb-6 border-b border-border">
          <h4 className="font-medium text-sm text-muted-foreground mb-2">Event</h4>
          <p className="font-medium">{event.title}</p>
          <p className="text-sm text-muted-foreground mt-1">{event.location}</p>
        </div>
      )}

      {/* Seats */}
      <div className="mb-6 pb-6 border-b border-border">
        <h4 className="font-medium text-sm text-muted-foreground mb-3">Seats</h4>
        <div className="space-y-2">
          {selectedSeats.map((seat, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span>{seat.id}</span>
              <span>{seat.price}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{subtotal}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Tax (10%)</span>
          <span>{tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-semibold text-lg pt-3 border-t border-border">
          <span>Total</span>
          <span className="text-primary">{total.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Method */}
      <div className="text-sm text-muted-foreground">
        <p className="mb-1">Payment via</p>
        <p className="font-medium text-foreground capitalize">{paymentMethod}</p>
      </div>
    </div>
  );
};
