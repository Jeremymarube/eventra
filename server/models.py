from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=True)
    full_name = db.Column(db.String(100), nullable=True)
    phone = db.Column(db.String(20))
    is_admin = db.Column(db.Boolean, default=False, index=True)
    status = db.Column(db.String(20), default='active', index=True)  # active, inactive, suspended
    google_id = db.Column(db.String(255), unique=True, nullable=True, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    bookings = db.relationship('Booking', backref='user', lazy=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.full_name,
            'full_name': self.full_name,
            'phone': self.phone,
            'is_admin': self.is_admin,
            'status': self.status,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }

class Category(db.Model):
    __tablename__ = 'categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    slug = db.Column(db.String(50), unique=True, nullable=False)
    description = db.Column(db.Text)
    
    events = db.relationship('Event', backref='category', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug,
            'description': self.description
        }

class Event(db.Model):
    __tablename__ = 'events'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False, index=True)
    description = db.Column(db.Text, nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False, index=True)
    venue = db.Column(db.String(200), nullable=False)
    date = db.Column(db.DateTime, nullable=False, index=True)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    total_seats = db.Column(db.Integer, nullable=False)
    image_url = db.Column(db.String(500))
    status = db.Column(db.Enum('draft', 'published', 'cancelled', name='event_status'), 
                      default='published', nullable=False, index=True)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    seats = db.relationship('Seat', backref='event', lazy=True, cascade='all, delete-orphan')
    bookings = db.relationship('Booking', backref='event', lazy=True)
    
    def to_dict(self):
        # Use SQL count query instead of looping - much faster for events with many seats
        from sqlalchemy import func
        available_seats = db.session.query(
            func.count(Seat.id)
        ).filter(
            Seat.event_id == self.id,
            Seat.status == 'available'
        ).scalar() or 0
        
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'category': self.category.to_dict() if self.category else None,
            'venue': self.venue,
            'date': self.date.isoformat(),
            'price': float(self.price),
            'total_seats': self.total_seats,
            'available_seats': available_seats,
            'image_url': self.image_url,
            'status': self.status,
            # include creator so the frontend can tell whether the logged‑in
            # user owns this event (used for showing edit buttons, etc.)
            'created_by': self.created_by,
            'created_at': self.created_at.isoformat()
        }

class Seat(db.Model):
    __tablename__ = 'seats'
    
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=False, index=True)
    seat_number = db.Column(db.String(10), nullable=False)
    status = db.Column(db.Enum('available', 'reserved', 'booked', name='seat_status'), 
                      default='available', nullable=False, index=True)
    reserved_until = db.Column(db.DateTime, index=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), index=True)
    
    __table_args__ = (db.UniqueConstraint('event_id', 'seat_number', name='unique_event_seat'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'seat_number': self.seat_number,
            'status': self.status,
            'reserved_until': self.reserved_until.isoformat() if self.reserved_until else None
        }

class Booking(db.Model):
    __tablename__ = 'bookings'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events.id'), nullable=False, index=True)
    total_amount = db.Column(db.Numeric(10, 2), nullable=False)
    # quantity is used for general admission bookings where no specific seats exist
    quantity = db.Column(db.Integer, default=0)
    status = db.Column(db.Enum('pending', 'confirmed', 'cancelled', name='booking_status'), 
                      default='pending', nullable=False, index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    # Renewal tracking
    renewal_count = db.Column(db.Integer, default=0)
    last_renewed = db.Column(db.DateTime)

    seats = db.relationship('Seat', backref='booking', lazy=True)
    payment = db.relationship('Payment', backref='booking', uselist=False)
    ticket = db.relationship('Ticket', backref='booking', uselist=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'event': self.event.to_dict() if self.event else None,
            'total_amount': float(self.total_amount),
            'quantity': self.quantity,
            'status': self.status,
            'renewal_count': self.renewal_count,
            'last_renewed': self.last_renewed.isoformat() if self.last_renewed else None,
            'seats': [seat.to_dict() for seat in self.seats],
            'created_at': self.created_at.isoformat()
        }

class Payment(db.Model):
    __tablename__ = 'payments'
    
    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=False, index=True)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    method = db.Column(db.Enum('stripe', 'mpesa', name='payment_method'), nullable=False, index=True)
    status = db.Column(db.Enum('pending', 'success', 'failed', name='payment_status'), 
                      default='pending', nullable=False, index=True)
    reference = db.Column(db.String(255), unique=True, index=True)
    transaction_id = db.Column(db.String(255), index=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'booking_id': self.booking_id,
            'amount': float(self.amount),
            'method': self.method,
            'status': self.status,
            'reference': self.reference,
            'created_at': self.created_at.isoformat()
        }

class Ticket(db.Model):
    __tablename__ = 'tickets'
    
    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('bookings.id'), nullable=False)
    qr_code = db.Column(db.Text, nullable=False)
    status = db.Column(db.Enum('valid', 'used', name='ticket_status'), 
                      default='valid', nullable=False)
    used_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'booking_id': self.booking_id,
            'qr_code': self.qr_code,
            'status': self.status,
            'created_at': self.created_at.isoformat()
        }
