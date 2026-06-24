import React, { useState } from 'react';

// ─── Helper: rupiah formatter ───
const rp = (n) => `Rp ${parseFloat(n || 0).toLocaleString('id-ID')}`;

// ─── Badge definitif "Verified Store" (toko dengan jam_operasional & no_telepon terisi) ───
function isVerified(bike) {
  return !!(bike.jam_operasional && bike.no_telepon && bike.nama_toko);
}

// ─── Spek fisik berdasarkan jenis_sepeda ───
const BIKE_SPECS = {
  gunung:    { gigi: '21 Speed', berat: '12–14 kg', ban: '26"',  cocok: 'Jalur pegunungan & offroad' },
  lipat:     { gigi: '7 Speed',  berat: '10–12 kg', ban: '20"',  cocok: 'Mudah dibawa & parkir' },
  onthel:    { gigi: 'Single',   berat: '14–18 kg', ban: '28"',  cocok: 'Wisata santai kota tua' },
  city_bike: { gigi: '3–7 Speed',berat: '11–13 kg', ban: '700c', cocok: 'Jalan raya & flat city' },
  listrik:   { gigi: 'E-Drive',  berat: '20–24 kg', ban: '26"',  cocok: 'Tanpa capek, jarak jauh' },
};

// ─── Component: BikeImageCarousel ───
function BikeImageCarousel({ bike }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const photos = React.useMemo(() => {
    if (Array.isArray(bike.foto_urls) && bike.foto_urls.length > 0) {
      return bike.foto_urls.map(p => p.src);
    }
    if (bike.foto_url) {
      return [bike.foto_url];
    }
    return [];
  }, [bike.foto_url, bike.foto_urls]);

  if (photos.length === 0) {
    return (
      <div className="text-center space-y-1">
        <span className="text-3xl font-extrabold text-[#333333] uppercase select-none tracking-widest block">{bike.jenis_sepeda}</span>
        <span className="text-[10px] text-[#a0a0a0] tracking-widest uppercase font-bold">Foto Belum Tersedia</span>
      </div>
    );
  }

  const next = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  const prev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  return (
    <div className="w-full h-full relative group/carousel">
      <img
        src={photos[currentIndex]}
        alt={`${bike.nama_sepeda} - ${currentIndex + 1}`}
        className="object-cover h-full w-full opacity-90 transition-opacity duration-300 group-hover/carousel:opacity-100"
        onError={e => { e.target.src = 'https://placehold.co/600x400/1e1e1e/555?text=Error'; }}
      />
      {photos.length > 1 && (
        <>
          <button
            onClick={prev}
            type="button"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/60 hover:bg-black/90 text-[#39FF14] text-xs font-black transition-all opacity-0 group-hover/carousel:opacity-100 flex items-center justify-center border border-[#2d2d2d]"
          >
            ‹
          </button>
          <button
            onClick={next}
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-black/60 hover:bg-black/90 text-[#39FF14] text-xs font-black transition-all opacity-0 group-hover/carousel:opacity-100 flex items-center justify-center border border-[#2d2d2d]"
          >
            ›
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 bg-black/40 px-2 py-1 rounded-full backdrop-blur-sm border border-white/5">
            {photos.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  currentIndex === i ? 'bg-[#39FF14] w-3' : 'bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function SearchFilter({ bikes = [], currentUser, onSelectBike }) {
  const [selectedTab, setSelectedTab] = useState('semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('semua');
  const [maxPrice, setMaxPrice] = useState(250000);
  const [expandedSpecs, setExpandedSpecs] = useState(null); // bike.id yang sedang expand spec

  const handlePesanClick = (bike) => { onSelectBike(bike); };

  const tabs = [
    { id: 'semua',     label: 'Semua Sepeda' },
    { id: 'gunung',    label: '🏔 Gunung' },
    { id: 'lipat',     label: '🪗 Lipat' },
    { id: 'onthel',    label: '🚲 Onthel' },
    { id: 'city_bike', label: '🏙 City Bike' },
    { id: 'listrik',   label: '⚡ Listrik' },
  ];

  const uniqueLocations = ['semua', ...new Set(bikes.map(bike => {
    if (!bike.alamat_toko) return 'Yogyakarta';
    const parts = bike.alamat_toko.split(',');
    return parts[parts.length - 1].trim();
  }))];

  const filteredBikes = bikes.filter(bike => {
    const matchesTab    = selectedTab === 'semua' || bike.jenis_sepeda === selectedTab;
    const matchesSearch =
      bike.nama_sepeda.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bike.nama_toko || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bike.alamat_toko || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPrice  = parseFloat(bike.harga_per_hari) <= maxPrice;
    const bikeLoc = bike.alamat_toko ? bike.alamat_toko.split(',').pop().trim().toLowerCase() : '';
    const matchesLocation = selectedLocation === 'semua' || bikeLoc === selectedLocation.toLowerCase();
    return matchesTab && matchesSearch && matchesPrice && matchesLocation;
  });

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-10 space-y-8 bg-[#121212]">
      {/* Title Header */}
      <div className="text-left space-y-2">
        <h2 className="text-2xl md:text-3xl font-black uppercase text-white tracking-tight">
          Cari &amp; Filter <span className="text-[#39FF14]">Koleksi Sepeda</span>
        </h2>
        <p className="text-xs md:text-sm text-[#a0a0a0]">Temukan unit terbaik terdekat dari lokasi Anda di Yogyakarta. Toko ber-<span className="text-[#39FF14] font-bold">✅ Verified</span> sudah terverifikasi oleh tim piTrahan.</p>
      </div>

      {/* Filter controls panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-[#1e1e1e] border border-[#2d2d2d] rounded-2xl">
        <div className="flex flex-col space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#a0a0a0]">Kata Kunci</label>
          <input
            type="text"
            placeholder="Cari nama sepeda, toko..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-4 py-3 bg-[#121212] border border-[#333333] focus:border-[#39FF14] text-white rounded-xl text-sm focus:outline-none transition-all duration-300"
          />
        </div>

        <div className="flex flex-col space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#a0a0a0]">Lokasi Toko</label>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-4 py-3 bg-[#121212] border border-[#333333] focus:border-[#39FF14] text-white rounded-xl text-sm focus:outline-none transition-all duration-300"
          >
            {uniqueLocations.map(loc => (
              <option key={loc} value={loc} className="bg-[#1e1e1e] text-white uppercase text-xs font-bold">
                {loc === 'semua' ? 'Semua Lokasi' : loc}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-xs font-bold uppercase tracking-wider text-[#a0a0a0]">Harga Maks / Hari</label>
            <span className="text-sm font-bold text-[#39FF14]">{rp(maxPrice)}</span>
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
          <span className="text-[10px] text-[#555]">{filteredBikes.filter(isVerified).length} toko terverifikasi</span>
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
            const verified = isVerified(bike);
            const specs    = BIKE_SPECS[bike.jenis_sepeda] || null;
            const hargaJam = bike.harga_per_jam ? parseFloat(bike.harga_per_jam) : Math.round(parseFloat(bike.harga_per_hari) / 8);
            const isExpanded = expandedSpecs === bike.id;

            let statusText = 'Tersedia';
            let badgeClass = 'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/30';
            if (bike.status_ketersediaan === 'disewa') {
              statusText = 'Disewa'; badgeClass = 'bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/30';
            } else if (bike.status_ketersediaan === 'servis') {
              statusText = 'Servis'; badgeClass = 'bg-[#FF3E3E]/10 text-[#FF3E3E] border-[#FF3E3E]/30';
            }

            return (
              <div key={bike.id} className="bento-card p-5 flex flex-col justify-between space-y-4 hover:border-glow-green">

                {/* ── Foto / Placeholder ── */}
                <div className="h-44 w-full bg-gradient-to-br from-[#252525] to-[#121212] rounded-xl flex items-center justify-center relative overflow-hidden border border-[#2d2d2d]">
                  <div className="absolute -right-10 -bottom-10 w-32 h-32 border-[8px] border-[#39FF14]/5 rounded-full pointer-events-none" />
                  <div className="absolute -left-10 -top-10 w-28 h-28 border-[8px] border-[#39FF14]/5 rounded-full pointer-events-none" />

                  <BikeImageCarousel bike={bike} />

                  {/* Status badge */}
                  <span className={`absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${badgeClass}`}>
                    {statusText}
                  </span>

                  {/* Verified store badge */}
                  {verified && (
                    <span className="absolute top-3 left-3 px-2 py-1 rounded-full text-[9px] font-black uppercase bg-[#39FF14]/90 text-black border border-[#39FF14] flex items-center gap-1">
                      ✅ Verified
                    </span>
                  )}
                </div>

                {/* ── Info teks ── */}
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-extrabold text-white text-lg tracking-tight uppercase line-clamp-1">{bike.nama_sepeda}</h3>
                    <span className="px-2 py-0.5 bg-[#121212] border border-[#2d2d2d] rounded text-[10px] uppercase font-bold text-[#39FF14]">
                      {bike.jenis_sepeda.replace('_', ' ')}
                    </span>
                  </div>

                  {bike.deskripsi && (
                    <p className="text-xs text-[#a0a0a0] leading-relaxed line-clamp-2">{bike.deskripsi}</p>
                  )}

                  <div className="text-xs space-y-0.5 text-[#a0a0a0]">
                    <p className="flex items-center gap-1">
                      <span className="text-[#39FF14] font-semibold">🏪</span>
                      {bike.nama_toko}
                      {verified && <span className="text-[#39FF14] text-[9px] font-black">✅</span>}
                    </p>
                    <p className="line-clamp-1"><span className="text-[#39FF14] font-semibold">📍</span> {bike.alamat_toko}</p>
                    {bike.no_telepon && <p><span className="text-[#39FF14] font-semibold">📱</span> {bike.no_telepon}</p>}
                    {bike.jam_operasional && <p><span className="text-[#39FF14] font-semibold">🕐</span> {bike.jam_operasional}</p>}
                  </div>

                  {/* ── Spesifikasi fisik (toggle) ── */}
                  {specs && (
                    <div>
                      <button
                        onClick={() => setExpandedSpecs(isExpanded ? null : bike.id)}
                        className="text-[9px] uppercase font-black text-[#39FF14]/70 hover:text-[#39FF14] transition-colors flex items-center gap-1"
                      >
                        {isExpanded ? '▲' : '▼'} Lihat Spesifikasi
                      </button>
                      {isExpanded && (
                        <div className="mt-2 grid grid-cols-2 gap-1.5 p-3 bg-[#0d0d0d] rounded-xl border border-[#2d2d2d] text-[9px]">
                          {[
                            ['⚙️ Gigi', specs.gigi],
                            ['⚖️ Berat', specs.berat],
                            ['🔵 Ban', specs.ban],
                            ['🎯 Cocok untuk', specs.cocok],
                          ].map(([k, v]) => (
                            <div key={k}>
                              <p className="text-[#555] uppercase">{k}</p>
                              <p className="text-white font-bold">{v}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Addon tersedia ── */}
                  <div className="flex gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 text-[8px] font-black uppercase bg-[#2d2d2d] text-[#a0a0a0] rounded-full">⛑️ Helm +Rp10rb</span>
                    <span className="px-2 py-0.5 text-[8px] font-black uppercase bg-[#2d2d2d] text-[#a0a0a0] rounded-full">🔒 Kunci +Rp5rb</span>
                    {bike.deposit_fee > 0 && (
                      <span className="px-2 py-0.5 text-[8px] font-black uppercase bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/20 rounded-full">
                        🛡 Deposit {rp(bike.deposit_fee)}
                      </span>
                    )}
                  </div>
                </div>

                {/* ── Footer harga & CTA ── */}
                <div className="flex justify-between items-center pt-3 border-t border-[#2d2d2d]">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#a0a0a0]">Mulai dari</span>
                    <span className="text-white font-extrabold text-sm md:text-md">
                      {rp(bike.harga_per_hari)}
                      <span className="text-[10px] text-[#a0a0a0] font-normal uppercase">/hari</span>
                    </span>
                    <span className="text-[9px] text-[#555]">≈ {rp(hargaJam)}/jam</span>
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
                      className={`px-4 py-2 font-bold uppercase rounded-lg text-xs cursor-not-allowed border ${
                        bike.status_ketersediaan === 'servis'
                          ? 'bg-[#FF3E3E]/10 text-[#FF3E3E] border-[#FF3E3E]/30'
                          : 'bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/30'
                      }`}
                    >
                      {bike.status_ketersediaan === 'servis' ? 'Servis' : 'Disewa'}
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
