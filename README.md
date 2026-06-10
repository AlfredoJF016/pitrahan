# piTrahan: Platform Sewa Sepeda Modern (Yogyakarta)

Platform **piTrahan** adalah solusi digital modern, mobile-friendly, dan berkinerja tinggi untuk sewa sepeda di Yogyakarta, yang menargetkan mahasiswa dan wisatawan. Untuk MVP Tahap 1, sistem menggunakan model pembayaran offline/tunai di lokasi dengan dukungan penuh untuk **Guest Booking** tanpa pendaftaran akun.

---

## 1. UI/UX Design System & Guidelines
Konsep desain yang diterapkan adalah **"Tech-Minimalist Meets Adventure"**. Desain ini menggabungkan estetika teknologi tinggi (mirip dasbor sepeda listrik modern atau platform game) dengan elemen minimalis petualangan luar ruangan yang bersih.

### Palet Warna
- **Dominan Gelap/Doff (Matte Black):** `#121212` (Base Background), `#1E1E1E` (Card & Section Background)
- **Aksen Neon Green:** `#39FF14` (Status "Tersedia", Tombol Utama, Elemen Aktif/Hover)
- **Aksen Electric Cyan:** `#00E5FF` (Status "Disewa", Info Toko, Badge Informasi Kategori)
- **Aksen Warning Red:** `#FF3E3E` (Status "Servis", Pesan Error, Batalkan Booking)
- **Teks Utama:** `#FFFFFF` (Kontras tinggi)
- **Teks Sekunder:** `#A0A0A0` (Muted Grey)

### Tipografi
- **Primary Font:** `Plus Jakarta Sans` atau `Inter` (Sans-serif modern, bersih, dengan kerning yang optimal untuk layar handphone).
- **Heading Styles:** Bold, menggunakan lowercase/uppercase kontras tinggi dengan glow text shadow halus untuk aksen neon.

### Layout & Bento Grid
Katalog sepeda disusun menggunakan tata letak **Bento Grid** responsif, yang menyatukan elemen-elemen informasi (foto sepeda, nama, rating, info toko, dan harga) ke dalam ukuran kotak yang bervariasi secara geometris dan dinamis.
- **Micro-interactions:** 
  - Hovering card memicu sedikit perbesaran (`scale-102`), border glow neon, dan pergeseran bayangan (drop shadow).
  - Klik tombol memicu feedback visual cepat seperti transisi warna instan atau ripple effect.

---

## 2. Struktur Proyek
Aplikasi terbagi menjadi tiga bagian utama:
1. **`database/`**: Skema SQL relational MySQL.
2. **`backend/`**: Node.js Express server yang aman dengan JWT, bcrypt, input validation, rate limiting, dan RBAC.
3. **`frontend/`**: Komponen React dengan Tailwind CSS, state management yang kuat, dan layout responsif mobile-first.
4. **`tests/`**: Suite pengujian QA manual dan otomatis.

---

## 3. Alur Kerja Keamanan (OWASP Top 10)
- **A1: Broken Access Control:** Mencegah IDOR pada CSV export dengan memvalidasi kepemilikan store melalui token JWT pengguna.
- **A2: Cryptographic Failures:** Menggunakan `bcrypt` untuk hashing password pengguna dan modul `crypto` bawaan Node.js untuk booking code generator yang acak dan tidak dapat diprediksi.
- **A3: Injection:** Validasi skema input query/body yang ketat menggunakan parameterized queries (MySQL Prepared Statements) untuk memblokir SQL Injection, serta melakukan sanitasi data input untuk mencegah Cross-Site Scripting (XSS).
- **A4: Insecure Design & Rate Limiting:** Pembatasan frekuensi (Rate Limiting) pada login dan booking endpoint untuk meredam brute-force attack dan automated spam bookings.
- **Race Condition Prevention:** Pemesanan sepeda menggunakan transaksi database ACID dan row-level locking (`SELECT ... FOR UPDATE`). Ketika sebuah sepeda sedang dalam proses booking aktif, baris data tersebut dikunci sehingga transaksi paralel lainnya akan menunggu atau gagal, sehingga mencegah double-booking unit yang sama.

---

## 4. Cara Menjalankan Project

### Prerequisites
- Node.js (v18+)
- MySQL Server

### Jalankan Backend
1. Masuk ke folder `backend`
2. Jalankan `npm install`
3. Konfigurasi file `.env` untuk koneksi database
4. Jalankan `npm run dev` atau `node server.js`

### Jalankan Frontend
1. Masuk ke folder `frontend`
2. Jalankan `npm install`
3. Jalankan `npm run dev` untuk memulai development server Vite.
