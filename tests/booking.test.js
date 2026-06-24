const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../backend/middleware/auth');

// 1. Mock the Database connection pool to isolate test runs from live MySQL instances
const mockQuery = jest.fn();
const mockRelease = jest.fn();
const mockBeginTransaction = jest.fn();
const mockCommit = jest.fn();
const mockRollback = jest.fn();

const mockConnection = {
    query: mockQuery,
    beginTransaction: mockBeginTransaction,
    commit: mockCommit,
    rollback: mockRollback,
    release: mockRelease
};

// Mock the config/db module before loading routes
jest.mock('../backend/config/db', () => ({
    pool: {
        query: mockQuery,
        getConnection: jest.fn().mockResolvedValue(mockConnection)
    },
    checkConnection: jest.fn()
}));

const { pool } = require('../backend/config/db');

// Import routes and create a fresh Express instance for testing
const { router: bookingRoutes } = require('../backend/routes/bookings');
const app = express();
app.use(express.json());
app.use('/api/bookings', bookingRoutes);

describe('piTrahan Booking API Integration Tests', () => {
    
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/bookings - Guest Booking Creation', () => {
        
        test('Should succeed (201) when creating a valid Guest booking', async () => {
            // Mock DB response: Bike is available (status = 'tersedia')
            mockQuery.mockResolvedValueOnce([
                [{ id: 3, nama_sepeda: 'Onthel Jogja', harga_per_hari: 30000.00, status_ketersediaan: 'tersedia' }]
            ]);
            // Mock DB response: Booking Insert Successful (insertId = 12)
            mockQuery.mockResolvedValueOnce([{ insertId: 12 }]);
            // Mock DB response: Addon Insert Successful
            mockQuery.mockResolvedValueOnce([{}]);

            const payload = {
                bike_id: 3,
                tanggal_ambil: '2026-06-12T08:00:00Z',
                durasi_sewa: 2,
                guest_name: 'Dewi Lestari',
                guest_phone: '08543210987',
                addons: [{ nama_alat: 'helm' }]
            };

            const response = await request(app)
                .post('/api/bookings')
                .send(payload);

            expect(response.statusCode).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.kode_booking).toMatch(/^PT-[A-Z2-9]{5}$/); // Match cryptographically secure code regex
            expect(response.body.data.total_harga).toBe(70000); // (30k * 2) + 10k flat helm = 70k
            expect(mockBeginTransaction).toHaveBeenCalledTimes(1);
            expect(mockCommit).toHaveBeenCalledTimes(1);
            expect(mockRelease).toHaveBeenCalledTimes(1);
        });

        test('Should fail (400) when Guest booking is missing guest details', async () => {
            const payload = {
                bike_id: 3,
                tanggal_ambil: '2026-06-12T08:00:00Z',
                durasi_sewa: 2,
                // Missing guest_name & guest_phone
                addons: []
            };

            const response = await request(app)
                .post('/api/bookings')
                .send(payload);

            expect(response.statusCode).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.errors).toBeDefined();
            // Database transactions should not be touched
            expect(mockBeginTransaction).not.toHaveBeenCalled();
        });

        test('Should fail (409) when bike status is not available', async () => {
            // Mock DB response: Bike is occupied (status = 'disewa')
            mockQuery.mockResolvedValueOnce([
                [{ id: 3, nama_sepeda: 'Onthel Jogja', harga_per_hari: 30000.00, status_ketersediaan: 'disewa' }]
            ]);

            const payload = {
                bike_id: 3,
                tanggal_ambil: '2026-06-12T08:00:00Z',
                durasi_sewa: 2,
                guest_name: 'Dewi Lestari',
                guest_phone: '08543210987'
            };

            const response = await request(app)
                .post('/api/bookings')
                .send(payload);

            expect(response.statusCode).toBe(409);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('baru saja disewa');
            expect(mockBeginTransaction).toHaveBeenCalledTimes(1);
            expect(mockRollback).toHaveBeenCalledTimes(1);
            expect(mockRelease).toHaveBeenCalledTimes(1);
        });
    });

    describe('POST /api/bookings/confirm/:id - Access Bypass Prevention (RBAC Check)', () => {
        
        test('Should fail (401) when attempting confirmation without authentication token', async () => {
            const response = await request(app)
                .post('/api/bookings/confirm/12')
                .send();

            expect(response.statusCode).toBe(401);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Token autentikasi tidak tersedia');
        });

        test('Should fail (403) when customer tries to confirm their own booking (Bypass prevention)', async () => {
            // Create customer payload & sign JWT
            const customerPayload = { id: 88, nama: 'Adi', email: 'adi@gmail.com', role: 'customer' };
            const token = jwt.sign(customerPayload, JWT_SECRET);

            const response = await request(app)
                .post('/api/bookings/confirm/12')
                .set('Authorization', `Bearer ${token}`)
                .send();

            expect(response.statusCode).toBe(403);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('tidak memiliki izin');
        });
    });
});
