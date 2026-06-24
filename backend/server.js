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

// Trust Vercel proxy for express-rate-limit IP detection
app.set('trust proxy', 1);

// Route prefix cleanup middleware for Vercel routing fallback
app.use((req, res, next) => {
    if (req.url.startsWith('/_/backend')) {
        req.url = req.url.replace('/_/backend', '');
    }
    next();
});

// Connect and verify DB (only in non-serverless env or on first cold start)
checkConnection();

// ── Allowed Origins ──────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173'];

// Global Security Middlewares
app.use(helmet()); // Adds various HTTP headers for XSS, Clickjacking protection
app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (e.g. mobile apps, curl, Vercel internal)
        if (!origin) return callback(null, true);
        // Allow wildcard '*'
        if (allowedOrigins.includes('*')) return callback(null, true);
        // Allow explicitly listed origins
        if (allowedOrigins.includes(origin)) return callback(null, true);
        // Allow ALL *.vercel.app subdomains (covers preview & production URLs)
        if (/^https:\/\/.*\.vercel\.app$/i.test(origin)) return callback(null, true);
        // Allow localhost on any port for local development
        if (/^http:\/\/localhost(:\d+)?$/.test(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Input sanitization constraints: allow larger payloads for base64 image proofs
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Health Check API ─────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Server piTrahan dalam keadaan aktif dan sehat.' });
});

// ── Cron Endpoint (Vercel Cron Job — runs every 15 minutes) ─────────────────
// Replaces setInterval which is not supported in Vercel serverless environment
app.get('/api/cron/cancel-expired', async (req, res) => {
    // Basic security: only allow Vercel Cron or internal calls
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
        const authHeader = req.headers['authorization'];
        if (authHeader !== `Bearer ${cronSecret}`) {
            return res.status(401).json({ success: false, message: 'Unauthorized cron call.' });
        }
    }

    try {
        await autoCancelExpiredBookings();
        res.json({ success: true, message: 'Auto-cancel check selesai.' });
    } catch (err) {
        console.error('[piTrahan Cron] Error:', err);
        res.status(500).json({ success: false, message: 'Cron job gagal dijalankan.' });
    }
});

// ── Mount Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/profile', profileRoutes);

// ── 404 Route handler ────────────────────────────────────────────────────────
app.use((req, res, next) => {
    res.status(404).json({ success: false, message: 'Resource tidak ditemukan.' });
});

// ── Centralized error handling middleware ────────────────────────────────────
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err.stack);

    res.status(err.status || 500).json({
        success: false,
        message: process.env.NODE_ENV === 'production'
            ? 'Terjadi kesalahan sistem internal.'
            : err.message
    });
});

// ── Start Server (always except in test environments and Vercel) ──────────────
if (process.env.NODE_ENV !== 'test' && !process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);

        // Auto-cancel TTL checker setup
        setInterval(async () => {
            try {
                await autoCancelExpiredBookings();
            } catch (err) {
                console.error('[piTrahan Scheduler] Error executing autoCancelExpiredBookings:', err);
            }
        }, 30000); // 30 seconds
    });
}

// ── Export app for Vercel Serverless Function ────────────────────────────────
module.exports = app;
