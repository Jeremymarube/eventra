#!/usr/bin/env python
"""Test seat reservation endpoint"""
from app import create_app
from models import db, User, Event, Seat, Category
from flask_jwt_extended import create_access_token

app = create_app()

with app.app_context():
    db.create_all()

    # ensure admin user exists
    user = User.query.filter_by(email='user@test.com').first()
    if not user:
        user = User(email='user@test.com', full_name='Test User')
        user.set_password('password')
        db.session.add(user)
        db.session.commit()

    token = create_access_token(identity=user.id)

    # ensure a category
    cat = Category.query.first()
    if not cat:
        cat = Category(name='Test', slug='test')
        db.session.add(cat)
        db.session.commit()

    # create event with seats
    from datetime import datetime
    event = Event(title='Reservation Test', description='Test seats', category_id=cat.id, venue='Hall', date=datetime(2026,5,1,18,0), price=10.0, total_seats=10)
    db.session.add(event)
    db.session.flush()
    # generate seats
    from datetime import datetime
    seats_per_row = 5
    for i in range(10):
        row = chr(65 + (i // seats_per_row))
        seat_num = (i % seats_per_row) + 1
        seat_number = f"{row}{seat_num}"
        s = Seat(event_id=event.id, seat_number=seat_number, status='available')
        db.session.add(s)
    db.session.commit()

    client = app.test_client()

    # pick first two seats
    seat_ids = [s.id for s in Seat.query.filter_by(event_id=event.id).limit(2).all()]

    resp = client.post('/api/seats/reserve', json={'event_id': event.id, 'seat_ids': seat_ids}, headers={'Authorization': f'Bearer {token}'})
    print('Status:', resp.status_code)
    print('Response:', resp.json)

    # try reserving same seats with another user
    user2 = User(email='user2@test.com', full_name='User Two')
    user2.set_password('password')
    db.session.add(user2)
    db.session.commit()
    token2 = create_access_token(identity=user2.id)

    resp2 = client.post('/api/seats/reserve', json={'event_id': event.id, 'seat_ids': seat_ids}, headers={'Authorization': f'Bearer {token2}'})
    print('Second attempt status:', resp2.status_code)
    print('Second response:', resp2.json)

    # --- general admission case -------------------------------------------------
    ga_event = Event(
        title='GA Test',
        description='General admission event',
        category_id=cat.id,
        venue='Open Ground',
        date=datetime(2026,7,1,18,0),
        price=5.0,
        total_seats=0  # indicates GA
    )
    db.session.add(ga_event)
    db.session.commit()

    # reserve 3 tickets for GA event
    resp3 = client.post('/api/seats/reserve', json={'event_id': ga_event.id, 'quantity': 3}, headers={'Authorization': f'Bearer {token}'})
    print('GA reservation status:', resp3.status_code)
    print('GA response:', resp3.json)
    assert resp3.status_code == 200, 'GA reservation failed'
    assert resp3.json.get('quantity') == 3, 'Returned quantity should match request'

    # verify booking record has quantity set
    from models import Booking
    booking = Booking.query.get(resp3.json.get('booking_id'))
    assert booking is not None
    assert booking.quantity == 3
