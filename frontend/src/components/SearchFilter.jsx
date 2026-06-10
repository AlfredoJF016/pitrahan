import React, { useState } from 'react';

export default function SearchFilter({ bikes = [], currentUser, onSelectBike }) {
  const [selectedTab, setSelectedTab] = useState('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [maxPrice, setMaxPrice] = useState(250000);

  const handlePesanClick = (bike) => { onSelectBike(bike); };

  const tabs = [
    { id: 'semua',     label: 'Semua Sepeda' },
    { id: 'gunung',    label: 'Gunung' },
    { id: 'lipat',     label: 'Lipat' },
    { id: 'onthel',    label: 'Onthel/Klasik' },
    { id: 'city_bike', label: 'City Bike' },
  ];

  const filteredBikes = bikes.filter(bike => {
    const matchesTab    = selectedTab === 'semua' || bike.jenis_sepeda === selectedTab;
    const matchesSearch =
      bike.nama_sepeda.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bike.nama_toko || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bike.alamat_toko || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice  = parseFloat(bike.harga_per_hari) <= maxPrice;
    return matchesTab && matchesSearch && matchesPrice;
  });

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-10 space-y-8 bg-[#121212]">
      {/* Title Header */}
      <div className="text-left space-y-2">
        <h2 className="text-2xl md:text-3xl font-black uppercase text-white tracking-tight">
          Cari &amp; Filter <span className="text-[#39FF14]">Koleksi Sepeda</span>
        </h2>
        <p className="text-xs md:text-sm text-[#a0a0a0]">Temukan unit terbaik terdekat dari lokasi Anda di Yogyakarta.</p>
      </div>

      {/* Filter controls panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-[#1e1e1e] border border-[#2d2d2d] rounded-2xl">
        <div className="flex flex-col space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#a0a0a0]">Kata Kunci</label>
          <input
            type="text"
            placeholder="Cari nama sepeda, nama toko, atau alamat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-3 bg-[#121212] border border-[#333333] focus:border-[#39FF14] text-white rounded-xl text-sm focus:outline-none transition-all duration-300"
          />
        </div>

        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold uppercase tracking-wider text-[#a0a0a0]">Harga Maks / Hari</label>
            <span className="text-sm font-bold text-[#39FF14]">Rp {maxPrice.toLocaleString('id-ID')}</span>
          </div>
          <input
            type="range" min="20000" max="250000" step="5000"
            value={maxPrice} onChange={(e) => setMaxPrice(parseInt(e.target.value))}
            className="w-full h-1 bg-[#2d2d2d] accent-[#39FF14] rounded-lg cursor-pointer"
          />
        </div>

        <div className="flex flex-col justify-center space-y-1">
          <span className="text-xs font-bold text-[#a0a0a0] uppercase tracking-wider">Hasil Pencarian</span>
          <span className="text-xl font-extrabold text-white">
            {filteredBikes.length} <span className="text-xs text-[#a0a0a0] font-normal uppercase">unit ditemukan</span>
          </span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSelectedTab(tab.id)}
            className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider border whitespace-nowrap transition-all duration-300 ${
              selectedTab === tab.id
                ? 'bg-white text-black border-white'
                : 'bg-[#1e1e1e] text-[#a0a0a0] border-[#2d2d2d] hover:border-[#a0a0a0]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bike Grid */}
      {filteredBikes.length === 0 ? (
        <div className="text-center py-16 bg-[#1e1e1e] border border-[#2d2d2d] rounded-2xl">
          <p className="text-[#a0a0a0] text-sm font-semibold uppercase tracking-wider">Tidak ada sepeda yang cocok dengan kriteria filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBikes.map(bike => {
            let statusText = 'Tersedia';
            let badgeClass = 'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/30';
            if (bike.status_ketersediaan === 'disewa') {
              statusText = 'Disewa'; badgeClass = 'bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/30';
            } else if (bike.status_ketersediaan === 'servis') {
              statusText = 'Servis'; badgeClass = 'bg-[#FF3E3E]/10 text-[#FF3E3E] border-[#FF3E3E]/30';
            }

            return (
              <div key={bike.id} className="bento-card p-5 flex flex-col justify-between space-y-4 hover:border-glow-green">
                <div className="h-44 w-full bg-gradient-to-br from-[#252525] to-[#121212] rounded-xl flex items-center justify-center relative overflow-hidden border border-[#2d2d2d]">
                  <div className="absolute -right-10 -bottom-10 w-32 h-32 border-[8px] border-[#39FF14]/5 rounded-full pointer-events-none" />
                  <div className="absolute -left-10 -top-10 w-28 h-28 border-[8px] border-[#00E5FF]/5 rounded-full pointer-events-none" />

                  {bike.foto_url ? (
                    <img src={bike.foto_url} alt={bike.nama_sepeda}
                      className="object-cover h-full w-full opacity-90 transition-opacity duration-300 hover:opacity-100"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="text-center space-y-1">
                      <span className="text-3xl font-extrabold text-[#333333] uppercase select-none tracking-widest block">{bike.jenis_sepeda}</span>
                      <span className="text-[10px] text-[#a0a0a0] tracking-widest uppercase font-bold">Foto Belum Tersedia</span>
                    </div>
                  )}

                  <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${badgeClass}`}>
                    {statusText}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-extrabold text-white text-lg tracking-tight uppercase line-clamp-1">{bike.nama_sepeda}</h3>
                    <span className="px-2 py-0.5 bg-[#121212] border border-[#2d2d2d] rounded text-[10px] uppercase font-bold text-[#00E5FF]">
                      {bike.jenis_sepeda.replace('_', ' ')}
                    </span>
                  </div>

                  {bike.deskripsi && (
                    <p className="text-xs text-[#a0a0a0] leading-relaxed line-clamp-2">{bike.deskripsi}</p>
                  )}

                  <div className="text-xs space-y-0.5 text-[#a0a0a0]">
                    <p className="flex items-center gap-1"><span className="text-[#00E5FF] font-semibold">🏪</span> {bike.nama_toko}</p>
                    <p className="line-clamp-1"><span className="text-[#00E5FF] font-semibold">📍</span> {bike.alamat_toko}</p>
                    {bike.no_telepon && <p><span className="text-[#00E5FF] font-semibold">📱</span> {bike.no_telepon}</p>}
                    {bike.jam_operasional && <p><span className="text-[#39FF14] font-semibold">🕐</span> {bike.jam_operasional}</p>}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-[#2d2d2d]">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#a0a0a0]">Harga Sewa</span>
                    <span className="text-white font-extrabold text-sm md:text-md">
                      Rp {parseFloat(bike.harga_per_hari).toLocaleString('id-ID')}
                      <span className="text-[10px] text-[#a0a0a0] font-normal uppercase">/hari</span>
                    </span>
                  </div>

                  {bike.status_ketersediaan === 'tersedia' ? (
                    <button
                      onClick={() => handlePesanClick(bike)}
                      className="px-4 py-2 bg-[#39FF14] text-black font-extrabold uppercase rounded-lg text-xs tracking-wider transition-all duration-300 hover:bg-white hover:scale-105 active:scale-95"
                    >
                      Pesan
                    </button>
                  ) : (
                    <button disabled
                      className="px-4 py-2 bg-[#1e1e1e] text-[#555555] border border-[#333333] font-bold uppercase rounded-lg text-xs cursor-not-allowed"
                    >
                      Penuh
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
