require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/database');

// Route imports
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');
const leaveRoutes = require('./routes/leave');
const companyRoutes = require('./routes/company');
const departmentRoutes = require('./routes/department');
const userRoutes = require('./routes/user');

// Initialize Express
const app = express();

// Connect to Database
connectDB();

// FIXED CORS CONFIGURATION - This will definitely work
const allowedOrigins = [
  'https://smart-register-ten.vercel.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

// SIMPLE CORS that always works
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests explicitly
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/company', companyRoutes);
app.use('/api/department', departmentRoutes);
app.use('/api/users', userRoutes);

// Basic route for testing
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true,
    message: 'Smart Register API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    cors: 'Enabled for all frontend URLs'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error stack:', err.stack);
  
  // Handle CORS errors specifically
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ 
      success: false,
      error: 'CORS Error: Origin not allowed'
    });
  }
  
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({ 
      success: false,
      error: 'Validation Error',
      details: messages 
    });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({ 
      success: false,
      error: 'Invalid ID format' 
    });
  }
  
  res.status(500).json({ 
    success: false,
    error: 'Internal server error' 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found' 
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
  console.log(`🌐 CORS Enabled for:`, allowedOrigins);
});

// Socket.io setup for real-time features
const io = require('socket.io')(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-company', (companyId) => {
    socket.join(companyId);
    console.log(`User ${socket.id} joined company ${companyId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Make io accessible to our routes
app.set('io', io);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});