import React, { useState, useEffect } from 'react';

export default function BookingForm({ bike, currentUser, onSubmitBooking, onClose }) {
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [duration, setDuration] = useState(1);
  const [addons, setAddons] = useState({
    helm: false,
    kunci_pengaman: false
  });
  const [errors, setErrors] = useState({});
  const [pricePreview, setPricePreview] = useState(0);

  // Price calculations trigger
  useEffect(() => {
    if (!bike) return;
    const base = parseFloat(bike.harga_per_hari) * duration;
    const addonPrice = (addons.helm ? 10000 : 0) + (addons.kunci_pengaman ? 5000 : 0);
    setPricePreview(base + addonPrice);
  }, [bike, duration, addons]);

  const handleAddonChange = (e) => {
    const { name, checked } = e.target;
    setAddons(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Client Side validation
  const validateForm = () => {
    const tempErrors = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!currentUser) {
      if (!guestName.trim()) tempErrors.guestName = 'Nama lengkap wajib diisi.';
      if (!guestPhone.trim()) {
        tempErrors.guestPhone = 'Nomor telepon wajib diisi.';
      } else if (!/^[0-9+ -]{8,15}$/.test(guestPhone.trim())) {
        tempErrors.guestPhone = 'Format nomor telepon tidak valid (8-15 digit).';
      }
    }

    if (!pickupDate) {
      tempErrors.pickupDate = 'Tanggal pengambilan wajib diisi.';
    } else {
      const selectedDate = new Date(pickupDate);
      if (selectedDate < today) {
        tempErrors.pickupDate = 'Tanggal pengambilan tidak boleh di masa lalu.';
      }
    }

    if (duration < 1) {
      tempErrors.duration = 'Durasi sewa minimal 1 hari.';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const selectedAddons = [];
    if (addons.helm) selectedAddons.push({ nama_alat: 'helm' });
    if (addons.kunci_pengaman) selectedAddons.push({ nama_alat: 'kunci_pengaman' });

    const formData = {
      bike_id: bike.id,
      tanggal_ambil: pickupDate,
      durasi_sewa: duration,
      addons: selectedAddons,
      ...(currentUser ? {} : { guest_name: guestName, guest_phone: guestPhone })
    };

    onSubmitBooking(formData);
  };

  if (!bike) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50 p-4 overflow-y-auto">
      <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-2xl w-full max-w-lg p-6 md:p-8 space-y-6 relative">
        {/* Close Button */}
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-[#a0a0a0] hover:text-white transition-colors text-xl font-bold"
        >
          &times;
        </button>

        {/* Form Header */}
        <div className="space-y-1">
          <h3 className="text-xl md:text-2xl font-black uppercase text-white tracking-tight">Formulir Pemesanan</h3>
          <p className="text-xs text-[#a0a0a0]">Detail pemesanan untuk <span className="text-[#39FF14] font-bold">{bike.nama_sepeda}</span> ({bike.nama_toko})</p>
        </div>

        {/* Booking Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {currentUser ? (
            // Logged-in client layout
            <div className="p-3 bg-[#121212] border border-[#333333] rounded-xl text-xs space-y-1">
              <p className="text-[#a0a0a0]">Memesan sebagai Anggota Terdaftar:</p>
              <p className="text-white font-bold text-sm uppercase">{currentUser.nama} ({currentUser.email})</p>
            </div>
          ) : (
            // Guest client layout
            <div className="space-y-3 p-4 bg-[#121212] border border-[#2d2d2d] rounded-xl">
              <span className="text-[10px] uppercase font-bold text-[#00E5FF] tracking-wider block">Mode Guest (Tanpa Akun)</span>
              
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#a0a0a0]">Nama Lengkap</label>
                <input 
                  type="text" 
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="px-3 py-2 bg-[#1e1e1e] border border-[#333333] text-white rounded-lg text-sm focus:outline-none focus:border-[#39FF14] transition-colors"
                />
                {errors.guestName && <span className="text-xs text-[#FF3E3E] font-medium">{errors.guestName}</span>}
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#a0a0a0]">Nomor Telepon (WhatsApp)</label>
                <input 
                  type="text" 
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="Contoh: 08123456789"
                  className="px-3 py-2 bg-[#1e1e1e] border border-[#333333] text-white rounded-lg text-sm focus:outline-none focus:border-[#39FF14] transition-colors"
                />
                {errors.guestPhone && <span className="text-xs text-[#FF3E3E] font-medium">{errors.guestPhone}</span>}
              </div>
            </div>
          )}

          {/* Rental Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] uppercase font-bold text-[#a0a0a0]">Tanggal Ambil</label>
              <input 
                type="date" 
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="px-3 py-2 bg-[#121212] border border-[#333333] text-white rounded-lg text-sm focus:outline-none focus:border-[#39FF14] transition-colors"
              />
              {errors.pickupDate && <span className="text-xs text-[#FF3E3E] font-medium">{errors.pickupDate}</span>}
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[10px] uppercase font-bold text-[#a0a0a0]">Durasi Sewa (Hari)</label>
              <input 
                type="number" 
                min="1" 
                max="30"
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                className="px-3 py-2 bg-[#121212] border border-[#333333] text-white rounded-lg text-sm focus:outline-none focus:border-[#39FF14] transition-colors"
              />
              {errors.duration && <span className="text-xs text-[#FF3E3E] font-medium">{errors.duration}</span>}
            </div>
          </div>

          {/* Booking Addons Checkbox */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold text-[#a0a0a0] tracking-wider block">Tambahan Alat (Opsional)</label>
            <div className="grid grid-cols-2 gap-3">
              {/* Helm */}
              <label className="flex items-center gap-3 p-3 bg-[#121212] border border-[#333333] rounded-xl cursor-pointer hover:border-[#39FF14] transition-colors select-none">
                <input 
                  type="checkbox"
                  name="helm"
                  checked={addons.helm}
                  onChange={handleAddonChange}
                  className="w-4 h-4 accent-[#39FF14] cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white uppercase">Helm</span>
                  <span className="text-[9px] text-[#a0a0a0]">+Rp10.000 (flat)</span>
                </div>
              </label>

              {/* Kunci Pengaman */}
              <label className="flex items-center gap-3 p-3 bg-[#121212] border border-[#333333] rounded-xl cursor-pointer hover:border-[#39FF14] transition-colors select-none">
                <input 
                  type="checkbox"
                  name="kunci_pengaman"
                  checked={addons.kunci_pengaman}
                  onChange={handleAddonChange}
                  className="w-4 h-4 accent-[#39FF14] cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white uppercase">Kunci Pengaman</span>
                  <span className="text-[9px] text-[#a0a0a0]">+Rp5.000 (flat)</span>
                </div>
              </label>
            </div>
          </div>

          {/* Price Preview section */}
          <div className="p-4 bg-[#39FF14]/5 border border-[#39FF14]/20 rounded-xl flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-[#a0a0a0]">Estimasi Total Biaya</span>
              <span className="text-xs text-[#00E5FF] uppercase font-semibold">Bayar Tunai di Lokasi</span>
            </div>
            <span className="text-white text-xl font-black glow-green">
              Rp {pricePreview.toLocaleString('id-ID')}
            </span>
          </div>

          {/* Form Actions */}
          <div className="flex gap-4 pt-2">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-[#1e1e1e] text-[#a0a0a0] border border-[#333333] hover:text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
            >
              Kembali
            </button>
            <button 
              type="submit"
              className="flex-1 py-3 bg-[#39FF14] text-black font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(57,255,20,0.2)] hover:bg-white hover:shadow-none hover:scale-102 transition-all duration-300"
            >
              Konfirmasi Sewa
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
