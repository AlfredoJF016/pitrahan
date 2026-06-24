const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// Helper to log user activity in MySQL
async function dbLogActivity(userId, email, action, details, userAgent = null, ipAddress = null, status = 'success') {
    try {
        await pool.query(
            `INSERT INTO user_activity_logs (user_id, email, action, details, user_agent, ip_address, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [userId, email, action, details, userAgent, ipAddress, status]
        );
    } catch (err) {
        console.error('Failed to write activity log to DB:', err);
    }
}

/**
 * @route GET /api/profile/me
 * @desc Get detailed profile information (including KYC and store details)
 * @access Private
 */
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const [users] = await pool.query(
            `SELECT id, nama, email, role, avatar_url, no_telepon, kyc_doc_url, is_kyc_verified, is_anonymized, created_at 
             FROM users WHERE id = ?`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
        }

        const user = users[0];

        // If user is owner, also fetch store info
        if (user.role === 'owner') {
            const [stores] = await pool.query(
                `SELECT nama_toko AS nama_usaha, alamat AS alamat_toko, gps_latitude AS shop_lat, gps_longitude AS shop_lng 
                 FROM rentals_stores WHERE owner_id = ?`,
                [user.id]
            );
            if (stores.length > 0) {
                Object.assign(user, stores[0]);
            }
        }

        res.json({ success: true, data: user });
    } catch (error) {
        console.error('GET /profile/me error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil data profil.' });
    }
});

/**
 * @route PUT /api/profile/update
 * @desc Update account details
 * @access Private
 */
router.put('/update',
    authenticateToken,
    [
        body('nama').trim().notEmpty().withMessage('Nama tidak boleh kosong.').isLength({ min: 2, max: 100 }),
        body('email').trim().isEmail().withMessage('Format email tidak valid.').normalizeEmail(),
        body('no_telepon').optional({ nullable: true, checkFalsy: true }).custom(v => {
            const clean = v.replace(/\s|-/g, '');
            if (!/^(\+62|62|0)8[1-9][0-9]{6,11}$/.test(clean)) {
                throw new Error('Nomor WhatsApp Indonesia tidak valid (contoh: 081234567890).');
            }
            return true;
        })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { nama, email, no_telepon, avatar_url, nama_usaha, alamat_toko, shop_lat, shop_lng } = req.body;
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // 1. Check if email is already in use by another user
            const [existing] = await connection.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, req.user.id]);
            if (existing.length > 0) {
                await connection.rollback();
                return res.status(400).json({ success: false, message: 'Email sudah terdaftar pada akun lain.' });
            }

            // 2. Update users table
            await connection.query(
                `UPDATE users 
                 SET nama = ?, email = ?, no_telepon = ?, avatar_url = ? 
                 WHERE id = ?`,
                [nama, email, no_telepon || null, avatar_url || null, req.user.id]
            );

            // 3. Update rentals_stores table if owner
            if (req.user.role === 'owner') {
                // Check if store already exists
                const [stores] = await connection.query('SELECT id FROM rentals_stores WHERE owner_id = ?', [req.user.id]);
                if (stores.length > 0) {
                    await connection.query(
                        `UPDATE rentals_stores 
                         SET nama_toko = ?, alamat = ?, gps_latitude = ?, gps_longitude = ? 
                         WHERE owner_id = ?`,
                        [nama_usaha || '', alamat_toko || '', shop_lat || null, shop_lng || null, req.user.id]
                    );
                } else {
                    await connection.query(
                        `INSERT INTO rentals_stores (owner_id, nama_toko, alamat, no_telepon, gps_latitude, gps_longitude) 
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [req.user.id, nama_usaha || '', alamat_toko || '', no_telepon || '', shop_lat || null, shop_lng || null]
                    );
                }
            }

            await connection.commit();

            // Log activity
            await dbLogActivity(
                req.user.id,
                email,
                'UPDATE_PROFIL',
                'Memperbarui informasi pribadi dan detail akun.',
                req.headers['user-agent'],
                req.ip
            );

            res.json({ success: true, message: 'Profil berhasil diperbarui.' });
        } catch (error) {
            await connection.rollback();
            console.error('PUT /profile/update error:', error);
            res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem saat memperbarui profil.' });
        } finally {
            connection.release();
        }
    }
);

/**
 * @route PUT /api/profile/change-password
 * @desc Change password of currently logged-in user
 * @access Private
 */
router.put('/change-password',
    authenticateToken,
    authLimiter,
    [
        body('oldPassword').notEmpty().withMessage('Password lama wajib diisi.'),
        body('newPassword').isLength({ min: 8 }).withMessage('Password baru minimal 8 karakter.')
            .custom(v => {
                let strength = 0;
                if (/[A-Z]/.test(v)) strength++;
                if (/[0-9]/.test(v)) strength++;
                if (/[^A-Za-z0-9]/.test(v)) strength++;
                if (strength < 1) { // Requires at least one uppercase, number, or symbol to be score >= 2
                    throw new Error('Password baru terlalu lemah. Tambahkan huruf kapital, angka, atau simbol.');
                }
                return true;
            })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { oldPassword, newPassword } = req.body;

        try {
            const [users] = await pool.query('SELECT email, password_hash FROM users WHERE id = ?', [req.user.id]);
            if (users.length === 0) {
                return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
            }

            const user = users[0];

            const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
            if (!isMatch) {
                await dbLogActivity(req.user.id, user.email, 'UBAH_PASSWORD', 'Gagal mengubah kata sandi: kata sandi lama salah.', req.headers['user-agent'], req.ip, 'failed');
                return res.status(401).json({ success: false, message: 'Password lama Anda salah.' });
            }

            const salt = await bcrypt.genSalt(10);
            const newPasswordHash = await bcrypt.hash(newPassword, salt);

            await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [newPasswordHash, req.user.id]);

            await dbLogActivity(req.user.id, user.email, 'UBAH_PASSWORD', 'Berhasil mengubah kata sandi akun.', req.headers['user-agent'], req.ip);

            res.json({ success: true, message: 'Kata sandi berhasil diperbarui.' });
        } catch (error) {
            console.error('PUT /profile/change-password error:', error);
            res.status(500).json({ success: false, message: 'Gagal memperbarui kata sandi.' });
        }
    }
);

/**
 * @route POST /api/profile/revoke-sessions
 * @desc Revoke all JWT sessions for this user (logs out all devices)
 * @access Private
 */
router.post('/revoke-sessions', authenticateToken, async (req, res) => {
    try {
        // In JWT session blacklist architecture, we insert a blacklist or wipe active sessions
        await pool.query('DELETE FROM active_sessions WHERE user_id = ?', [req.user.id]);

        await dbLogActivity(
            req.user.id,
            req.user.email,
            'REVOKE_SESSIONS',
            'Semua sesi aktif dicabut dari seluruh perangkat.',
            req.headers['user-agent'],
            req.ip
        );

        res.json({ success: true, message: 'Seluruh sesi berhasil dicabut.' });
    } catch (error) {
        console.error('POST /profile/revoke-sessions error:', error);
        res.status(500).json({ success: false, message: 'Gagal mencabut sesi.' });
    }
});

/**
 * @route POST /api/profile/kyc-upload
 * @desc Upload KYC Document (base64 DataURL or file)
 * @access Private
 */
router.post('/kyc-upload',
    authenticateToken,
    [
        body('kyc_doc').notEmpty().withMessage('File dokumen identitas wajib dilampirkan.')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { kyc_doc } = req.body;

        try {
            // Check size if passed as base64 (approx. character count * 0.75 bytes)
            const approxBytes = kyc_doc.length * 0.75;
            if (approxBytes > 5 * 1024 * 1024) {
                return res.status(400).json({ success: false, message: 'Dokumen terlalu besar (maksimal 5 MB).' });
            }

            await pool.query(
                'UPDATE users SET kyc_doc_url = ?, is_kyc_verified = 0 WHERE id = ?',
                [kyc_doc, req.user.id]
            );

            await dbLogActivity(
                req.user.id,
                req.user.email,
                'KYC_UPLOAD',
                'Mengunggah dokumen identitas untuk verifikasi KYC (Menunggu Review).',
                req.headers['user-agent'],
                req.ip
            );

            res.json({ success: true, message: 'Dokumen KYC berhasil diunggah. Menunggu verifikasi admin.' });
        } catch (error) {
            console.error('POST /profile/kyc-upload error:', error);
            res.status(500).json({ success: false, message: 'Gagal mengunggah dokumen KYC.' });
        }
    }
);

/**
 * @route POST /api/profile/export-data
 * @desc Export all user data (GDPR / UU PDP compliance)
 * @access Private
 */
router.post('/export-data', authenticateToken, async (req, res) => {
    try {
        // 1. Get profile data
        const [users] = await pool.query(
            `SELECT id, nama, email, role, avatar_url, no_telepon, is_kyc_verified, created_at 
             FROM users WHERE id = ?`,
            [req.user.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
        }

        const user = users[0];

        // Fetch store details if owner
        if (user.role === 'owner') {
            const [stores] = await pool.query(
                `SELECT nama_toko, alamat, no_telepon, gps_latitude, gps_longitude FROM rentals_stores WHERE owner_id = ?`,
                [user.id]
            );
            if (stores.length > 0) user.store_info = stores[0];
        }

        // 2. Get booking history
        const [bookings] = await pool.query(
            `SELECT kode_booking, tanggal_ambil, durasi_sewa, total_harga, metode_pembayaran, status_booking, created_at 
             FROM bookings WHERE customer_id = ? ORDER BY id DESC`,
            [user.id]
        );

        // 3. Get activity log
        const [logs] = await pool.query(
            `SELECT action, details, status, timestamp FROM user_activity_logs WHERE user_id = ? ORDER BY id DESC`,
            [user.id]
        );

        const exportPayload = {
            exported_at: new Date().toISOString(),
            platform: 'piTrahan – Yogyakarta Bike Rental',
            profile: {
                nama: user.nama,
                email: user.email,
                no_telepon: user.no_telepon,
                role: user.role,
                joined: user.created_at,
                is_kyc_verified: !!user.is_kyc_verified
            },
            bookings: bookings.map(b => ({
                kode_booking: b.kode_booking,
                tanggal_ambil: b.tanggal_ambil,
                durasi_sewa: b.durasi_sewa,
                total_harga: b.total_harga,
                status: b.status_booking,
                metode_pembayaran: b.metode_pembayaran,
                created_at: b.created_at
            })),
            activity_log: logs.map(l => ({
                action: l.action,
                details: l.details,
                status: l.status,
                timestamp: l.timestamp
            }))
        };

        await dbLogActivity(
            req.user.id,
            req.user.email,
            'EXPORT_DATA',
            'Mengekspor salinan data pribadi (GDPR & UU PDP).',
            req.headers['user-agent'],
            req.ip
        );

        res.json({ success: true, data: exportPayload });
    } catch (error) {
        console.error('POST /profile/export-data error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengekspor data pribadi.' });
    }
});

/**
 * @route DELETE /api/profile/delete-account
 * @desc Anonymize user account (GDPR Permanent Account Delete)
 * @access Private
 */
router.delete('/delete-account',
    authenticateToken,
    [
        body('password').notEmpty().withMessage('Password konfirmasi wajib diisi.')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { password } = req.body;

        try {
            // Retrieve current password hash
            const [users] = await pool.query('SELECT email, password_hash FROM users WHERE id = ?', [req.user.id]);
            if (users.length === 0) {
                return res.status(404).json({ success: false, message: 'Pengguna tidak ditemukan.' });
            }

            const user = users[0];

            // Compare passwords
            const isMatch = await bcrypt.compare(password, user.password_hash);
            if (!isMatch) {
                await dbLogActivity(req.user.id, user.email, 'DELETE_ACCOUNT', 'Gagal menghapus akun: password salah.', req.headers['user-agent'], req.ip, 'failed');
                return res.status(401).json({ success: false, message: 'Konfirmasi password salah.' });
            }

            // Anonymize personal details (do not hard-delete to maintain database integrity of existing bookings)
            const anonymousEmail = `deleted_u${req.user.id}@removed.com`;
            const anonymousName = '[Akun Dihapus]';
            const anonymousPassHash = await bcrypt.hash(Math.random().toString(36).substring(2, 12), 10); // Random junk password

            await pool.query(
                `UPDATE users 
                 SET nama = ?, email = ?, password_hash = ?, avatar_url = NULL, no_telepon = NULL, kyc_doc_url = NULL, is_kyc_verified = 0, is_anonymized = 1, anonymized_at = NOW() 
                 WHERE id = ?`,
                [anonymousName, anonymousEmail, anonymousPassHash, req.user.id]
            );

            // If user was owner, also wipe store details
            if (req.user.role === 'owner') {
                await pool.query(
                    `UPDATE rentals_stores SET nama_toko = '[Toko Dihapus]', alamat = '[N/A]', no_telepon = '[N/A]', gps_latitude = NULL, gps_longitude = NULL WHERE owner_id = ?`,
                    [req.user.id]
                );
            }

            // Wipe sessions
            await pool.query('DELETE FROM active_sessions WHERE user_id = ?', [req.user.id]);

            await dbLogActivity(
                null, // user_id is now NULL
                user.email, // original email for trace audit log
                'DELETE_ACCOUNT',
                `Akun ${user.email} telah dianonimkan secara permanen.`,
                req.headers['user-agent'],
                req.ip
            );

            res.json({ success: true, message: 'Akun berhasil dihapus secara permanen.' });
        } catch (error) {
            console.error('DELETE /profile/delete-account error:', error);
            res.status(500).json({ success: false, message: 'Gagal menghapus akun secara permanen.' });
        }
    }
);

/**
 * @route GET /api/profile/activity-logs
 * @desc Get security/activity logs for currently logged-in user
 * @access Private
 */
router.get('/activity-logs', authenticateToken, async (req, res) => {
    try {
        const [logs] = await pool.query(
            `SELECT action, details, status, timestamp 
             FROM user_activity_logs 
             WHERE user_id = ? OR email = ? 
             ORDER BY id DESC LIMIT 100`,
            [req.user.id, req.user.email]
        );
        res.json({ success: true, data: logs });
    } catch (error) {
        console.error('GET /profile/activity-logs error:', error);
        res.status(500).json({ success: false, message: 'Gagal mengambil log aktivitas.' });
    }
});

module.exports = router;
