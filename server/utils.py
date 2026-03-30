import qrcode
import io
import base64
from flask_mail import Mail, Message
from flask import current_app, render_template_string
import json

mail = Mail()

def generate_qr_code(data):
    """Generate QR code and return as base64 string"""
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    
    qr.add_data(json.dumps(data))
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Convert to base64
    buffered = io.BytesIO()
    img.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    
    return f"data:image/png;base64,{img_str}"

def send_ticket_email(user_email, booking, ticket):
    """Send ticket confirmation email with QR code"""
    
    email_template = """
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 20px; margin: 20px 0; }
            .ticket { background: white; padding: 20px; border: 2px solid #4F46E5; border-radius: 8px; }
            .qr-code { text-align: center; margin: 20px 0; }
            .qr-code img { max-width: 300px; }
            .details { margin: 15px 0; }
            .details strong { display: inline-block; width: 120px; }
            .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎫 Your Ticket Confirmation</h1>
            </div>
            
            <div class="content">
                <h2>Thank you for your booking!</h2>
                <p>Your tickets for <strong>{{ event_title }}</strong> have been confirmed.</p>
                
                <div class="ticket">
                    <h3>Event Details</h3>
                    <div class="details">
                        <p><strong>Event:</strong> {{ event_title }}</p>
                        <p><strong>Date:</strong> {{ event_date }}</p>
                        <p><strong>Venue:</strong> {{ venue }}</p>
                        <p><strong>Seats:</strong> {{ seats }}</p>
                        <p><strong>Total Amount:</strong> KES {{ amount }}</p>
                    </div>
                    
                    <div class="qr-code">
                        <h3>Your QR Ticket</h3>
                        <img src="{{ qr_code }}" alt="QR Code Ticket">
                        <p><small>Booking ID: {{ booking_id }}</small></p>
                    </div>
                    
                    <p style="text-align: center; margin-top: 20px;">
                        <strong>Please present this QR code at the event entrance</strong>
                    </p>
                </div>
            </div>
            
            <div class="footer">
                <p>If you have any questions, please contact our support team.</p>
                <p>&copy; 2026 Event Ticketing System. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    try:
        # Prepare data
        event = booking.event
        seats_str = ", ".join([seat.seat_number for seat in booking.seats])
        
        # Render email
        html_body = render_template_string(
            email_template,
            event_title=event.title,
            event_date=event.date.strftime('%B %d, %Y at %I:%M %p'),
            venue=event.venue,
            seats=seats_str,
            amount=f"{booking.total_amount:,.2f}",
            booking_id=booking.id,
            qr_code=ticket.qr_code
        )
        
        # Create message
        msg = Message(
            subject=f"Your Ticket for {event.title}",
            recipients=[user_email],
            html=html_body
        )
        
        # Send email
        mail.send(msg)
        return True
    except Exception as e:
        current_app.logger.error(f"Failed to send email: {str(e)}")
        return False

def send_payment_confirmation_email(user_email, booking):
    """Send payment confirmation email"""
    
    email_template = """
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10B981; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 20px; margin: 20px 0; }
            .footer { text-align: center; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Payment Confirmed</h1>
            </div>
            
            <div class="content">
                <h2>Payment Successful!</h2>
                <p>Your payment for <strong>{{ event_title }}</strong> has been confirmed.</p>
                <p><strong>Amount Paid:</strong> KES {{ amount }}</p>
                <p>Your ticket will be sent in a separate email shortly.</p>
            </div>
            
            <div class="footer">
                <p>&copy; 2026 Event Ticketing System</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    try:
        html_body = render_template_string(
            email_template,
            event_title=booking.event.title,
            amount=f"{booking.total_amount:,.2f}"
        )
        
        msg = Message(
            subject="Payment Confirmation",
            recipients=[user_email],
            html=html_body
        )
        
        mail.send(msg)
        return True
    except Exception as e:
        current_app.logger.error(f"Failed to send payment confirmation: {str(e)}")
        return False
