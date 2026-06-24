import React from 'react';

export default function HeroSection({ currentUser, onStartRental, onOpenAuth }) {
  return (
    <section className="relative min-h-[85vh] flex flex-col justify-center items-center px-6 py-12 text-center bg-[#121212] overflow-hidden">
      {/* Decorative Neon Background Blurs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-[#39FF14] opacity-[0.07] blur-[100px] pointer-events-none rounded-full" />
      <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-[#39FF14] opacity-[0.05] blur-[120px] pointer-events-none rounded-full" />

      {/* Hero Content Wrapper */}
      <div className="max-w-3xl z-10 space-y-6">
        {/* Tag */}
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#1e1e1e] border border-[#2d2d2d] rounded-full text-xs font-semibold tracking-wider text-[#39FF14]">
          <span className="w-2 h-2 rounded-full bg-[#39FF14] animate-pulse"></span>
          RENTAL SEPEDA YOGYAKARTA
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight uppercase">
          Eksplor Jogja Lebih Bebas, Sewa Sepeda Mulai <span className="text-[#39FF14] glow-green font-black">Rp40rb<span className="text-white">/Hari</span></span>
        </h1>

        {/* Subtitle */}
        <p className="text-[#a0a0a0] text-sm md:text-lg max-w-xl mx-auto leading-relaxed">
          Penyewaan sepeda instan, tanpa ribet.
          Dukung pemesanan{' '}
          <span className="text-[#39FF14] font-bold">Guest Booking</span>{' '}
          — wisatawan dan mahasiswa bisa langsung menyewa sepeda secara cepat.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4 w-full max-w-md mx-auto">
          <button
            onClick={onStartRental}
            className="w-full sm:w-auto px-8 py-4 bg-[#39FF14] text-[#0b0f19] font-extrabold uppercase rounded-xl tracking-wider text-sm hover:bg-white transition-all duration-300 shadow-[0_0_20px_rgba(57,255,20,0.3)] hover:shadow-none hover:scale-105 active:scale-95"
          >
            Sewa Sekarang
          </button>

          {!currentUser && (
            <button
              onClick={onOpenAuth}
              className="w-full sm:w-auto px-8 py-4 bg-[#1e1e1e] text-white border border-[#333333] hover:border-[#39FF14] font-semibold uppercase rounded-xl tracking-wider text-sm transition-all duration-300 hover:scale-105 active:scale-95"
            >
              Masuk / Daftar
            </button>
          )}
        </div>
      </div>

      {/* Floating features dashboard in Bento grid style */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mt-16 z-10 w-full">
        <div className="p-5 bg-[#1e1e1e]/60 border border-[#2d2d2d] rounded-2xl text-left">
          <span className="text-[#39FF14] text-2xl font-bold block mb-1">01</span>
          <h3 className="text-white text-sm font-bold uppercase">Guest Booking</h3>
          <p className="text-xs text-[#a0a0a0] mt-1">Sewa sepeda tanpa harus daftar akun.</p>
        </div>

        <div className="p-5 bg-[#1e1e1e]/60 border border-[#2d2d2d] rounded-2xl text-left">
          <span className="text-[#39FF14] text-2xl font-bold block mb-1">02</span>
          <h3 className="text-white text-sm font-bold uppercase">Bayar Offline</h3>
          <p className="text-xs text-[#a0a0a0] mt-1">Bayar tunai saat ambil sepeda di toko.</p>
        </div>

        <div className="p-5 col-span-2 md:col-span-1 bg-[#1e1e1e]/60 border border-[#2d2d2d] rounded-2xl text-left">
          <span className="text-white text-2xl font-bold block mb-1">03</span>
          <h3 className="text-white text-sm font-bold uppercase">Lokasi Strategis</h3>
          <p className="text-xs text-[#a0a0a0] mt-1">Tersebar di dekat kampus &amp; wisata Yogyakarta.</p>
        </div>
      </div>
    </section>
  );
}
