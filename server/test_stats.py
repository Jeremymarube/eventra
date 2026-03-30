#!/usr/bin/env python
"""Test the stats endpoint"""
from app import create_app
from models import db, User
import json

app = create_app()

with app.app_context():
    # Create tables
    db.create_all()
    
    # Check if admin exists
    admin = User.query.filter_by(email='admin@eventtickets.com').first()
    if not admin:
        print("Creating admin user...")
        admin = User(
            email='admin@eventtickets.com',
            full_name='Admin User',
            is_admin=True
        )
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()
        print(f"Admin created with ID: {admin.id}")
    
    # Get stats query
    from models import Event, Booking, Payment, Ticket
    from sqlalchemy import func
    from datetime import datetime
    
    try:
        total_events = Event.query.count()
        total_bookings = Booking.query.filter_by(status='confirmed').count()
        total_revenue = db.session.query(
            func.sum(Payment.amount)
        ).filter(Payment.status == 'success').scalar() or 0
        total_tickets = Ticket.query.filter_by(status='valid').count() + \
                       Ticket.query.filter_by(status='used').count()
        total_users = User.query.count()
        
        recent_bookings = Booking.query.filter_by(
            status='confirmed'
        ).order_by(Booking.created_at.desc()).limit(5).all()
        
        upcoming_events = Event.query.filter(
            Event.date >= datetime.utcnow()
        ).order_by(Event.date.asc()).limit(5).all()
        
        response = {
            'total_events': total_events,
            'total_bookings': total_bookings,
            'total_revenue': float(total_revenue),
            'total_tickets': total_tickets,
            'total_users': total_users,
            'recent_bookings': [booking.to_dict() for booking in recent_bookings],
            'upcoming_events': [event.to_dict() for event in upcoming_events]
        }
        
        print("✓ Stats query successful!")
        print(json.dumps(response, indent=2, default=str))
        
    except Exception as e:
        print(f"✗ Error in stats query: {e}")
        import traceback
        traceback.print_exc()
