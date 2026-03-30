from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, Payment, Booking, Seat, User, Ticket
from datetime import datetime
import stripe
import requests
import base64
import json
from utils import generate_qr_code, send_ticket_email, send_payment_confirmation_email

payments_bp = Blueprint('payments', __name__, url_prefix='/api/payments')

def get_mpesa_access_token():
    """Get M-Pesa access token"""
    consumer_key = current_app.config['MPESA_CONSUMER_KEY']
    consumer_secret = current_app.config['MPESA_CONSUMER_SECRET']
    
    if not consumer_key or not consumer_secret:
        current_app.logger.error("M-Pesa credentials not configured")
        return None
    
    if current_app.config['MPESA_ENVIRONMENT'] == 'production':
        api_url = "https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    else:
        api_url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials"
    
    try:
        response = requests.get(api_url, auth=(consumer_key, consumer_secret))
        return response.json().get('access_token')
    except Exception as e:
        current_app.logger.error(f"M-Pesa token error: {str(e)}")
        return None

@payments_bp.route('/stripe/create-intent', methods=['POST'])
@jwt_required()
def create_stripe_payment_intent():
    """Create Stripe payment intent"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data.get('booking_id'):
        return jsonify({'error': 'Booking ID required'}), 400
    
    booking = Booking.query.get(data['booking_id'])
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
    
    if booking.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    if booking.status != 'pending':
        return jsonify({'error': 'Booking already processed'}), 400
    
    # Initialize Stripe
    stripe.api_key = current_app.config['STRIPE_SECRET_KEY']
    
    try:
        # Create payment intent
        amount_in_cents = int(float(booking.total_amount) * 100)
        
        intent = stripe.PaymentIntent.create(
            amount=amount_in_cents,
            currency='kes',
            metadata={
                'booking_id': booking.id,
                'user_id': user_id,
                'event_id': booking.event_id
            }
        )
        
        # Create payment record
        payment = Payment(
            booking_id=booking.id,
            amount=booking.total_amount,
            method='stripe',
            status='pending',
            reference=intent.id
        )
        
        db.session.add(payment)
        db.session.commit()
        
        return jsonify({
            'client_secret': intent.client_secret,
            'payment_id': payment.id
        }), 200
        
    except stripe.error.StripeError as e:
        return jsonify({'error': str(e)}), 400

@payments_bp.route('/stripe/confirm', methods=['POST'])
@jwt_required()
def confirm_stripe_payment():
    """Confirm Stripe payment and complete booking"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data.get('payment_intent_id'):
        return jsonify({'error': 'Payment intent ID required'}), 400
    
    # Find payment
    payment = Payment.query.filter_by(
        reference=data['payment_intent_id'],
        method='stripe'
    ).first()
    
    if not payment:
        return jsonify({'error': 'Payment not found'}), 404
    
    booking = payment.booking
    if booking.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    # Initialize Stripe
    stripe.api_key = current_app.config['STRIPE_SECRET_KEY']
    
    try:
        # Retrieve payment intent
        intent = stripe.PaymentIntent.retrieve(data['payment_intent_id'])
        
        if intent.status == 'succeeded':
            # Update payment
            payment.status = 'success'
            payment.transaction_id = intent.id
            
            # Update booking
            booking.status = 'confirmed'
            
            # Update seats
            for seat in booking.seats:
                seat.status = 'booked'
                seat.reserved_until = None
            
            # Generate QR code ticket
            qr_data = {
                'booking_id': booking.id,
                'user_id': user_id,
                'event_id': booking.event_id,
                'seats': [seat.seat_number for seat in booking.seats],
                'timestamp': datetime.utcnow().isoformat()
            }
            
            qr_code = generate_qr_code(qr_data)
            
            ticket = Ticket(
                booking_id=booking.id,
                qr_code=qr_code,
                status='valid'
            )
            
            db.session.add(ticket)
            db.session.commit()
            
            # Send emails
            user = User.query.get(user_id)
            send_payment_confirmation_email(user.email, booking)
            send_ticket_email(user.email, booking, ticket)
            
            return jsonify({
                'message': 'Payment confirmed',
                'booking': booking.to_dict(),
                'ticket': ticket.to_dict()
            }), 200
        else:
            payment.status = 'failed'
            db.session.commit()
            return jsonify({'error': 'Payment not successful'}), 400
            
    except stripe.error.StripeError as e:
        return jsonify({'error': str(e)}), 400

@payments_bp.route('/mpesa/initiate', methods=['POST'])
@jwt_required()
def initiate_mpesa_payment():
    """Initiate M-Pesa STK Push"""
    user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data.get('booking_id') or not data.get('phone'):
        return jsonify({'error': 'Booking ID and phone number required'}), 400
    
    booking = Booking.query.get(data['booking_id'])
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404
    
    if booking.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    if booking.status != 'pending':
        return jsonify({'error': 'Booking already processed'}), 400
    
    # Get M-Pesa access token
    access_token = get_mpesa_access_token()
    if not access_token:
        return jsonify({'error': 'Failed to connect to M-Pesa'}), 500
    
    # Prepare STK Push request
    shortcode = current_app.config['MPESA_SHORTCODE']
    passkey = current_app.config['MPESA_PASSKEY']
    timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
    
    password = base64.b64encode(
        f"{shortcode}{passkey}{timestamp}".encode()
    ).decode('utf-8')
    
    phone = data['phone'].replace('+', '').replace(' ', '')
    if phone.startswith('0'):
        phone = '254' + phone[1:]
    
    amount = int(float(booking.total_amount))
    
    if current_app.config['MPESA_ENVIRONMENT'] == 'production':
        api_url = "https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
    else:
        api_url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest"
    
    headers = {
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json'
    }
    
    payload = {
        'BusinessShortCode': shortcode,
        'Password': password,
        'Timestamp': timestamp,
        'TransactionType': 'CustomerPayBillOnline',
        'Amount': amount,
        'PartyA': phone,
        'PartyB': shortcode,
        'PhoneNumber': phone,
        'CallBackURL': current_app.config['MPESA_CALLBACK_URL'],
        'AccountReference': f'BOOKING{booking.id}',
        'TransactionDesc': f'Ticket for {booking.event.title}'
    }
    
    try:
        response = requests.post(api_url, json=payload, headers=headers)
        result = response.json()
        
        if result.get('ResponseCode') == '0':
            # Create payment record
            payment = Payment(
                booking_id=booking.id,
                amount=booking.total_amount,
                method='mpesa',
                status='pending',
                reference=result.get('CheckoutRequestID')
            )
            
            db.session.add(payment)
            db.session.commit()
            
            return jsonify({
                'message': 'STK Push sent to phone',
                'checkout_request_id': result.get('CheckoutRequestID'),
                'payment_id': payment.id
            }), 200
        else:
            return jsonify({
                'error': 'Failed to initiate payment',
                'details': result.get('errorMessage', 'Unknown error')
            }), 400
            
    except Exception as e:
        current_app.logger.error(f"M-Pesa error: {str(e)}")
        return jsonify({'error': 'Payment service error'}), 500

@payments_bp.route('/mpesa/callback', methods=['POST'])
def mpesa_callback():
    """Handle M-Pesa payment callback"""
    data = request.get_json()
    
    try:
        # Extract callback data
        result_code = data['Body']['stkCallback']['ResultCode']
        checkout_request_id = data['Body']['stkCallback']['CheckoutRequestID']
        
        # Find payment
        payment = Payment.query.filter_by(
            reference=checkout_request_id,
            method='mpesa'
        ).first()
        
        if not payment:
            return jsonify({'error': 'Payment not found'}), 404
        
        booking = payment.booking
        
        if result_code == 0:
            # Payment successful
            callback_metadata = data['Body']['stkCallback']['CallbackMetadata']['Item']
            mpesa_receipt = next(
                (item['Value'] for item in callback_metadata if item['Name'] == 'MpesaReceiptNumber'),
                None
            )
            
            payment.status = 'success'
            payment.transaction_id = mpesa_receipt
            
            booking.status = 'confirmed'
            
            # Update seats
            for seat in booking.seats:
                seat.status = 'booked'
                seat.reserved_until = None
            
            # Generate QR code ticket
            qr_data = {
                'booking_id': booking.id,
                'user_id': booking.user_id,
                'event_id': booking.event_id,
                'seats': [seat.seat_number for seat in booking.seats],
                'timestamp': datetime.utcnow().isoformat()
            }
            
            qr_code = generate_qr_code(qr_data)
            
            ticket = Ticket(
                booking_id=booking.id,
                qr_code=qr_code,
                status='valid'
            )
            
            db.session.add(ticket)
            db.session.commit()
            
            # Send emails
            user = User.query.get(booking.user_id)
            send_payment_confirmation_email(user.email, booking)
            send_ticket_email(user.email, booking, ticket)
            
        else:
            # Payment failed
            payment.status = 'failed'
            
            # Release seats
            for seat in booking.seats:
                seat.status = 'available'
                seat.reserved_until = None
                seat.booking_id = None
            
            booking.status = 'cancelled'
            db.session.commit()
        
        return jsonify({'message': 'Callback processed'}), 200
        
    except Exception as e:
        current_app.logger.error(f"Callback error: {str(e)}")
        return jsonify({'error': 'Callback processing failed'}), 500

@payments_bp.route('/status/<int:payment_id>', methods=['GET'])
@jwt_required()
def get_payment_status(payment_id):
    """Get payment status"""
    user_id = get_jwt_identity()
    
    payment = Payment.query.get(payment_id)
    if not payment:
        return jsonify({'error': 'Payment not found'}), 404
    
    booking = payment.booking
    if booking.user_id != user_id:
        return jsonify({'error': 'Unauthorized'}), 403
    
    return jsonify(payment.to_dict()), 200
