import React, { useState, useRef, useMemo, useEffect } from 'react';

function fmtTgl(s) {
  if (!s) return '-';
  const raw = (s.includes('T') ? s.split('T')[0] : s) + 'T00:00:00';
  return new Date(raw).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
}

// ─── CSV Injection Protection ─────────────────────────────────────────────
function sanitizeCSV(val) {
  const s = String(val ?? '');
  return s.replace(/^[=+\-@\t\r]/, "'");
}

function exportToCSV(data, filename) {
  const headers = ['Kode Booking','Pemesan','No HP','Email','Sepeda','Toko','Tgl Ambil','Durasi','Satuan','Total (Rp)','Metode','Status'];
  const rows = data.map(b => [
    sanitizeCSV(b.kode_booking),
    sanitizeCSV(b.nama_pemesan),
    sanitizeCSV(b.no_hp),
    sanitizeCSV(b.email || '-'),
    sanitizeCSV(b.sepeda),
    sanitizeCSV(b.nama_toko),
    sanitizeCSV(fmtTgl(b.tanggal_ambil)),
    sanitizeCSV(b.durasi_sewa),
    sanitizeCSV(b.durasi_mode || 'hari'),
    sanitizeCSV(parseFloat(b.total_harga || 0).toFixed(0)),
    sanitizeCSV(b.metode_pembayaran || '-'),
    sanitizeCSV(b.status),
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

const STATUS_BIKE = {
  tersedia: { label: 'Tersedia', cls: 'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/30' },
  disewa:   { label: 'Disewa',   cls: 'bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/30' },
  servis:   { label: 'Servis',   cls: 'bg-[#FF3E3E]/10 text-[#FF3E3E] border-[#FF3E3E]/30' },
};
const STATUS_BOOKING = {
  pending:   { label: 'Menunggu',     cls: 'bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/30' },
  confirmed: { label: 'Dikonfirmasi', cls: 'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/30' },
  rejected:  { label: 'Ditolak',      cls: 'bg-[#FF3E3E]/10 text-[#FF3E3E] border-[#FF3E3E]/30' },
  completed: { label: 'Selesai',      cls: 'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/30' },
  cancelled: { label: 'Dibatalkan',   cls: 'bg-[#555]/20 text-[#a0a0a0] border-[#555]/30' },
};

function StatusPill({ status, config }) {
  const cfg = config[status] || { label: status, cls: 'bg-[#333]/20 text-[#a0a0a0] border-[#333]' };
  return <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${cfg.cls}`}>{cfg.label}</span>;
}

// ─── Jenis Sepeda ────────────────────────────────────────────────────────
const BIKE_TYPES = [
  { val: 'gunung',    label: '🏔 Gunung' },
  { val: 'lipat',     label: '🪗 Lipat' },
  { val: 'onthel',    label: '🚲 Onthel/Klasik' },
  { val: 'city_bike', label: '🏙 City Bike' },
  { val: 'listrik',   label: '⚡ Listrik' },
];

const EMPTY_BIKE = {
  nama_sepeda: '', jenis_sepeda: 'gunung', deskripsi: '',
  harga_per_hari: '', harga_per_jam: '', deposit_fee: '',
  foto_urls: [],   // ← Array of { type: 'url'|'file', src: string, name?: string }
  foto_url: '',    // ← backward-compat primary
  status_ketersediaan: 'tersedia',
};

// ─── Helper: pastikan foto_urls array selalu ada ──────────────────────────
function normalizeBike(bike) {
  if (!bike) return { ...EMPTY_BIKE };
  let urls = [];
  if (Array.isArray(bike.foto_urls) && bike.foto_urls.length > 0) {
    urls = bike.foto_urls;
  } else if (bike.foto_url) {
    urls = [{ type: 'url', src: bike.foto_url }];
  }
  return { ...EMPTY_BIKE, ...bike, foto_urls: urls };
}

// ─── Komponen: Multi-Photo Manager ──────────────────────────────────────
function MultiPhotoManager({ photos, onChange }) {
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const fileRef = useRef(null);
  const [uploadingIdx, setUploadingIdx] = useState(null);

  const addUrl = () => {
    const v = urlInput.trim();
    if (!v) return;
    if (!/^https?:\/\/.+/.test(v)) { setUrlError('URL harus diawali https:// atau http://'); return; }
    if (photos.length >= 6) { setUrlError('Maksimal 6 foto.'); return; }
    onChange([...photos, { type: 'url', src: v }]);
    setUrlInput('');
    setUrlError('');
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    if (photos.length + files.length > 6) {
      alert('Maksimal total 6 foto per unit sepeda.');
      e.target.value = '';
      return;
    }
    files.forEach((file, i) => {
      if (!file.type.startsWith('image/')) return;
      if (file.size > 5 * 1024 * 1024) { alert(`${file.name} terlalu besar. Maks 5 MB.`); return; }
      const idx = photos.length + i;
      setUploadingIdx(idx);
      const reader = new FileReader();
      reader.onload = (ev) => {
        onChange(prev => [...prev, { type: 'file', src: ev.target.result, name: file.name }]);
        setUploadingIdx(null);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = '';
  };

  const remove = (idx) => onChange(photos.filter((_, i) => i !== idx));

  const moveLeft = (idx) => {
    if (idx === 0) return;
    const arr = [...photos];
    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
    onChange(arr);
  };

  const moveRight = (idx) => {
    if (idx === photos.length - 1) return;
    const arr = [...photos];
    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
    onChange(arr);
  };

  return (
    <div className="space-y-3">
      {/* Foto Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p, i) => (
            <div key={i} className="relative group rounded-xl overflow-hidden border border-[#2d2d2d] bg-[#0d0d0d]">
              <img
                src={p.src}
                alt={`Foto ${i + 1}`}
                className="w-full h-24 object-cover"
                onError={e => { e.target.src = 'https://placehold.co/200x96/1e1e1e/555?text=Error'; }}
              />
              {/* Primary badge */}
              {i === 0 && (
                <span className="absolute top-1 left-1 bg-[#FFD700] text-black text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase">
                  Utama
                </span>
              )}
              {/* Type badge */}
              <span className={`absolute top-1 right-1 text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase ${
                p.type === 'file' ? 'bg-[#39FF14]/90 text-black' : 'bg-white/20 text-white'
              }`}>
                {p.type === 'file' ? '📁' : '🔗'}
              </span>
              {/* Overlay controls */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <button type="button" onClick={() => moveLeft(i)} disabled={i === 0}
                  className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/40 text-white text-xs disabled:opacity-30 flex items-center justify-center transition-all">
                  ‹
                </button>
                <button type="button" onClick={() => remove(i)}
                  className="w-6 h-6 rounded-full bg-[#FF3E3E]/80 hover:bg-[#FF3E3E] text-white text-xs flex items-center justify-center transition-all">
                  ×
                </button>
                <button type="button" onClick={() => moveRight(i)} disabled={i === photos.length - 1}
                  className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/40 text-white text-xs disabled:opacity-30 flex items-center justify-center transition-all">
                  ›
                </button>
              </div>
            </div>
          ))}
          {/* Loading placeholder */}
          {uploadingIdx !== null && (
            <div className="w-full h-24 rounded-xl border border-dashed border-[#FFD700]/40 bg-[#0d0d0d] flex items-center justify-center">
              <span className="text-[9px] text-[#FFD700] animate-pulse">Memproses...</span>
            </div>
          )}
        </div>
      )}

      {/* Add controls */}
      {photos.length < 6 && (
        <div className="space-y-2">
          {/* URL Input */}
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://cdn.example.com/bike.jpg"
              value={urlInput}
              onChange={e => { setUrlInput(e.target.value); setUrlError(''); }}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addUrl())}
              className="flex-1 px-3 py-2 bg-[#0d0d0d] border border-[#333] text-white rounded-lg text-xs focus:outline-none focus:border-[#FFD700] transition-colors placeholder:text-[#444]"
            />
            <button type="button" onClick={addUrl}
              className="px-3 py-2 text-[9px] font-black uppercase bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30 rounded-lg hover:bg-[#FFD700]/20 transition-all whitespace-nowrap">
              + Tambah URL
            </button>
          </div>
          {urlError && <p className="text-[9px] text-[#FF3E3E]">{urlError}</p>}

          {/* File Upload */}
          <button type="button" onClick={() => fileRef.current?.click()}
            className="w-full py-2.5 border border-dashed border-[#333] rounded-xl text-[10px] font-bold text-[#a0a0a0] hover:border-[#FFD700]/50 hover:text-[#FFD700] transition-all flex items-center justify-center gap-2">
            📁 Upload Foto dari Perangkat (JPG/PNG/WEBP · Maks 5 MB)
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFileUpload} />
        </div>
      )}

      <div className="flex justify-between text-[8px] text-[#555]">
        <span>{photos.length}/6 foto • Foto pertama menjadi tampilan utama katalog</span>
        <span>Hover foto untuk atur urutan atau hapus</span>
      </div>
    </div>
  );
}

// ─── Komponen: Modal Form Tambah/Edit Sepeda (Fixed Overlay seperti TicketModal) ──
function BikeFormModal({ bike, ownerUser, onSave, onCancel }) {
  const [form, setForm] = useState(() => normalizeBike(bike));
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const inp = 'w-full px-3 py-2 bg-[#0d0d0d] border border-[#333] text-white rounded-lg text-xs focus:outline-none focus:border-[#FFD700] transition-colors placeholder:text-[#444]';
  const lbl = 'text-[9px] uppercase font-bold text-[#a0a0a0] tracking-wider';
  const isEdit = !!(bike && bike.id);

  const handleSave = () => {
    if (!form.nama_sepeda.trim()) return alert('Nama sepeda wajib diisi.');
    if (!form.harga_per_hari || isNaN(form.harga_per_hari)) return alert('Harga per hari wajib diisi (angka).');
    if (form.foto_urls.length === 0) return alert('Minimal 1 foto harus ditambahkan (via URL atau upload).');

    // Primary foto_url dari index 0 (backward compat)
    const primaryPhoto = form.foto_urls[0]?.src || '';

    onSave({
      ...form,
      id: form.id || Date.now(),
      foto_url: primaryPhoto,
      foto_urls: form.foto_urls,
      deposit_fee: form.deposit_fee || 0,
      nama_toko: ownerUser.nama_usaha || ownerUser.nama,
      alamat_toko: ownerUser.alamat_toko || '',
      no_telepon: ownerUser.no_hp_toko || ownerUser.no_telepon || '',
      jam_operasional: ownerUser.jam_operasional || '',
    });
  };

  // Klik backdrop juga menutup
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onCancel();
  };

  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center bg-black/80 z-[60] p-0 sm:p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-[#1a1a1a] border-t sm:border border-[#2d2d2d] sm:border-[#FFD700]/30 rounded-t-2xl sm:rounded-2xl w-full max-w-lg flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden shadow-2xl">
        
        {/* ── Header ── */}
        <div className="px-5 py-4 border-b border-[#2d2d2d] flex items-center justify-between flex-shrink-0 bg-[#1a1a1a]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FFD700]/10 border border-[#FFD700]/30 flex items-center justify-center text-lg">
              {isEdit ? '✏️' : '➕'}
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">
                {isEdit ? 'Edit Sepeda' : 'Tambah Sepeda Baru'}
              </h3>
              <p className="text-[9px] text-[#a0a0a0] mt-0.5">
                {isEdit ? `Memperbarui: ${bike.nama_sepeda}` : 'Inventaris toko baru'}
              </p>
            </div>
          </div>
          <button onClick={onCancel}
            className="w-8 h-8 rounded-full bg-[#2d2d2d] hover:bg-[#3d3d3d] text-[#a0a0a0] hover:text-white text-lg font-bold transition-all flex items-center justify-center">
            ×
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 pb-28 scrollbar-none">

          {/* Nama & Jenis */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <label className={lbl}>Nama Sepeda *</label>
              <input value={form.nama_sepeda} onChange={e => set('nama_sepeda', e.target.value)}
                placeholder="Contoh: Polygon Xtrada 5 2024" className={inp} />
            </div>
            <div className="space-y-1">
              <label className={lbl}>Jenis Sepeda *</label>
              <select value={form.jenis_sepeda} onChange={e => set('jenis_sepeda', e.target.value)} className={inp}>
                {BIKE_TYPES.map(t => <option key={t.val} value={t.val}>{t.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className={lbl}>Status Awal</label>
              <select value={form.status_ketersediaan} onChange={e => set('status_ketersediaan', e.target.value)} className={inp}>
                <option value="tersedia">✅ Tersedia</option>
                <option value="servis">🔧 Servis</option>
              </select>
            </div>
          </div>

          {/* Harga */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className={lbl}>Harga / Hari (Rp) *</label>
              <input type="number" min="0" value={form.harga_per_hari}
                onChange={e => set('harga_per_hari', e.target.value)} placeholder="75000" className={inp} />
            </div>
            <div className="space-y-1">
              <label className={lbl}>Harga / Jam (Rp)</label>
              <input type="number" min="0" value={form.harga_per_jam}
                onChange={e => set('harga_per_jam', e.target.value)} placeholder="15000" className={inp} />
            </div>
            <div className="space-y-1">
              <label className={lbl}>Deposit (Rp)</label>
              <input type="number" min="0" value={form.deposit_fee}
                onChange={e => set('deposit_fee', e.target.value)} placeholder="50000" className={inp} />
            </div>
          </div>

          {/* Deskripsi */}
          <div className="space-y-1">
            <label className={lbl}>Deskripsi</label>
            <textarea rows={2} value={form.deskripsi} onChange={e => set('deskripsi', e.target.value)}
              placeholder="Spesifikasi singkat atau keunggulan sepeda..." className={inp + ' resize-none'} />
          </div>

          {/* Multi-Photo Manager */}
          <div className="space-y-1">
            <label className={lbl}>
              Foto Sepeda * <span className="text-[#555] normal-case font-normal">(maks. 6 foto — URL atau upload file)</span>
            </label>
            <MultiPhotoManager
              photos={form.foto_urls}
              onChange={(newPhotos) => {
                // newPhotos bisa berupa array baru atau fungsi updater dari state
                if (typeof newPhotos === 'function') {
                  setForm(f => ({ ...f, foto_urls: newPhotos(f.foto_urls) }));
                } else {
                  set('foto_urls', newPhotos);
                }
              }}
            />
          </div>

        </div>

        {/* ── Sticky Footer Actions ── */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#2d2d2d] px-5 py-4 flex gap-3 flex-shrink-0 shadow-[0_-8px_24px_rgba(0,0,0,0.5)]">
          <button type="button" onClick={onCancel}
            className="flex-1 py-3 text-[10px] font-black text-[#a0a0a0] border border-[#2d2d2d] hover:text-white hover:border-[#555] rounded-xl uppercase tracking-wider transition-all">
            Batal
          </button>
          <button type="button" onClick={handleSave}
            className="flex-1 py-3 text-[10px] font-black bg-[#FFD700] text-black rounded-xl hover:bg-white transition-all uppercase tracking-wider shadow-[0_0_15px_rgba(255,215,0,0.2)]">
            {isEdit ? '✓ Simpan Perubahan' : '➕ Tambahkan Sepeda'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Email Simulasi Modal ─────────────────────────────────────────────────
function EmailSimModal({ booking, type, onClose }) {
  const subject = type === 'rejected'
    ? `[piTrahan] Maaf, Pesanan Anda Ditolak — ${booking.kode_booking}`
    : `[piTrahan] Pesanan Dikonfirmasi! — ${booking.kode_booking}`;
  const body = type === 'rejected'
    ? `Yth. ${booking.nama_pemesan},\n\nKami mohon maaf, pesanan Anda untuk sepeda "${booking.sepeda}" dengan kode ${booking.kode_booking} tidak dapat kami proses saat ini.\n\nKemungkinan penyebab:\n- Unit tidak tersedia di tanggal yang diminta\n- Jadwal bentrok dengan pemesanan lain\n\nSilakan lakukan pemesanan ulang dengan tanggal berbeda.\n\nTerima kasih telah menggunakan piTrahan.\n\nSalam,\nTim piTrahan Yogyakarta`
    : `Yth. ${booking.nama_pemesan},\n\nSELAMAT! Pesanan Anda telah dikonfirmasi.\n\n📋 Kode Booking: ${booking.kode_booking}\n🚴 Sepeda: ${booking.sepeda}\n📅 Tanggal Ambil: ${fmtTgl(booking.tanggal_ambil)}${booking.waktu_ambil ? ` pukul ${booking.waktu_ambil} WIB` : ''}\n⏱ Durasi: ${booking.durasi_sewa} ${booking.durasi_mode || 'hari'}\n💰 Total: Rp ${parseFloat(booking.total_harga).toLocaleString('id-ID')}\n\nWAJIB DIBAWA:\n- KTP Asli atau SIM Asli\n- Uang deposit (jika ada kebijakan toko)\n\nSalam,\nTim piTrahan`;
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[70] p-4">
      <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl w-full max-w-md p-5 space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-sm font-black text-white">📧 Simulasi Email Terkirim</p>
          <button onClick={onClose} className="text-[#a0a0a0] hover:text-white font-bold">×</button>
        </div>
        <div className="p-3 bg-[#121212] border border-[#2d2d2d] rounded-xl space-y-2 text-xs">
          <p><span className="text-[#a0a0a0]">Kepada:</span> <span className="text-white font-bold">{booking.email || booking.no_hp}</span></p>
          <p><span className="text-[#a0a0a0]">Subjek:</span> <span className={`font-bold ${type==='rejected'?'text-[#FF3E3E]':'text-[#39FF14]'}`}>{subject}</span></p>
          <div className="border-t border-[#2d2d2d] pt-2">
            <pre className="text-[9px] text-[#a0a0a0] whitespace-pre-wrap font-sans leading-relaxed">{body}</pre>
          </div>
        </div>
        <button onClick={onClose} className="w-full py-2 bg-[#39FF14] text-black font-black text-xs uppercase rounded-xl hover:bg-white transition-all">
          Tutup (Email Sudah Terkirim)
        </button>
      </div>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function OwnerDashboardModal({ user, bikes: initialBikes, onUpdateBikeStatus, onAddBike, onEditBike, onDeleteBike, onClose, logActivity, API_BASE_URL, token }) {
  const [activeTab, setActiveTab] = useState('overview');

  const bikes = initialBikes;

  const ownerStoreName = user.nama_usaha || user.nama;
  const [bookings, setBookings] = useState(() => {
    try {
      const all = JSON.parse(localStorage.getItem('pitrahan_demo_bookings') || '[]');
      return all.filter(b => b.nama_toko === ownerStoreName || !b.nama_toko);
    } catch { return []; }
  });
  const saveBookings = (updated) => {
    const all = JSON.parse(localStorage.getItem('pitrahan_demo_bookings') || '[]');
    const otherStores = all.filter(b => b.nama_toko !== ownerStoreName && b.nama_toko);
    const merged = [...otherStores, ...updated];
    localStorage.setItem('pitrahan_demo_bookings', JSON.stringify(merged));
    setBookings(updated);
  };

  useEffect(() => {
    async function fetchBookings() {
      if (!API_BASE_URL) return;
      try {
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${API_BASE_URL}/bookings/owner/all`, { headers });
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          const normalized = data.data.map(b => ({
            ...b,
            status: b.status_booking || b.status || 'pending',
            sepeda: b.nama_sepeda || b.sepeda || '-',
            nama_pemesan: b.nama_pemesan || b.guest_name || '-',
            kode_booking: b.kode_booking || '-',
            total_harga: parseFloat(b.total_harga || 0),
          }));
          setBookings(normalized);
        }
      } catch (err) {
        console.error('Owner: failed to fetch bookings from API:', err);
      }
    }
    fetchBookings();
  }, [API_BASE_URL, token]);

  // ── Modal States ──
  const [bikeFormState, setBikeFormState] = useState(null); // null | { mode: 'add' } | { mode: 'edit', bike }
  const [bikeStatusEdit, setBikeStatusEdit] = useState(null);
  const [emailModal, setEmailModal] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // ── Stats ──
  const stats = useMemo(() => {
    const pending   = bookings.filter(b => b.status === 'pending').length;
    const confirmed = bookings.filter(b => b.status === 'confirmed').length;
    const revenue   = bookings.filter(b => ['confirmed','completed'].includes(b.status))
                              .reduce((s, b) => s + parseFloat(b.total_harga||0), 0);
    const tersedia  = bikes.filter(b => b.status_ketersediaan === 'tersedia').length;
    return { pending, confirmed, revenue, tersedia, total: bikes.length };
  }, [bookings, bikes]);

  const pendingB = bookings.filter(b => b.status === 'pending');
  const activeB  = bookings.filter(b => b.status === 'confirmed');
  const historyB = bookings.filter(b => ['completed','rejected','cancelled'].includes(b.status));

  // ── Booking Actions ──
  const handleBookingAction = async (kode, newStatus) => {
    const booking = bookings.find(b => b.kode_booking === kode);
    if (!booking) return;

    if (API_BASE_URL) {
      try {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${API_BASE_URL}/bookings/status/${booking.id}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ status: newStatus })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Gagal mengubah status booking.');

        setBookings(prev => prev.map(b => b.kode_booking === kode ? { ...b, status: newStatus } : b));
      } catch (err) {
        alert(`❌ ${err.message}`);
        return;
      }
    } else {
      const updated = bookings.map(b => b.kode_booking === kode ? { ...b, status: newStatus } : b);
      saveBookings(updated);
    }

    if (logActivity && booking) {
      const actionMap = { confirmed: 'BOOKING_CONFIRMED', rejected: 'BOOKING_REJECTED', completed: 'BOOKING_COMPLETED' };
      const detailMap = {
        confirmed: `Mitra mengkonfirmasi booking ${kode} dari ${booking.nama_pemesan}`,
        rejected:  `Mitra menolak booking ${kode} dari ${booking.nama_pemesan}`,
        completed: `Booking ${kode} dari ${booking.nama_pemesan} diselesaikan`,
      };
      logActivity(actionMap[newStatus] || 'BOOKING_' + newStatus.toUpperCase(), detailMap[newStatus] || `Status booking ${kode} diubah menjadi ${newStatus}`, 'owner', user.nama || user.email);
    }

    if (booking) {
      const bike = bikes.find(b => b.nama_sepeda === booking.sepeda);
      if (bike) {
        if (newStatus === 'confirmed') onUpdateBikeStatus(bike.id, 'disewa');
        if (['completed','rejected'].includes(newStatus)) onUpdateBikeStatus(bike.id, 'tersedia');
      }
    }

    if (booking && (newStatus === 'rejected' || newStatus === 'confirmed')) {
      setEmailModal({ booking, type: newStatus === 'rejected' ? 'rejected' : 'confirmed' });
    }
  };

  // ── CRUD Bike ──
  const handleSaveBike = (bikeData) => {
    if (bikeData.id && bikes.find(b => b.id === bikeData.id)) {
      onEditBike(bikeData);
      if (logActivity) logActivity('BIKE_EDIT', `Mitra memperbarui data sepeda "${bikeData.nama_sepeda}"`, 'owner', user.nama || user.email);
    } else {
      onAddBike(bikeData);
      if (logActivity) logActivity('BIKE_ADD', `Mitra menambahkan sepeda baru "${bikeData.nama_sepeda}" ke katalog`, 'owner', user.nama || user.email);
    }
    setBikeFormState(null);
  };

  const handleDeleteBike = (id) => {
    const bike = bikes.find(b => b.id === id);
    onDeleteBike(id);
    setDeleteConfirm(null);
    if (logActivity && bike) logActivity('BIKE_DELETE', `Mitra menghapus sepeda "${bike.nama_sepeda}" dari katalog`, 'owner', user.nama || user.email);
  };

  const handleBikeStatusSave = () => {
    if (bikeStatusEdit) {
      if (logActivity) {
        const bike = bikes.find(b => b.id === bikeStatusEdit.id);
        logActivity('BIKE_STATUS', `Mitra mengubah status sepeda "${bike?.nama_sepeda}" menjadi ${bikeStatusEdit.newStatus}`, 'owner', user.nama || user.email);
      }
      onUpdateBikeStatus(bikeStatusEdit.id, bikeStatusEdit.newStatus);
      setBikeStatusEdit(null);
    }
  };

  const handleExportCSV = () => {
    if (historyB.length === 0) return alert('Belum ada riwayat untuk di-ekspor.');
    const date = new Date().toISOString().split('T')[0];
    exportToCSV(historyB, `pitrahan_riwayat_${date}.csv`);
  };

  const TABS = [
    { id: 'overview', icon: '📊', label: 'Ringkasan' },
    { id: 'bookings', icon: '📋', label: 'Pemesanan', badge: pendingB.length },
    { id: 'bikes',    icon: '🚴', label: 'Inventaris' },
    { id: 'history',  icon: '📜', label: 'Riwayat' },
  ];

  return (
    <>
      {/* ── Email Sim Modal (z-[70]) ── */}
      {emailModal && (
        <EmailSimModal booking={emailModal.booking} type={emailModal.type} onClose={() => setEmailModal(null)} />
      )}

      {/* ── Bike Form Overlay Modal (z-[60]) ── */}
      {bikeFormState && (
        <BikeFormModal
          bike={bikeFormState.mode === 'edit' ? bikeFormState.bike : null}
          ownerUser={user}
          onSave={handleSaveBike}
          onCancel={() => setBikeFormState(null)}
        />
      )}

      {/* ── Main Owner Dashboard (z-50) ── */}
      <div className="fixed inset-0 flex items-start justify-center bg-black/85 z-50 p-3 overflow-y-auto">
        <div className="bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl w-full max-w-3xl my-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent" />

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d2d2d]">
            <div>
              <h2 className="text-lg font-black uppercase text-white tracking-tight">🏪 Dashboard Pemilik</h2>
              <p className="text-[10px] text-[#a0a0a0] mt-0.5">
                <span className="text-[#FFD700] font-bold">{ownerStoreName}</span> — {user.email}
              </p>
            </div>
            <button onClick={onClose} className="text-[#a0a0a0] hover:text-white text-2xl font-bold">×</button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#2d2d2d] px-2 overflow-x-auto">
            {TABS.map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-[10px] font-black uppercase tracking-wider whitespace-nowrap border-b-2 transition-all ${
                  activeTab === t.id ? 'text-[#FFD700] border-[#FFD700]' : 'text-[#a0a0a0] border-transparent hover:text-white'
                }`}>
                {t.icon} {t.label}
                {t.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 bg-[#FF3E3E] text-white rounded-full text-[8px] font-black">{t.badge}</span>
                )}
              </button>
            ))}
          </div>

          <div className="p-5 md:p-6">

            {/* ══ OVERVIEW ══ */}
            {activeTab === 'overview' && (
              <div className="space-y-5">
                <p className="text-xs font-black uppercase text-[#a0a0a0] tracking-widest">Statistik Toko Anda</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { icon:'⏳', label:'Booking Masuk', val: stats.pending,  color:'#FFD700' },
                    { icon:'✅', label:'Aktif Disewa',  val: stats.confirmed, color:'#39FF14' },
                    { icon:'🚴', label:'Unit Tersedia', val: `${stats.tersedia}/${stats.total}`, color:'#39FF14' },
                    { icon:'💰', label:'Omzet',         val: `Rp ${stats.revenue.toLocaleString('id-ID')}`, color:'#FF9F00' },
                  ].map(s => (
                    <div key={s.label} className="p-4 bg-[#121212] border border-[#2d2d2d] rounded-xl space-y-1.5 hover:border-[#3d3d3d] transition-colors">
                      <span className="text-2xl">{s.icon}</span>
                      <p className="text-[9px] text-[#a0a0a0] uppercase font-bold">{s.label}</p>
                      <p className="font-black text-lg" style={{ color: s.color }}>{s.val}</p>
                    </div>
                  ))}
                </div>

                {pendingB.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-black uppercase text-[#FF3E3E] tracking-widest flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#FF3E3E] animate-pulse" />
                      Perlu Dikonfirmasi ({pendingB.length})
                    </p>
                    {pendingB.slice(0,2).map(b => (
                      <div key={b.kode_booking} className="flex items-center justify-between gap-3 p-3 bg-[#121212] border border-[#FFD700]/20 rounded-xl">
                        <div>
                          <p className="text-sm font-black text-white">{b.sepeda}</p>
                          <p className="text-[9px] text-[#a0a0a0]">
                            {b.nama_pemesan} • {fmtTgl(b.tanggal_ambil)}{b.waktu_ambil ? ` ${b.waktu_ambil}` : ''} • {b.durasi_sewa} {b.durasi_mode||'hari'}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleBookingAction(b.kode_booking, 'rejected')}
                            className="px-3 py-1.5 text-[9px] font-black uppercase border border-[#FF3E3E]/40 text-[#FF3E3E] rounded-lg hover:bg-[#FF3E3E]/10 transition-all">Tolak</button>
                          <button onClick={() => handleBookingAction(b.kode_booking, 'confirmed')}
                            className="px-3 py-1.5 text-[9px] font-black uppercase bg-[#39FF14] text-black rounded-lg hover:bg-white transition-all">Konfirmasi</button>
                        </div>
                      </div>
                    ))}
                    {pendingB.length > 2 && (
                      <button onClick={() => setActiveTab('bookings')} className="text-[10px] font-bold text-[#FFD700] hover:underline w-full py-1">
                        Lihat {pendingB.length - 2} pemesanan lainnya →
                      </button>
                    )}
                  </div>
                )}

                {pendingB.length === 0 && (
                  <div className="text-center py-8 space-y-1">
                    <p className="text-3xl">✅</p>
                    <p className="text-sm font-bold text-white">Semua booking sudah ditangani!</p>
                  </div>
                )}
              </div>
            )}

            {/* ══ PEMESANAN ══ */}
            {activeTab === 'bookings' && (
              <div className="space-y-4">
                <p className="text-xs font-black uppercase text-[#a0a0a0] tracking-widest">
                  Pemesanan Aktif ({pendingB.length + activeB.length})
                </p>
                {[...pendingB, ...activeB].length === 0 ? (
                  <div className="text-center py-16"><p className="text-4xl">📭</p><p className="text-sm font-bold text-white mt-2">Belum ada pemesanan aktif</p></div>
                ) : (
                  <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
                    {[...pendingB, ...activeB].map(b => (
                      <div key={b.kode_booking} className="p-4 bg-[#121212] border border-[#2d2d2d] rounded-xl">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-black text-white">{b.sepeda}</span>
                              <StatusPill status={b.status} config={STATUS_BOOKING} />
                            </div>
                            <p className="text-[9px] font-mono text-[#a0a0a0]">{b.kode_booking}</p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[9px] text-[#a0a0a0] mt-1">
                              <span>👤 {b.nama_pemesan}</span>
                              <span>📱 {b.no_hp}</span>
                              <span>📅 {fmtTgl(b.tanggal_ambil)}{b.waktu_ambil ? ` — ${b.waktu_ambil}` : ''}</span>
                              <span>⏱ {b.durasi_sewa} {b.durasi_mode||'hari'}</span>
                            </div>
                            <p className="text-sm font-black text-[#39FF14]">Rp {parseFloat(b.total_harga).toLocaleString('id-ID')}</p>
                          </div>
                          <div className="flex gap-2 flex-shrink-0">
                            {b.status === 'pending' && (
                              <>
                                <button onClick={() => handleBookingAction(b.kode_booking, 'rejected')}
                                  className="px-3 py-1.5 text-[9px] font-black uppercase border border-[#FF3E3E]/40 text-[#FF3E3E] rounded-lg hover:bg-[#FF3E3E]/10 transition-all">Tolak</button>
                                <button onClick={() => handleBookingAction(b.kode_booking, 'confirmed')}
                                  className="px-3 py-1.5 text-[9px] font-black uppercase bg-[#39FF14] text-black rounded-lg hover:bg-white transition-all">Konfirmasi</button>
                              </>
                            )}
                            {b.status === 'confirmed' && (
                              <button onClick={() => handleBookingAction(b.kode_booking, 'completed')}
                                className="px-3 py-1.5 text-[9px] font-black uppercase bg-[#39FF14] text-black rounded-lg hover:bg-white transition-all">Selesai</button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ══ INVENTARIS (CRUD SEPEDA) ══ */}
            {activeTab === 'bikes' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase text-[#a0a0a0] tracking-widest">Inventaris Sepeda ({bikes.length})</p>
                  <button onClick={() => setBikeFormState({ mode: 'add' })}
                    className="px-4 py-2 text-[10px] font-black uppercase bg-[#FFD700] text-black rounded-xl hover:bg-white transition-all">
                    ➕ Tambah Sepeda
                  </button>
                </div>

                {/* Status edit inline */}
                {bikeStatusEdit && (
                  <div className="p-3 bg-[#FFD700]/5 border border-[#FFD700]/30 rounded-xl space-y-2">
                    <p className="text-[10px] font-bold text-white">
                      Ubah status: <span className="text-[#FFD700]">{bikes.find(b=>b.id===bikeStatusEdit.id)?.nama_sepeda}</span>
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(STATUS_BIKE).map(([k,{label,cls}]) => (
                        <button key={k} onClick={() => setBikeStatusEdit(p => ({...p, newStatus: k}))}
                          className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg border transition-all ${bikeStatusEdit.newStatus===k ? `${cls} scale-105` : 'border-[#333] text-[#a0a0a0] hover:border-[#555]'}`}>
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setBikeStatusEdit(null)} className="px-3 py-1.5 text-[9px] font-black text-[#a0a0a0] border border-[#333] rounded-lg uppercase">Batal</button>
                      <button onClick={handleBikeStatusSave} className="px-3 py-1.5 text-[9px] font-black bg-[#FFD700] text-black rounded-lg uppercase">Simpan</button>
                    </div>
                  </div>
                )}

                {/* Delete confirm */}
                {deleteConfirm && (
                  <div className="p-3 bg-[#FF3E3E]/5 border border-[#FF3E3E]/30 rounded-xl space-y-2">
                    <p className="text-[10px] font-bold text-white">🗑️ Hapus sepeda ini dari katalog?</p>
                    <p className="text-[9px] text-[#a0a0a0]">Tindakan ini tidak bisa dibatalkan.</p>
                    <div className="flex gap-2">
                      <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 text-[9px] font-black text-[#a0a0a0] border border-[#333] rounded-lg uppercase">Batal</button>
                      <button onClick={() => handleDeleteBike(deleteConfirm)}
                        className="px-3 py-1.5 text-[9px] font-black bg-[#FF3E3E] text-white rounded-lg uppercase">Ya, Hapus</button>
                    </div>
                  </div>
                )}

                {/* Bike List */}
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {bikes.length === 0 && (
                    <div className="text-center py-10"><p className="text-3xl">🚴</p><p className="text-sm font-bold text-white mt-2">Belum ada sepeda. Klik "Tambah Sepeda"!</p></div>
                  )}
                  {bikes.map(bike => {
                    // Photo gallery preview: ambil semua src dari foto_urls atau fallback ke foto_url
                    const allPhotos = Array.isArray(bike.foto_urls) && bike.foto_urls.length > 0
                      ? bike.foto_urls
                      : bike.foto_url ? [{ src: bike.foto_url }] : [];
                    const primarySrc = allPhotos[0]?.src || '';

                    return (
                      <div key={bike.id} className="p-3 bg-[#121212] border border-[#2d2d2d] rounded-xl hover:border-[#3d3d3d] transition-all">
                        <div className="flex items-center gap-3">
                          {/* Foto stack (perlihatkan hingga 3 foto kecil) */}
                          <div className="flex -space-x-2 flex-shrink-0">
                            {allPhotos.slice(0, 3).map((p, i) => (
                              <img key={i} src={p.src} alt=""
                                className="w-12 h-10 rounded-lg object-cover border-2 border-[#1a1a1a] bg-[#2d2d2d]"
                                style={{ zIndex: 3 - i }}
                                onError={e => { e.target.src = 'https://placehold.co/48x40/1e1e1e/555?text=?'; }}
                              />
                            ))}
                            {allPhotos.length > 3 && (
                              <div className="w-12 h-10 rounded-lg bg-[#2d2d2d] border-2 border-[#1a1a1a] flex items-center justify-center text-[8px] font-black text-[#a0a0a0]" style={{ zIndex: 0 }}>
                                +{allPhotos.length - 3}
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-black text-white truncate">{bike.nama_sepeda}</p>
                            <p className="text-[9px] text-[#a0a0a0] capitalize">
                              {bike.jenis_sepeda?.replace('_',' ')} • Rp {parseFloat(bike.harga_per_hari||0).toLocaleString('id-ID')}/hari
                              {bike.harga_per_jam ? ` • Rp ${parseFloat(bike.harga_per_jam).toLocaleString('id-ID')}/jam` : ''}
                            </p>
                            <p className="text-[8px] text-[#555]">{allPhotos.length} foto</p>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <StatusPill status={bike.status_ketersediaan} config={STATUS_BIKE} />
                            <button onClick={() => setBikeStatusEdit({ id: bike.id, newStatus: bike.status_ketersediaan })}
                              className="px-2 py-1 text-[8px] font-black text-[#a0a0a0] border border-[#333] rounded-lg hover:border-[#FFD700] hover:text-[#FFD700] transition-all uppercase">
                              Status
                            </button>
                            <button onClick={() => setBikeFormState({ mode: 'edit', bike })}
                              className="px-2 py-1 text-[8px] font-black text-[#39FF14] border border-[#39FF14]/30 rounded-lg hover:border-[#39FF14] hover:bg-[#39FF14]/5 transition-all uppercase">
                              Edit
                            </button>
                            <button onClick={() => setDeleteConfirm(bike.id)}
                              className="px-2 py-1 text-[8px] font-black text-[#FF3E3E] border border-[#FF3E3E]/30 rounded-lg hover:border-[#FF3E3E] hover:bg-[#FF3E3E]/5 transition-all uppercase">
                              Hapus
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ══ RIWAYAT ══ */}
            {activeTab === 'history' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase text-[#a0a0a0] tracking-widest">
                    Riwayat Transaksi ({historyB.length})
                  </p>
                  <button onClick={handleExportCSV}
                    className="flex items-center gap-1.5 px-4 py-2 text-[10px] font-black uppercase bg-[#1a1a1a] border border-[#39FF14]/40 text-[#39FF14] rounded-xl hover:bg-[#39FF14]/10 transition-all">
                    📥 Export CSV
                  </button>
                </div>

                {historyB.length === 0 ? (
                  <div className="text-center py-16"><p className="text-4xl">📋</p><p className="text-sm font-bold text-white mt-2">Belum ada riwayat transaksi</p></div>
                ) : (
                  <>
                    <div className="p-3 bg-[#39FF14]/5 border border-[#39FF14]/20 rounded-xl flex justify-between items-center">
                      <div>
                        <p className="text-[9px] uppercase font-bold text-[#a0a0a0]">Total Omzet Terkonfirmasi</p>
                        <p className="font-black text-[#39FF14]">Rp {stats.revenue.toLocaleString('id-ID')}</p>
                      </div>
                      <p className="text-[9px] text-[#a0a0a0]">{historyB.length} transaksi</p>
                    </div>

                    <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
                      {historyB.map(b => (
                        <div key={b.kode_booking} className="p-3 bg-[#121212] border border-[#2d2d2d] rounded-xl">
                          <div className="flex items-center justify-between gap-2">
                            <div className="space-y-0.5 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-white">{b.sepeda}</span>
                                <StatusPill status={b.status} config={STATUS_BOOKING} />
                              </div>
                              <p className="text-[9px] text-[#a0a0a0]">
                                {b.nama_pemesan} • {b.kode_booking} • {fmtTgl(b.tanggal_ambil)}
                              </p>
                            </div>
                            <p className="text-sm font-black text-white flex-shrink-0">
                              Rp {parseFloat(b.total_harga).toLocaleString('id-ID')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
