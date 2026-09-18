/**
 * ExamGen AI Pro - Backend Server
 * Entry point: loads environment, connects DB, registers all routes
 */

require('dotenv').config();
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Connect to MongoDB
connectDB();

const app = express();

// ─── Core Middleware ─────────────────────────────────────────────────────────

// Parse JSON bodies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS: allow requests from React frontend
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// Serve uploaded files statically (for PDFs)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─── API Routes ──────────────────────────────────────────────────────────────

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/tests',     require('./routes/tests'));
app.use('/api/results',   require('./routes/results'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/assistant', require('./routes/assistant'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/learning',    require('./routes/learning'));
app.use('/api/interview',   require('./routes/interview'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ExamGen AI Pro API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ─── Error Handling ──────────────────────────────────────────────────────────

app.use(notFound);      // 404 for unknown routes
app.use(errorHandler);  // Global error handler

// ─── Start Server ────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 ExamGen AI Pro server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health\n`);
});
