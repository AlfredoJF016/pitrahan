const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/db');
const { JWT_SECRET } = require('../middleware/auth');
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

module.exports = router;
