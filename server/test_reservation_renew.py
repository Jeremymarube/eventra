#!/usr/bin/env python
"""Test seat reservation renewal endpoint"""
from app import create_app
from models import db, User, Event, Seat, Category
from flask_jwt_extended import create_access_token
from datetime import datetime, timedelta

app = create_app()

with app.app_context():
    db.create_all()

    # ensure user exists
    user = User.query.filter_by(email='renew@test.com').first()
    if not user:
        user = User(email='renew@test.com', full_name='Renew User')
        user.set_password('password')
        db.session.add(user)
        db.session.commit()

    token = create_access_token(identity=user.id)

    # Ensure schema has new columns (dev convenience)
    from sqlalchemy import text
    conn = db.engine.connect()
    try:
        res = conn.execute(text("PRAGMA table_info('bookings')")).fetchall()
        cols = [row[1] for row in res]
        if 'renewal_count' not in cols:
            conn.execute(text("ALTER TABLE bookings ADD COLUMN renewal_count INTEGER DEFAULT 0"))
        if 'last_renewed' not in cols:
            conn.execute(text("ALTER TABLE bookings ADD COLUMN last_renewed DATETIME"))
    finally:
        conn.close()

    # ensure a category
    cat = Category.query.first()
    if not cat:
        cat = Category(name='Test', slug='test')
        db.session.add(cat)
        db.session.commit()

    # create event with seats
    event = Event(title='Renew Test', description='Test renew', category_id=cat.id, venue='Hall', date=datetime(2026,6,1,18,0), price=10.0, total_seats=6)
    db.session.add(event)
    db.session.flush()
    # generate seats
    seats_per_row = 3
    for i in range(6):
        row = chr(65 + (i // seats_per_row))
        seat_num = (i % seats_per_row) + 1
        seat_number = f"{row}{seat_num}"
        s = Seat(event_id=event.id, seat_number=seat_number, status='available')
        db.session.add(s)
    db.session.commit()

    client = app.test_client()

    # pick first seat
    seat_ids = [s.id for s in Seat.query.filter_by(event_id=event.id).limit(1).all()]

    resp = client.post('/api/seats/reserve', json={'event_id': event.id, 'seat_ids': seat_ids}, headers={'Authorization': f'Bearer {token}'})
    print('Reserve status:', resp.status_code)
    print('Reserve resp:', resp.json)

    assert resp.status_code == 200
    booking_id = resp.json['booking_id']
    reserved_until_1 = datetime.fromisoformat(resp.json['reserved_until'])

    # Call renew several times up to limit
    from config import Config
    import time

    limit = Config.SEAT_RENEWAL_LIMIT
    renew_results = []
    for i in range(limit):
        resp2 = client.post('/api/seats/renew', json={'booking_id': booking_id}, headers={'Authorization': f'Bearer {token}'})
        print(f'Renew attempt {i+1} status:', resp2.status_code)
        print('Resp:', resp2.json)
        renew_results.append((resp2.status_code, resp2.json))
        # wait for cooldown before next attempt
        time.sleep(Config.SEAT_RENEWAL_COOLDOWN + 0.1)

    # One more attempt should fail (limit reached)
    resp_over = client.post('/api/seats/renew', json={'booking_id': booking_id}, headers={'Authorization': f'Bearer {token}'})
    print('Over limit attempt status:', resp_over.status_code, resp_over.json)

    success_count = sum(1 for status, _ in renew_results if status == 200)
    print('Success:', success_count)
    assert success_count == limit
    assert resp_over.status_code == 400

    # Test cooldown: immediate renew should return 429 with retry_after (on next fresh booking)
    # Create a fresh booking
    resp3 = client.post('/api/seats/reserve', json={'event_id': event.id, 'seat_ids': [s.id for s in Seat.query.filter_by(event_id=event.id).limit(1).all()]}, headers={'Authorization': f'Bearer {token}'})
    assert resp3.status_code == 200
    booking_id2 = resp3.json['booking_id']

    # First renew
    r1 = client.post('/api/seats/renew', json={'booking_id': booking_id2}, headers={'Authorization': f'Bearer {token}'})
    assert r1.status_code == 200
    # Immediate second renew should hit cooldown
    r2 = client.post('/api/seats/renew', json={'booking_id': booking_id2}, headers={'Authorization': f'Bearer {token}'})
    print('Cooldown test status:', r2.status_code, r2.json)
    assert r2.status_code in (400, 429)

    print('Renew limit and cooldown tests passed')
