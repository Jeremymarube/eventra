#!/usr/bin/env python
"""Test the stats endpoint directly with Flask test client"""
from app import create_app
from models import db, User
from flask_jwt_extended import create_access_token

app = create_app()

with app.app_context():
    # Create tables
    db.create_all()
    
    # Create admin if doesn't exist
    admin = User.query.filter_by(email='admin@eventtickets.com').first()
    if not admin:
        admin = User(
            email='admin@eventtickets.com',
            full_name='Admin User',
            is_admin=True
        )
        admin.set_password('admin123')
        db.session.add(admin)
        db.session.commit()
    
    # Create token for admin
    access_token = create_access_token(identity=admin.id)
    print(f"Admin token: {access_token}\n")
    
    # Test with Flask test client
    client = app.test_client()
    
    # Test without token
    print("1. Testing without token:")
    response = client.get('/api/admin/dashboard/stats')
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json}\n")
    
    # Test with token
    print("2. Testing with token:")
    response = client.get(
        '/api/admin/dashboard/stats',
        headers={'Authorization': f'Bearer {access_token}'}
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json}\n")
