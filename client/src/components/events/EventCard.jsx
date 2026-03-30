'use client';
import Link from 'next/link';

export const EventCard = ({ event }) => {
  const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

  const base = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:5000';
  const imageSrc = event.image_url ? `${base}${event.image_url}` : null;

  return (
    <Link href={`/events/${event.id}`}>
      <div className="group cursor-pointer overflow-hidden rounded-lg border border-border bg-card transition-all hover:shadow-lg hover:border-primary/50">
        {/* Image */}
        <div className="relative h-48 overflow-hidden bg-muted">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={event.title}
              className="h-full w-full object-cover transition-transform"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-muted-foreground">
              No Image
            </div>
          )}
          {event.featured && (
            <div className="absolute top-3 right-3 rounded-full bg-primary/90 px-3 py-1 text-xs font-medium text-primary-foreground">
              Featured
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="mb-2 flex items-start justify-between">
            <div>
              <h3 className="font-semibold line-clamp-2 text-foreground group-hover:text-primary transition-colors">
                {event.title}
              </h3>
              <p className="text-sm text-muted-foreground">{event.category?.name || ''}</p>
            </div>
          </div>

          {/* Event Details */}
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>📅 {formattedDate}</p>
            <p>🕐 {event.time}</p>
            <p>📍 {event.location}</p>
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between pt-4 border-t border-border">
            <span className="font-semibold text-foreground">
              {event.currency} {event.price.toLocaleString()}
            </span>
            <span className="text-xs text-muted-foreground">
              {event.availableSeats} seats left
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
