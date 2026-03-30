from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
from sqlalchemy import func, and_, or_
from models import db, Event, Category, User, Booking, Payment, Seat
from werkzeug.utils import secure_filename
import os

admin_events_bp = Blueprint('admin_events', __name__, url_prefix='/api/admin/events')

# Helper function to check if user is admin
def is_admin():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    return user and user.is_admin

@admin_events_bp.route('', methods=['GET'])
@jwt_required()
def get_events():
    """Get all events with filtering, sorting, and pagination (admin only)"""
    if not is_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    # Pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # Sorting
    sort_by = request.args.get('sort_by', 'date')
    sort_order = request.args.get('sort_order', 'desc')
    
    # Filters
    status = request.args.get('status')
    category = request.args.get('category')
    search = request.args.get('search')
    
    # Build query
    query = Event.query
    
    # Apply filters
    if status:
        if status == 'upcoming':
            query = query.filter(Event.date >= datetime.utcnow())
        elif status == 'past':
            query = query.filter(Event.date < datetime.utcnow())
        elif status in ['draft', 'published', 'cancelled']:
            query = query.filter(Event.status == status)
    
    if category:
        query = query.join(Category).filter(Category.name == category)
    
    if search:
        search = f"%{search}%"
        query = query.filter(
            or_(
                Event.title.ilike(search),
                Event.description.ilike(search),
                Event.venue.ilike(search)
            )
        )
    
    # Apply sorting
    if sort_by in ['title', 'date', 'price', 'created_at']:
        order_column = getattr(Event, sort_by)
        if sort_order == 'desc':
            order_column = order_column.desc()
        query = query.order_by(order_column)
    
    # Execute query with pagination
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    events = pagination.items
    
    # Calculate available seats for each event
    events_data = []
    for event in events:
        event_data = event.to_dict()
        event_data['available_seats'] = Seat.query.filter_by(
            event_id=event.id,
            status='available'
        ).count()
        events_data.append(event_data)
    
    return jsonify({
        'data': events_data,
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page,
        'per_page': per_page
    }), 200

@admin_events_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_event_stats():
    """Get event statistics (admin only)"""
    if not is_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    # Total events
    total_events = Event.query.count()
    
    # Upcoming events
    upcoming_events = Event.query.filter(Event.date >= datetime.utcnow()).count()
    
    # Past events
    past_events = Event.query.filter(Event.date < datetime.utcnow()).count()
    
    # Events by status
    events_by_status = db.session.query(
        Event.status,
        func.count(Event.id).label('count')
    ).group_by(Event.status).all()
    
    # Events by category
    events_by_category = db.session.query(
        Category.name,
        func.count(Event.id).label('count')
    ).join(Event).group_by(Category.name).all()
    
    # Revenue stats
    revenue_stats = db.session.query(
        func.sum(Booking.total_amount).label('total_revenue'),
        func.avg(Booking.total_amount).label('avg_revenue_per_booking'),
        func.count(Booking.id).label('total_bookings')
    ).join(Event).filter(Event.date < datetime.utcnow()).first()
    
    return jsonify({
        'total_events': total_events,
        'upcoming_events': upcoming_events,
        'past_events': past_events,
        'events_by_status': dict(events_by_status),
        'events_by_category': dict(events_by_category),
        'total_revenue': float(revenue_stats.total_revenue or 0),
        'avg_revenue_per_booking': float(revenue_stats.avg_revenue_per_booking or 0),
        'total_bookings': revenue_stats.total_bookings or 0
    }), 200

@admin_events_bp.route('/<int:event_id>/bookings', methods=['GET'])
@jwt_required()
def get_event_bookings(event_id):
    """Get all bookings for an event (admin only)"""
    if not is_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    event = Event.query.get(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    
    # Pagination
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    # Get bookings with user and payment info
    bookings = Booking.query.filter_by(event_id=event_id)\
        .join(User)\
        .outerjoin(Payment)\
        .add_columns(
            User.email,
            User.full_name,
            Payment.amount,
            Payment.status.label('payment_status'),
            Payment.payment_method
        )\
        .order_by(Booking.created_at.desc())\
        .paginate(page=page, per_page=per_page, error_out=False)
    
    # Format response
    bookings_data = []
    for booking, email, full_name, amount, payment_status, payment_method in bookings.items:
        booking_data = booking.to_dict()
        booking_data['user'] = {'email': email, 'full_name': full_name}
        booking_data['payment'] = {
            'amount': float(amount or 0),
            'status': payment_status,
            'method': payment_method
        }
        bookings_data.append(booking_data)
    
    return jsonify({
        'data': bookings_data,
        'total': bookings.total,
        'pages': bookings.pages,
        'current_page': page,
        'per_page': per_page
    }), 200

@admin_events_bp.route('/<int:event_id>/export', methods=['GET'])
@jwt_required()
def export_event_data(event_id):
    """Export event data as CSV (admin only)"""
    if not is_admin():
        return jsonify({'error': 'Admin access required'}), 403
    
    event = Event.query.get(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    
    # Get all bookings with user and payment info
    bookings = Booking.query.filter_by(event_id=event_id)\
        .join(User)\
        .outerjoin(Payment)\
        .add_columns(
            User.email,
            User.full_name,
            Payment.amount,
            Payment.status.label('payment_status'),
            Payment.payment_method,
            Payment.transaction_id
        )\
        .order_by(Booking.created_at.desc())\
        .all()
    
    # Create CSV data
    import csv
    import io
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        'Booking ID', 'User', 'Email', 'Tickets', 'Amount', 
        'Payment Status', 'Payment Method', 'Transaction ID', 'Booking Date'
    ])
    
    # Write data
    for booking, email, full_name, amount, payment_status, payment_method, transaction_id in bookings:
        writer.writerow([
            booking.id,
            full_name,
            email,
            booking.ticket_count,
            f"${float(amount or 0):.2f}",
            payment_status or 'pending',
            payment_method or 'N/A',
            transaction_id or 'N/A',
            booking.created_at.strftime('%Y-%m-%d %H:%M:%S')
        ])
    
    # Prepare response
    output.seek(0)
    
    return jsonify({
        'csv': output.getvalue()
    }), 200

# Add this to your app's __init__.py or where you register blueprints
# from routes.admin_events import admin_events_bp
# app.register_blueprint(admin_events_bp)
