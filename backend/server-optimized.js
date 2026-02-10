const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();

// ============================================
// OPTIMIZATION 1: Create uploads directory
// ============================================
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('✅ Created uploads directory');
}

// ============================================
// OPTIMIZATION 2: Security middleware
// ============================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// ============================================
// OPTIMIZATION 3: Development-friendly rate limiting
// ============================================
const limiter = rateLimit({
  windowMs: process.env.NODE_ENV === 'production' ? 15 * 60 * 1000 : 60 * 60 * 1000, // 15 min prod, 1 hour dev
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 100 prod, 1000 dev
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// ============================================
// OPTIMIZATION 4: Body parsing with size limits
// ============================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use('/uploads', express.static(uploadsDir));

// ============================================
// OPTIMIZATION 5: MongoDB connection with retry logic
// ============================================
const connectDB = async (retries = 5) => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hospital_management';
  
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(mongoURI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      
      console.log('✅ Connected to MongoDB');
      console.log(`   Database: ${mongoose.connection.name}`);
      console.log(`   Host: ${mongoose.connection.host}`);
      return;
      
    } catch (err) {
      console.error(`❌ MongoDB connection attempt ${i + 1}/${retries} failed:`, err.message);
      
      if (i === retries - 1) {
        console.error('❌ Could not connect to MongoDB after multiple attempts');
        console.error('   Please ensure MongoDB is running:');
        console.error('   - Docker: docker-compose up -d mongodb');
        console.error('   - Local: Start MongoDB service');
        process.exit(1);
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
};

// ============================================
// OPTIMIZATION 6: Graceful MongoDB event handling
// ============================================
mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
});

mongoose.connection.on('reconnected', () => {
  console.log('✅ MongoDB reconnected');
});

// ============================================
// OPTIMIZATION 7: Routes with error handling
// ============================================
const registerRoutes = () => {
  try {
    app.use('/api/auth', require('./routes/auth'));
    console.log('✅ Auth routes loaded');
  } catch (err) {
    console.error('❌ Error loading auth routes:', err.message);
  }

  try {
    app.use('/api/patients', require('./routes/patients'));
    console.log('✅ Patients routes loaded');
  } catch (err) {
    console.error('❌ Error loading patients routes:', err.message);
  }

  try {
    app.use('/api/doctors', require('./routes/doctors'));
    console.log('✅ Doctors routes loaded');
  } catch (err) {
    console.error('❌ Error loading doctors routes:', err.message);
  }

  try {
    app.use('/api/doctor', require('./routes/doctor'));
    console.log('✅ Doctor dashboard routes loaded');
  } catch (err) {
    console.error('❌ Error loading doctor dashboard routes:', err.message);
  }

  try {
    app.use('/api/patient-records', require('./routes/patientRecords'));
    console.log('✅ Patient records routes loaded');
  } catch (err) {
    console.error('❌ Error loading patient records routes:', err.message);
  }

  try {
    app.use('/api/appointments', require('./routes/appointments'));
    console.log('✅ Appointments routes loaded');
  } catch (err) {
    console.error('❌ Error loading appointments routes:', err.message);
  }

  try {
    app.use('/api/beds', require('./routes/beds'));
    console.log('✅ Beds routes loaded');
  } catch (err) {
    console.error('❌ Error loading beds routes:', err.message);
  }

  try {
    app.use('/api/nurses', require('./routes/nurses'));
    console.log('✅ Nurses routes loaded');
  } catch (err) {
    console.error('❌ Error loading nurses routes:', err.message);
  }

  try {
    app.use('/api/inventory', require('./routes/inventory'));
    console.log('✅ Inventory routes loaded');
  } catch (err) {
    console.error('❌ Error loading inventory routes:', err.message);
  }

  try {
    app.use('/api/billing', require('./routes/billing'));
    console.log('✅ Billing routes loaded');
  } catch (err) {
    console.error('❌ Error loading billing routes:', err.message);
  }

  try {
    app.use('/api/ml', require('./routes/ml'));
    console.log('✅ ML routes loaded');
  } catch (err) {
    console.error('❌ Error loading ML routes:', err.message);
  }

  try {
    app.use('/api/reports', require('./routes/reports'));
    console.log('✅ Reports routes loaded');
  } catch (err) {
    console.error('❌ Error loading reports routes:', err.message);
  }

  try {
    app.use('/api/attendance', require('./routes/attendance'));
    console.log('✅ Attendance routes loaded');
  } catch (err) {
    console.error('❌ Error loading attendance routes:', err.message);
  }

  try {
    app.use('/api/admin/staff', require('./routes/admin_staff'));
    console.log('✅ Staff management routes loaded');
  } catch (err) {
    console.error('❌ Error loading staff management routes:', err.message);
  }
};

// ============================================
// OPTIMIZATION 8: Swagger documentation (optional)
// ============================================
try {
  const swaggerJsdoc = require('swagger-jsdoc');
  const swaggerUi = require('swagger-ui-express');

  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Hospital Management API',
        version: '1.0.0',
        description: 'API for Hospital Management System with ML',
      },
      servers: [
        {
          url: process.env.API_URL || 'http://localhost:5000',
        },
      ],
    },
    apis: ['./routes/*.js'],
  };

  const specs = swaggerJsdoc(options);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
  console.log('✅ Swagger documentation enabled');
} catch (err) {
  console.warn('⚠️  Swagger documentation not available:', err.message);
}

// ============================================
// OPTIMIZATION 9: Enhanced health check
// ============================================
app.get('/health', (req, res) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: {
      connected: mongoose.connection.readyState === 1,
      state: ['disconnected', 'connected', 'connecting', 'disconnecting'][mongoose.connection.readyState],
      name: mongoose.connection.name || 'N/A'
    },
    memory: {
      used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`
    }
  };

  const statusCode = health.database.connected ? 200 : 503;
  res.status(statusCode).json(health);
});

// ============================================
// OPTIMIZATION 10: Better error handling
// ============================================
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  
  // Don't leak error details in production
  const errorResponse = {
    message: err.message || 'Something went wrong!',
    status: err.status || 500,
    timestamp: new Date().toISOString()
  };

  if (process.env.NODE_ENV !== 'production') {
    errorResponse.stack = err.stack;
    errorResponse.details = err;
  }

  res.status(errorResponse.status).json(errorResponse);
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// ============================================
// OPTIMIZATION 11: Graceful shutdown
// ============================================
const gracefulShutdown = async (signal) => {
  console.log(`\n⚠️  ${signal} received. Starting graceful shutdown...`);
  
  try {
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ============================================
// START SERVER
// ============================================
const startServer = async () => {
  console.log('\n🏥 Hospital Management System - Backend Server');
  console.log('================================================\n');

  // Connect to database
  await connectDB();

  // Register routes
  registerRoutes();

  // Start listening
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log('\n✅ Server started successfully!');
    console.log(`   Port: ${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Health check: http://localhost:${PORT}/health`);
    console.log(`   API docs: http://localhost:${PORT}/api-docs`);
    console.log('\n================================================\n');
  });
};

// Start the server
startServer().catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});

module.exports = app;
