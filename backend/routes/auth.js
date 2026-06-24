const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/db');
const { JWT_SECRET, authenticateToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post('/register',
    authLimiter,
    [
        body('nama').trim().notEmpty().withMessage('Nama wajib diisi.').isLength({ max: 100 }),
        body('email').trim().isEmail().withMessage('Format email tidak valid.').normalizeEmail(),
        body('password').isLength({ min: 6 }).withMessage('Password minimal 6 karakter.'),
        body('role').isIn(['owner', 'customer']).withMessage('Role harus customer atau owner.')
    ],
    async (req, res) => {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { nama, email, password, role } = req.body;

        try {
            // Check if user already exists
            const [existingUser] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
            if (existingUser.length > 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Email sudah terdaftar. Silakan gunakan email lain.' 
                });
            }

            // Hashing password
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            // Insert user
            const [result] = await pool.query(
                'INSERT INTO users (nama, email, password_hash, role) VALUES (?, ?, ?, ?)',
                [nama, email, passwordHash, role]
            );

            res.status(201).json({
                success: true,
                message: 'Pendaftaran berhasil.',
                data: {
                    userId: result.insertId,
                    nama,
                    email,
                    role
                }
            });
        } catch (error) {
            console.error('Registration Error:', error);
            res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem saat mendaftar.' });
        }
    }
);

/**
 * @route POST /api/auth/login
 * @desc Login user & return JWT token
 * @access Public
 */
router.post('/login',
    authLimiter,
    [
        body('email').trim().isEmail().withMessage('Format email tidak valid.'),
        body('password').notEmpty().withMessage('Password wajib diisi.')
    ],
    async (req, res) => {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            // Retrieve user
            const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
            if (users.length === 0) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Email atau password salah.' 
                });
            }

            const user = users[0];

            // Compare passwords
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                return res.status(401).json({ 
                    success: false, 
                    message: 'Email atau password salah.' 
                });
            }

            // Reject banned or anonymized accounts
            if (user.is_anonymized === 1) {
                return res.status(403).json({ success: false, message: 'Akun ini telah dihapus.' });
            }
            if (user.is_banned === 1) {
                return res.status(403).json({ success: false, message: 'Akun Anda telah diblokir oleh administrator. Hubungi dukungan untuk bantuan.' });
            }

            // Generate JWT payload
            const payload = {
                id: user.id,
                nama: user.nama,
                email: user.email,
                role: user.role
            };

            // Sign token
            const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

            res.json({
                success: true,
                message: 'Login berhasil.',
                token: token,
                user: {
                    id: user.id,
                    nama: user.nama,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            console.error('Login Error:', error);
            res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem saat login.' });
        }
    }
);

/**
 * @route GET /api/auth/me
 * @desc Get current logged-in user profile details
 * @access Private
 */
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, nama, email, role, created_at FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
        }
        res.json({ success: true, data: users[0] });
    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem saat mengambil profil.' });
    }
});

/**
 * @route POST /api/auth/change-password
 * @desc Change password of currently logged-in user
 * @access Private
 */
router.post('/change-password',
    authenticateToken,
    [
        body('oldPassword').notEmpty().withMessage('Password lama wajib diisi.'),
        body('newPassword').isLength({ min: 6 }).withMessage('Password baru minimal 6 karakter.')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { oldPassword, newPassword } = req.body;

        try {
            // Retrieve current password hash
            const [users] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
            if (users.length === 0) {
                return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
            }

            const user = users[0];

            // Compare passwords
            const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
            if (!isMatch) {
                return res.status(401).json({ success: false, message: 'Password lama Anda salah.' });
            }

            // Hash new password
            const salt = await bcrypt.genSalt(10);
            const newPasswordHash = await bcrypt.hash(newPassword, salt);

            // Update user password
            await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newPasswordHash, req.user.id]);

            res.json({ success: true, message: 'Password berhasil diubah.' });
        } catch (error) {
            console.error('Change Password Error:', error);
            res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem saat mengubah password.' });
        }
    }
);

/**
 * @route GET /api/auth/admin/users
 * @desc Get all users (Admin only)
 * @access Private (Admin Only)
 */
router.get('/admin/users',
    authenticateToken,
    async (req, res) => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Akses ditolak: hanya admin.' });
        }
        try {
            const [users] = await pool.query(
                `SELECT id, nama, email, role, is_kyc_verified, is_anonymized, is_banned, created_at,
                        (SELECT COUNT(*) FROM active_sessions WHERE user_id = users.id) AS session_count
                 FROM users
                 WHERE is_anonymized = 0
                 ORDER BY created_at DESC
                 LIMIT 500`
            );
            res.json({ success: true, count: users.length, data: users });
        } catch (err) {
            console.error('Admin Users Error:', err);
            res.status(500).json({ success: false, message: 'Gagal mengambil daftar pengguna.' });
        }
    }
);

/**
 * @route POST /api/auth/admin/users/:id/ban
 * @desc Toggle ban/unban a user (Admin only)
 * @access Private (Admin Only)
 */
router.post('/admin/users/:id/ban',
    authenticateToken,
    async (req, res) => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Akses ditolak: hanya admin.' });
        }
        const targetId = parseInt(req.params.id);
        if (targetId === req.user.id) {
            return res.status(400).json({ success: false, message: 'Admin tidak dapat memblokir akun sendiri.' });
        }
        try {
            const [rows] = await pool.query('SELECT role, is_anonymized FROM users WHERE id = ?', [targetId]);
            if (rows.length === 0 || rows[0].is_anonymized === 1) {
                return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan atau sudah dihapus.' });
            }
            if (rows[0].role === 'admin') {
                return res.status(403).json({ success: false, message: 'Admin tidak dapat memblokir admin lain.' });
            }
            const { action } = req.body; // 'ban' or 'unban'
            await pool.query('UPDATE users SET is_banned = ? WHERE id = ?', [action === 'ban' ? 1 : 0, targetId]);
            res.json({ success: true, message: action === 'ban' ? 'Pengguna berhasil diblokir.' : 'Blokir pengguna berhasil dibuka.' });
        } catch (err) {
            console.error('Admin Ban User Error:', err);
            res.status(500).json({ success: false, message: 'Gagal memperbarui status pengguna.' });
        }
    }
);

/**
 * @route POST /api/auth/admin/users/:id/verify-kyc
 * @desc Verify or reject KYC for an owner (Admin only)
 * @access Private (Admin Only)
 */
router.post('/admin/users/:id/verify-kyc',
    authenticateToken,
    async (req, res) => {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Akses ditolak: hanya admin.' });
        }
        const targetId = parseInt(req.params.id);
        const { approved } = req.body; // boolean
        try {
            const [rows] = await pool.query('SELECT role FROM users WHERE id = ?', [targetId]);
            if (rows.length === 0) {
                return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
            }
            await pool.query('UPDATE users SET is_kyc_verified = ? WHERE id = ?', [approved ? 1 : 0, targetId]);
            res.json({ success: true, message: approved ? 'KYC berhasil diverifikasi.' : 'KYC ditolak.' });
        } catch (err) {
            console.error('Admin Verify KYC Error:', err);
            res.status(500).json({ success: false, message: 'Gagal memverifikasi KYC pengguna.' });
        }
    }
);

module.exports = router;
