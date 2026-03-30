from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Event, Category, User, Seat, Booking
from datetime import datetime
import os
from werkzeug.utils import secure_filename

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'gif'}

def generate_seats_for_event(event):
    """Generate seats for an event using bulk insert for better performance"""
    total_seats = event.total_seats
    if total_seats > 0:
        seats_per_row = 10
        seats_to_add = []

        for i in range(total_seats):
            row = chr(65 + (i // seats_per_row))  # A, B, C, etc.
            seat_num = (i % seats_per_row) + 1
            seat_number = f"{row}{seat_num}"

            seat = Seat(
                event_id=event.id,
                seat_number=seat_number,
                status='available'
            )
            seats_to_add.append(seat)

        # Bulk insert for better performance
        if seats_to_add:
            db.session.add_all(seats_to_add)

events_bp = Blueprint('events', __name__, url_prefix='/api/events')

@events_bp.route('', methods=['GET'])
def get_events():
    """Get events.  By default only future events are returned, but if the
    requester is authenticated we also include any events they created so
    organisers can immediately see their own listings even if the start time
    has already passed (usually due to timezone conversions).

    Accepts optional query parameters:
      * category_id (int) - filter by category
      * all (boolean) - when true, return everything regardless of date
    """
    try:
        from sqlalchemy.orm import joinedload
        from flask_jwt_extended import get_jwt_identity

        category_id = request.args.get('category_id', type=int)
        include_all = request.args.get('all', type=lambda v: v.lower() == 'true')

        # Attempt to retrieve identity if a JWT is present.  get_jwt_identity
        # returns None when no valid token is supplied, so we can call it
        # directly without decorating the route.
        user_id = None
        try:
            user_id = get_jwt_identity()
        except Exception:
            user_id = None

        query = Event.query.options(joinedload(Event.category)).filter(Event.status == 'published')
        if category_id:
            query = query.filter_by(category_id=category_id)

        # Only show future events unless told otherwise or if the event belongs
        # to the current user.
        if not include_all:
            now = datetime.utcnow()
            if user_id:
                query = query.filter(
                    (Event.date >= now) | (Event.created_by == user_id)
                )
            else:
                query = query.filter(Event.date >= now)

        query = query.order_by(Event.date.asc())

        events = query.all()
        return jsonify([event.to_dict() for event in events]), 200
    except Exception as e:
        # log the full traceback as well for server logs
        import traceback
        current_app.logger.error(f'Error getting events: {str(e)}')
        current_app.logger.error(traceback.format_exc())
        # return the error message in the response during development
        return jsonify({'error': 'Failed to fetch events', 'details': str(e)}), 500

# support both '/api/events' and '/api/events/' since browser may append slash
@events_bp.route('', methods=['POST','OPTIONS'])
@events_bp.route('/', methods=['POST','OPTIONS'])
@jwt_required()
def create_event():
    """Create a new event"""
    # handle CORS preflight; flask-cors already adds headers but ensure 200
    if request.method == 'OPTIONS':
        return jsonify({'message': 'OK'}), 200
    try:
        # Get data from form or JSON
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form.to_dict()
            # Convert string values to appropriate types
            if 'category_id' in data:
                data['category_id'] = int(data['category_id'])
            if 'price' in data:
                data['price'] = float(data['price'])
            if 'total_seats' in data:
                data['total_seats'] = int(data['total_seats'])
        
        # Validate required fields
        required_fields = ['title', 'description', 'date', 'venue', 'price', 'total_seats', 'category_id']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Create new event
        event = Event(
            title=data['title'],
            description=data['description'],
            date=datetime.fromisoformat(data['date'].replace('Z', '+00:00')),
            venue=data['venue'],
            price=float(data['price']),
            total_seats=int(data['total_seats']),
            category_id=int(data['category_id']),
            image_url=None,
            created_by=get_jwt_identity()
        )
        
        db.session.add(event)
        db.session.flush()  # Get event ID
        
        # Handle file upload if present
        if 'image' in request.files:
            file = request.files['image']
            if file and file.filename != '' and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                upload_folder = current_app.config.get('UPLOAD_FOLDER', os.path.join(current_app.root_path, '..', 'uploads'))
                os.makedirs(upload_folder, exist_ok=True)
                filepath = os.path.join(upload_folder, f"event_{event.id}_{filename}")
                file.save(filepath)
                event.image_url = f"/uploads/event_{event.id}_{filename}"
        
        # Generate seats using optimized function
        generate_seats_for_event(event)
        
        db.session.commit()
        
        response = jsonify(event.to_dict())
        response.status_code = 201
        return response
        
    except ValueError as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Error creating event: {str(e)}')
        return jsonify({'error': 'Failed to create event'}), 500

@events_bp.route('/<int:event_id>', methods=['GET'])
def get_event(event_id):
    """Get single event"""
    try:
        event = Event.query.get(event_id)
        if not event:
            return jsonify({'error': 'Event not found'}), 404

        if event.status == 'cancelled':
            return jsonify({'error': 'Event has been cancelled', 'event': event.to_dict()}), 410

        return jsonify(event.to_dict()), 200
    except Exception as e:
        current_app.logger.error(f'Error getting event {event_id}: {str(e)}')
        return jsonify({'error': 'Failed to fetch event'}), 500

@events_bp.route('/<int:event_id>', methods=['PUT', 'OPTIONS'])
@jwt_required()
def update_event(event_id):
    """Update event (admin only)"""
    if request.method == 'OPTIONS':
        # Let Flask-CORS handle the OPTIONS response
        return jsonify({'message': 'OK'}), 200
    
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        event = Event.query.get(event_id)
        if not event:
            return jsonify({'error': 'Event not found'}), 404
        
        if not user or (not user.is_admin and event.created_by != user.id):
            return jsonify({'error': 'Permission denied. Only admins or event creators can update events'}), 403
        
        # Get data from form or JSON
        if request.is_json:
            data = request.get_json()
        else:
            data = request.form.to_dict()
        
        # Update fields
        if 'title' in data:
            event.title = data['title']
        if 'description' in data:
            event.description = data['description']
        if 'venue' in data:
            event.venue = data['venue']
        if 'price' in data:
            event.price = float(data['price'])
        
        # Handle file upload if present
        if 'image' in request.files:
            file = request.files['image']
            if file and file.filename != '' and allowed_file(file.filename):
                # Remove old image if exists
                if event.image_url:
                    try:
                        old_file = os.path.join(current_app.root_path, '..', event.image_url.lstrip('/'))
                        if os.path.exists(old_file):
                            os.remove(old_file)
                    except Exception as e:
                        current_app.logger.error(f'Error removing old image: {str(e)}')
                
                # Save new image
                filename = secure_filename(file.filename)
                upload_folder = current_app.config.get('UPLOAD_FOLDER', os.path.join(current_app.root_path, '..', 'uploads'))
                os.makedirs(upload_folder, exist_ok=True)
                filepath = os.path.join(upload_folder, f"event_{event.id}_{filename}")
                file.save(filepath)
                event.image_url = f"/uploads/event_{event.id}_{filename}"
        
        if 'date' in data:
            try:
                event.date = datetime.fromisoformat(str(data['date']).replace('Z', '+00:00'))
            except ValueError as e:
                return jsonify({'error': f'Invalid date format: {str(e)}'}), 400
        
        if 'category_id' in data:
            category = Category.query.get(data['category_id'])
            if not category:
                return jsonify({'error': 'Category not found'}), 404
            event.category_id = int(data['category_id'])
        
        db.session.commit()
        return jsonify(event.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Error updating event {event_id}: {str(e)}')
        return jsonify({'error': 'Failed to update event'}), 500

@events_bp.route('/<int:event_id>/cancel', methods=['POST', 'OPTIONS'])
@jwt_required()
def cancel_event(event_id):
    """Cancel an event (admin only)"""
    if request.method == 'OPTIONS':
        return jsonify({'message': 'OK'}), 200

    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    if not user or not user.is_admin:
        return jsonify({'error': 'Admin access required'}), 403

    event = Event.query.get(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404

    if event.status == 'cancelled':
        return jsonify({'error': 'Event already cancelled'}), 400

    event.status = 'cancelled'

    # Optionally cancel associated bookings and release seats
    try:
        bookings = Booking.query.filter_by(event_id=event_id).all()
        for booking in bookings:
            if booking.status != 'cancelled':
                booking.status = 'cancelled'
                for seat in booking.seats:
                    seat.status = 'available'
                    seat.booking_id = None
                    seat.reserved_until = None
    except Exception as e:
        current_app.logger.warning(f'Error cancelling associated bookings: {str(e)}')

    db.session.commit()
    return jsonify(event.to_dict()), 200

@events_bp.route('/<int:event_id>', methods=['DELETE', 'OPTIONS'])
@jwt_required()
def delete_event(event_id):
    """Delete event (admin only)"""
    if request.method == 'OPTIONS':
        # Let Flask-CORS handle the OPTIONS response
        return jsonify({'message': 'OK'}), 200
    
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        event = Event.query.get(event_id)
        if not event:
            return jsonify({'error': 'Event not found'}), 404
        
        if not user or (not user.is_admin and event.created_by != user.id):
            return jsonify({'error': 'Permission denied. Only admins or event creators can delete events'}), 403
        
        # Delete associated image if exists
        if event.image_url:
            try:
                file_path = os.path.join(current_app.root_path, '..', event.image_url.lstrip('/'))
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception as e:
                current_app.logger.error(f'Error deleting event image: {str(e)}')
        
        # Delete associated seats
        Seat.query.filter_by(event_id=event_id).delete()
        
        # Delete the event
        db.session.delete(event)
        db.session.commit()
        
        return jsonify({'message': 'Event deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f'Error deleting event {event_id}: {str(e)}')
        return jsonify({'error': 'Failed to delete event'}), 500

@events_bp.route('/<int:event_id>/seats', methods=['GET'])
def get_event_seats(event_id):
    """Get all seats for an event"""
    event = Event.query.get(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404

    # Order by seat_number for proper display, use optimized query
    seats = Seat.query.filter_by(event_id=event_id).order_by(
        Seat.seat_number
    ).all()
    return jsonify([seat.to_dict() for seat in seats]), 200

@events_bp.route('/stats', methods=['GET'])
def get_events_stats():
    """Get events statistics"""
    try:
        from sqlalchemy import func

        # Get current time for filtering
        now = datetime.utcnow()

        # Total events
        total_events = Event.query.count()

        # Upcoming events (future events)
        upcoming_events = Event.query.filter(Event.date >= now).count()

        # Past events
        past_events = Event.query.filter(Event.date < now).count()

        # Events this month
        start_of_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        events_this_month = Event.query.filter(Event.date >= start_of_month).count()

        # Most popular category
        popular_category = db.session.query(
            Category.name,
            func.count(Event.id).label('event_count')
        ).join(Event).group_by(Category.id).order_by(func.count(Event.id).desc()).first()

        # Total seats available across all events
        total_seats = db.session.query(func.sum(Event.total_seats)).scalar() or 0

        # Reserved seats
        reserved_seats = Seat.query.filter(Seat.status == 'reserved').count()

        stats = {
            'total_events': total_events,
            'upcoming_events': upcoming_events,
            'past_events': past_events,
            'events_this_month': events_this_month,
            'total_seats': int(total_seats),
            'reserved_seats': reserved_seats,
            'total_attendees': reserved_seats,
            'available_seats': int(total_seats) - reserved_seats,
            'popular_category': {
                'name': popular_category[0] if popular_category else None,
                'event_count': popular_category[1] if popular_category else 0
            } if popular_category else None
        }

        return jsonify(stats), 200

    except Exception as e:
        current_app.logger.error(f'Error getting events stats: {str(e)}')
        return jsonify({'error': 'Failed to fetch events statistics'}), 500
