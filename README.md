# Nestify - Hostel Management System

A comprehensive hostel management system that connects hostel owners and tenants for seamless rent collection and facility management.

## 🚀 Features

### For Hostel Owners (Admins)
- **Secure Registration**: NestKey-based signup for authorized access
- **Dashboard**: Real-time overview of tenants, rooms, and collections
- **Room Management**: Add, edit, and manage room details
- **Tenant Management**: Track tenant information and room assignments
- **Billing System**: Generate and manage bills with multiple charge types
- **Payment Integration**: Secure Razorpay integration for rent collection
- **Analytics**: Performance insights and revenue tracking
- **Profile Management**: Update details with OTP verification

### For Tenants
- **StayKey Registration**: Secure signup using admin-provided StayKey
- **Payment Portal**: View and pay bills securely through Razorpay
- **Bill History**: Access to all payment records and receipts
- **Profile Management**: Update personal information

### Security Features
- **NestKey System**: Admin authorization control
- **StayKey System**: Tenant registration control
- **OTP Verification**: Email-based verification using Resend
- **JWT Authentication**: Secure session management
- **Role-based Access**: Separate admin and tenant portals

## 🛠 Tech Stack

### Backend
- **Node.js** with Express.js
- **Supabase** for database and authentication
- **Razorpay** for payment processing
- **Resend** for email services
- **JWT** for authentication
- **bcryptjs** for password hashing

### Frontend
- **React.js** with modern hooks
- **React Router** for navigation
- **Tailwind CSS** for styling
- **React Query** for data fetching
- **Axios** for API calls
- **React Hot Toast** for notifications

### Database
- **PostgreSQL** (via Supabase)
- Comprehensive schema with proper relationships
- Automated triggers and functions

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account
- Razorpay account
- Resend account

## 🔧 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd nestify-hostel-management
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `.env` file in backend directory:
```env
PORT=5000
NODE_ENV=development

# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# JWT Configuration
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Resend Email Configuration
RESEND_API_KEY=your_resend_api_key
FROM_EMAIL=noreply@nestify.com

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 3. Database Setup
1. Create a new Supabase project
2. Run the SQL schema from `database/schema.sql`
3. Update the NestKey in system_config table

### 4. Frontend Setup
```bash
cd frontend
npm install
```

Create `.env` file in frontend directory:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 5. Start the Application
```bash
# Start backend (from backend directory)
npm run dev

# Start frontend (from frontend directory)
npm start
```

## 🏗 Project Structure

```
nestify-hostel-management/
├── backend/
│   ├── src/
│   │   ├── auth/
│   │   ├── email/
│   │   ├── routes/
│   │   ├── utils/
│   │   └── server.js
│   ├── config/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── contexts/
│   │   ├── pages/
│   │   ├── utils/
│   │   └── App.js
│   └── package.json
├── database/
│   └── schema.sql
└── README.md
```

## 🔐 Authentication Flow

### Admin Registration
1. Admin enters details with NestKey
2. System validates NestKey against database
3. OTP sent to email for verification
4. Account activated after OTP verification

### Tenant Registration
1. Tenant enters details with StayKey
2. System validates StayKey against admin's key
3. Account created and linked to hostel

### Login Process
1. Email/password authentication
2. JWT token generation
3. Role-based dashboard redirection

## 💳 Payment Flow

1. Tenant views pending bills
2. Clicks "Pay Now" button
3. Razorpay checkout opens with admin's credentials
4. Payment processed securely
5. Webhook updates payment status
6. Invoice generated automatically

## 📊 Database Schema

### Key Tables
- `system_config`: NestKey management
- `admins`: Hostel owner accounts
- `tenants`: Tenant accounts
- `rooms`: Room information
- `bills`: Billing records
- `transactions`: Payment records
- `otp_verifications`: OTP management

## 🔧 Configuration

### Razorpay Setup
1. Create Razorpay account
2. Get Key ID and Secret
3. Configure in admin profile
4. Test with sandbox credentials

### Resend Setup
1. Create Resend account
2. Get API key
3. Configure domain (optional)
4. Set up email templates

### Supabase Setup
1. Create new project
2. Run database schema
3. Configure RLS policies
4. Get connection credentials

## 🚀 Deployment

### Backend Deployment
- Deploy to platforms like Railway, Render, or Heroku
- Set environment variables
- Configure database connection

### Frontend Deployment
- Build the React app: `npm run build`
- Deploy to Netlify, Vercel, or similar
- Update API URL in environment

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/admin/signup` - Admin registration
- `POST /api/auth/admin/login` - Admin login
- `POST /api/auth/tenant/signup` - Tenant registration
- `POST /api/auth/tenant/login` - Tenant login

### Admin Endpoints
- `GET /api/admin/dashboard` - Dashboard data
- `GET /api/admin/rooms` - Room management
- `GET /api/admin/tenants` - Tenant management
- `GET /api/admin/bills` - Billing management

### Payment Endpoints
- `POST /api/payment/create-order` - Create payment order
- `POST /api/payment/verify` - Verify payment
- `GET /api/payment/invoice/:billId` - Download invoice

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and queries:
- Email: support@nestify.com
- Documentation: [Link to docs]
- Issues: [GitHub Issues]

## 🔄 Version History

- **v1.0.0** - Initial release with core features
- **v1.1.0** - Enhanced payment integration
- **v1.2.0** - Advanced analytics and reporting

---

Built with ❤️ for modern hostel management.