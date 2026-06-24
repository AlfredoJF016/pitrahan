import React, { useState, useRef } from 'react';
import { logActivity } from '../App';

// ─── Helper tanggal tanpa bug UTC ───
function fmtTgl(s) {
  if (!s) return '-';
  const raw = (s.includes('T') ? s.split('T')[0] : s) + 'T00:00:00';
  return new Date(raw).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

// ─── Simpan bukti pembayaran ke localStorage (per kode_booking) ───
function saveBukti(kode_booking, base64) {
  const all = JSON.parse(localStorage.getItem('pitrahan_demo_bookings') || '[]');
  const updated = all.map(b =>
    b.kode_booking === kode_booking ? { ...b, bukti_transfer: base64, bukti_sent_at: new Date().toISOString() } : b
  );
  localStorage.setItem('pitrahan_demo_bookings', JSON.stringify(updated));
}

function getBukti(kode_booking) {
  const all = JSON.parse(localStorage.getItem('pitrahan_demo_bookings') || '[]');
  return all.find(b => b.kode_booking === kode_booking)?.bukti_transfer || null;
}

// ─── Komponen: Panel Kirim Bukti Pembayaran ───
function BuktiPanel({ kode_booking, pemesan }) {
  const fileRef = useRef(null);
  const [preview, setPreview]   = useState(() => getBukti(kode_booking));
  const [uploading, setUploading] = useState(false);
  const [sent, setSent]          = useState(!!getBukti(kode_booking));
  const [showPanel, setShowPanel] = useState(false);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return alert('Pilih file gambar (JPG/PNG/WEBP).');
    if (file.size > 5 * 1024 * 1024) return alert('Ukuran file maksimal 5 MB.');

    setUploading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      setPreview(base64);
      saveBukti(kode_booking, base64);
      setSent(true);
      setUploading(false);
      // Log payment proof upload
      logActivity(
        'PAYMENT_PROOF',
        `Bukti pembayaran untuk booking ${kode_booking} dikirim oleh ${pemesan || 'Pemesan'}`,
        'customer',
        pemesan || 'Pemesan'
      );
    };
    reader.readAsDataURL(file);
  };

  if (!showPanel) {
    return (
      <button
        onClick={() => setShowPanel(true)}
        className={`w-full py-3 font-extrabold uppercase rounded-xl text-xs tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${
          sent
            ? 'bg-[#39FF14]/10 border border-[#39FF14]/40 text-[#39FF14] hover:bg-[#39FF14]/20'
            : 'bg-[#FFD700] text-black shadow-[0_0_15px_rgba(255,215,0,0.2)] hover:bg-white hover:shadow-[0_0_20px_rgba(255,215,0,0.4)]'
        }`}
      >
        <span className="text-base">📎</span>
        {sent ? 'Bukti Sudah Dikirim — Lihat / Ganti' : 'Kirim Bukti Pembayaran'}
      </button>
    );
  }

  return (
    <div className="w-full bg-[#1a1a1a] border border-[#FFD700]/30 rounded-2xl p-4 space-y-4">
      {/* Header panel */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">📎</span>
          <div>
            <p className="text-sm font-black text-white uppercase tracking-tight">Kirim Bukti Pembayaran</p>
            <p className="text-[9px] text-[#a0a0a0]">Upload foto/screenshot bukti transfer/QRIS ke admin.</p>
          </div>
        </div>
        <button onClick={() => setShowPanel(false)} className="text-[#555] hover:text-white text-lg leading-none">&times;</button>
      </div>

      {/* Preview atau placeholder */}
      {preview ? (
        <div className="relative">
          <img
            src={preview}
            alt="Bukti pembayaran"
            className="w-full max-h-56 object-contain rounded-xl border border-[#FFD700]/20 bg-[#0d0d0d]"
          />
          {sent && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-[#39FF14] text-black text-[9px] font-black rounded-lg uppercase">
              ✓ Terkirim ke Admin
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="w-full h-36 border-2 border-dashed border-[#FFD700]/30 rounded-xl flex flex-col items-center justify-center gap-2 hover:border-[#FFD700]/60 hover:bg-[#FFD700]/5 transition-all cursor-pointer"
        >
          <span className="text-3xl">{uploading ? '⏳' : '🖼️'}</span>
          <p className="text-xs font-bold text-[#a0a0a0]">
            {uploading ? 'Memproses gambar...' : 'Ketuk untuk pilih foto bukti pembayaran'}
          </p>
          <p className="text-[9px] text-[#555]">JPG / PNG / WEBP • Maks. 5 MB</p>
        </button>
      )}

      {/* Action buttons */}
      <div className="flex gap-2">
        {preview && (
          <button
            onClick={() => { setPreview(null); setSent(false); fileRef.current?.click(); }}
            className="flex-1 py-2.5 text-[10px] font-black uppercase border border-[#333] text-[#a0a0a0] rounded-xl hover:border-[#555] hover:text-white transition-all"
          >
            Ganti Foto
          </button>
        )}
        {!preview && (
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex-1 py-2.5 text-[10px] font-black uppercase bg-[#FFD700] text-black rounded-xl hover:bg-white transition-all"
          >
            {uploading ? 'Memproses...' : 'Pilih Foto'}
          </button>
        )}
        {sent && (
          <div className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-black uppercase text-[#39FF14] bg-[#39FF14]/10 border border-[#39FF14]/30 rounded-xl">
            <span>✓</span> Bukti Diterima Admin
          </div>
        )}
      </div>

      <p className="text-[9px] text-[#555] text-center">
        Admin akan memverifikasi bukti dan mengkonfirmasi booking Anda.
      </p>

      {/* Hidden file input */}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

export default function TicketModal({ bookingData, onClose, onOpenEmail }) {
  if (!bookingData) return null;

  const {
    kode_booking, sepeda, foto_url,
    durasi_sewa, durasi_mode,
    tanggal_ambil, waktu_ambil,
    tanggal_kembali,
    total_harga, status,
    nama_toko, alamat_toko, no_telepon,
    metode_pembayaran,
    nama_pemesan, no_hp,
    addons = [],
  } = bookingData;

  const satuanLabel = durasi_mode === 'jam' ? 'jam' : 'hari';

  const metodePretty = {
    qris: 'QRIS',
    'e-wallet': 'E-Wallet (GoPay/Dana/OVO)',
    transfer: 'Transfer Bank BCA',
  }[metode_pembayaran] || metode_pembayaran;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/90 z-50 p-4 overflow-y-auto">
      <div className="w-full max-w-sm space-y-4 flex flex-col items-center my-4">

        {/* ── Header sukses ── */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-[#39FF14]/10 border-2 border-[#39FF14] flex items-center justify-center mx-auto">
            <span className="text-[#39FF14] text-2xl">✓</span>
          </div>
          <h2 className="text-xl font-black uppercase text-white tracking-wider">Pemesanan Berhasil!</h2>
          <p className="text-xs text-[#a0a0a0]">Screenshot layar ini sebagai bukti pemesanan</p>
        </div>

        {/* ── Tiket digital ── */}
        <div className="digital-ticket w-full p-5 rounded-2xl border-2 border-dashed border-[#333] space-y-4 bg-[#1a1a1a]">

          {/* Header tiket */}
          <div className="flex justify-between items-start pb-3 border-b border-[#2d2d2d]">
            <div>
              <p className="text-[8px] uppercase font-bold text-[#a0a0a0]">Platform Sewa</p>
              <p className="text-sm font-black text-[#39FF14] uppercase tracking-wide">piTrahan Jogja</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] uppercase font-bold text-[#a0a0a0]">Status</p>
              <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30">
                {status === 'pending' ? 'Menunggu Konfirmasi' : status}
              </span>
            </div>
          </div>

          {/* Kode Booking */}
          <div className="text-center py-3 bg-[#121212] border border-[#222] rounded-xl space-y-1">
            <p className="text-[9px] uppercase font-bold tracking-widest text-[#a0a0a0]">Kode Booking Anda</p>
            <p className="text-3xl font-black text-white tracking-widest uppercase glow-green select-all">
              {kode_booking}
            </p>
          </div>

          {/* Foto sepeda kecil + nama */}
          {foto_url && (
            <div className="flex items-center gap-3 p-2 bg-[#121212] border border-[#2d2d2d] rounded-xl">
              <img src={foto_url} alt={sepeda}
                className="w-16 h-12 object-cover rounded-lg flex-shrink-0"
                onError={e => { e.target.style.display = 'none'; }}
              />
              <div>
                <p className="text-xs font-black text-white uppercase">{sepeda}</p>
                <p className="text-[9px] text-[#a0a0a0]">Sewa {durasi_sewa} {satuanLabel}</p>
              </div>
            </div>
          )}

          {/* Grid info booking */}
          <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs">
            <div>
              <p className="text-[8px] uppercase font-bold text-[#a0a0a0]">Pemesan</p>
              <p className="font-bold text-white">{nama_pemesan || '-'}</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] uppercase font-bold text-[#a0a0a0]">No. HP</p>
              <p className="font-bold text-white">{no_hp || '-'}</p>
            </div>
            <div>
              <p className="text-[8px] uppercase font-bold text-[#a0a0a0]">Tanggal Ambil</p>
              <p className="font-bold text-white">{fmtTgl(tanggal_ambil)}</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] uppercase font-bold text-[#a0a0a0]">Jam Ambil</p>
              <p className="font-bold text-[#39FF14]">{waktu_ambil || '-'} WIB</p>
            </div>
            <div>
              <p className="text-[8px] uppercase font-bold text-[#a0a0a0]">Durasi Sewa</p>
              <p className="font-bold text-white">{durasi_sewa} {satuanLabel}</p>
            </div>
            <div className="text-right">
              <p className="text-[8px] uppercase font-bold text-[#a0a0a0]">Total Biaya</p>
              <p className="font-bold text-[#39FF14]">Rp {parseFloat(total_harga).toLocaleString('id-ID')}</p>
            </div>
          </div>

          {/* Metode Pembayaran */}
          <div className="px-3 py-2 bg-[#FFD700]/5 border border-[#FFD700]/20 rounded-lg">
            <p className="text-[8px] uppercase font-bold text-[#a0a0a0]">Metode Pembayaran</p>
            <p className="text-xs font-bold text-[#FFD700] uppercase">{metodePretty}</p>
          </div>

          {/* Info Toko */}
          {nama_toko && (
            <div className="p-3 bg-[#121212] border border-[#2d2d2d] rounded-xl space-y-1 text-[10px]">
              <p className="text-[8px] uppercase font-bold text-[#a0a0a0]">🏪 Lokasi Pengambilan</p>
              <p className="font-bold text-white">{nama_toko}</p>
              {alamat_toko && <p className="text-[#a0a0a0]">📍 {alamat_toko}</p>}
              {no_telepon && <p className="text-[#39FF14] font-bold">📱 {no_telepon}</p>}
            </div>
          )}

          {/* Jaminan fisik & Persiapan */}
          <div className="p-3 bg-[#FFD700]/5 border border-[#FFD700]/30 rounded-xl space-y-2">
            <p className="text-[9px] font-black uppercase text-[#FFD700] flex items-center gap-1">
              💡 Persiapan Sebelum ke Toko
            </p>
            <div className="space-y-1.5">
              {[
                { icon: '🪪', text: 'Membawa KTP atau SIM Asli atas nama pemesan untuk verifikasi cepat.', critical: true },
                { icon: '💵', text: `Siapkan jaminan deposit Rp ${parseFloat(deposit_fee || 0).toLocaleString('id-ID')} (100% kembali saat sepeda kembali utuh).`, critical: false },
                { icon: '📱', text: 'Tunjukkan kode booking di atas kepada petugas ramah kami.', critical: true },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-xs flex-shrink-0">{item.icon}</span>
                  <p className={`text-[9px] ${item.critical ? 'text-white font-medium' : 'text-[#a0a0a0]'}`}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Petunjuk Pengambilan */}
          <div className="border-t border-dashed border-[#333] pt-3 space-y-2 text-[9px] text-[#a0a0a0]">
            <p className="font-black text-white uppercase text-[10px]">📋 Panduan & Ketentuan Ramah:</p>
            <ol className="list-decimal pl-4 space-y-1 leading-relaxed">
              <li>Datangi <strong className="text-white">{nama_toko}</strong> sesuai waktu pilihan Anda. Jika ada keterlambatan, mohon kabari pihak toko agar unit tetap tersimpan aman.</li>
              <li>Tunjukkan kode booking <strong className="text-[#39FF14]">{kode_booking}</strong> untuk pencocokan unit secara instan.</li>
              <li>Lakukan <strong className="text-white">cek fisik bersama petugas</strong> untuk memastikan kenyamanan bersepeda Anda.</li>
              <li>Demi kenyamanan teman-teman penyewa berikutnya yang mengantre, mohon kembalikan unit tepat waktu.</li>
              <li>Apabila ada kendala darurat di jalan, segera hubungi kami lewat tombol <strong className="text-white">WhatsApp Bantuan Darurat</strong> di sudut kiri bawah layar.</li>
            </ol>
          </div>

          {/* Footer kode */}
          <div className="text-center pt-2 border-t border-[#2d2d2d]">
            <p className="text-[7px] text-[#555] uppercase tracking-widest">
              piTrahan • Yogyakarta Bike Rental Platform • {new Date().getFullYear()}
            </p>
          </div>
        </div>

        {/* ── Tombol Kirim Bukti Pembayaran ── */}
        {metode_pembayaran !== 'offline' && (
          <BuktiPanel kode_booking={kode_booking} pemesan={nama_pemesan} />
        )}

        {/* Tombol Lihat Notifikasi Email (UC-08) */}
        {onOpenEmail && (
          <button onClick={onOpenEmail}
            className="w-full py-3 bg-[#1e1e1e] text-[#39FF14] border border-[#39FF14]/40 font-extrabold uppercase rounded-xl text-xs tracking-wider transition-all duration-300 flex items-center justify-center gap-2 hover:bg-[#39FF14]/10 hover:border-[#39FF14]">
            <span>📧</span> Lihat Notifikasi Email (E-Receipt)
          </button>
        )}

        {/* Tombol tutup */}
        <button onClick={onClose}
          className="w-full py-3 bg-[#39FF14] text-black font-extrabold uppercase rounded-xl text-xs tracking-wider shadow-[0_0_15px_rgba(57,255,20,0.2)] hover:bg-white transition-all duration-300">
          Tutup Karcis
        </button>
      </div>
    </div>
  );
}
