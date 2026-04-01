# 🎟️ Event Ticketing System - Extended MVP

A full-stack event ticketing platform with seat selection, multiple payment methods (Stripe & M-Pesa), QR code tickets, and email notifications.

## 🚀 Features

### Core Features
- ✅ **Event Categories** - Music, Tech, Sports, Business
- ✅ **Seat Selection** - Interactive seat grid with real-time availability
- ✅ **Dual Payment Methods**:
  - Stripe (Card payments - Global)
  - M-Pesa (STK Push - Kenya 🇰🇪)
- ✅ **QR Code Tickets** - Generated after successful payment
- ✅ **Email Notifications** - Payment confirmation & ticket delivery
- ✅ **Admin Dashboard** - Event management & sales analytics
- ✅ **Booking Management** - View history & download tickets

### User Roles
1. **User (Attendee)** - Browse, book, pay, receive tickets
2. **Admin (Organizer)** - Manage events, view sales, verify tickets

## 🧪 Testing

### Frontend Testing

We use Jest and React Testing Library for frontend testing.

```bash
# Run frontend tests
cd client
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage
```

### Backend Testing

We use Pytest for backend testing.

```bash
# Install test dependencies
pip install -r requirements-test.txt

# Run all tests
cd server
pytest -v

# Run a specific test file
pytest tests/test_events.py -v

# Run with coverage report
pytest --cov=app --cov-report=term-missing
```

## 🛠️ Tech Stack

### Backend
- **Flask** - Python web framework
- **SQLAlchemy** - ORM for database operations
- **PostgreSQL/SQLite** - Database
- **Stripe API** - Card payments
- **M-Pesa API** - Mobile payments (Safaricom)
- **Flask-Mail** - Email delivery
- **QRCode** - Ticket generation
- **JWT** - Authentication

### Frontend
- **Next.js 14** - React framework (App Router)
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Axios** - API client
- **React Hot Toast** - Notifications
- **Stripe.js** - Payment integration

## � Development Setup

### Prerequisites

- Python 3.9+
- Node.js 18+
- PostgreSQL (optional, can use SQLite for development)
- Stripe Account
- M-Pesa Account (for Kenyan payments)
- Gmail/SMTP for emails
- Node.js 18+ (for frontend)
- Python 3.9+ (for backend)
- PostgreSQL (or SQLite for development)

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd event-ticketing-system
```

### 2. Backend Setup

```bash
cd server

# Create virtual environment
python -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment variables
cp .env.example .env

# Edit .env with your credentials
nano .env
```

#### Configure Environment Variables (.env)

```env
# Database
DATABASE_URL=postgresql://user:password@localhost/event_ticketing
# Or use SQLite for development:
# DATABASE_URL=sqlite:///event_ticketing.db

# Flask
SECRET_KEY=your-super-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-key-here

# Stripe (Get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# M-Pesa (Get from https://developer.safaricom.co.ke)
MPESA_CONSUMER_KEY=your_consumer_key
MPESA_CONSUMER_SECRET=your_consumer_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/callback
MPESA_ENVIRONMENT=sandbox  # or production

# Email (Gmail example)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_DEFAULT_SENDER=your-email@gmail.com

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

#### Run Database Migrations

```bash
# Initialize database and seed data
python app.py
```

This will create:
- Default categories (Music, Tech, Sports, Business)
- Admin user (email: admin@eventtickets.com, password: admin123)

#### Start Backend Server

```bash
python app.py
```

Backend runs on: http://localhost:5000

### 3. Frontend Setup

```bash
cd ../client

# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local

# Edit .env.local
nano .env.local
```

#### Configure Frontend Environment (.env.local)

```env
# Base URL of the backend API. Do not include a trailing slash.
NEXT_PUBLIC_API_BASE=http://localhost:5000
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

#### Start Frontend Development Server

```bash
npm run dev
```

Frontend runs on: http://localhost:3000

## 🎯 User Flow

```
1. Browse events → Filter by category
2. Select event → View details
3. Select seats → Interactive seat grid
4. Reserve seats → 10-minute hold
5. Choose payment method → Stripe or M-Pesa
6. Complete payment → Real-time processing
7. Receive confirmation email
8. Get QR ticket → Download/Print
9. Attend event → Scan at gate
```

## 📊 Database Schema

```sql
users (id, email, password_hash, full_name, phone, is_admin)
categories (id, name, slug, description)
events (id, title, description, category_id, venue, date, price, total_seats)
seats (id, event_id, seat_number, status, reserved_until, booking_id)
bookings (id, user_id, event_id, total_amount, status)
payments (id, booking_id, amount, method, status, reference, transaction_id)
tickets (id, booking_id, qr_code, status, used_at)
```

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/register     - Register new user
POST   /api/auth/login        - Login user
GET    /api/auth/me           - Get current user
```

### Categories
```
GET    /api/categories        - List all categories
GET    /api/categories/:id    - Get category
POST   /api/categories        - Create (admin)
PUT    /api/categories/:id    - Update (admin)
DELETE /api/categories/:id    - Delete (admin)
```

### Events
```
GET    /api/events            - List events (filter by category)
GET    /api/events/:id        - Get event details
GET    /api/events/:id/seats  - Get seat availability
POST   /api/events            - Create event (admin)
PUT    /api/events/:id        - Update event (admin)
DELETE /api/events/:id        - Delete event (admin)
```

### Seats
```
POST   /api/seats/reserve     - Reserve seats (10 min hold)
POST   /api/seats/release     - Release reservation
POST   /api/seats/cleanup-expired - Cleanup expired (cron)
```

### Payments
```
POST   /api/payments/stripe/create-intent  - Create Stripe payment
POST   /api/payments/stripe/confirm        - Confirm Stripe payment
POST   /api/payments/mpesa/initiate        - Initiate M-Pesa STK
POST   /api/payments/mpesa/callback        - M-Pesa callback
GET    /api/payments/status/:id            - Check payment status
```

### Bookings
```
GET    /api/bookings          - User's bookings
GET    /api/bookings/:id      - Booking details
GET    /api/bookings/:id/ticket - Get QR ticket
```

### Admin
```
GET    /api/admin/dashboard/stats        - Dashboard statistics
GET    /api/admin/events/:id/bookings    - Event bookings
GET    /api/admin/events/:id/sales       - Sales report
GET    /api/admin/users                  - All users
```

## 💳 Payment Integration

### Stripe Setup

1. Create account at https://stripe.com
2. Get API keys from Dashboard
3. Test with card: 4242 4242 4242 4242
4. Configure webhook for production

### M-Pesa Setup

1. Register at https://developer.safaricom.co.ke
2. Create app (Lipa Na M-Pesa Online)
3. Get Consumer Key & Secret
4. Set callback URL (must be HTTPS in production)
5. Test phone: 254708374149 (sandbox)

## 📧 Email Configuration

### Gmail Setup

1. Enable 2-Factor Authentication
2. Generate App Password (not regular password)
3. Use App Password in MAIL_PASSWORD

### SendGrid (Alternative)

```env
MAIL_SERVER=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=your-sendgrid-api-key
```

## 🔒 Security Features

- JWT authentication
- Password hashing (Werkzeug)
- CORS protection
- SQL injection prevention (SQLAlchemy ORM)
- Input validation
- Secure payment handling
- Environment variable protection

## 🎨 Frontend Pages

```
/                  - Event listing with category filter
/events/[id]       - Event details with seat selector
/checkout          - Payment processing
/success           - Confirmation & QR ticket
/bookings          - User booking history
/login             - User login
/register          - User registration
/admin             - Admin dashboard
/admin/events      - Event management
/admin/sales       - Sales analytics
```

## 🐛 Troubleshooting

### Backend Issues

**Database connection fails**
```bash
# Check PostgreSQL is running
sudo service postgresql status

# Or use SQLite for development
# In .env: DATABASE_URL=sqlite:///event_ticketing.db
```

**Email not sending**
```bash
# Check Gmail settings
# Verify App Password (not regular password)
# Check MAIL_USE_TLS=True
```

**M-Pesa callback not working**
```bash
# Must use HTTPS in production
# Use ngrok for local testing:
ngrok http 5000
# Update MPESA_CALLBACK_URL with ngrok URL
```

### Frontend Issues

**API connection refused**
```bash
# Ensure backend is running on port 5000
# Check NEXT_PUBLIC_API_URL in .env.local
```

**Stripe not loading**
```bash
# Verify NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
# Check browser console for errors
```

## 📈 Production Deployment

### Backend (Heroku)

```bash
# Install Heroku CLI
heroku create your-app-name
heroku addons:create heroku-postgresql
heroku config:set SECRET_KEY=...
heroku config:set STRIPE_SECRET_KEY=...
git push heroku main
```

### Frontend (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel
cd frontend
vercel
# Add environment variables in Vercel dashboard
```

### Important Production Changes

1. **Use PostgreSQL** (not SQLite)
2. **Enable HTTPS** for all endpoints
3. **Set strong SECRET_KEY**
4. **Configure CORS** properly
5. **Use production Stripe/M-Pesa keys**
6. **Set up monitoring** (Sentry, LogRocket)
7. **Configure CDN** for static assets
8. **Set up backup** strategy

## 🧪 Testing

### Test Admin Account
```
Email: admin@eventtickets.com
Password: admin123
```

### Test Payment Cards (Stripe)
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
```

### Test M-Pesa (Sandbox)
```
Phone: 254708374149
PIN: Any 4 digits
```

## 📝 License

MIT License - feel free to use for your projects!

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📞 Support

For issues and questions:
- Open GitHub issue
- Email: support@eventtickets.com

---

**Built with ❤️ using Flask, Next.js, Stripe, and M-Pesa**

