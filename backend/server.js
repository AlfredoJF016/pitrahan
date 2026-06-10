const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { checkConnection } = require('./config/db');
const authRoutes = require('./routes/auth');
const bookingRoutes = require('./routes/bookings');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect and verify DB
checkConnection();

// Global Security Middlewares
app.use(helmet()); // Adds various HTTP headers for XSS, Clickjacking protection
app.use(cors({
    origin: process.env.CLIENT_URL || '*', // Restrict to trusted client URL in production
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Input sanitization constraints: prevent payload injection attacks (limiting body size)
app.use(express.json({ limit: '10kb' })); // Prevents massive payload DOS
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Health Check API
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Server piTrahan dalam keadaan aktif dan sehat.' });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);

// 404 Route handler
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'Resource tidak ditemukan.' });
});

// Centralized error handling middleware (prevents stacktrace leakage to users)
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err.stack);
    
    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'production' 
            ? 'Terjadi kesalahan sistem internal.' 
            : err.message
    });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
});
