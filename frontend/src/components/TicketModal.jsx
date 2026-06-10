import React from 'react';

// ─── Helper tanggal tanpa bug UTC ───
function fmtTgl(s) {
  if (!s) return '-';
  const raw = (s.includes('T') ? s.split('T')[0] : s) + 'T00:00:00';
  return new Date(raw).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

export default function TicketModal({ bookingData, onClose }) {
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

  // Format metode pembayaran untuk display
  const metodePretty = {
    qris: 'QRIS',
    'e-wallet': 'E-Wallet (GoPay/Dana/OVO)',
    transfer: 'Transfer Bank BCA',
  }[metode_pembayaran] || metode_pembayaran;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/90 z-50 p-4 overflow-y-auto">
      <div className="w-full max-w-sm space-y-5 flex flex-col items-center my-4">

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
              <p className="font-bold text-[#00E5FF]">{waktu_ambil || '-'} WIB</p>
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
              {no_telepon && <p className="text-[#00E5FF] font-bold">📱 {no_telepon}</p>}
            </div>
          )}

          {/* ══ SEKSI JAMINAN FISIK ══ */}
          <div className="p-3 bg-[#FF3E3E]/5 border border-[#FF3E3E]/30 rounded-xl space-y-2">
            <p className="text-[9px] font-black uppercase text-[#FF3E3E] flex items-center gap-1">
              ⚠️ Wajib Dibawa ke Lokasi
            </p>
            <p className="text-[9px] text-[#a0a0a0]">
              Tanpa jaminan berikut, pengambilan sepeda <strong className="text-white">bisa ditolak</strong> di tempat:
            </p>
            <div className="space-y-1.5">
              {[
                { icon: '🪪', text: 'KTP Asli ATAU SIM Asli (wajib salah satu)', critical: true },
                { icon: '💵', text: 'Uang Deposit (sesuai kebijakan masing-masing toko)', critical: false },
                { icon: '📱', text: 'Tampilkan kode booking ini ke kasir toko', critical: true },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span className="text-sm flex-shrink-0">{item.icon}</span>
                  <p className={`text-[9px] ${item.critical ? 'text-white font-bold' : 'text-[#a0a0a0]'}`}>
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Petunjuk Pengambilan */}
          <div className="border-t border-dashed border-[#333] pt-3 space-y-2 text-[9px] text-[#a0a0a0]">
            <p className="font-black text-white uppercase text-[10px]">📋 Petunjuk Pengambilan:</p>
            <ol className="list-decimal pl-4 space-y-1 leading-relaxed">
              <li>Datangi <strong className="text-white">{nama_toko}</strong> pada tanggal & jam yang tertera.</li>
              <li>Tunjukkan kode booking <strong className="text-[#39FF14]">{kode_booking}</strong> ke kasir.</li>
              <li>Serahkan jaminan fisik (KTP/SIM asli) kepada petugas.</li>
              <li>Lakukan <strong className="text-white">verifikasi kondisi sepeda</strong> bersama petugas sebelum berangkat.</li>
              <li>Kembalikan tepat waktu sesuai durasi. Keterlambatan dikenai biaya tambahan.</li>
            </ol>
          </div>

          {/* Footer kode */}
          <div className="text-center pt-2 border-t border-[#2d2d2d]">
            <p className="text-[7px] text-[#555] uppercase tracking-widest">
              piTrahan • Yogyakarta Bike Rental Platform • {new Date().getFullYear()}
            </p>
          </div>
        </div>

        {/* Tombol tutup */}
        <button onClick={onClose}
          className="w-full py-3 bg-[#39FF14] text-black font-extrabold uppercase rounded-xl text-xs tracking-wider shadow-[0_0_15px_rgba(57,255,20,0.2)] hover:bg-white transition-all duration-300">
          Tutup Karcis
        </button>
      </div>
    </div>
  );
}
