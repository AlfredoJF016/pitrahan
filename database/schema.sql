-- Database schema for piTrahan Bike Rental Platform
-- Target DBMS: MySQL 8.0+

CREATE DATABASE IF NOT EXISTS pitrahan;
USE pitrahan;

-- 1. Table: users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'owner', 'customer') NOT NULL DEFAULT 'customer',
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
    customer_id INT NULL, -- Nullable for Guest Bookings
    guest_name VARCHAR(100) DEFAULT NULL, -- Filled if guest booking
    guest_phone VARCHAR(20) DEFAULT NULL, -- Filled if guest booking
    bike_id INT NOT NULL,
    kode_booking VARCHAR(20) NOT NULL UNIQUE,
    tanggal_ambil DATETIME NOT NULL,
    durasi_sewa INT NOT NULL, -- Duration in hours or days (application logic defines hours/days)
    total_harga DECIMAL(12, 2) NOT NULL,
    status_booking ENUM('pending', 'confirmed', 'rejected', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
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
