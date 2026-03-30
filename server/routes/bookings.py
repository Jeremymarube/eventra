from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Booking, Ticket, User

bookings_bp = Blueprint('bookings', __name__, url_prefix='/api/bookings')

@bookings_bp.route('', methods=['GET'])
@jwt_required()
def get_user_bookings():
    """Get all bookings for current user"""
    user_id = get_jwt_identity()
    
    bookings = Booking.query.filter_by(user_id=user_id).order_by(
        Booking.created_at.desc()
    ).all()
    
    return jsonify([booking.to_dict() for booking in bookings]), 200

@bookings_bp.route('/<int:booking_id>', methods=['GET'])
@jwt_required()
def get_booking(booking_id):
    """Get single booking"""
    from sqlalchemy.orm import joinedload
    user_id = get_jwt_identity()
    
    booking = Booking.query.options(
        joinedload(Booking.event),
        joinedload(Booking.user),
        joinedload(Booking.seats)
    ).get(booking_id)
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
    
    if booking.user_id != user_id:
        user = User.query.get(user_id)
        if not user or not user.is_admin:
            return jsonify({'error': 'Unauthorized'}), 403
    
    return jsonify(booking.to_dict()), 200

@bookings_bp.route('/<int:booking_id>/ticket', methods=['GET'])
@jwt_required()
def get_booking_ticket(booking_id):
    """Get ticket for a booking"""
    user_id = get_jwt_identity()
    
    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
    
    if booking.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    if booking.status != 'confirmed':
        return jsonify({'error': 'Booking not confirmed'}), 400
    
    ticket = Ticket.query.filter_by(booking_id=booking_id).first()
    if not ticket:
        return jsonify({'error': 'Ticket not found'}), 404
    
    return jsonify({
        'ticket': ticket.to_dict(),
        'booking': booking.to_dict()
    }), 200

tickets_bp = Blueprint('tickets', __name__, url_prefix='/api/tickets')

@tickets_bp.route('/<int:ticket_id>/verify', methods=['POST'])
@jwt_required()
def verify_ticket(ticket_id):
    """Verify and use a ticket (admin only - for event entrance)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or not user.is_admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    ticket = Ticket.query.get(ticket_id)
    if not ticket:
        return jsonify({'error': 'Ticket not found'}), 404
    
    booking = ticket.booking
    
    if ticket.status == 'used':
        return jsonify({
            'valid': False,
            'message': 'Ticket already used',
            'used_at': ticket.used_at.isoformat() if ticket.used_at else None
        }), 400
    
    if booking.status != 'confirmed':
        return jsonify({
            'valid': False,
            'message': 'Booking not confirmed'
        }), 400
    
    # Mark ticket as used
    ticket.status = 'used'
    ticket.used_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'valid': True,
        'message': 'Ticket verified successfully',
        'booking': booking.to_dict(),
        'attendee': booking.user.to_dict()
    }), 200

@tickets_bp.route('/scan', methods=['POST'])
@jwt_required()
def scan_ticket():
    """Scan QR code to verify ticket (admin only)"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user or not user.is_admin:
        return jsonify({'error': 'Admin access required'}), 403
    
    data = request.get_json()
    
    if not data.get('booking_id'):
        return jsonify({'error': 'Booking ID required'}), 400
    
    ticket = Ticket.query.filter_by(booking_id=data['booking_id']).first()
    if not ticket:
        return jsonify({'error': 'Ticket not found'}), 404
    
    booking = ticket.booking
    
    if ticket.status == 'used':
        return jsonify({
            'valid': False,
            'message': 'Ticket already used',
            'used_at': ticket.used_at.isoformat() if ticket.used_at else None
        }), 200
    
    if booking.status != 'confirmed':
        return jsonify({
            'valid': False,
            'message': 'Booking not confirmed'
        }), 200
    
    from datetime import datetime
    
    # Mark ticket as used
    ticket.status = 'used'
    ticket.used_at = datetime.utcnow()
    db.session.commit()
    
    return jsonify({
        'valid': True,
        'message': 'Ticket verified successfully',
        'booking': booking.to_dict(),
        'attendee': booking.user.to_dict()
    }), 200
