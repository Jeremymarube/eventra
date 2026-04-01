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


def send_event_created_email(user_email, event):
    """Send an email to the event creator after event creation."""
    email_template = """
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 640px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #4F46E5; color: white; text-decoration: none; padding: 12px 20px; border-radius: 6px; margin: 12px 0; }
            .section { margin-bottom: 20px; }
            .section h2 { margin-bottom: 10px; }
            .footer { color: #666; font-size: 13px; margin-top: 24px; text-align: center; }
            .link { word-break: break-all; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎉 Your event is live!</h1>
                <p><strong>{{ event_title }}</strong> has been created successfully.</p>
            </div>
            <div class="content">
                <div class="section">
                    <p>Congratulations! Your event has been created and is now ready to share.</p>
                </div>

                <div class="section">
                    <h2>Share Your Link</h2>
                    <p>Copy and share the public event page below:</p>
                    <p class="link"><a href="{{ event_url }}">{{ event_url }}</a></p>
                </div>

                <div class="section">
                    <h2>What’s next?</h2>
                    <ul>
                        <li>Update the description, add questions, and adjust settings.</li>
                        <li>Sell tickets and set up payment details.</li>
                        <li>Invite guests and promote your event.</li>
                    </ul>
                </div>

                <div class="section">
                    <a class="button" href="{{ event_url }}">View event page</a>
                </div>

                <div class="section">
                    <p><strong>Event details</strong></p>
                    <p>Venue: {{ venue }}</p>
                    <p>Date: {{ event_date }}</p>
                </div>

                <div class="footer">
                    <p>If you have questions, reply to this email or visit your dashboard.</p>
                    <p>&copy; 2026 Eventra</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """

    try:
        frontend_url = current_app.config.get('FRONTEND_URL', 'http://localhost:3000').rstrip('/')
        event_url = f"{frontend_url}/events/{event.id}"
        html_body = render_template_string(
            email_template,
            event_title=event.title,
            event_date=event.date.strftime('%B %d, %Y at %I:%M %p'),
            venue=event.venue,
            event_url=event_url
        )

        msg = Message(
            subject=f"Your event '{event.title}' is live",
            recipients=[user_email],
            html=html_body
        )

        mail.send(msg)
        return True
    except Exception as e:
        current_app.logger.error(f"Failed to send event created email: {str(e)}")
        return False


def send_event_cancelled_email(user_email, event):
    """Send an email to attendees when an event is cancelled."""
    email_template = """
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 640px; margin: 0 auto; padding: 20px; }
            .header { background: #DC2626; color: white; padding: 24px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 24px; border-radius: 0 0 8px 8px; }
            .section { margin-bottom: 18px; }
            .footer { color: #666; font-size: 13px; margin-top: 24px; text-align: center; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Event Cancelled</h1>
                <p><strong>{{ event_title }}</strong> will no longer take place.</p>
            </div>
            <div class="content">
                <div class="section">
                    <p>We are sorry to let you know that this event has been cancelled by the organizer.</p>
                </div>
                <div class="section">
                    <p><strong>Event:</strong> {{ event_title }}</p>
                    <p><strong>Date:</strong> {{ event_date }}</p>
                    <p><strong>Venue:</strong> {{ venue }}</p>
                </div>
                <div class="section">
                    <p>Please contact the organizer or support if you need any help with your booking.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2026 Eventra</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """

    try:
        html_body = render_template_string(
            email_template,
            event_title=event.title,
            event_date=event.date.strftime('%B %d, %Y at %I:%M %p'),
            venue=event.venue,
        )

        msg = Message(
            subject=f"Event cancelled: {event.title}",
            recipients=[user_email],
            html=html_body
        )

        mail.send(msg)
        return True
    except Exception as e:
        current_app.logger.error(f"Failed to send event cancellation email: {str(e)}")
        return False
