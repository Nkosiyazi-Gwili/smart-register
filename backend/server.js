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

// CORS Configuration
const allowedOrigins = [
  'https://smart-register-ten.vercel.app',
  'http://localhost:3000',
];

app.use(cors({
  origin: allowedOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
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

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Smart Register Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});
// Add this to your auth routes
router.get('/health-check', async (req, res) => {
  try {
    console.log('🏥 Health check called');
    
    // Test database connection by counting users
    const userCount = await User.countDocuments();
    console.log('📊 User count:', userCount);
    
    // Test if we can find the admin user
    const adminUser = await User.findOne({ email: 'admin@eskilzcollege.co.za' });
    console.log('👤 Admin user exists:', !!adminUser);
    
    if (adminUser) {
      console.log('📧 Admin email:', adminUser.email);
      console.log('🔐 Admin password hash exists:', !!adminUser.password);
      console.log('📏 Password hash length:', adminUser.password?.length);
      console.log('🔑 Password hash prefix:', adminUser.password?.substring(0, 30) + '...');
    }
    
    res.json({
      success: true,
      database: 'Connected',
      userCount,
      adminUserExists: !!adminUser,
      adminUserEmail: adminUser?.email,
      adminUserStatus: adminUser?.status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('💥 Health check error:', error);
    res.json({
      success: false,
      database: 'Error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});
// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true,
    message: 'Smart Register API is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Debug endpoint
app.get('/api/debug', (req, res) => {
  res.json({
    success: true,
    cors: {
      allowedOrigins: allowedOrigins,
      currentOrigin: req.headers.origin,
      isAllowed: allowedOrigins.includes(req.headers.origin)
    },
    environment: process.env.NODE_ENV
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false,
    error: 'Route not found',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Socket.io
const io = require('socket.io')(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
});

app.set('io', io);