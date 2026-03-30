from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, User, Event, Booking, Payment, Ticket, Category
from sqlalchemy import func
from datetime import datetime

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

admin_bp = Blueprint('admin', __name__, url_prefix='/api/admin')

def require_admin():
    """Decorator to require admin access"""
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or not user.is_admin:
        return None
    return user

@admin_bp.route('/dashboard/stats', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    """Get dashboard statistics"""
    user = require_admin()
    if not user:
        return jsonify({'error': 'Admin access required'}), 403
    
    # Total events
    total_events = Event.query.count()
    
    # Total bookings
    total_bookings = Booking.query.filter_by(status='confirmed').count()
    
    # Total revenue
    total_revenue = db.session.query(
        func.sum(Payment.amount)
    ).filter(Payment.status == 'success').scalar() or 0
    
    # Total tickets sold
    total_tickets = Ticket.query.filter_by(status='valid').count() + \
                   Ticket.query.filter_by(status='used').count()
    
    # Recent bookings with eager loading
    from sqlalchemy.orm import joinedload
    recent_bookings = Booking.query.filter_by(
        status='confirmed'
    ).options(
        joinedload(Booking.event),
        joinedload(Booking.user)
    ).order_by(Booking.created_at.desc()).limit(5).all()
    
    # Upcoming events with eager loading
    from datetime import datetime
    upcoming_events = Event.query.filter(
        Event.date >= datetime.utcnow()
    ).options(
        joinedload(Event.category)
    ).order_by(Event.date.asc()).limit(5).all()
    
    # Get total users
    total_users = User.query.count()
    
    return jsonify({
        'total_events': total_events,
        'total_bookings': total_bookings,
        'total_revenue': float(total_revenue),
        'total_tickets': total_tickets,
        'total_users': total_users,
        'recent_bookings': [booking.to_dict() for booking in recent_bookings],
        'upcoming_events': [event.to_dict() for event in upcoming_events]
    }), 200

@admin_bp.route('/events/<int:event_id>/bookings', methods=['GET'])
@jwt_required()
def get_event_bookings(event_id):
    """Get all bookings for an event"""
    user = require_admin()
    if not user:
        return jsonify({'error': 'Admin access required'}), 403
    
    event = Event.query.get(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    
    bookings = Booking.query.filter_by(
        event_id=event_id,
        status='confirmed'
    ).all()
    
    return jsonify({
        'event': event.to_dict(),
        'bookings': [booking.to_dict() for booking in bookings],
        'total_bookings': len(bookings),
        'total_revenue': sum(float(b.total_amount) for b in bookings)
    }), 200

@admin_bp.route('/events/<int:event_id>/sales', methods=['GET'])
@jwt_required()
def get_event_sales(event_id):
    """Get sales report for an event"""
    user = require_admin()
    if not user:
        return jsonify({'error': 'Admin access required'}), 403
    
    event = Event.query.get(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    
    # Get all confirmed bookings
    bookings = Booking.query.filter_by(
        event_id=event_id,
        status='confirmed'
    ).all()
    
    # Calculate statistics
    total_seats_sold = sum(len(booking.seats) for booking in bookings)
    total_revenue = sum(float(booking.total_amount) for booking in bookings)
    
    # Payment method breakdown
    payments = Payment.query.join(Booking).filter(
        Booking.event_id == event_id,
        Payment.status == 'success'
    ).all()
    
    stripe_revenue = sum(
        float(p.amount) for p in payments if p.method == 'stripe'
    )
    mpesa_revenue = sum(
        float(p.amount) for p in payments if p.method == 'mpesa'
    )
    
    return jsonify({
        'event': event.to_dict(),
        'total_bookings': len(bookings),
        'total_seats_sold': total_seats_sold,
        'seats_available': event.total_seats - total_seats_sold,
        'total_revenue': total_revenue,
        'payment_breakdown': {
            'stripe': stripe_revenue,
            'mpesa': mpesa_revenue
        },
        'occupancy_rate': (total_seats_sold / event.total_seats * 100) if event.total_seats > 0 else 0
    }), 200

@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    """Get all users with pagination and search"""
    user = require_admin()
    if not user:
        return jsonify({'error': 'Admin access required'}), 403
    
    # Get query parameters
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 10, type=int)
    search = request.args.get('search', '').strip()
    
    # Build query
    query = User.query
    
    # Apply search filter if provided
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            db.or_(
                User.name.ilike(search_filter),
                User.email.ilike(search_filter)
            )
        )
    
    # Get total count for pagination
    total_users = query.count()
    total_pages = (total_users + limit - 1) // limit  # Ceiling division
    
    # Apply pagination
    users = query.order_by(User.created_at.desc()).offset((page - 1) * limit).limit(limit).all()
    
    return jsonify({
        'users': [u.to_dict() for u in users],
        'totalPages': total_pages,
        'currentPage': page,
        'totalUsers': total_users
    }), 200

@admin_bp.route('/users', methods=['POST'])
@jwt_required()
def create_user_admin():
    """Create a new user (admin)"""
    user = require_admin()
    if not user:
        return jsonify({'error': 'Admin access required'}), 403
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'email']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields: name and email'}), 400
    
    # Check if email already exists
    existing_user = User.query.filter_by(email=data['email']).first()
    if existing_user:
        return jsonify({'error': 'Email already registered'}), 400
    
    # Create user
    new_user = User(
        name=data['name'],
        email=data['email'],
        password_hash=User.hash_password('defaultpassword'),  # Default password
        is_admin=data.get('is_admin', False)
    )
    
    db.session.add(new_user)
    db.session.commit()
    
    return jsonify(new_user.to_dict()), 201

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user_admin(user_id):
    """Update a user (admin)"""
    user = require_admin()
    if not user:
        return jsonify({'error': 'Admin access required'}), 403
    
    target_user = User.query.get(user_id)
    if not target_user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    # Update fields
    if 'name' in data:
        target_user.name = data['name']
    if 'email' in data:
        # Check if email is taken by another user
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user and existing_user.id != user_id:
            return jsonify({'error': 'Email already taken'}), 400
        target_user.email = data['email']
    if 'is_admin' in data:
        target_user.is_admin = data['is_admin']
    
    db.session.commit()
    
    return jsonify(target_user.to_dict()), 200

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user_admin(user_id):
    """Delete a user (admin)"""
    user = require_admin()
    if not user:
        return jsonify({'error': 'Admin access required'}), 403
    
    target_user = User.query.get(user_id)
    if not target_user:
        return jsonify({'error': 'User not found'}), 404
    
    # Prevent deleting self
    if target_user.id == user.id:
        return jsonify({'error': 'Cannot delete your own account'}), 400
    
    # Check if user has bookings
    booking_count = Booking.query.filter_by(user_id=user_id).count()
    if booking_count > 0:
        return jsonify({'error': 'Cannot delete user with existing bookings'}), 400
    
    db.session.delete(target_user)
    db.session.commit()
    
    return jsonify({'message': 'User deleted successfully'}), 200

@admin_bp.route('/users/<int:user_id>/status', methods=['PATCH'])
@jwt_required()
def update_user_status_admin(user_id):
    """Update user status (admin)"""
    admin_user = require_admin()
    if not admin_user:
        return jsonify({'error': 'Admin access required'}), 403
    
    target_user = User.query.get(user_id)
    if not target_user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    if 'status' not in data:
        return jsonify({'error': 'Status field required'}), 400
    
    new_status = data['status']
    if new_status not in ['active', 'inactive', 'suspended']:
        return jsonify({'error': 'Invalid status. Must be active, inactive, or suspended'}), 400
    
    # Update status (assuming User model has a status field)
    if hasattr(target_user, 'status'):
        target_user.status = new_status
        db.session.commit()
        return jsonify(target_user.to_dict()), 200
    else:
        return jsonify({'error': 'User model does not support status updates'}), 400

@admin_bp.route('/users/<int:user_id>/bookings', methods=['GET'])
@jwt_required()
def get_user_bookings_admin(user_id):
    """Get all bookings for a specific user (admin)"""
    user = require_admin()
    if not user:
        return jsonify({'error': 'Admin access required'}), 403
    
    target_user = User.query.get(user_id)
    if not target_user:
        return jsonify({'error': 'User not found'}), 404
    
    bookings = Booking.query.filter_by(user_id=user_id).order_by(
        Booking.created_at.desc()
    ).all()
    
    return jsonify({
        'user': target_user.to_dict(),
        'bookings': [booking.to_dict() for booking in bookings]
    }), 200

@admin_bp.route('/events', methods=['GET'])
@jwt_required()
def get_all_events_admin():
    """Get all events for admin management"""
    user = require_admin()
    if not user:
        return jsonify({'error': 'Admin access required'}), 403
    
    events = Event.query.options(db.joinedload(Event.category)).all()
    return jsonify([event.to_dict() for event in events]), 200

@admin_bp.route('/events', methods=['POST'])
@jwt_required()
def create_event_admin():
    """Create a new event (admin)"""
    user = require_admin()
    if not user:
        return jsonify({'error': 'Admin access required'}), 403
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['title', 'description', 'date', 'venue', 'price', 'total_seats', 'category_id']
    if not all(field in data for field in required_fields):
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Validate category exists
    category = Category.query.get(data['category_id'])
    if not category:
        return jsonify({'error': 'Invalid category'}), 400
    
    # Create event
    event = Event(
        title=data['title'],
        description=data['description'],
        date=datetime.fromisoformat(data['date'].replace('Z', '+00:00')),
        venue=data['venue'],
        price=float(data['price']),
        total_seats=int(data['total_seats']),
        category_id=int(data['category_id']),
        image_url=data.get('image_url', '')
    )
    
    db.session.add(event)
    db.session.commit()
    
    # Generate seats for the event
    from routes.events import generate_seats_for_event
    generate_seats_for_event(event)
    
    return jsonify(event.to_dict()), 201

@admin_bp.route('/events/<int:event_id>', methods=['PUT'])
@jwt_required()
def update_event_admin(event_id):
    """Update an event (admin)"""
    user = require_admin()
    if not user:
        return jsonify({'error': 'Admin access required'}), 403
    
    event = Event.query.get(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    
    data = request.get_json()
    
    # Update fields
    if 'title' in data:
        event.title = data['title']
    if 'description' in data:
        event.description = data['description']
    if 'date' in data:
        event.date = datetime.fromisoformat(data['date'].replace('Z', '+00:00'))
    if 'venue' in data:
        event.venue = data['venue']
    if 'price' in data:
        event.price = float(data['price'])
    if 'total_seats' in data:
        event.total_seats = int(data['total_seats'])
    if 'category_id' in data:
        category = Category.query.get(data['category_id'])
        if not category:
            return jsonify({'error': 'Invalid category'}), 400
        event.category_id = int(data['category_id'])
    if 'image_url' in data:
        event.image_url = data['image_url']
    
    db.session.commit()
    return jsonify(event.to_dict()), 200

@admin_bp.route('/events/<int:event_id>', methods=['DELETE'])
@jwt_required()
def delete_event_admin(event_id):
    """Delete an event (admin)"""
    user = require_admin()
    if not user:
        return jsonify({'error': 'Admin access required'}), 403
    
    event = Event.query.get(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    
    # Check if event has bookings
    booking_count = Booking.query.filter_by(event_id=event_id).count()
    if booking_count > 0:
        return jsonify({'error': 'Cannot delete event with existing bookings'}), 400
    
    db.session.delete(event)
    db.session.commit()
    
    return jsonify({'message': 'Event deleted successfully'}), 200
