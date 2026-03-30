'use client';
import { useState } from 'react';

export const SeatSelector = ({ seats, selectedSeats, onSeatToggle }) => {
  const rows = new Set(seats.map(s => s.row));
  const sections = new Set(seats.map(s => s.section));

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Select Your Seats</h3>
        <div className="inline-block space-y-4">
          {/* Legend */}
          <div className="flex gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-muted rounded border border-border" />
              <span>Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-primary rounded" />
              <span>Selected</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-muted-foreground/30 rounded" />
              <span>Sold</span>
            </div>
          </div>

          {/* Seats Grid */}
          <div className="space-y-2">
            {Array.from(rows).sort().map((row) => (
              <div key={row} className="flex gap-2">
                <div className="w-6 text-center text-xs font-medium text-muted-foreground">
                  {row}
                </div>
                <div className="flex gap-1">
                  {seats
                    .filter(s => s.row === row)
                    .sort((a, b) => parseInt(a.number) - parseInt(b.number))
                    .map((seat) => (
                      <button
                        key={seat.id}
                        onClick={() => onSeatToggle(seat.id)}
                        disabled={seat.status === 'sold'}
                        className={`w-6 h-6 rounded text-xs font-medium transition-all ${
                          selectedSeats.includes(seat.id)
                            ? 'bg-primary text-primary-foreground'
                            : seat.status === 'sold'
                            ? 'bg-muted-foreground/30 cursor-not-allowed'
                            : 'bg-muted border border-border hover:border-primary/50'
                        }`}
                      >
                        {seat.number}
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
