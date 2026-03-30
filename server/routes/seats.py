from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Seat, Event, Booking, User
from datetime import datetime, timedelta
from config import Config

seats_bp = Blueprint('seats', __name__, url_prefix='/api/seats')

@seats_bp.route('/reserve', methods=['POST'])
@jwt_required()
def reserve_seats():
    """Reserve seats temporarily (10 minutes). Supports general admission events by
    accepting a `quantity` instead of `seat_ids` when the event has no fixed seats
    (total_seats == 0).
    """
    user_id = get_jwt_identity()
    data = request.get_json()
    
    # At minimum we need an event id
    if not data.get('event_id'):
        return jsonify({'error': 'Event ID required'}), 400
    
    event = Event.query.get(data['event_id'])
    if not event:
        return jsonify({'error': 'Event not found'}), 404

    # For GA events we expect a positive quantity
    if event.total_seats == 0:
        qty = data.get('quantity', 0)
        try:
            qty = int(qty)
        except Exception:
            qty = 0
        if qty <= 0:
            return jsonify({'error': 'Quantity must be provided for general admission events'}), 400

        total_amount = qty * event.price
        booking = Booking(
            user_id=user_id,
            event_id=event.id,
            total_amount=total_amount,
            quantity=qty,
            status='pending'
        )
        db.session.add(booking)
        db.session.commit()

        return jsonify({
            'message': 'General admission reservation created',
            'booking_id': booking.id,
            'total_amount': float(total_amount),
            'seats': [],
            'quantity': qty
        }), 200

    # non-GA flow requires seat_ids
    if not data.get('seat_ids') or not isinstance(data.get('seat_ids'), list):
        return jsonify({'error': 'Seat IDs required for reserved seating events'}), 400

    seat_ids = data['seat_ids']
    
    # Check if all seats are available
    seats = Seat.query.filter(
        Seat.id.in_(seat_ids),
        Seat.event_id == data['event_id']
    ).all()
    
    if len(seats) != len(seat_ids):
        return jsonify({'error': 'Some seats not found'}), 404
    
    # Check seat availability
    unavailable_seats = []
    for seat in seats:
        if seat.status != 'available':
            # Check if reservation expired
            if seat.status == 'reserved' and seat.reserved_until:
                if seat.reserved_until < datetime.utcnow():
                    seat.status = 'available'
                    seat.reserved_until = None
                else:
                    unavailable_seats.append(seat.seat_number)
            else:
                unavailable_seats.append(seat.seat_number)
    
    if unavailable_seats:
        return jsonify({
            'error': 'Some seats are not available',
            'unavailable_seats': unavailable_seats
        }), 400
    
    # Create pending booking
    total_amount = len(seats) * event.price
    
    booking = Booking(
        user_id=user_id,
        event_id=event.id,
        total_amount=total_amount,
        status='pending'
    )
    
    db.session.add(booking)
    db.session.flush()  # Get booking ID
    
    # Reserve seats
    reservation_time = datetime.utcnow() + timedelta(minutes=Config.SEAT_RESERVATION_TIMEOUT)
    
    for seat in seats:
        seat.status = 'reserved'
        seat.reserved_until = reservation_time
        seat.booking_id = booking.id
    
    db.session.commit()
    
    return jsonify({
        'message': 'Seats reserved successfully',
        'booking_id': booking.id,
        'reserved_until': reservation_time.isoformat(),
        'total_amount': float(total_amount),
        'seats': [seat.to_dict() for seat in seats],
        'renewal_count': booking.renewal_count,
        'renewal_limit': Config.SEAT_RENEWAL_LIMIT
    }), 200

@seats_bp.route('/release', methods=['POST'])
@jwt_required()
def release_seats():
    """Release reserved seats"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data.get('booking_id'):
        return jsonify({'error': 'Booking ID required'}), 400
    
    booking = Booking.query.get(data['booking_id'])
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
    
    # Verify ownership
    if booking.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Release seats if booking is still pending
    if booking.status == 'pending':
        for seat in booking.seats:
            if seat.status == 'reserved':
                seat.status = 'available'
                seat.reserved_until = None
                seat.booking_id = None
        
        db.session.delete(booking)
        db.session.commit()
        
        return jsonify({'message': 'Seats released successfully'}), 200
    
    return jsonify({'error': 'Cannot release confirmed booking'}), 400

@seats_bp.route('/renew', methods=['POST'])
@jwt_required()
def renew_reservation():
    """Renew an existing reservation (extend reserved_until)"""
    user_id = get_jwt_identity()
    data = request.get_json()

    if not data.get('booking_id'):
        return jsonify({'error': 'Booking ID required'}), 400

    booking = Booking.query.get(data['booking_id'])
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404

    # Verify ownership
    if booking.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    # Only pending bookings can be renewed
    if booking.status != 'pending':
        return jsonify({'error': 'Only pending bookings can be renewed'}), 400

    # Ensure seats are still reserved and not expired
    now = datetime.utcnow()

    reserved_seats = [s for s in booking.seats if s.status == 'reserved']
    if not reserved_seats:
        return jsonify({'error': 'No reserved seats found for booking'}), 400

    for seat in reserved_seats:
        if seat.reserved_until and seat.reserved_until < now:
            return jsonify({'error': 'Reservation has expired and cannot be renewed'}), 400

    # Enforce renewal limit
    if booking.renewal_count >= Config.SEAT_RENEWAL_LIMIT:
        return jsonify({'error': 'Renewal limit reached'}), 400

    # Enforce cooldown between renewals
    if booking.last_renewed:
        cooldown_seconds = Config.SEAT_RENEWAL_COOLDOWN
        seconds_since = (now - booking.last_renewed).total_seconds()
        if seconds_since < cooldown_seconds:
            return jsonify({'error': 'Renewal cooldown active', 'retry_after': int(cooldown_seconds - seconds_since)}), 429

    # Extend reservation
    new_until = datetime.utcnow() + timedelta(minutes=Config.SEAT_RESERVATION_TIMEOUT)
    for seat in reserved_seats:
        seat.reserved_until = new_until

    # Update booking renewal metadata
    booking.renewal_count = (booking.renewal_count or 0) + 1
    booking.last_renewed = datetime.utcnow()

    db.session.commit()

    return jsonify({
        'message': 'Reservation renewed',
        'booking_id': booking.id,
        'reserved_until': new_until.isoformat(),
        'renewal_count': booking.renewal_count,
        'renewal_limit': Config.SEAT_RENEWAL_LIMIT
    }), 200

@seats_bp.route('/cleanup-expired', methods=['POST'])
def cleanup_expired_reservations():
    """Cleanup expired seat reservations (can be called by cron job)"""
    # Find expired reservations
    expired_seats = Seat.query.filter(
        Seat.status == 'reserved',
        Seat.reserved_until < datetime.utcnow()
    ).all()
    
    count = 0
    for seat in expired_seats:
        seat.status = 'available'
        seat.reserved_until = None
        
        # Delete pending booking if it has no more seats
        if seat.booking_id:
            booking = Booking.query.get(seat.booking_id)
            if booking and booking.status == 'pending':
                remaining_seats = Seat.query.filter(
                    Seat.booking_id == seat.booking_id,
                    Seat.status == 'reserved'
                ).count()
                
                if remaining_seats == 1:  # This is the last seat
                    db.session.delete(booking)
        
        seat.booking_id = None
        count += 1
    
    db.session.commit()
    
    return jsonify({
        'message': f'{count} expired reservations cleaned up'
    }), 200
