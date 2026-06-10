const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'piTrahanSuperSecretKey123!';

/**
 * Middleware to authenticate user JWT tokens
 */
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Akses ditolak: Token autentikasi tidak tersedia.' 
        });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ 
                success: false, 
                message: 'Akses ditolak: Token tidak valid atau kedaluwarsa.' 
            });
        }
        req.user = user;
        next();
    });
}

/**
 * Middleware to enforce Role-Based Access Control (RBAC)
 * @param {string[]} allowedRoles - List of roles permitted to access the route
 */
function requireRole(allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Akses ditolak: Autentikasi diperlukan.' 
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: `Akses ditolak: Peran '${req.user.role}' tidak memiliki izin untuk mengakses resource ini.` 
            });
        }

        next();
    };
}

module.exports = {
    authenticateToken,
    requireRole,
    JWT_SECRET
};
