'use client';

export const QRTicket = ({ ticket, event }) => {
  return (
    <div className="bg-card border border-border rounded-lg p-6 max-w-md">
      {/* QR Code */}
      <div className="bg-muted rounded-lg p-8 mb-6 flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">📱 QR Code</p>
          <div className="w-40 h-40 bg-white rounded-lg flex items-center justify-center">
            <p className="text-xs text-center text-muted-foreground">QR Code Image</p>
          </div>
        </div>
      </div>

      {/* Ticket Details */}
      <div className="space-y-4">
        <div>
          <p className="text-sm text-muted-foreground mb-1">Booking ID</p>
          <p className="font-mono font-semibold">{ticket.bookingId}</p>
        </div>

        {event && (
          <>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Event</p>
              <p className="font-medium">{event.title}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Seats</p>
              <p className="font-medium">{ticket.seats.join(', ')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Date & Time</p>
              <p className="font-medium">
                {new Date(event.date).toLocaleDateString()} at {event.time}
              </p>
            </div>
          </>
        )}
      </div>

      {/* Warning */}
      <div className="mt-6 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-sm text-yellow-700">
        📧 Keep this QR code safe. You'll need it to enter the event.
      </div>
    </div>
  );
};
