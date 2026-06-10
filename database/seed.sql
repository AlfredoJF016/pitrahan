-- Seed data for piTrahan Bike Rental Platform
USE pitrahan;

-- Clear existing data if any (disable foreign keys check temporarily)
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE booking_addons;
TRUNCATE TABLE bookings;
TRUNCATE TABLE bikes;
TRUNCATE TABLE rentals_stores;
TRUNCATE TABLE users;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. Insert Users
-- Password for all accounts is 'password123'
-- Hash generated using bcrypt ($2a$10$N9qo8uLOqpGC1dHnEG1R/eb182ePy3Q7z4e0iP3XfQ0h.dF.dG8/u)
INSERT INTO users (id, nama, email, password_hash, role) VALUES
(1, 'Budi Santoso', 'customer@gmail.com', '$2a$10$N9qo8uLOqpGC1dHnEG1R/eb182ePy3Q7z4e0iP3XfQ0h.dF.dG8/u', 'customer'),
(2, 'Pak Eko', 'owner@gmail.com', '$2a$10$N9qo8uLOqpGC1dHnEG1R/eb182ePy3Q7z4e0iP3XfQ0h.dF.dG8/u', 'owner'),
(3, 'Admin piTrahan', 'admin@gmail.com', '$2a$10$N9qo8uLOqpGC1dHnEG1R/eb182ePy3Q7z4e0iP3XfQ0h.dF.dG8/u', 'admin');

-- 2. Insert Rental Stores
INSERT INTO rentals_stores (id, owner_id, nama_toko, alamat, no_telepon, status_verifikasi) VALUES
(1, 2, 'Rental Jogja Bikes', 'Jl. Malioboro No. 15, Yogyakarta', '08123456789', 1),
(2, 2, 'UGM Bike Rental', 'Jl. Bulaksumur No. 2, Sleman', '08198765432', 1),
(3, 2, 'Prambanan Vintage Rent', 'Jl. Raya Prambanan KM 16, Klaten', '08776655443', 1),
(4, 2, 'Premium Bike Jogja', 'Jl. Prawirotaman No. 7, Yogyakarta', '08998877665', 1);

-- 3. Insert Bikes
INSERT INTO bikes (id, store_id, nama_sepeda, jenis_sepeda, harga_per_jam, harga_per_hari, foto_url, status_ketersediaan) VALUES
(1, 1, 'Polygon Xtrada 5', 'gunung', 0.00, 75000.00, 'https://images.unsplash.com/photo-1576435465679-644737eb679d?w=600&auto=format&fit=crop&q=80', 'tersedia'),
(2, 2, 'Dahon Speed P8', 'lipat', 0.00, 90000.00, 'https://images.unsplash.com/photo-1507138086030-616c3b6dd768?w=600&auto=format&fit=crop&q=80', 'tersedia'),
(3, 3, 'Onthel Jawa Klasik', 'onthel', 0.00, 40000.00, 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=600&auto=format&fit=crop&q=80', 'disewa'),
(4, 1, 'Trek FX 2 Disc', 'city_bike', 0.00, 120000.00, 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=600&auto=format&fit=crop&q=80', 'tersedia'),
(5, 4, 'Sepeda Lipat Brompton S2L', 'lipat', 0.00, 200000.00, 'https://images.unsplash.com/photo-1571068316344-75bc76f77890?w=600&auto=format&fit=crop&q=80', 'tersedia'),
(6, 2, 'Polygon Heist 3', 'city_bike', 0.00, 65000.00, 'https://images.unsplash.com/photo-1505705694340-019e1e335916?w=600&auto=format&fit=crop&q=80', 'servis');
