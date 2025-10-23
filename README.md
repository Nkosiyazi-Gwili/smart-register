https://img.shields.io/badge/version-1.0.0-green
https://img.shields.io/badge/license-MIT-yellow

A modern, feature-rich employee attendance tracking system built with Next.js, Express.js, and MongoDB. Smart Register provides secure, location-verified attendance tracking with facial recognition capabilities and comprehensive leave management.

🚀 Live Demo
Frontend: https://smart-register.vercel.app

Backend API: https://smart-register-backend.vercel.app/api

Demo Credentials
Admin: admin@company.com / password123

Manager: it.manager@company.com / password123

Employee: employee@company.com / password123

✨ Features
🔒 Secure Attendance Tracking
Location-Verified Clock In/Out: Employees can only clock in when within designated work locations

Selfie Authentication: Facial recognition prevents buddy punching (placeholder implementation)

Real-time GPS Validation: Ensures employees are physically present at work sites

IP Address Tracking: Additional security layer for attendance records

📊 Advanced Management Dashboard
Role-based Access Control: Separate interfaces for Admin, Managers, and Employees

Department-wise Analytics: Track attendance patterns across organizational units

Real-time Monitoring: Live view of employee attendance status

Automated Timesheets: Generate and export attendance reports

Performance Metrics: Hours worked, punctuality, and attendance trends

🎯 Smart Notifications & Alerts
Shift Reminders: Automatic notifications before clock in/out times

Leave Status Updates: Real-time notification of leave application outcomes

Management Alerts: Instant notifications for attendance anomalies

Email Notifications: Automated email system for important updates

📅 Streamlined Leave Management
Digital Leave Applications: Employees apply directly through the app

Automated Workflow: Streamlined approval process for managers

Calendar Integration: Visual overview of team availability

Historical Tracking: Complete audit trail of all leave requests

Leave Balance Tracking: Automatic deduction and balance management

🛠️ Tech Stack
Frontend
Framework: Next.js 14 with App Router

Language: TypeScript

Styling: Tailwind CSS

State Management: React Context API

Forms: React Hook Form

HTTP Client: Axios

Real-time: Socket.io Client

Charts: Recharts

Date Handling: date-fns

Backend
Runtime: Node.js

Framework: Express.js

Database: MongoDB with Mongoose ODM

Authentication: JWT (JSON Web Tokens)

Security: bcryptjs for password hashing

Real-time: Socket.io

Validation: Custom middleware

CORS: Enabled for cross-origin requests

Deployment
Frontend: Vercel

Backend: Vercel

Database: MongoDB Atlas

Environment Variables: Vercel configuration

📁 Project Structure
text
smart-register/
├── backend/
│   ├── models/          # MongoDB data models
│   │   ├── User.js
│   │   ├── Company.js
│   │   ├── Department.js
│   │   ├── Attendance.js
│   │   └── Leave.js
│   ├── routes/          # Express route handlers
│   │   ├── auth.js
│   │   ├── attendance.js
│   │   ├── leave.js
│   │   ├── company.js
│   │   ├── department.js
│   │   └── user.js
│   ├── middleware/      # Custom middleware
│   │   ├── auth.js
│   │   └── validation.js
│   ├── config/          # Configuration files
│   │   ├── database.js
│   │   └── email.js
│   ├── server.js        # Main server file
│   ├── seed.js          # Database seeder
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/         # Next.js App Router
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   └── globals.css
│   │   ├── components/  # React components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── AttendanceClock.tsx
│   │   │   ├── LeaveApplication.tsx
│   │   │   ├── LeaveForm.tsx
│   │   │   └── StatsOverview.tsx
│   │   └── context/     # React context
│   │       └── AuthContext.tsx
│   ├── public/          # Static assets
│   ├── next.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── tsconfig.json
│   └── package.json
└── README.md
🚀 Quick Start
Prerequisites
Node.js 18+

MongoDB (local or MongoDB Atlas)

npm or yarn

Local Development
Clone the repository

bash
git clone https://github.com/yourusername/smart-register.git
cd smart-register
Backend Setup

bash
cd backend
npm install

# Configure environment variables
cp .env.example .env
# Edit .env with your configuration
Frontend Setup

bash
cd ../frontend
npm install

# Configure environment variables
cp .env.local.example .env.local
# Edit .env.local with your configuration
Database Setup

bash
# Start MongoDB locally or use MongoDB Atlas
# Seed the database with sample data
cd ../backend
npm run seed
Run the Application

bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
Access the Application

Frontend: http://localhost:3000

Backend API: http://localhost:5000/api/health

⚙️ Configuration
Backend Environment Variables (.env)
env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart-register
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d
NODE_ENV=development
Frontend Environment Variables (.env.local)
env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=Smart Register
📊 API Documentation
Authentication
POST /api/auth/login - User login

GET /api/auth/me - Get current user

PUT /api/auth/change-password - Change password

Attendance
POST /api/attendance/clock-in - Clock in with location verification

POST /api/attendance/clock-out - Clock out with location verification

GET /api/attendance/today - Get today's attendance record

GET /api/attendance/history - Get attendance history

Leave Management
POST /api/leave/apply - Apply for leave

GET /api/leave/my-leaves - Get user's leave history

GET /api/leave/pending - Get pending leaves (managers)

PUT /api/leave/:id/action - Approve/reject leave

User Management
GET /api/users - Get all users (admin/manager)

GET /api/users/profile - Get user profile

PUT /api/users/profile - Update user profile

POST /api/users - Create user (admin)

🎯 User Roles
👨‍💼 Admin
Full system access

Company and department management

User management and role assignment

System configuration

All reports and analytics

👩‍💼 Manager
Department management

Leave approval/rejection

Team attendance monitoring

Department reports

Employee management within department

👨‍💻 Employee
Personal attendance tracking

Leave applications

Personal dashboard and reports

Profile management

🚀 Deployment
Vercel Deployment
Backend Deployment

bash
cd backend
vercel --prod
Frontend Deployment

bash
cd frontend
vercel --prod
Environment Variables for Production
Backend (Vercel):

text
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_secure_production_jwt_secret
JWT_EXPIRES_IN=7d
NODE_ENV=production
Frontend (Vercel):

text
NEXT_PUBLIC_API_URL=https://your-backend-app.vercel.app/api
NEXT_PUBLIC_APP_NAME=Smart Register
🤝 Contributing
We welcome contributions! Please see our Contributing Guide for details.

Fork the repository

Create a feature branch (git checkout -b feature/amazing-feature)

Commit your changes (git commit -m 'Add some amazing feature')

Push to the branch (git push origin feature/amazing-feature)

Open a Pull Request

📝 License
This project is licensed under the MIT License - see the LICENSE file for details.

🆘 Support
📧 Email: support@smartregister.com

🐛 Issue Tracker

📚 Documentation

🔮 Roadmap
Mobile app development (React Native)

Advanced facial recognition integration

Biometric authentication

Advanced reporting and analytics

Integration with payroll systems

Multi-language support

Dark mode

Offline functionality

API rate limiting

Advanced security features

🙏 Acknowledgments
Next.js team for the amazing framework

MongoDB for the robust database solution

Vercel for seamless deployment

Tailwind CSS for the utility-first CSS framework

The open-source community for countless packages and tools

