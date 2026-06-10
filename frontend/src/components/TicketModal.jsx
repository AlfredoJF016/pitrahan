import React from 'react';

export default function TicketModal({ bookingData, onClose }) {
  if (!bookingData) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/90 z-50 p-4 overflow-y-auto">
      {/* Container holding the receipt ticket */}
      <div className="w-full max-w-sm space-y-6 flex flex-col items-center">
        
        {/* Success Header Message */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-full bg-[#39FF14]/10 border border-[#39FF14] flex items-center justify-center mx-auto mb-2">
            <span className="text-[#39FF14] text-xl font-bold">&#10003;</span>
          </div>
          <h3 className="text-lg font-black uppercase text-white tracking-wider">Pemesanan Sukses!</h3>
          <p className="text-xs text-[#a0a0a0]">Screenshot layar ini untuk ditunjukkan ke lokasi toko</p>
        </div>

        {/* Digital Ticket Body Card */}
        <div className="digital-ticket w-full p-6 text-left rounded-2xl border-2 border-dashed border-[#333333] space-y-5">
          {/* Header Ticket Section */}
          <div className="flex justify-between items-center pb-4 border-b border-[#2d2d2d]">
            <div className="flex flex-col">
              <span className="text-[9px] uppercase font-bold text-[#a0a0a0]">Platform Sewa</span>
              <span className="text-sm font-black text-[#39FF14] uppercase tracking-wide">piTrahan</span>
            </div>
            <div className="text-right">
              <span className="text-[9px] uppercase font-bold text-[#a0a0a0]">Sistem Pembayaran</span>
              <span className="text-xs font-bold text-white uppercase block">Offline / Tunai</span>
            </div>
          </div>

          {/* Large Booking Code Centerpiece */}
          <div className="text-center py-4 bg-[#121212] border border-[#222222] rounded-xl space-y-1 my-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#a0a0a0]">Kode Booking Anda</span>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-widest uppercase glow-green select-all">
              {bookingData.kode_booking}
            </h1>
          </div>

          {/* Ticket Information Grid */}
          <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-xs pt-2">
            <div>
              <span className="text-[9px] uppercase font-bold text-[#a0a0a0] block">Sepeda</span>
              <span className="font-extrabold text-white uppercase line-clamp-1">{bookingData.sepeda}</span>
            </div>
            
            <div className="text-right">
              <span className="text-[9px] uppercase font-bold text-[#a0a0a0] block">Durasi</span>
              <span className="font-extrabold text-white uppercase">{bookingData.durasi_sewa} Hari</span>
            </div>

            <div>
              <span className="text-[9px] uppercase font-bold text-[#a0a0a0] block">Tanggal Ambil</span>
              <span className="font-extrabold text-white uppercase">
                {new Date(bookingData.tanggal_ambil).toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[9px] uppercase font-bold text-[#a0a0a0] block">Total Biaya</span>
              <span className="font-extrabold text-[#00E5FF] uppercase">
                Rp {parseFloat(bookingData.total_harga).toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Dashed line notches separation area */}
          <div className="border-t border-dashed border-[#333333] my-4 pt-4 text-[10px] text-[#a0a0a0] space-y-2 leading-relaxed">
            <p className="font-bold text-white uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14]"></span>
              Petunjuk Pengambilan:
            </p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Datangi toko rental terkait sesuai jadwal tanggal ambil.</li>
              <li>Tunjukkan kode booking <span className="text-[#39FF14] font-bold">{bookingData.kode_booking}</span> ini ke kasir.</li>
              <li>Bayar biaya sewa secara tunai/cash di tempat.</li>
              <li>Lakukan verifikasi kondisi fisik sepeda sebelum meninggalkan lokasi.</li>
            </ol>
          </div>
        </div>

        {/* Close Button / Screenshot CTA */}
        <button 
          onClick={onClose}
          className="w-full py-3 bg-[#39FF14] text-black font-extrabold uppercase rounded-xl text-xs tracking-wider shadow-[0_0_15px_rgba(57,255,20,0.2)] hover:bg-white hover:shadow-none transition-all duration-300"
        >
          Tutup Karcis
        </button>
      </div>
    </div>
  );
}
