import React, { useState, useEffect } from 'react';
import qrisImg from '../assets/qris.png';

// ─── Helper: format tanggal tanpa bug UTC ───
function formatTglID(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
}

// ─── Jam operasional default ───
const DEFAULT_TIMES = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00'];

// ─── Component: BookingBikeImageCarousel ───
function BookingBikeImageCarousel({ bike }) {
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
      <div className="w-24 h-18 rounded-lg bg-[#1a1a1a] border border-[#2d2d2d] flex items-center justify-center flex-shrink-0 text-[8px] text-[#555] uppercase font-black">
        No Pic
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
    <div className="w-24 h-18 rounded-lg bg-[#1a1a1a] border border-[#2d2d2d] overflow-hidden flex-shrink-0 relative group/mini">
      <img
        src={photos[currentIndex]}
        alt={`${bike.nama_sepeda} - ${currentIndex + 1}`}
        className="w-full h-full object-cover"
        onError={e => { e.target.src = 'https://placehold.co/150x100/1e1e1e/555?text=Bike'; }}
      />
      {photos.length > 1 && (
        <>
          <button
            onClick={prev}
            type="button"
            className="absolute left-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-black/70 hover:bg-black/90 text-[#39FF14] text-[10px] font-black transition-all opacity-0 group-hover/mini:opacity-100 flex items-center justify-center"
          >
            ‹
          </button>
          <button
            onClick={next}
            type="button"
            className="absolute right-1 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-black/70 hover:bg-black/90 text-[#39FF14] text-[10px] font-black transition-all opacity-0 group-hover/mini:opacity-100 flex items-center justify-center"
          >
            ›
          </button>
          <span className="absolute bottom-1 right-1 bg-black/60 px-1 py-0.5 rounded text-[7px] font-black text-[#39FF14]">
            {currentIndex + 1}/{photos.length}
          </span>
        </>
      )}
    </div>
  );
}

export default function BookingForm({ bike, currentUser, getTodayLocal, onSubmitBooking, onClose }) {
  const todayStr = getTodayLocal ? getTodayLocal() : (() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
  })();

  const [step, setStep] = useState(1);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('09:00');
  const [durasiMode, setDurasiMode] = useState('hari');
  const [duration, setDuration] = useState(1);
  const [addons, setAddons] = useState({ helm: false, kunci_pengaman: false });
  const [paymentMethod, setPaymentMethod] = useState('qris');
  const [errors, setErrors] = useState({});
  const [pricePreview, setPricePreview] = useState(0);

  // ─── Kalkulasi harga dinamis ───
  useEffect(() => {
    if (!bike) return;
    let base = 0;
    if (durasiMode === 'hari') {
      base = parseFloat(bike.harga_per_hari || 0) * duration;
    } else {
      const hargaJam = parseFloat(bike.harga_per_jam || (bike.harga_per_hari / 8) || 0);
      base = hargaJam * duration;
    }
    const addonPrice = (addons.helm ? 10000 : 0) + (addons.kunci_pengaman ? 5000 : 0);
    setPricePreview(base + addonPrice);
  }, [bike, duration, durasiMode, addons]);

  const hargaUnit = durasiMode === 'hari'
    ? parseFloat(bike?.harga_per_hari || 0)
    : parseFloat(bike?.harga_per_jam || (bike?.harga_per_hari / 8) || 0);

  const satuanLabel = durasiMode === 'hari' ? 'hari' : 'jam';
  const maxDurasi   = durasiMode === 'hari' ? 30 : 72;
  const depositVal  = parseFloat(bike?.deposit_fee || 0);

  const handleAddonChange = (e) => {
    const { name, checked } = e.target;
    setAddons(prev => ({ ...prev, [name]: checked }));
  };

  const validateStep1 = () => {
    const errs = {};

    if (!currentUser) {
      if (!guestName.trim()) errs.guestName = 'Nama lengkap wajib diisi.';
      if (!guestPhone.trim()) {
        errs.guestPhone = 'Nomor telepon wajib diisi.';
      } else if (!/^[0-9+\- ]{8,20}$/.test(guestPhone.trim())) {
        errs.guestPhone = 'Format nomor telepon tidak valid (8–20 digit).';
      }
      if (guestEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim())) {
        errs.guestEmail = 'Format email tidak valid.';
      }
    }

    if (!pickupDate) {
      errs.pickupDate = 'Tanggal pengambilan wajib diisi.';
    } else if (pickupDate < todayStr) {
      errs.pickupDate = 'Tanggal pengambilan tidak boleh di masa lalu.';
    }

    if (!pickupTime) {
      errs.pickupTime = 'Waktu pengambilan wajib diisi.';
    }

    if (!duration || duration < 1) {
      errs.duration = `Durasi minimal 1 ${satuanLabel}.`;
    } else if (duration > maxDurasi) {
      errs.duration = `Durasi maksimal ${maxDurasi} ${satuanLabel}.`;
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNextStep = (e) => {
    e.preventDefault();
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedAddons = [];
    if (addons.helm) selectedAddons.push({ nama_alat: 'helm' });
    if (addons.kunci_pengaman) selectedAddons.push({ nama_alat: 'kunci_pengaman' });

    onSubmitBooking({
      bike_id: bike.id,
      tanggal_ambil: pickupDate,
      waktu_ambil: pickupTime,
      durasi_sewa: duration,
      durasi_mode: durasiMode,
      addons: selectedAddons,
      metode_pembayaran: paymentMethod,
      ...(currentUser ? {} : { guest_name: guestName, guest_phone: guestPhone, guest_email: guestEmail }),
    });
  };

  if (!bike) return null;

  const inputCls = 'w-full px-3 py-2 bg-[#121212] border border-[#333333] text-white rounded-lg text-sm focus:outline-none focus:border-[#39FF14] transition-colors';
  const labelCls = 'text-[10px] uppercase font-bold text-[#a0a0a0]';

  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center bg-black/80 z-50 p-0 sm:p-4 overflow-y-auto">
      {/* Container Modal with strict heights and flexible layouts */}
      <div className="bg-[#1e1e1e] border-t sm:border border-[#2d2d2d] rounded-t-2xl sm:rounded-2xl w-full max-w-lg flex flex-col max-h-[92vh] sm:max-h-[85vh] relative overflow-hidden">
        
        {/* Sticky Header */}
        <div className="px-6 py-4 border-b border-[#2d2d2d] flex items-center justify-between bg-[#1e1e1e] z-10 flex-shrink-0">
          <div className="space-y-0.5">
            <h3 className="text-lg font-black uppercase text-white tracking-tight flex items-center gap-2">
              <span className="text-[#39FF14]">{step === 1 ? '🚲 Detail Sewa' : '💳 Pembayaran'}</span>
            </h3>
            <p className="text-[10px] text-[#a0a0a0] truncate">
              {bike.nama_sepeda} · <strong className="text-white">{bike.nama_toko}</strong>
            </p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#121212] hover:bg-[#2d2d2d] text-[#a0a0a0] hover:text-white text-lg font-bold transition-all flex items-center justify-center">
            ×
          </button>
        </div>

        {/* Stepper Status Bar */}
        <div className="bg-[#151515] px-6 py-2 border-b border-[#2d2d2d] flex items-center justify-between text-[9px] uppercase font-bold tracking-widest text-[#a0a0a0] flex-shrink-0">
          <span className={step === 1 ? 'text-[#39FF14]' : ''}>1. Isi Data &amp; Tanggal</span>
          <div className="h-0.5 flex-1 mx-3 bg-[#2d2d2d] relative">
            <div className="absolute top-0 bottom-0 left-0 bg-[#39FF14] transition-all duration-300" style={{ width: step === 1 ? '50%' : '100%' }} />
          </div>
          <span className={step === 2 ? 'text-[#39FF14]' : ''}>2. Pilih Pembayaran</span>
        </div>

        {/* Scrollable Contents Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 pb-36 scrollbar-none">
          
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-4">
              
              {/* Bike Mini Preview Banner */}
              <div className="p-3 bg-[#121212] border border-[#2d2d2d] rounded-xl flex items-center gap-3">
              <BookingBikeImageCarousel bike={bike} />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black text-white uppercase tracking-tight truncate">{bike.nama_sepeda}</h4>
                    <span className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/20">
                      Tersedia
                    </span>
                  </div>
                  <p className="text-[9px] text-[#a0a0a0] truncate">🏪 {bike.nama_toko} · 📍 {bike.alamat_toko}</p>
                  <p className="text-[9px] text-[#39FF14] font-bold">💰 Sewa: Rp {parseFloat(bike.harga_per_hari).toLocaleString('id-ID')}/hari · Deposit: Rp {parseFloat(bike.deposit_fee || 0).toLocaleString('id-ID')}</p>
                </div>
              </div>

              {/* Guest / Account Info Card */}
              {currentUser ? (
                <div className="p-3 bg-[#121212] border border-[#39FF14]/20 rounded-xl text-xs flex items-center justify-between">
                  <div>
                    <p className="text-[9px] uppercase font-bold text-[#a0a0a0]">Memesan sebagai:</p>
                    <p className="text-white font-bold">{currentUser.nama} ({currentUser.email})</p>
                  </div>
                  <span className="px-2 py-0.5 bg-[#39FF14]/10 text-[#39FF14] rounded-lg text-[8px] font-black uppercase">Pelanggan</span>
                </div>
              ) : (
                <div className="space-y-3 p-4 bg-[#121212] border border-[#39FF14]/15 rounded-xl">
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] font-black uppercase text-[#39FF14] tracking-wider">Mode Guest (Tanpa Akun)</p>
                    <span className="text-[8px] text-[#a0a0a0] uppercase">Praktis &amp; Cepat</span>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className={labelCls}>Nama Lengkap *</label>
                        <input type="text" value={guestName} onChange={e => setGuestName(e.target.value)}
                          placeholder="Masukkan nama sesuai KTP" className={inputCls} />
                        {errors.guestName && <p className="text-[10px] text-[#FF3E3E] font-medium">{errors.guestName}</p>}
                      </div>
                      <div className="space-y-1">
                        <label className={labelCls}>No. WhatsApp *</label>
                        <input type="tel" value={guestPhone} onChange={e => setGuestPhone(e.target.value)}
                          placeholder="Contoh: 08123456789" className={inputCls} />
                        {errors.guestPhone && <p className="text-[10px] text-[#FF3E3E] font-medium">{errors.guestPhone}</p>}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className={labelCls}>Alamat Email (Opsional, untuk e-receipt)</label>
                      <input type="email" value={guestEmail} onChange={e => setGuestEmail(e.target.value)}
                        placeholder="contoh@domain.com" className={inputCls} />
                      {errors.guestEmail && <p className="text-[10px] text-[#FF3E3E] font-medium">{errors.guestEmail}</p>}
                    </div>
                  </div>
                </div>
              )}

              {/* Tanggal & Waktu Ambil */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className={labelCls}>Tanggal Ambil *</label>
                  <input type="date" min={todayStr} value={pickupDate}
                    onChange={e => setPickupDate(e.target.value)} className={inputCls} />
                  {errors.pickupDate && <p className="text-[10px] text-[#FF3E3E] font-medium">{errors.pickupDate}</p>}
                </div>
                <div className="space-y-1">
                  <label className={labelCls}>Waktu Ambil *</label>
                  <select value={pickupTime} onChange={e => setPickupTime(e.target.value)} className={inputCls}>
                    {DEFAULT_TIMES.map(t => (
                      <option key={t} value={t}>{t} WIB</option>
                    ))}
                  </select>
                  {errors.pickupTime && <p className="text-[10px] text-[#FF3E3E] font-medium">{errors.pickupTime}</p>}
                </div>
              </div>

              {/* Satuan Sewa */}
              <div className="space-y-2">
                <label className={labelCls}>Satuan Sewa</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { val: 'hari', icon: '🗓️', label: 'Per Hari', harga: `Rp ${parseFloat(bike.harga_per_hari||0).toLocaleString('id-ID')}/hari` },
                    { val: 'jam',  icon: '⏱️', label: 'Per Jam',  harga: `Rp ${parseFloat(bike.harga_per_jam || Math.round(bike.harga_per_hari/8)||0).toLocaleString('id-ID')}/jam` },
                  ].map(m => (
                    <label key={m.val}
                      className={`flex flex-col items-center p-2.5 border rounded-xl cursor-pointer select-none transition-all text-center ${
                        durasiMode === m.val
                          ? 'border-[#39FF14] bg-[#39FF14]/5'
                          : 'border-[#333] bg-[#121212] hover:border-[#555]'
                      }`}>
                      <input type="radio" value={m.val} checked={durasiMode === m.val}
                        onChange={() => { setDurasiMode(m.val); setDuration(1); }} className="sr-only" />
                      <span className="text-base">{m.icon}</span>
                      <span className={`text-[10px] font-black mt-0.5 ${durasiMode === m.val ? 'text-[#39FF14]' : 'text-white'}`}>{m.label}</span>
                      <span className="text-[8px] text-[#a0a0a0]">{m.harga}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Durasi */}
              <div className="space-y-1.5">
                <label className={labelCls}>Durasi Sewa ({satuanLabel}) — Maks. {maxDurasi} {satuanLabel}</label>
                <div className="flex items-center gap-3">
                  <button type="button"
                    onClick={() => setDuration(d => Math.max(1, d - 1))}
                    className="w-9 h-9 rounded-lg bg-[#121212] border border-[#333] text-white font-black hover:border-[#39FF14] transition-all flex items-center justify-center text-lg">
                    −
                  </button>
                  <input type="number" min="1" max={maxDurasi} value={duration}
                    onChange={e => setDuration(Math.min(maxDurasi, Math.max(1, parseInt(e.target.value)||1)))}
                    className="flex-1 px-3 py-2 text-center bg-[#121212] border border-[#333333] text-white rounded-lg text-sm font-bold focus:outline-none focus:border-[#39FF14] transition-colors" />
                  <button type="button"
                    onClick={() => setDuration(d => Math.min(maxDurasi, d + 1))}
                    className="w-9 h-9 rounded-lg bg-[#121212] border border-[#333] text-white font-black hover:border-[#39FF14] transition-all flex items-center justify-center text-lg">
                    +
                  </button>
                </div>
                {errors.duration && <p className="text-[10px] text-[#FF3E3E] font-medium">{errors.duration}</p>}
              </div>

              {/* Addons Selection */}
              <div className="space-y-2">
                <label className={labelCls}>Perlengkapan Tambahan (Add-on)</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { name: 'helm', label: 'Perlindungan Kepala (Helm Higienis & Steril)', price: '+Rp10.000', icon: '⛑️', desc: 'Dicuci & disanitasi berkala' },
                    { name: 'kunci_pengaman', label: 'Keamanan Ekstra (Kunci Gembok Ganda)', price: '+Rp5.000', icon: '🔒', desc: 'Kabel baja tebal berlapis' },
                  ].map(a => (
                    <label key={a.name}
                      className={`flex flex-col p-3 border rounded-xl cursor-pointer select-none transition-colors ${
                        addons[a.name] ? 'border-[#39FF14] bg-[#39FF14]/5' : 'bg-[#121212] border-[#333] hover:border-[#39FF14]'
                      }`}>
                      <div className="flex items-start gap-2">
                        <input type="checkbox" name={a.name} checked={addons[a.name]}
                          onChange={handleAddonChange} className="w-4 h-4 accent-[#39FF14] mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-black text-white leading-tight">{a.icon} {a.label}</p>
                          <p className="text-[9px] text-[#39FF14] font-bold mt-0.5">{a.price}</p>
                        </div>
                      </div>
                      <p className="text-[8px] text-[#555] mt-1 pl-6">{a.desc}</p>
                    </label>
                  ))}
                </div>
              </div>

              {/* Transparansi Biaya & Syarat Jaminan */}
              <div className="p-3.5 bg-[#121212] border border-[#2d2d2d] rounded-xl space-y-2 text-[10px] text-[#a0a0a0]">
                <p className="font-bold text-white uppercase text-[11px] flex items-center gap-1.5">
                  📋 Transparansi Biaya &amp; Kebijakan Toko
                </p>
                <div className="space-y-2 leading-relaxed">
                  <div className="flex items-start gap-2">
                    <span className="text-[#39FF14] text-xs flex-shrink-0">🛡️</span>
                    <p>
                      <strong className="text-white">Uang Jaminan Deposit (Refundable):</strong> Sebesar <strong className="text-[#FFD700]">Rp {depositVal.toLocaleString('id-ID')}</strong> akan ditambahkan ke tagihan dan dikembalikan penuh 100% saat sepeda dikembalikan tanpa kerusakan fisik berat.
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[#39FF14] text-xs flex-shrink-0">⚡</span>
                    <p>
                      <strong className="text-white">Biaya Layanan Platform / Admin:</strong> Rp 0 (GRATIS tanpa biaya tersembunyi).
                    </p>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-[#FF3E3E] text-xs flex-shrink-0">⏱️</span>
                    <p>
                      <strong className="text-white">Denda Keterlambatan:</strong> Dikenakan Rp10.000 per jam setelah lewat masa toleransi 15 menit. Mohon dikembalikan tepat waktu untuk menghargai penyewa berikutnya.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4">
              
              {/* Payment Method Selector */}
              <div className="space-y-2">
                <label className={labelCls}>Pilih Metode Pembayaran</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'qris',     icon: '📱', label: 'QRIS',     sub: 'Otomatis / Bank' },
                    { val: 'transfer', icon: '🏦', label: 'BCA Transfer',  sub: 'Manual Check' },
                    { val: 'offline',  icon: '💵', label: 'Bayar Toko',   sub: 'Cash di Kasir' },
                  ].map(m => (
                    <label key={m.val}
                      className={`flex flex-col items-center p-3 border rounded-xl cursor-pointer select-none text-center transition-colors ${
                        paymentMethod === m.val ? 'border-[#39FF14] bg-[#39FF14]/5' : 'border-[#333] bg-[#121212]'
                      }`}>
                      <input type="radio" name="payment" value={m.val}
                        checked={paymentMethod === m.val} onChange={() => setPaymentMethod(m.val)} className="sr-only" />
                      <span className="text-lg mb-1">{m.icon}</span>
                      <span className="text-[10px] font-black text-white">{m.label}</span>
                      <span className="text-[8px] text-[#a0a0a0] leading-tight">{m.sub}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Dynamic Payment Guide */}
              <div className="p-4 bg-[#121212] border border-[#2d2d2d] rounded-xl text-center space-y-2">
                {paymentMethod === 'qris' && (
                  <>
                    <div className="w-36 bg-white mx-auto p-1.5 rounded-lg flex items-center justify-center border border-[#2d2d2d]">
                      <img src={qrisImg} alt="QRIS piTrahan" className="w-full h-auto object-contain" />
                    </div>
                    <p className="text-xs font-bold text-white uppercase tracking-wider">QRIS piTrahan Jogja</p>
                    <p className="text-[9px] text-[#a0a0a0]">Pindai QR di atas memakai GoPay, OVO, Dana, LinkAja, atau m-Banking Anda.</p>
                  </>
                )}
                {paymentMethod === 'transfer' && (
                  <>
                    <p className="text-2xl">🏛️</p>
                    <p className="text-xs font-bold text-white uppercase tracking-wider">Transfer Bank BCA</p>
                    <p className="text-xs font-mono font-bold text-white bg-[#0d0d0d] py-1 px-3 rounded-lg border border-[#2d2d2d] inline-block mt-1">
                      803-5123-4567
                    </p>
                    <p className="text-[9px] text-[#a0a0a0] mt-1">Atas nama: <span className="text-white font-bold">PT piTrahan Transportasi Jogja</span></p>
                  </>
                )}
                {paymentMethod === 'offline' && (
                  <>
                    <p className="text-2xl">💵</p>
                    <p className="text-xs font-bold text-white uppercase tracking-wider">Bayar Langsung Di Toko</p>
                    <p className="text-[9px] text-[#a0a0a0]">Anda dapat membayar menggunakan tunai, kartu debit, atau QRIS langsung di kasir toko saat pengambilan sepeda.</p>
                    <p className="text-[9px] text-[#39FF14] font-bold">Toko: {bike.nama_toko}</p>
                  </>
                )}
              </div>

              {/* Detail Transparansi Rincian Pembayaran */}
              <div className="p-4 bg-[#121212] border border-[#2d2d2d] rounded-xl space-y-2 text-xs">
                <p className="text-[10px] uppercase font-black tracking-wider text-[#a0a0a0] border-b border-[#222] pb-1">Rincian Tagihan Akhir</p>
                
                <div className="flex justify-between">
                  <span className="text-[#a0a0a0]">Tarif Sewa ({duration} {satuanLabel}):</span>
                  <span className="text-white font-bold">Rp {pricePreview.toLocaleString('id-ID')}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-[#a0a0a0]">Jaminan Deposit (Refundable):</span>
                  <span className="text-[#FFD700] font-bold">Rp {depositVal.toLocaleString('id-ID')}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-[#a0a0a0]">Biaya Admin:</span>
                  <span className="text-[#39FF14] font-bold">Rp 0 (GRATIS)</span>
                </div>

                <div className="flex justify-between border-t border-[#222] pt-2 font-bold text-sm">
                  <span className="text-white">Total Transfer/Bayar:</span>
                  <span className="text-[#39FF14] font-black glow-green">
                    Rp {(pricePreview + depositVal).toLocaleString('id-ID')}
                  </span>
                </div>
                
                <p className="text-[8px] text-[#555] text-center italic mt-2">
                  * Deposit sebesar Rp {depositVal.toLocaleString('id-ID')} akan dikembalikan utuh via transfer / tunai segera setelah sepeda dikembalikan dalam keadaan baik.
                </p>
              </div>

            </div>
          )}

        </div>

        {/* ── STICKY BOTTOM PANEL FOR MOBILE ── */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#2d2d2d] p-4 flex flex-col gap-3 z-20 shadow-[0_-8px_24px_rgba(0,0,0,0.6)] flex-shrink-0">
          
          {/* Price & Summary Preview Row */}
          <div className="flex justify-between items-center px-1">
            <div>
              <p className="text-[9px] uppercase font-bold text-[#a0a0a0]">Total Tagihan</p>
              <p className="text-[8px] text-[#555] leading-none mt-0.5">
                {step === 1 ? 'Belum termasuk deposit' : `Sewa Rp ${pricePreview.toLocaleString('id-ID')} + Deposit Refundable`}
              </p>
            </div>
            <div className="text-right">
              <span className="text-white text-xl font-black tracking-tight glow-green">
                Rp {(step === 1 ? pricePreview : (pricePreview + depositVal)).toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          {/* Action Buttons Row */}
          <div className="flex gap-3">
            {step === 1 ? (
              <>
                <button type="button" onClick={onClose}
                  className="flex-1 py-3 bg-[#121212] hover:bg-[#222] text-[#a0a0a0] border border-[#2d2d2d] hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all">
                  Batal
                </button>
                <button type="button" onClick={handleNextStep}
                  className="flex-1 py-3 bg-[#39FF14] text-black font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(57,255,20,0.3)] hover:bg-white transition-all duration-300">
                  Lanjut Pembayaran →
                </button>
              </>
            ) : (
              <>
                <button type="button" onClick={() => setStep(1)}
                  className="flex-1 py-3 bg-[#121212] hover:bg-[#222] text-[#a0a0a0] border border-[#2d2d2d] hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all">
                  ← Edit Data
                </button>
                <button type="button" onClick={handleSubmit}
                  className="flex-1 py-3 bg-[#39FF14] text-black font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(57,255,20,0.3)] hover:bg-white transition-all duration-300">
                  ✓ Konfirmasi Pesanan
                </button>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
