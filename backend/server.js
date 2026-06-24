const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { checkConnection } = require('./config/db');
const authRoutes = require('./routes/auth');
const { router: bookingRoutes, autoCancelExpiredBookings } = require('./routes/bookings');
const profileRoutes = require('./routes/profile');
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

// Input sanitization constraints: allow larger payloads for base64 image proofs
app.use(express.json({ limit: '10mb' })); 
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check API
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Server piTrahan dalam keadaan aktif dan sehat.' });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/profile', profileRoutes);

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

// Start Server & TTL Auto-cancel checker interval (every 30 seconds)
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
    
    // Auto-cancel TTL checker setup
    if (process.env.NODE_ENV !== 'test') {
        setInterval(async () => {
            try {
                await autoCancelExpiredBookings();
            } catch (err) {
                console.error('[piTrahan Scheduler] Error executing autoCancelExpiredBookings:', err);
            }
        }, 30000); // 30 seconds
    }
});
