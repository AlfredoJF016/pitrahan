const rateLimit = require('express-rate-limit');

// Limiter for authentication endpoints (login, register)
// Max 5 attempts per 15 minutes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    message: {
        success: false,
        message: 'Terlalu banyak percobaan masuk/daftar. Silakan coba lagi setelah 15 menit.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false,  // Disable the `X-RateLimit-*` headers
});

// Limiter for booking submission endpoints
// Max 10 bookings per hour per IP to prevent spamming
const bookingLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: {
        success: false,
        message: 'Batas pemesanan terlampaui. Anda hanya diperbolehkan membuat 10 pesanan per jam.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    authLimiter,
    bookingLimiter
};
