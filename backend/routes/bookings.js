const express = require('express');
const router = express.Router();
const { body, query, validationResult } = require('express-validator');
const { pool } = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { bookingLimiter } = require('../middleware/rateLimiter');
const { generateBookingCode } = require('../utils/bookingGenerator');

/**
 * Helper middleware to optionally authenticate users (allowing guest bookings)
 */
function optionalAuthenticate(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return next(); // Proceed as guest
    }
    
    const { JWT_SECRET } = require('../middleware/auth');
    const jwt = require('jsonwebtoken');
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (!err) {
            req.user = user;
        }
        next(); // Proceed regardless of token validity, but with req.user populated if valid
    });
}

/**
 * @route GET /api/bookings/bikes
 * @desc Get available bikes with tabs, location search, and price range filters
 * @access Public
 */
router.get('/bikes', [
    query('jenis_sepeda').optional().isIn(['gunung', 'lipat', 'onthel', 'city_bike']),
    query('status_ketersediaan').optional().isIn(['tersedia', 'disewa', 'servis']),
    query('search').optional().trim().escape(),
    query('max_harga').optional().isFloat({ min: 0 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { jenis_sepeda, status_ketersediaan, search, max_harga } = req.query;
    
    let sql = `
        SELECT b.*, s.nama_toko, s.alamat as alamat_toko, s.no_telepon as telp_toko
        FROM bikes b
        JOIN rentals_stores s ON b.store_id = s.id
        WHERE 1 = 1
    `;
    const params = [];

    if (jenis_sepeda) {
        sql += ` AND b.jenis_sepeda = ?`;
        params.push(jenis_sepeda);
    }
    if (status_ketersediaan) {
        sql += ` AND b.status_ketersediaan = ?`;
        params.push(status_ketersediaan);
    } else {
        // By default for customer catalog, show only available or recently occupied
        sql += ` AND b.status_ketersediaan != 'servis'`;
    }
    if (search) {
        sql += ` AND (b.nama_sepeda LIKE ? OR s.nama_toko LIKE ? OR s.alamat LIKE ?)`;
        const wild = `%${search}%`;
        params.push(wild, wild, wild);
    }
    if (max_harga) {
        sql += ` AND b.harga_per_hari <= ?`;
        params.push(parseFloat(max_harga));
    }

    try {
        const [bikes] = await pool.query(sql, params);
        res.json({ success: true, count: bikes.length, data: bikes });
    } catch (err) {
        console.error('Fetch Bikes Error:', err);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem saat mencari sepeda.' });
    }
});

/**
 * @route POST /api/bookings
 * @desc Create a booking (supports Guest Booking, prevents Race Conditions using Transactions + FOR UPDATE row lock)
 * @access Public (Optionally Authenticated)
 */
router.post('/',
    optionalAuthenticate,
    bookingLimiter,
    [
        body('bike_id').isInt().withMessage('ID Sepeda tidak valid.'),
        body('tanggal_ambil').isISO8601().withMessage('Format tanggal ambil salah.'),
        body('durasi_sewa').isInt({ min: 1 }).withMessage('Durasi sewa minimal 1 hari.'),
        body('addons').optional().isArray(),
        body('addons.*.nama_alat').optional().isIn(['helm', 'kunci_pengaman']),
        // Guest Validations & Sanitization to prevent Stored XSS and invalid input formats
        body('guest_name')
            .if((value, { req }) => !req.user)
            .trim()
            .notEmpty().withMessage('Nama pemesan wajib diisi untuk pemesanan Guest.')
            .escape()
            .isLength({ min: 2, max: 100 }).withMessage('Nama pemesan minimal 2 karakter dan maksimal 100 karakter.'),
        body('guest_phone')
            .if((value, { req }) => !req.user)
            .trim()
            .notEmpty().withMessage('Nomor telepon wajib diisi untuk pemesanan Guest.')
            .escape()
            .matches(/^[0-9+\- ]+$/).withMessage('Format nomor telepon tidak valid (hanya angka, spasi, +, dan -).')
            .isLength({ min: 8, max: 20 }).withMessage('Nomor telepon minimal 8 karakter dan maksimal 20 karakter.')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { bike_id, tanggal_ambil, durasi_sewa, addons = [], guest_name, guest_phone } = req.body;
        
        // Determine customer variables
        const customerId = req.user ? req.user.id : null;
        const gName = req.user ? null : guest_name.trim();
        const gPhone = req.user ? null : guest_phone.trim();

        // Get DB connection for transaction execution
        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // CRITICAL SECTION: PREVENT RACE CONDITION
            // Execute SELECT ... FOR UPDATE to acquire InnoDB row-level lock on target bike.
            // This blocks other concurrent bookings from assessing the availability of this specific bike unit.
            const [bikeRows] = await connection.query(
                'SELECT * FROM bikes WHERE id = ? FOR UPDATE',
                [bike_id]
            );

            if (bikeRows.length === 0) {
                await connection.rollback();
                return res.status(404).json({ success: false, message: 'Sepeda tidak ditemukan.' });
            }

            const bike = bikeRows[0];

            // Verify bike is currently available
            if (bike.status_ketersediaan !== 'tersedia') {
                await connection.rollback();
                return res.status(409).json({ 
                    success: false, 
                    message: 'Maaf, sepeda ini baru saja disewa oleh pengguna lain atau sedang dalam perawatan.' 
                });
            }

            // Calculate Base Price (defaulting to pricing per day)
            const basePrice = parseFloat(bike.harga_per_hari) * parseInt(durasi_sewa);
            
            // Calculate Addon Prices
            let addonsTotal = 0;
            const preparedAddons = [];
            
            for (const add of addons) {
                let addonPrice = 0.00;
                if (add.nama_alat === 'helm') {
                    addonPrice = 10000.00; // Harga sewa flat helm Rp10.000
                } else if (add.nama_alat === 'kunci_pengaman') {
                    addonPrice = 5000.00; // Harga sewa flat kunci Rp5.000
                }
                addonsTotal += addonPrice;
                preparedAddons.push({
                    nama_alat: add.nama_alat,
                    harga: addonPrice
                });
            }

            const grandTotal = basePrice + addonsTotal;
            const kodeBooking = generateBookingCode();

            // Insert Booking
            const [bookingResult] = await connection.query(
                `INSERT INTO bookings 
                 (customer_id, guest_name, guest_phone, bike_id, kode_booking, tanggal_ambil, durasi_sewa, total_harga, status_booking) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
                [customerId, gName, gPhone, bike_id, kodeBooking, tanggal_ambil, durasi_sewa, grandTotal]
            );

            const bookingId = bookingResult.insertId;

            // Insert Addons if any
            for (const prepAdd of preparedAddons) {
                await connection.query(
                    'INSERT INTO booking_addons (booking_id, nama_alat, harga) VALUES (?, ?, ?)',
                    [bookingId, prepAdd.nama_alat, prepAdd.harga]
                );
            }

            // Commit Transaction
            await connection.commit();

            res.status(201).json({
                success: true,
                message: 'Pemesanan berhasil dibuat. Silakan tunjukkan kode booking ini ke toko untuk pengambilan dan pembayaran.',
                data: {
                    booking_id: bookingId,
                    kode_booking: kodeBooking,
                    tanggal_ambil,
                    durasi_sewa,
                    total_harga: grandTotal,
                    status_booking: 'pending',
                    sepeda: bike.nama_sepeda
                }
            });

        } catch (err) {
            await connection.rollback();
            console.error('Booking Transaction Error:', err);
            res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem saat memproses pemesanan.' });
        } finally {
            connection.release();
        }
    }
);

/**
 * @route POST /api/bookings/confirm/:id
 * @desc Confirm booking & lock bike availability status (Owner only, IDOR-safe verification)
 * @access Private (Owner Only)
 */
router.post('/confirm/:id',
    authenticateToken,
    requireRole(['owner']),
    async (req, res) => {
        const bookingId = req.params.id;
        const ownerId = req.user.id;

        const connection = await pool.getConnection();

        try {
            await connection.beginTransaction();

            // IDOR Protection & Concurrency Safeguard:
            // Verify that this booking is for a bike belonging to a store owned by this logged-in owner.
            // Also fetch current bike status FOR UPDATE to prevent race conditions during confirmation.
            const [bookingDetails] = await connection.query(`
                SELECT b.id, b.bike_id, b.status_booking, s.owner_id, bk.status_ketersediaan AS bike_status 
                FROM bookings b
                JOIN bikes bk ON b.bike_id = bk.id
                JOIN rentals_stores s ON bk.store_id = s.id
                WHERE b.id = ? FOR UPDATE
            `, [bookingId]);
 
            if (bookingDetails.length === 0) {
                await connection.rollback();
                return res.status(404).json({ success: false, message: 'Transaksi booking tidak ditemukan.' });
            }
 
            const booking = bookingDetails[0];
 
            if (booking.owner_id !== ownerId) {
                await connection.rollback();
                return res.status(403).json({ 
                    success: false, 
                    message: 'Akses ditolak: Anda bukan pemilik toko rental sepeda untuk pemesanan ini.' 
                });
            }
 
            if (booking.status_booking !== 'pending') {
                await connection.rollback();
                return res.status(400).json({ 
                    success: false, 
                    message: `Booking tidak bisa dikonfirmasi karena status saat ini adalah '${booking.status_booking}'.` 
                });
            }

            // CRITICAL CHECK: Verify that the bike unit is still available (preventing double booking confirm conflicts)
            if (booking.bike_status !== 'tersedia') {
                await connection.rollback();
                return res.status(409).json({
                    success: false,
                    message: 'Sepeda ini sudah tidak tersedia (sedang disewa dalam transaksi lain atau sedang servis).'
                });
            }

            // Update Booking Status
            await connection.query(
                "UPDATE bookings SET status_booking = 'confirmed' WHERE id = ?",
                [bookingId]
            );

            // Automatically lock bike availability status to 'disewa'
            await connection.query(
                "UPDATE bikes SET status_ketersediaan = 'disewa' WHERE id = ?",
                [booking.bike_id]
            );

            await connection.commit();

            res.json({
                success: true,
                message: 'Pemesanan berhasil dikonfirmasi dan status unit sepeda dikunci menjadi "disewa".'
            });

        } catch (err) {
            await connection.rollback();
            console.error('Confirm Booking Error:', err);
            res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem saat konfirmasi booking.' });
        } finally {
            connection.release();
        }
    }
);

/**
 * @route GET /api/bookings/export-csv
 * @desc Export store's transactions to CSV (IDOR-safe filter verification)
 * @access Private (Owner Only)
 */
router.get('/export-csv',
    authenticateToken,
    requireRole(['owner']),
    [
        query('store_id').isInt().withMessage('ID Toko wajib disertakan.')
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const storeId = parseInt(req.query.store_id);
        const ownerId = req.user.id;

        try {
            // IDOR Check: Ensure the store being exported actually belongs to the authenticated owner
            const [storeRows] = await pool.query(
                'SELECT id FROM rentals_stores WHERE id = ? AND owner_id = ?',
                [storeId, ownerId]
            );

            if (storeRows.length === 0) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'Akses ditolak: Anda tidak memiliki wewenang untuk mengekspor data toko ini.' 
                });
            }

            // Fetch transaction reports
            const [bookings] = await pool.query(`
                SELECT 
                    b.kode_booking AS 'Kode Booking',
                    COALESCE(u.nama, b.guest_name) AS 'Nama Pelanggan',
                    COALESCE(u.email, 'Guest (N/A)') AS 'Email',
                    COALESCE(b.guest_phone, 'Registrasi (N/A)') AS 'Nomor Telepon',
                    bk.nama_sepeda AS 'Sepeda',
                    b.tanggal_ambil AS 'Tanggal Pengambilan',
                    b.durasi_sewa AS 'Durasi (Hari)',
                    b.total_harga AS 'Total Biaya (Rp)',
                    b.status_booking AS 'Status Booking',
                    b.created_at AS 'Waktu Pembuatan'
                FROM bookings b
                JOIN bikes bk ON b.bike_id = bk.id
                LEFT JOIN users u ON b.customer_id = u.id
                WHERE bk.store_id = ?
                ORDER BY b.created_at DESC
            `, [storeId]);

            // Formulate manual clean CSV to prevent external dependencies and control injection
            if (bookings.length === 0) {
                return res.status(200).attachment(`laporan_toko_${storeId}.csv`).send('No records found');
            }

            const headers = Object.keys(bookings[0]);
            const csvRows = [headers.join(',')];

            for (const row of bookings) {
                const values = headers.map(header => {
                    const val = row[header];
                    let valStr = '' + (val ?? '');
                    
                    // CSV Injection Mitigation: If field starts with formula indicators (=, +, -, @), prepend a single quote
                    if (valStr.startsWith('=') || valStr.startsWith('+') || valStr.startsWith('-') || valStr.startsWith('@')) {
                        valStr = `'${valStr}`;
                    }
                    
                    const escaped = valStr.replace(/"/g, '""');
                    return `"${escaped}"`;
                });
                csvRows.push(values.join(','));
            }

            const csvContent = '\uFEFF' + csvRows.join('\n'); // Add UTF-8 BOM for Microsoft Excel compliance

            res.header('Content-Type', 'text/csv; charset=utf-8');
            res.attachment(`laporan_transaksi_toko_${storeId}.csv`);
            return res.send(csvContent);

        } catch (err) {
            console.error('Export CSV Error:', err);
            res.status(500).json({ success: false, message: 'Terjadi kesalahan sistem saat mengekspor laporan.' });
        }
    }
);

module.exports = router;
