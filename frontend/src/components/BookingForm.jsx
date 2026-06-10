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

export default function BookingForm({ bike, currentUser, getTodayLocal, onSubmitBooking, onClose }) {
  const todayStr = getTodayLocal ? getTodayLocal() : (() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
  })();

  const [step, setStep] = useState(1);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('09:00');   // ← BARU: waktu ambil
  const [durasiMode, setDurasiMode] = useState('hari');    // ← BARU: 'hari' | 'jam'
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
      // Per jam — fallback ke harga_per_jam, atau estimasi harga_per_hari / 8
      const hargaJam = parseFloat(bike.harga_per_jam || (bike.harga_per_hari / 8) || 0);
      base = hargaJam * duration;
    }
    const addonPrice = (addons.helm ? 10000 : 0) + (addons.kunci_pengaman ? 5000 : 0);
    setPricePreview(base + addonPrice);
  }, [bike, duration, durasiMode, addons]);

  // ─── Harga per unit untuk display ───
  const hargaUnit = durasiMode === 'hari'
    ? parseFloat(bike?.harga_per_hari || 0)
    : parseFloat(bike?.harga_per_jam || (bike?.harga_per_hari / 8) || 0);

  const satuanLabel = durasiMode === 'hari' ? 'hari' : 'jam';
  const maxDurasi   = durasiMode === 'hari' ? 30 : 72;

  const handleAddonChange = (e) => {
    const { name, checked } = e.target;
    setAddons(prev => ({ ...prev, [name]: checked }));
  };

  // ─── Validasi Step 1 ───
  const validateStep1 = () => {
    const errs = {};

    if (!currentUser) {
      if (!guestName.trim()) errs.guestName = 'Nama lengkap wajib diisi.';
      if (!guestPhone.trim()) {
        errs.guestPhone = 'Nomor telepon wajib diisi.';
      } else if (!/^[0-9+\- ]{8,20}$/.test(guestPhone.trim())) {
        errs.guestPhone = 'Format nomor telepon tidak valid (8–20 digit).';
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
      ...(currentUser ? {} : { guest_name: guestName, guest_phone: guestPhone }),
    });
  };

  if (!bike) return null;

  const inputCls = 'w-full px-3 py-2 bg-[#121212] border border-[#333333] text-white rounded-lg text-sm focus:outline-none focus:border-[#39FF14] transition-colors';
  const labelCls = 'text-[10px] uppercase font-bold text-[#a0a0a0]';

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50 p-4 overflow-y-auto">
      <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-2xl w-full max-w-lg p-6 md:p-8 space-y-6 relative my-4">
        <button onClick={onClose}
          className="absolute top-4 right-4 text-[#a0a0a0] hover:text-white text-xl font-bold transition-colors">
          ×
        </button>

        {/* ── Stepper ── */}
        <div className="flex items-center max-w-xs mx-auto pb-4 border-b border-[#2d2d2d]">
          {[
            { n: 1, label: 'Detail', color: '#39FF14' },
            { n: 2, label: 'Bayar', color: '#00E5FF' },
          ].map((s, i) => (
            <React.Fragment key={s.n}>
              <div className="flex flex-col items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-colors ${
                  step >= s.n ? 'text-black' : 'bg-[#2d2d2d] text-[#a0a0a0]'
                }`} style={step >= s.n ? { backgroundColor: s.color } : {}}>
                  {s.n}
                </div>
                <span className="text-[9px] uppercase font-bold text-[#a0a0a0] mt-1">{s.label}</span>
              </div>
              {i === 0 && (
                <div className={`flex-1 h-0.5 mx-2 ${step >= 2 ? 'bg-gradient-to-r from-[#39FF14] to-[#00E5FF]' : 'bg-[#2d2d2d]'}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* ── Header ── */}
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-xl font-black uppercase text-white tracking-tight">
            {step === 1 ? 'Formulir Pemesanan' : 'Metode Pembayaran'}
          </h3>
          <p className="text-xs text-[#a0a0a0]">
            Sewa <span className="text-[#39FF14] font-bold">{bike.nama_sepeda}</span> — {bike.nama_toko}
          </p>
        </div>

        {/* ══════════════ STEP 1 ══════════════ */}
        {step === 1 && (
          <form onSubmit={handleNextStep} className="space-y-4">

            {/* Guest / Login info */}
            {currentUser ? (
              <div className="p-3 bg-[#121212] border border-[#39FF14]/20 rounded-xl text-xs space-y-0.5">
                <p className="text-[#a0a0a0]">Memesan sebagai:</p>
                <p className="text-white font-bold">{currentUser.nama}</p>
                <p className="text-[#a0a0a0]">{currentUser.email}</p>
              </div>
            ) : (
              <div className="space-y-3 p-4 bg-[#121212] border border-[#00E5FF]/20 rounded-xl">
                <p className="text-[10px] font-black uppercase text-[#00E5FF]">Mode Guest (Tanpa Akun)</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className={labelCls}>Nama Lengkap *</label>
                    <input type="text" value={guestName} onChange={e => setGuestName(e.target.value)}
                      placeholder="Budi Santoso" className={inputCls} />
                    {errors.guestName && <p className="text-xs text-[#FF3E3E]">{errors.guestName}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className={labelCls}>No. WhatsApp *</label>
                    <input type="tel" value={guestPhone} onChange={e => setGuestPhone(e.target.value)}
                      placeholder="08123456789" className={inputCls} />
                    {errors.guestPhone && <p className="text-xs text-[#FF3E3E]">{errors.guestPhone}</p>}
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
                {errors.pickupDate && <p className="text-xs text-[#FF3E3E]">{errors.pickupDate}</p>}
              </div>
              <div className="space-y-1">
                <label className={labelCls}>Waktu Ambil *</label>
                <select value={pickupTime} onChange={e => setPickupTime(e.target.value)} className={inputCls}>
                  {DEFAULT_TIMES.map(t => (
                    <option key={t} value={t}>{t} WIB</option>
                  ))}
                </select>
                {errors.pickupTime && <p className="text-xs text-[#FF3E3E]">{errors.pickupTime}</p>}
              </div>
            </div>

            {/* Mode Durasi: JAM / HARI */}
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
                    <span className="text-lg">{m.icon}</span>
                    <span className={`text-[10px] font-black mt-0.5 ${durasiMode === m.val ? 'text-[#39FF14]' : 'text-white'}`}>{m.label}</span>
                    <span className="text-[8px] text-[#a0a0a0]">{m.harga}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Durasi input */}
            <div className="space-y-1">
              <label className={labelCls}>
                Durasi Sewa ({satuanLabel}) — maks. {maxDurasi} {satuanLabel}
              </label>
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
              {errors.duration && <p className="text-xs text-[#FF3E3E]">{errors.duration}</p>}
            </div>

            {/* Addons */}
            <div className="space-y-2">
              <label className={labelCls}>Tambahan Alat (Opsional)</label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { name: 'helm', label: 'Helm', price: '+Rp10.000', icon: '⛑️' },
                  { name: 'kunci_pengaman', label: 'Kunci', price: '+Rp5.000', icon: '🔒' },
                ].map(a => (
                  <label key={a.name}
                    className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer select-none transition-colors ${
                      addons[a.name] ? 'border-[#39FF14] bg-[#39FF14]/5' : 'bg-[#121212] border-[#333] hover:border-[#39FF14]'
                    }`}>
                    <input type="checkbox" name={a.name} checked={addons[a.name]}
                      onChange={handleAddonChange} className="w-4 h-4 accent-[#39FF14]" />
                    <div>
                      <p className="text-xs font-bold text-white">{a.icon} {a.label}</p>
                      <p className="text-[9px] text-[#a0a0a0]">{a.price}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Estimasi biaya */}
            <div className="p-4 bg-[#39FF14]/5 border border-[#39FF14]/20 rounded-xl">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] uppercase font-bold text-[#a0a0a0]">Estimasi Biaya</p>
                  <p className="text-[9px] text-[#a0a0a0]">
                    Rp {hargaUnit.toLocaleString('id-ID')} × {duration} {satuanLabel}
                    {(addons.helm || addons.kunci_pengaman) ? ' + addon' : ''}
                  </p>
                </div>
                <span className="text-white text-2xl font-black glow-green">
                  Rp {pricePreview.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-3 bg-[#1e1e1e] text-[#a0a0a0] border border-[#333] hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all">
                Batal
              </button>
              <button type="submit"
                className="flex-1 py-3 bg-[#39FF14] text-black font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(57,255,20,0.2)] hover:bg-white transition-all duration-300">
                Lanjut Pembayaran →
              </button>
            </div>
          </form>
        )}

        {/* ══════════════ STEP 2 ══════════════ */}
        {step === 2 && (
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Pilih metode pembayaran */}
            <div className="space-y-2">
              <label className={labelCls}>Pilih Metode Pembayaran</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { val: 'qris',     icon: '📱', label: 'QRIS',     sub: 'Scan & Pay' },
                  { val: 'e-wallet', icon: '💳', label: 'E-Wallet', sub: 'GoPay/Dana' },
                  { val: 'transfer', icon: '🏦', label: 'Transfer',  sub: 'Bank BCA' },
                ].map(m => (
                  <label key={m.val}
                    className={`flex flex-col items-center p-3 border rounded-xl cursor-pointer select-none text-center transition-colors ${
                      paymentMethod === m.val ? 'border-[#00E5FF] bg-[#00E5FF]/5' : 'border-[#333] bg-[#121212]'
                    }`}>
                    <input type="radio" name="payment" value={m.val}
                      checked={paymentMethod === m.val} onChange={() => setPaymentMethod(m.val)} className="sr-only" />
                    <span className="text-xl mb-1">{m.icon}</span>
                    <span className="text-[10px] font-black text-white">{m.label}</span>
                    <span className="text-[8px] text-[#a0a0a0]">{m.sub}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Info pembayaran per metode */}
            <div className="p-4 bg-[#121212] border border-[#2d2d2d] rounded-xl text-center space-y-2">
              {paymentMethod === 'qris' && (
                <>
                  <div className="w-44 bg-white mx-auto p-1.5 rounded-lg flex items-center justify-center relative overflow-hidden border border-[#2d2d2d]">
                    <img src={qrisImg} alt="QRIS piTrahan Yogyakarta" className="w-full h-auto object-contain" />
                  </div>
                  <p className="text-xs font-bold text-white">QRIS piTrahan Yogyakarta</p>
                  <p className="text-[9px] text-[#a0a0a0]">Scan menggunakan aplikasi e-wallet / mobile banking</p>
                </>
              )}
              {paymentMethod === 'e-wallet' && (
                <>
                  <p className="text-2xl">⚡</p>
                  <p className="text-xs font-bold text-white uppercase">GoPay / OVO / Dana</p>
                  <p className="text-[10px] text-[#a0a0a0]">Transfer ke: <span className="text-[#00E5FF] font-mono font-bold">0812-3456-7890</span></p>
                  <p className="text-[9px] text-[#a0a0a0]">a/n piTrahan Rental Jogja</p>
                </>
              )}
              {paymentMethod === 'transfer' && (
                <>
                  <p className="text-2xl">🏛️</p>
                  <p className="text-xs font-bold text-white uppercase">Transfer Bank BCA</p>
                  <p className="text-[10px] text-[#a0a0a0]">No. Rek: <span className="text-[#00E5FF] font-mono font-bold">803-5123-4567</span></p>
                  <p className="text-[9px] text-[#a0a0a0]">a/n PT piTrahan Transportasi Jogja</p>
                </>
              )}
            </div>

            {/* Ringkasan booking */}
            <div className="p-4 bg-[#00E5FF]/5 border border-[#00E5FF]/20 rounded-xl space-y-2 text-xs">
              {[
                ['Sepeda', bike.nama_sepeda],
                ['Tanggal Ambil', `${formatTglID(pickupDate)} — ${pickupTime} WIB`],
                ['Durasi', `${duration} ${satuanLabel}`],
                ...(currentUser ? [['Pemesan', currentUser.nama]] : [['Pemesan', guestName]]),
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-[#a0a0a0]">{k}:</span>
                  <span className="text-white font-bold text-right">{v}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-[#222] pt-2 font-bold">
                <span className="text-[#a0a0a0]">Total Tagihan:</span>
                <span className="text-[#00E5FF] text-sm font-black">Rp {pricePreview.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={() => setStep(1)}
                className="flex-1 py-3 bg-[#1e1e1e] text-[#a0a0a0] border border-[#333] hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all">
                ← Kembali
              </button>
              <button type="submit"
                className="flex-1 py-3 bg-[#00E5FF] text-black font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(0,229,255,0.2)] hover:bg-white transition-all duration-300">
                ✓ Konfirmasi Pesanan
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
