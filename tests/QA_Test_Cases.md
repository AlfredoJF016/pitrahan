# Skenario Pengujian (QA Test Cases) - piTrahan Platform

Dokumen ini mendokumentasikan panduan dan kasus uji untuk menguji fitur fungsionalitas dan keamanan pada platform **piTrahan** (Fase MVP 1).

---

## 1. Skenario Uji Guest Booking (Tanpa Login)

Fitur Guest Booking mengizinkan pengguna untuk memesan sepeda tanpa harus membuat akun terlebih dahulu. Seluruh biaya dibayar secara tunai di lokasi pengambilan.

### Kasus Uji Positif: Pemesanan Guest Berhasil
- **Deskripsi:** Memastikan pengguna umum dapat membuat pemesanan sepeda yang berstatus "tersedia" dengan mengisi data guest secara lengkap.
- **Langkah-langkah:**
  1. Akses halaman pencarian sepeda tanpa login.
  2. Cari sepeda dengan status "Tersedia" (Badge Hijau) dan klik tombol **Pesan**.
  3. Form booking pop-up terbuka. Pastikan input **Nama Lengkap** dan **Nomor Telepon** muncul (tidak tertutup info user login).
  4. Isi Nama Lengkap dengan "Hendra Wijaya" dan Nomor Telepon dengan "08123456789".
  5. Pilih Tanggal Pengambilan (misal: besok hari) dan Durasi Sewa "2 Hari".
  6. Pilih addon tambahan (Helm & Kunci Pengaman).
  7. Klik **Konfirmasi Sewa**.
- **Hasil yang Diharapkan:**
  - Request dikirim ke `POST /api/bookings` dengan payload guest data.
  - Server memproses transaksi, mengembalikan status `201 Created` beserta objek booking.
  - Modal Karcis Sukses muncul di layar, menampilkan Kode Booking acak berformat `PT-XXXXX` (misal: `PT-D8J2K`), nama sepeda, total harga sewa (termasuk addon), dan panduan pengambilan.
  - Tombol **Tutup Karcis** mereset form.

### Kasus Uji Negatif: Validasi Kolom Guest Kosong
- **Deskripsi:** Memastikan booking ditolak jika kolom Nama Lengkap atau Nomor Telepon pada mode Guest dikosongkan.
- **Langkah-langkah:**
  1. Ulangi langkah booking di atas.
  2. Kosongkan kolom **Nama Lengkap** dan isi nomor telepon, lalu klik **Konfirmasi Sewa**.
  3. Kosongkan kolom **Nomor Telepon** dan isi nama lengkap, lalu klik **Konfirmasi Sewa**.
- **Hasil yang Diharapkan:**
  - Client-side validation memblokir submit dan menampilkan pesan error merah di bawah kolom terkait: "Nama lengkap wajib diisi." / "Nomor telepon wajib diisi."
  - Jika dicoba bypass ke API via Postman dengan payload tanpa data guest, server membalas dengan status `400 Bad Request` dan menyertakan rincian error validator.

### Kasus Uji Negatif: Tanggal Pengambilan di Masa Lalu
- **Deskripsi:** Memastikan pengguna tidak dapat menyewa sepeda dengan tanggal pengambilan sebelum hari ini.
- **Langkah-langkah:**
  1. Di form booking, pilih Tanggal Pengambilan kemarin atau hari-hari sebelumnya.
  2. Klik **Konfirmasi Sewa**.
- **Hasil yang Diharapkan:**
  - Muncul error validasi: "Tanggal pengambilan tidak boleh di masa lalu."
  - Tombol konfirmasi dinonaktifkan atau memicu validasi error di frontend.

---

## 2. Penanganan Race Condition (Double Booking Kontan)

Race Condition terjadi ketika 2 user (User A dan User B) secara bersamaan (misal di detik/milidetik yang sama) menekan tombol **Konfirmasi Sewa** untuk memesan **1 unit sepeda yang sama**.

### Desain Penanganan Sistem (Database Row-Level Lock)
Platform piTrahan menggunakan engine database **InnoDB (MySQL)** yang mendukung transaksi ACID dan Row-Level Locking.
Ketika User A mengirim request pemesanan:
1. API backend memulai transaksi database: `START TRANSACTION`.
2. Backend menjalankan query pemeriksaan status sepeda dengan lock:
   ```sql
   SELECT id, status_ketersediaan, harga_per_hari FROM bikes WHERE id = ? FOR UPDATE;
   ```
   Query dengan klausa `FOR UPDATE` ini akan mengunci baris (row) data sepeda tersebut.
3. Jika User B di milidetik yang sama mencoba melakukan pemesanan untuk sepeda yang sama, query `SELECT ... FOR UPDATE` miliknya akan **tertahan (blocked)** dan mengantri di sistem database hingga transaksi User A selesai (`COMMIT` atau `ROLLBACK`).
4. Setelah transaksi User A sukses menyimpan booking dan melakukan `COMMIT`, kunci baris dilepaskan.
5. Antrian User B kemudian diproses. Sistem membaca status sepeda terbaru. Karena sepeda tersebut sudah dipesan (atau status ketersediaannya berubah), transaksi User B dibatalkan (`ROLLBACK`) dan server mengirim respons error.

### Skenario Pengujian Simulasi Race Condition
- **Deskripsi:** Memastikan sistem hanya memproses satu booking dan menolak booking lainnya saat dua request masuk secara bersamaan untuk unit sepeda yang sama.
- **Langkah-langkah Pengujian Manual / Script:**
  1. Siapkan unit sepeda dengan `id = 5` yang berstatus `tersedia`.
  2. Buka dua terminal shell / jalankan script concurrency test (misal menggunakan Apache JMeter atau ApacheBench `ab` dengan request paralel, atau script Node.js concurrency).
  3. Kirim dua request HTTP POST secara simultan ke `POST /api/bookings`:
     - **Request A:** `{ "bike_id": 5, "tanggal_ambil": "2026-06-12", "durasi_sewa": 2, "guest_name": "User A", "guest_phone": "08111" }`
     - **Request B:** `{ "bike_id": 5, "tanggal_ambil": "2026-06-12", "durasi_sewa": 3, "guest_name": "User B", "guest_phone": "08222" }`
- **Hasil yang Diharapkan:**
  - Salah satu request (misal Request A yang tiba beberapa milidetik lebih cepat) akan diproses sukses, mengembalikan status `201 Created` dan Kode Booking baru (misal `PT-X1Y2Z`).
  - Request satunya (Request B) akan tertahan sebentar (menunggu pelepasan lock), lalu langsung dibatalkan dengan respons status `409 Conflict` dan pesan: "Maaf, sepeda ini baru saja disewa oleh pengguna lain atau sedang dalam perawatan."
  - Periksa tabel database `bookings`: Pastikan hanya ada **1** record booking baru untuk `bike_id = 5`. Data tetap konsisten, tidak terjadi duplikasi penyewaan unit di waktu yang sama.
