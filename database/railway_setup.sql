-- ─────────────────────────────────────────────────────────────────────────────
-- piTrahan Bike Rental Platform — Complete Database Setup Script
-- Import this file to Railway.app MySQL to set up the production database
-- ─────────────────────────────────────────────────────────────────────────────
-- Usage: Import via Railway Dashboard → MySQL → Query tab
-- Or via MySQL CLI: mysql -h host -u user -p pitrahan < railway_setup.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- Note: Railway creates the database automatically, no need for CREATE DATABASE

-- Disable foreign key checks during setup
SET FOREIGN_KEY_CHECKS = 0;

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 1: TABLES
-- ═══════════════════════════════════════════════════════════════════════════════

-- 1. Table: users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'owner', 'customer') NOT NULL DEFAULT 'customer',
    avatar_url TEXT DEFAULT NULL,
    no_telepon VARCHAR(20) DEFAULT NULL,
    kyc_doc_url TEXT DEFAULT NULL,
    is_kyc_verified TINYINT(1) NOT NULL DEFAULT 0,
    is_anonymized TINYINT(1) NOT NULL DEFAULT 0,
    is_banned TINYINT(1) NOT NULL DEFAULT 0,
    anonymized_at DATETIME DEFAULT NULL,
    last_seen_at DATETIME DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table: rentals_stores
CREATE TABLE IF NOT EXISTS rentals_stores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    nama_toko VARCHAR(100) NOT NULL,
    alamat TEXT NOT NULL,
    no_telepon VARCHAR(20) NOT NULL,
    gps_latitude DECIMAL(10,8) DEFAULT NULL,
    gps_longitude DECIMAL(11,8) DEFAULT NULL,
    status_verifikasi BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_store_owner FOREIGN KEY (owner_id)
        REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_store_owner (owner_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table: bikes
CREATE TABLE IF NOT EXISTS bikes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    store_id INT NOT NULL,
    nama_sepeda VARCHAR(100) NOT NULL,
    jenis_sepeda ENUM('gunung', 'lipat', 'onthel', 'city_bike') NOT NULL,
    harga_per_jam DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    harga_per_hari DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    deposit_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    foto_url VARCHAR(255) DEFAULT NULL,
    status_ketersediaan ENUM('tersedia', 'disewa', 'servis') NOT NULL DEFAULT 'tersedia',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bike_store FOREIGN KEY (store_id)
        REFERENCES rentals_stores(id) ON DELETE CASCADE,
    INDEX idx_bike_store (store_id),
    INDEX idx_bike_search (jenis_sepeda, status_ketersediaan),
    INDEX idx_bike_price (harga_per_hari)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Table: bookings
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NULL,
    guest_name VARCHAR(100) DEFAULT NULL,
    guest_phone VARCHAR(20) DEFAULT NULL,
    bike_id INT NOT NULL,
    kode_booking VARCHAR(20) NOT NULL UNIQUE,
    tanggal_ambil DATETIME NOT NULL,
    durasi_sewa INT NOT NULL,
    total_harga DECIMAL(12, 2) NOT NULL,
    metode_pembayaran ENUM('qris', 'transfer', 'offline') NOT NULL DEFAULT 'offline',
    bukti_transfer LONGTEXT DEFAULT NULL,
    bukti_sent_at TIMESTAMP NULL DEFAULT NULL,
    status_booking ENUM('pending', 'confirmed', 'rejected', 'completed', 'cancelled', 'expired') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_booking_customer FOREIGN KEY (customer_id)
        REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_booking_bike FOREIGN KEY (bike_id)
        REFERENCES bikes(id) ON DELETE CASCADE,
    INDEX idx_booking_customer (customer_id),
    INDEX idx_booking_bike (bike_id),
    INDEX idx_booking_code (kode_booking),
    INDEX idx_booking_status (status_booking)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Table: booking_addons
CREATE TABLE IF NOT EXISTS booking_addons (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    nama_alat ENUM('helm', 'kunci_pengaman') NOT NULL,
    harga DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    CONSTRAINT fk_addon_booking FOREIGN KEY (booking_id)
        REFERENCES bookings(id) ON DELETE CASCADE,
    INDEX idx_addon_booking (booking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. Table: user_activity_logs (OWASP security audit logging)
CREATE TABLE IF NOT EXISTS user_activity_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    email VARCHAR(100) NOT NULL,
    action VARCHAR(50) NOT NULL,
    details TEXT NOT NULL,
    user_agent VARCHAR(255) DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    status ENUM('success', 'failed') NOT NULL DEFAULT 'success',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_log_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_log_email (email),
    INDEX idx_log_action (action)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Table: active_sessions (for force logout / multi-device session management)
CREATE TABLE IF NOT EXISTS active_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token_jti VARCHAR(255) NOT NULL UNIQUE,
    user_agent VARCHAR(255) DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    CONSTRAINT fk_session_user FOREIGN KEY (user_id)
        REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_session_token (token_jti)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ═══════════════════════════════════════════════════════════════════════════════
-- PART 2: SEED DATA
-- ═══════════════════════════════════════════════════════════════════════════════

-- Clear existing data
TRUNCATE TABLE booking_addons;
TRUNCATE TABLE bookings;
TRUNCATE TABLE bikes;
TRUNCATE TABLE rentals_stores;
TRUNCATE TABLE user_activity_logs;
TRUNCATE TABLE active_sessions;
DELETE FROM users;

-- 1. Insert Users
-- Passwords: admin/owner/customer@gmail.com → 'password123' | john/budi/citra/eka → 'user123'
INSERT INTO users (id, nama, email, password_hash, role) VALUES
(1, 'Budi Santoso', 'customer@gmail.com', '$2a$10$VMuvgVLiYAjLe.udCLbR1e6UrCnK4szB4XTi9DydImxewbGANq3mO', 'customer'),
(2, 'Pak Eko', 'owner@gmail.com', '$2a$10$VMuvgVLiYAjLe.udCLbR1e6UrCnK4szB4XTi9DydImxewbGANq3mO', 'owner'),
(3, 'Admin piTrahan', 'admin@gmail.com', '$2a$10$VMuvgVLiYAjLe.udCLbR1e6UrCnK4szB4XTi9DydImxewbGANq3mO', 'admin'),
(4, 'John Doe', 'john@example.com', '$2a$10$3/XaTgXrCwtCDlyymESb4e.ZJTMQf64UVK7E62lUwqL7BQwdDHiD.', 'customer'),
(5, 'Budi Santoso', 'budi@gmail.com', '$2a$10$3/XaTgXrCwtCDlyymESb4e.ZJTMQf64UVK7E62lUwqL7BQwdDHiD.', 'customer'),
(6, 'Citra Kirana', 'citra@mail.com', '$2a$10$3/XaTgXrCwtCDlyymESb4e.ZJTMQf64UVK7E62lUwqL7BQwdDHiD.', 'customer'),
(7, 'Eka Saputra', 'eka.saputra@outlook.com', '$2a$10$3/XaTgXrCwtCDlyymESb4e.ZJTMQf64UVK7E62lUwqL7BQwdDHiD.', 'customer');

-- 2. Insert Rental Stores
INSERT INTO rentals_stores (id, owner_id, nama_toko, alamat, no_telepon, status_verifikasi) VALUES
(1, 2, 'Rental Jogja Bikes', 'Jl. Malioboro No. 15, Yogyakarta', '08123456789', 1),
(2, 2, 'UGM Bike Rental', 'Jl. Bulaksumur No. 2, Sleman', '08198765432', 1),
(3, 2, 'Prambanan Vintage Rent', 'Jl. Raya Prambanan KM 16, Klaten', '08776655443', 1),
(4, 2, 'Premium Bike Jogja', 'Jl. Prawirotaman No. 7, Yogyakarta', '08998877665', 1);

-- 3. Insert Bikes
INSERT INTO bikes (id, store_id, nama_sepeda, jenis_sepeda, harga_per_jam, harga_per_hari, deposit_fee, foto_url, status_ketersediaan) VALUES
(1, 1, 'Polygon Xtrada 5', 'gunung', 0.00, 75000.00, 50000.00, 'https://images.unsplash.com/photo-1576435465679-644737eb679d?w=600&auto=format&fit=crop&q=80', 'tersedia'),
(2, 2, 'Dahon Speed P8', 'lipat', 0.00, 90000.00, 50000.00, 'https://images.unsplash.com/photo-1507138086030-616c3b6dd768?w=600&auto=format&fit=crop&q=80', 'tersedia'),
(3, 3, 'Onthel Jawa Klasik', 'onthel', 0.00, 40000.00, 20000.00, 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80', 'disewa'),
(4, 1, 'Trek FX 2 Disc', 'city_bike', 0.00, 120000.00, 80000.00, 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=600&auto=format&fit=crop&q=80', 'tersedia'),
(5, 4, 'Sepeda Lipat Brompton S2L', 'lipat', 0.00, 200000.00, 150000.00, 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=600&auto=format&fit=crop&q=80', 'tersedia'),
(6, 2, 'Polygon Heist 3', 'city_bike', 0.00, 65000.00, 40000.00, 'https://images.unsplash.com/photo-1505705694340-019e1e335916?w=600&auto=format&fit=crop&q=80', 'servis');

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- Verify
SELECT 'Setup completed!' AS status;
SELECT COUNT(*) AS total_users FROM users;
SELECT COUNT(*) AS total_bikes FROM bikes;
