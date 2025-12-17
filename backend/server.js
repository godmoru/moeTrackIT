const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
require('dotenv').config();

const { sequelize } = require('./models');
const errorHandler = require('./src/middleware/errorHandler');
const { auditLogger } = require('./src/middleware/auditLogger');

// Import routes

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));
app.use(compression());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/v1/health', (_, res) => {
  res.json({ 
    status: 'The moeTrackIT Revenue Monitoring backend is running healthy and ready!🚀', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    uptime: process.uptime()
  });
});



// Audit logging middleware (logs mutating operations)
app.use(auditLogger);

// API routes (versioned)
app.use('/api/v1', require('./src/routes/v1'));


// Error handling
app.use(errorHandler);

// Database connection and server start
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Sync models in development (use migrations in production)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: false });
      console.log('✅ Database models synchronized.');
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
};

startServer();
