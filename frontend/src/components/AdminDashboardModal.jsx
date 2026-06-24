import React, { useState, useMemo, useEffect } from 'react';

function fmtTgl(s) {
  if (!s) return '-';
  const raw = (s.includes('T') ? s.split('T')[0] : s) + 'T00:00:00';
  return new Date(raw).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
}

const ROLE_LABEL = { customer: 'Customer', owner: 'Owner', admin: 'Admin' };
const STATUS_COLOR = {
  active:               'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/30',
  pending_verification: 'bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/30',
  banned:               'bg-[#FF3E3E]/10 text-[#FF3E3E] border-[#FF3E3E]/30',
};
const BOOKING_STATUS = {
  pending:   { l: 'Pending',   cls: 'bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/30' },
  confirmed: { l: 'Confirmed', cls: 'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/30' },
  completed: { l: 'Selesai',   cls: 'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/30' },
  rejected:  { l: 'Ditolak',  cls: 'bg-[#FF3E3E]/10 text-[#FF3E3E] border-[#FF3E3E]/30' },
  cancelled: { l: 'Batal',    cls: 'bg-[#555]/20 text-[#a0a0a0] border-[#555]/30' },
};

function Pill({ label, cls }) {
  return <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${cls}`}>{label}</span>;
}

const BIKE_TYPES = [
  { val: 'gunung',    label: 'Gunung' },
  { val: 'lipat',     label: 'Lipat' },
  { val: 'onthel',    label: 'Onthel/Klasik' },
  { val: 'city_bike', label: 'City Bike' },
];

const STATUS_BIKE = {
  tersedia: { label: 'Tersedia', cls: 'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/30' },
  disewa:   { label: 'Disewa',   cls: 'bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/30' },
  servis:   { label: 'Servis',   cls: 'bg-[#FF3E3E]/10 text-[#FF3E3E] border-[#FF3E3E]/30' },
};

const EMPTY_BIKE = {
  nama_sepeda: '', jenis_sepeda: 'gunung', deskripsi: '',
  harga_per_hari: '', harga_per_jam: '', deposit_fee: '',
  foto_urls: [],
  foto_url: '',
  status_ketersediaan: 'tersedia',
  nama_toko: '', alamat_toko: '', no_telepon: '', jam_operasional: '07.00 - 21.00 WIB'
};

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

// ─── Component: MultiPhotoManager (Admin Neon Green Theme) ───
function MultiPhotoManager({ photos, onChange }) {
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState('');
  const fileRef = React.useRef(null);
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
              {i === 0 && (
                <span className="absolute top-1 left-1 bg-[#39FF14] text-black text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase">
                  Utama
                </span>
              )}
              <span className={`absolute top-1 right-1 text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase ${
                p.type === 'file' ? 'bg-[#39FF14] text-black' : 'bg-white/20 text-white'
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
          {uploadingIdx !== null && (
            <div className="w-full h-24 rounded-xl border border-dashed border-[#39FF14]/40 bg-[#0d0d0d] flex items-center justify-center">
              <span className="text-[9px] text-[#39FF14] animate-pulse">Memproses...</span>
            </div>
          )}
        </div>
      )}

      {/* Add controls */}
      {photos.length < 6 && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="url"
              placeholder="https://cdn.example.com/bike.jpg"
              value={urlInput}
              onChange={e => { setUrlInput(e.target.value); setUrlError(''); }}
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addUrl())}
              className="flex-1 px-3 py-2 bg-[#0d0d0d] border border-[#333] text-white rounded-lg text-xs focus:outline-none focus:border-[#39FF14] transition-colors placeholder:text-[#444]"
            />
            <button type="button" onClick={addUrl}
              className="px-3 py-2 text-[9px] font-black uppercase bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/30 rounded-lg hover:bg-[#39FF14]/20 transition-all whitespace-nowrap">
              + Tambah URL
            </button>
          </div>
          {urlError && <p className="text-[9px] text-[#FF3E3E]">{urlError}</p>}

          <button type="button" onClick={() => fileRef.current?.click()}
            className="w-full py-2.5 border border-dashed border-[#333] rounded-xl text-[10px] font-bold text-[#a0a0a0] hover:border-[#39FF14]/50 hover:text-[#39FF14] transition-all flex items-center justify-center gap-2">
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

// ─── Component: AdminBikeFormModal (Fixed Centered Overlay Popup Modal) ───
function AdminBikeFormModal({ bike, activeOwners, onSave, onCancel }) {
  const [form, setForm] = useState(() => normalizeBike(bike));
  const [selectedMitraId, setSelectedMitraId] = useState('');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleMitraChange = (e) => {
    const val = e.target.value;
    setSelectedMitraId(val);
    if (val === 'manual' || val === '') {
      set('nama_toko', ''); set('alamat_toko', ''); set('no_telepon', '');
      set('jam_operasional', '07.00 - 21.00 WIB');
    } else {
      const owner = activeOwners.find(o => o.id === val);
      if (owner) {
        set('nama_toko', owner.nama_usaha || owner.nama);
        set('alamat_toko', owner.alamat_toko || '');
        set('no_telepon', owner.no_hp_toko || owner.no_telepon || '');
        set('jam_operasional', owner.jam_operasional || '07.00 - 21.00 WIB');
      }
    }
  };

  const handleSave = () => {
    if (!form.nama_sepeda.trim()) return alert('Nama sepeda wajib diisi.');
    if (!form.harga_per_hari || isNaN(form.harga_per_hari)) return alert('Harga per hari wajib diisi (angka).');
    if (form.foto_urls.length === 0) return alert('Minimal 1 foto harus ditambahkan (via URL atau upload).');
    if (!form.nama_toko.trim()) return alert('Nama toko/rental wajib diisi.');

    const primaryPhoto = form.foto_urls[0]?.src || '';

    onSave({
      ...form,
      id: form.id || Date.now(),
      foto_url: primaryPhoto,
      foto_urls: form.foto_urls,
      deposit_fee: form.deposit_fee || 0,
    });
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onCancel();
  };

  const inp = 'w-full px-3 py-2 bg-[#0d0d0d] border border-[#333] text-white rounded-lg text-xs focus:outline-none focus:border-[#39FF14] transition-colors placeholder:text-[#444]';
  const lbl = 'text-[9px] uppercase font-bold text-[#a0a0a0] tracking-wider';
  const isEdit = !!(bike && bike.id);

  return (
    <div
      className="fixed inset-0 flex items-end sm:items-center justify-center bg-black/80 z-[60] p-0 sm:p-4 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      <div className="bg-[#1a1a1a] border-t sm:border border-[#2d2d2d] sm:border-[#39FF14]/30 rounded-t-2xl sm:rounded-2xl w-full max-w-lg flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden shadow-2xl relative">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2d2d2d] flex items-center justify-between flex-shrink-0 bg-[#1a1a1a]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#39FF14]/10 border border-[#39FF14]/30 flex items-center justify-center text-lg">
              {isEdit ? '✏️' : '➕'}
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-tight">
                {isEdit ? 'Edit Sepeda (Admin)' : 'Tambah Sepeda Baru (Admin)'}
              </h3>
              <p className="text-[9px] text-[#a0a0a0] mt-0.5">
                {isEdit ? `Memperbarui: ${bike.nama_sepeda}` : 'Inventaris sepeda baru di katalog'}
              </p>
            </div>
          </div>
          <button onClick={onCancel}
            className="w-8 h-8 rounded-full bg-[#2d2d2d] hover:bg-[#3d3d3d] text-[#a0a0a0] hover:text-white text-lg font-bold transition-all flex items-center justify-center">
            ×
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 pb-28 scrollbar-none">
          
          {/* Detail Sepeda */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <label className={lbl}>Nama Sepeda *</label>
              <input value={form.nama_sepeda} onChange={e => set('nama_sepeda', e.target.value)} placeholder="Polygon Xtrada 5" className={inp} />
            </div>
            <div className="space-y-1">
              <label className={lbl}>Jenis Sepeda *</label>
              <select value={form.jenis_sepeda} onChange={e => set('jenis_sepeda', e.target.value)} className={inp}>
                {BIKE_TYPES.map(t => <option key={t.val} value={t.val}>{t.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className={lbl}>Status Sepeda</label>
              <select value={form.status_ketersediaan} onChange={e => set('status_ketersediaan', e.target.value)} className={inp}>
                <option value="tersedia">Tersedia</option>
                <option value="disewa">Sedang Disewa</option>
                <option value="servis">Servis</option>
              </select>
            </div>
          </div>

          {/* Tarif & Deposit */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className={lbl}>Harga / Hari (Rp) *</label>
              <input type="number" min="0" value={form.harga_per_hari} onChange={e => set('harga_per_hari', e.target.value)} placeholder="75000" className={inp} />
            </div>
            <div className="space-y-1">
              <label className={lbl}>Harga / Jam (Rp)</label>
              <input type="number" min="0" value={form.harga_per_jam} onChange={e => set('harga_per_jam', e.target.value)} placeholder="15000" className={inp} />
            </div>
            <div className="space-y-1">
              <label className={lbl}>Deposit (Rp)</label>
              <input type="number" min="0" value={form.deposit_fee} onChange={e => set('deposit_fee', e.target.value)} placeholder="50000" className={inp} />
            </div>
          </div>

          {/* Deskripsi */}
          <div className="space-y-1">
            <label className={lbl}>Deskripsi</label>
            <textarea rows={2} value={form.deskripsi} onChange={e => set('deskripsi', e.target.value)} placeholder="Deskripsi singkat sepeda..." className={inp + ' resize-none'} />
          </div>

          {/* Multi-Photo Manager */}
          <div className="space-y-1">
            <label className={lbl}>
              Foto Sepeda * <span className="text-[#555] normal-case font-normal">(maks. 6 foto — URL atau upload file)</span>
            </label>
            <MultiPhotoManager
              photos={form.foto_urls}
              onChange={(newPhotos) => {
                if (typeof newPhotos === 'function') {
                  setForm(f => ({ ...f, foto_urls: newPhotos(f.foto_urls) }));
                } else {
                  set('foto_urls', newPhotos);
                }
              }}
            />
          </div>

          {/* Hubungkan ke Toko */}
          <div className="space-y-3 p-3 bg-[#0d0d0d] border border-[#2d2d2d] rounded-xl">
            <p className="text-[10px] font-black uppercase text-[#39FF14] tracking-wider">Hubungkan ke Toko / Rental</p>
            <div className="space-y-1">
              <label className={lbl}>Pilih Mitra Terdaftar</label>
              <select value={selectedMitraId} onChange={handleMitraChange} className={inp}>
                <option value="">-- Input Manual / Toko Lainnya --</option>
                {activeOwners.map(o => <option key={o.id} value={o.id}>{o.nama_usaha || o.nama} ({o.email})</option>)}
                <option value="manual">Manual / Toko Lainnya</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1 col-span-2">
                <label className={lbl}>Nama Toko / Rental *</label>
                <input value={form.nama_toko} onChange={e => set('nama_toko', e.target.value)} placeholder="Rental Sepeda Jogja" className={inp} />
              </div>
              <div className="space-y-1 col-span-2">
                <label className={lbl}>Alamat Lengkap Toko</label>
                <input value={form.alamat_toko} onChange={e => set('alamat_toko', e.target.value)} placeholder="Jl. Malioboro No. 15, Yogyakarta" className={inp} />
              </div>
              <div className="space-y-1">
                <label className={lbl}>No. Telepon Toko</label>
                <input value={form.no_telepon} onChange={e => set('no_telepon', e.target.value)} placeholder="08123456789" className={inp} />
              </div>
              <div className="space-y-1">
                <label className={lbl}>Jam Operasional</label>
                <input value={form.jam_operasional} onChange={e => set('jam_operasional', e.target.value)} placeholder="07.00 - 21.00 WIB" className={inp} />
              </div>
            </div>
          </div>

        </div>

        {/* Sticky Footer Actions */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#2d2d2d] px-5 py-4 flex gap-3 flex-shrink-0 shadow-[0_-8px_24px_rgba(0,0,0,0.5)] z-20">
          <button type="button" onClick={onCancel}
            className="flex-1 py-3 text-[10px] font-black text-[#a0a0a0] border border-[#2d2d2d] hover:text-white hover:border-[#555] rounded-xl uppercase tracking-wider transition-all">
            Batal
          </button>
          <button type="button" onClick={handleSave}
            className="flex-1 py-3 text-[10px] font-black bg-[#39FF14] text-black rounded-xl hover:bg-white transition-all uppercase tracking-wider shadow-[0_0_15px_rgba(57,255,20,0.2)]">
            {isEdit ? '✓ Simpan Perubahan' : '➕ Tambahkan Sepeda'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardModal({ user, allBikes = [], onUpdateBikeStatus, onAddBike, onEditBike, onDeleteBike, onClose, logActivity, onOpenProfile, API_BASE_URL, token }) {
  const [tab, setTab] = useState('overview');

  const [users, setUsers] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pitrahan_users') || '[]'); }
    catch { return []; }
  });
  const saveUsers = (u) => { setUsers(u); localStorage.setItem('pitrahan_users', JSON.stringify(u)); };

  const [showBikeForm, setShowBikeForm] = useState(false);
  const [editingBike, setEditingBike]   = useState(null);
  const [bikeStatusEdit, setBikeStatusEdit] = useState(null);
  const [deleteConfirm, setDeleteConfirm]   = useState(null);

  const [bookings, setBookings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pitrahan_demo_bookings') || '[]'); }
    catch { return []; }
  });

  // Fetch bookings from API (production) or fallback to localStorage (demo mode)
  useEffect(() => {
    async function fetchBookings() {
      if (!API_BASE_URL) return; // demo mode — bookings already loaded from localStorage
      try {
        const headers = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${API_BASE_URL}/bookings/admin/all`, { headers });
        if (!res.ok) return; // silently fail, keep localStorage bookings
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          // Normalize API booking fields to match admin dashboard expectations
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
        console.error('Admin: failed to fetch bookings from API:', err);
      }
    }
    fetchBookings();
  }, [API_BASE_URL, token]);

  const [selectedOwner, setSelectedOwner] = useState(null);

  const handleActivateOwner = (id) => {
    const owner = users.find(u => u.id === id);
    saveUsers(users.map(u => u.id === id ? { ...u, status: 'active' } : u));
    if (logActivity && owner) {
      logActivity('OWNER_ACTIVATED', `Mitra "${owner.nama}" (${owner.email}) diaktifkan oleh admin`, 'admin', user?.nama || 'Admin');
    }
    setSelectedOwner(null);
  };
  const handleRejectOwner = (id) => {
    const owner = users.find(u => u.id === id);
    saveUsers(users.map(u => u.id === id ? { ...u, status: 'rejected' } : u));
    if (logActivity && owner) {
      logActivity('OWNER_REJECTED', `Mitra "${owner.nama}" (${owner.email}) ditolak oleh admin`, 'admin', user?.nama || 'Admin');
    }
    setSelectedOwner(null);
  };
  const handleToggleBan = (id) => {
    const target = users.find(u => u.id === id);
    const newStatus = target?.status === 'banned' ? 'active' : 'banned';
    saveUsers(users.map(u => u.id !== id ? u : { ...u, status: newStatus }));
    if (logActivity && target) {
      logActivity(
        newStatus === 'banned' ? 'USER_BANNED' : 'USER_UNBANNED',
        `Pengguna "${target.nama}" (${target.email}) ${newStatus === 'banned' ? 'diblokir' : 'dibuka blokirnya'} oleh admin`,
        'admin', user?.nama || 'Admin'
      );
    }
  };

  const pendingOwners = users.filter(u => u.role === 'owner' && u.status === 'pending_verification');
  const activeOwners  = users.filter(u => u.role === 'owner' && u.status === 'active');
  const bannedCount   = users.filter(u => u.status === 'banned').length;
  const totalRevenue  = bookings
    .filter(b => b.status === 'confirmed' || b.status === 'completed')
    .reduce((s, b) => s + parseFloat(b.total_harga || 0), 0);

  const stats = useMemo(() => ({
    users:    users.length,
    owners:   activeOwners.length,
    pending:  pendingOwners.length,
    bikes:    allBikes.length,
    bookings: bookings.length,
    revenue:  totalRevenue,
  }), [users, bookings, allBikes]);

  const MENU = [
    { id: 'overview', icon: '📊', label: 'Dashboard' },
    { id: 'verify',   icon: '✅', label: 'Verif. Mitra', badge: pendingOwners.length },
    { id: 'users',    icon: '👥', label: 'Pengguna' },
    { id: 'bikes',    icon: '🚴', label: 'Sepeda' },
    { id: 'monitor',  icon: '📋', label: 'Transaksi' },
    { id: 'logs',     icon: '📜', label: 'Log Aktivitas' },
  ];

  // ── State: expanded bukti per booking (for admin view) ──
  const [expandedBukti, setExpandedBukti] = useState(null);

  // ── State: log viewer ──
  const [logFilter, setLogFilter]     = useState('all');   // 'all' | role name
  const [actionFilter, setActionFilter] = useState('all'); // 'all' | action key
  const [logSearch, setLogSearch]     = useState('');
  const [allLogs, setAllLogs]         = useState(() => {
    try { return JSON.parse(localStorage.getItem('pitrahan_activity_logs') || '[]'); }
    catch { return []; }
  });

  // Reload logs whenever the log tab is visible or the global event fires
  React.useEffect(() => {
    const reload = () => {
      try { setAllLogs(JSON.parse(localStorage.getItem('pitrahan_activity_logs') || '[]')); }
      catch {}
    };
    window.addEventListener('pitrahan_new_activity', reload);
    return () => window.removeEventListener('pitrahan_new_activity', reload);
  }, []);

  const inputCls = 'w-full px-3 py-2 bg-[#0d0d0d] border border-[#333] text-white rounded-lg text-xs focus:outline-none focus:border-[#39FF14] transition-colors';

  return (
    <div className="min-h-screen w-full bg-[#0a0a0a] text-white flex overflow-hidden" style={{ height: '100vh' }}>

      {/* ── SIDEBAR ── */}
      <aside className="w-56 bg-[#0d0d0d] border-r border-[#2d2d2d] flex flex-col flex-shrink-0">
        {/* Brand */}
        <div className="px-5 py-4 border-b border-[#2d2d2d]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#39FF14] to-[#22c55e] flex items-center justify-center font-black text-black text-sm">PT</div>
            <span className="text-lg font-black tracking-tight uppercase">
              pi<span className="text-[#39FF14]">Trahan</span>
            </span>
          </div>
          <p className="text-[9px] text-[#555] font-bold uppercase tracking-wider mt-1">Superadmin Panel</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {MENU.map(m => (
            <button
              key={m.id}
              onClick={() => { setTab(m.id); setShowBikeForm(false); setEditingBike(null); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left ${
                tab === m.id
                  ? 'bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14]'
                  : 'text-[#a0a0a0] hover:text-white hover:bg-[#1a1a1a] border border-transparent'
              }`}
            >
              <span className="text-base leading-none">{m.icon}</span>
              <span className="flex-1">{m.label}</span>
              {m.badge > 0 && (
                <span className="px-1.5 py-0.5 bg-[#FF3E3E] text-white rounded-full text-[8px] font-black animate-pulse">{m.badge}</span>
              )}
            </button>
          ))}
        </nav>

        {/* User info + Logout */}
        <div className="p-3 border-t border-[#2d2d2d] space-y-2">
          <button
            onClick={onOpenProfile}
            title="Buka Profil & Dashboard"
            className="w-full flex items-center gap-2.5 px-3 py-2 bg-[#1a1a1a] border border-[#2d2d2d] hover:border-[#39FF14]/40 rounded-xl transition-all text-left cursor-pointer"
          >
            <div className="w-7 h-7 rounded-lg bg-[#39FF14]/20 flex items-center justify-center font-black text-[#39FF14] text-xs">
              {(user?.nama || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{user?.nama || 'Admin'}</p>
              <p className="text-[9px] text-[#555] uppercase font-bold">Superadmin</p>
            </div>
          </button>
          <button
            onClick={onClose}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-[#FF3E3E] hover:bg-[#FF3E3E]/10 border border-transparent hover:border-[#FF3E3E]/20"
          >
            <span className="text-base leading-none">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="px-6 py-3.5 bg-[#0d0d0d]/50 border-b border-[#2d2d2d] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase text-[#555] tracking-widest">
              {MENU.find(m => m.id === tab)?.label || 'Dashboard'}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14] animate-pulse" />
          </div>
          <button
            onClick={onOpenProfile}
            title="Buka Profil & Dashboard"
            className="flex items-center gap-2.5 hover:opacity-85 transition-opacity cursor-pointer text-left"
          >
            <p className="text-xs font-bold text-white hidden sm:block">{user?.nama || 'Admin piTrahan'}</p>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#39FF14] to-[#22c55e] flex items-center justify-center font-black text-black text-xs">
              {(user?.nama || 'A').charAt(0).toUpperCase()}
            </div>
          </button>
        </header>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* ══ TAB: OVERVIEW / DASHBOARD ══ */}
          {tab === 'overview' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Selamat Datang, Admin! ⚡</h2>
                <p className="text-xs text-[#555] mt-0.5">Pantau statistik, sepeda, dan performa platform secara real-time.</p>
              </div>

              {/* Stats cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { icon: '👥', label: 'Total Pengguna',  val: stats.users,    color: '#39FF14' },
                  { icon: '🏪', label: 'Mitra Aktif',     val: stats.owners,   color: '#FFD700' },
                  { icon: '⏳', label: 'Menunggu Verif.', val: stats.pending,  color: '#FF3E3E' },
                  { icon: '🚴', label: 'Unit Sepeda',     val: stats.bikes,    color: '#39FF14' },
                  { icon: '📋', label: 'Total Booking',   val: stats.bookings, color: '#a0a0a0' },
                  { icon: '💰', label: 'Total Omzet',     val: `Rp ${stats.revenue.toLocaleString('id-ID')}`, color: '#FF9F00' },
                ].map(s => (
                  <div key={s.label} className="p-4 bg-[#111] border border-[#2d2d2d] rounded-xl space-y-1.5 hover:border-[#3d3d3d] transition-colors">
                    <span className="text-2xl">{s.icon}</span>
                    <p className="text-[9px] text-[#555] uppercase font-bold">{s.label}</p>
                    <p className="font-black text-xl" style={{ color: s.color }}>{s.val}</p>
                  </div>
                ))}
              </div>

              {/* Pending alert */}
              {pendingOwners.length > 0 && (
                <div className="p-4 bg-[#FF3E3E]/5 border border-[#FF3E3E]/20 rounded-xl space-y-2">
                  <p className="text-xs font-black text-[#FF3E3E] uppercase flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#FF3E3E] animate-pulse inline-block" />
                    {pendingOwners.length} Mitra Menunggu Verifikasi!
                  </p>
                  <p className="text-[10px] text-[#a0a0a0]">Toko baru tidak akan muncul di katalog publik sampai diverifikasi.</p>
                  <button onClick={() => setTab('verify')} className="px-4 py-2 text-[10px] font-black uppercase bg-[#FF3E3E] text-white rounded-lg hover:bg-white hover:text-[#FF3E3E] transition-all">
                    Verifikasi Sekarang &rarr;
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#111] border border-[#2d2d2d] rounded-xl">
                  <p className="text-[9px] uppercase font-bold text-[#555]">Mitra Rental Aktif</p>
                  <p className="font-black text-lg text-[#FFD700]">{activeOwners.length}</p>
                  {activeOwners.slice(0, 3).map(o => (
                    <p key={o.id} className="text-[9px] text-[#a0a0a0] truncate">• {o.nama_usaha || o.nama}</p>
                  ))}
                </div>
                <div className="p-3 bg-[#111] border border-[#2d2d2d] rounded-xl">
                  <p className="text-[9px] uppercase font-bold text-[#555]">User Dibanned</p>
                  <p className="font-black text-lg text-[#FF3E3E]">{bannedCount}</p>
                  <p className="text-[9px] text-[#a0a0a0] mt-1">Kelola di tab Pengguna</p>
                </div>
              </div>

              {/* Recent bookings */}
              {bookings.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[9px] uppercase font-bold text-[#555] tracking-widest">Booking Terbaru</p>
                  {bookings.slice(0, 5).map(b => {
                    const st = BOOKING_STATUS[b.status] || BOOKING_STATUS.pending;
                    return (
                      <div key={b.kode_booking} className="flex items-center justify-between p-3 bg-[#111] border border-[#2d2d2d] rounded-xl">
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{b.sepeda}</span>
                            <Pill label={st.l} cls={st.cls} />
                          </div>
                          <p className="text-[9px] text-[#555]">{b.kode_booking} • {b.nama_pemesan}</p>
                        </div>
                        <p className="text-xs font-black text-white flex-shrink-0">Rp {parseFloat(b.total_harga).toLocaleString('id-ID')}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══ TAB: VERIFIKASI MITRA ══ */}
          {tab === 'verify' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Verifikasi Mitra</h2>
                <p className="text-xs text-[#555] mt-0.5">{pendingOwners.length} pendaftaran menunggu verifikasi.</p>
              </div>

              {selectedOwner && (
                <div className="p-4 bg-[#FFD700]/5 border border-[#FFD700]/30 rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-black text-white">Detail Pendaftaran Mitra</p>
                    <button onClick={() => setSelectedOwner(null)} className="text-[#a0a0a0] hover:text-white">x</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {[
                      ['Pemilik', selectedOwner.nama],
                      ['Email', selectedOwner.email],
                      ['HP Pribadi', selectedOwner.no_telepon],
                      ['Nama Usaha', selectedOwner.nama_usaha],
                      ['Alamat Toko', selectedOwner.alamat_toko],
                      ['HP Toko', selectedOwner.no_hp_toko || '-'],
                      ['Jam Operasional', selectedOwner.jam_operasional || '-'],
                      ['NIB/SIUP', selectedOwner.dokumen_nib || '-'],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <p className="text-[8px] uppercase font-bold text-[#555]">{k}</p>
                        <p className="font-bold text-white text-[10px]">{v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => handleRejectOwner(selectedOwner.id)} className="flex-1 py-2 text-[10px] font-black uppercase border border-[#FF3E3E]/40 text-[#FF3E3E] rounded-lg hover:bg-[#FF3E3E]/10 transition-all">
                      Tolak Pendaftaran
                    </button>
                    <button onClick={() => handleActivateOwner(selectedOwner.id)} className="flex-1 py-2 text-[10px] font-black uppercase bg-[#39FF14] text-black rounded-lg hover:bg-white transition-all">
                      Aktivasi Akun
                    </button>
                  </div>
                </div>
              )}

              {pendingOwners.length === 0 ? (
                <div className="text-center py-16 space-y-2">
                  <p className="text-4xl">✅</p>
                  <p className="text-sm font-bold text-white">Semua mitra sudah diverifikasi!</p>
                  <p className="text-xs text-[#555]">Tidak ada pendaftaran toko baru yang menunggu.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {pendingOwners.map(o => (
                    <div key={o.id} className="p-4 bg-[#111] border border-[#FFD700]/20 rounded-xl hover:border-[#FFD700]/40 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <p className="text-sm font-black text-white">{o.nama_usaha || 'Nama Usaha Belum Diisi'}</p>
                          <p className="text-[10px] text-[#a0a0a0]">{o.nama} &bull; {o.email}</p>
                          <p className="text-[9px] text-[#555]">📍 {o.alamat_toko || '-'}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => setSelectedOwner(o)} className="px-3 py-1.5 text-[9px] font-black uppercase border border-[#FFD700]/40 text-[#FFD700] rounded-lg hover:bg-[#FFD700]/10 transition-all">Detail</button>
                          <button onClick={() => handleActivateOwner(o.id)} className="px-3 py-1.5 text-[9px] font-black uppercase bg-[#39FF14] text-black rounded-lg hover:bg-white transition-all">Aktifkan</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeOwners.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-[#39FF14] tracking-widest">Mitra Aktif ({activeOwners.length})</p>
                  <div className="space-y-1.5 max-h-[30vh] overflow-y-auto pr-1">
                    {activeOwners.map(o => (
                      <div key={o.id} className="flex items-center justify-between p-2.5 bg-[#111] border border-[#2d2d2d] rounded-lg">
                        <div>
                          <p className="text-xs font-bold text-white">{o.nama_usaha || o.nama}</p>
                          <p className="text-[9px] text-[#555]">{o.email}</p>
                        </div>
                        <Pill label="Aktif" cls={STATUS_COLOR.active} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ TAB: MANAJEMEN PENGGUNA ══ */}
          {tab === 'users' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Manajemen Pengguna</h2>
                <p className="text-xs text-[#555] mt-0.5">{users.filter(u => u.role !== 'admin').length} pengguna terdaftar di platform.</p>
              </div>
              <div className="space-y-2 max-h-[70vh] overflow-y-auto pr-1">
                {users.filter(u => u.role !== 'admin').map(u => (
                  <div key={u.id} className={`p-3 border rounded-xl transition-all ${u.status === 'banned' ? 'bg-[#FF3E3E]/5 border-[#FF3E3E]/20' : 'bg-[#111] border-[#2d2d2d] hover:border-[#3d3d3d]'}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-white">{u.nama}</span>
                          <Pill label={ROLE_LABEL[u.role] || u.role} cls={u.role === 'owner' ? 'bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/30' : 'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/30'} />
                          <Pill
                            label={u.status === 'banned' ? 'Banned' : u.status === 'pending_verification' ? 'Pending' : 'Aktif'}
                            cls={STATUS_COLOR[u.status] || STATUS_COLOR.active}
                          />
                        </div>
                        <p className="text-[9px] text-[#555]">{u.email} &bull; {u.no_telepon || '-'}</p>
                        {u.nama_usaha && <p className="text-[9px] text-[#FFD700]">🏪 {u.nama_usaha}</p>}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {u.status === 'pending_verification' && (
                          <button onClick={() => handleActivateOwner(u.id)} className="px-2 py-1 text-[9px] font-black uppercase bg-[#39FF14] text-black rounded-lg hover:bg-white transition-all">Aktifkan</button>
                        )}
                        <button onClick={() => handleToggleBan(u.id)} className={`px-2 py-1 text-[9px] font-black uppercase rounded-lg transition-all border ${u.status === 'banned' ? 'border-[#39FF14]/40 text-[#39FF14] hover:bg-[#39FF14]/10' : 'border-[#FF3E3E]/40 text-[#FF3E3E] hover:bg-[#FF3E3E]/10'}`}>
                          {u.status === 'banned' ? 'Unban' : 'Ban'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ TAB: KELOLA SEPEDA ══ */}
          {tab === 'bikes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">Kelola Sepeda</h2>
                  <p className="text-xs text-[#555] mt-0.5">{allBikes.length} unit sepeda di katalog global.</p>
                </div>
                <button onClick={() => { setShowBikeForm(true); setEditingBike(null); }} className="px-4 py-2 text-[10px] font-black uppercase bg-[#39FF14] text-black rounded-xl hover:bg-white transition-all">
                  + Tambah Sepeda
                </button>
              </div>

              {(showBikeForm || editingBike) && (
                <AdminBikeFormModal
                  bike={editingBike}
                  activeOwners={activeOwners}
                  onSave={(data) => {
                    if (editingBike) {
                      onEditBike(data);
                      setEditingBike(null);
                    } else {
                      onAddBike(data);
                      setShowBikeForm(false);
                    }
                  }}
                  onCancel={() => {
                    setShowBikeForm(false);
                    setEditingBike(null);
                  }}
                />
              )}

              {bikeStatusEdit && (
                <div className="p-3 bg-[#39FF14]/5 border border-[#39FF14]/30 rounded-xl space-y-2">
                  <p className="text-[10px] font-bold text-white">Ubah status: <span className="text-[#39FF14]">{allBikes.find(b => b.id === bikeStatusEdit.id)?.nama_sepeda}</span></p>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(STATUS_BIKE).map(([k, { label, cls }]) => (
                      <button key={k} onClick={() => setBikeStatusEdit(p => ({ ...p, newStatus: k }))} className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg border transition-all ${bikeStatusEdit.newStatus === k ? `${cls} scale-105` : 'border-[#333] text-[#a0a0a0] hover:border-[#555]'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setBikeStatusEdit(null)} className="px-3 py-1.5 text-[9px] font-black text-[#a0a0a0] border border-[#333] rounded-lg uppercase">Batal</button>
                    <button onClick={() => {
                      onUpdateBikeStatus(bikeStatusEdit.id, bikeStatusEdit.newStatus);
                      if (logActivity) {
                        const bike = allBikes.find(b => b.id === bikeStatusEdit.id);
                        logActivity('BIKE_STATUS', `Admin mengubah status sepeda "${bike?.nama_sepeda}" menjadi ${bikeStatusEdit.newStatus}`, 'admin', user?.nama || 'Admin');
                      }
                      setBikeStatusEdit(null);
                    }} className="px-3 py-1.5 text-[9px] font-black bg-[#39FF14] text-black rounded-lg uppercase">Simpan</button>
                  </div>
                </div>
              )}

              {deleteConfirm && (
                <div className="p-3 bg-[#FF3E3E]/5 border border-[#FF3E3E]/30 rounded-xl space-y-2">
                  <p className="text-[10px] font-bold text-white">Hapus sepeda ini dari katalog global?</p>
                  <p className="text-[9px] text-[#a0a0a0]">Tindakan ini tidak bisa dibatalkan.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 text-[9px] font-black text-[#a0a0a0] border border-[#333] rounded-lg uppercase">Batal</button>
                    <button onClick={() => {
                      const bike = allBikes.find(b => b.id === deleteConfirm);
                      onDeleteBike(deleteConfirm);
                      setDeleteConfirm(null);
                    }} className="px-3 py-1.5 text-[9px] font-black bg-[#FF3E3E] text-white rounded-lg uppercase">Ya, Hapus</button>
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {allBikes.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-3xl">🚴</p>
                    <p className="text-sm font-bold text-white mt-2">Belum ada sepeda di katalog.</p>
                  </div>
                ) : (
                  allBikes.map(bike => (
                    <div key={bike.id} className="flex items-center gap-3 p-3 bg-[#111] border border-[#2d2d2d] rounded-xl hover:border-[#3d3d3d] transition-all">
                      <img src={bike.foto_url} alt={bike.nama_sepeda} className="w-16 h-12 rounded-lg object-cover flex-shrink-0 bg-[#2d2d2d]" onError={e => { e.target.src = 'https://placehold.co/64x48/1e1e1e/555?text=Bike'; }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-white truncate">{bike.nama_sepeda}</p>
                        <p className="text-[9px] text-[#a0a0a0] capitalize">
                          {bike.jenis_sepeda?.replace('_', ' ')} &bull; Rp {parseFloat(bike.harga_per_hari || 0).toLocaleString('id-ID')}/hari
                          {bike.harga_per_jam ? ` • Rp ${parseFloat(bike.harga_per_jam).toLocaleString('id-ID')}/jam` : ''}
                        </p>
                        <p className="text-[9px] text-[#FFD700] truncate">🏪 {bike.nama_toko || 'General'}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${(STATUS_BIKE[bike.status_ketersediaan] || { cls: 'bg-[#555]/20 text-[#a0a0a0] border-[#555]/30' }).cls}`}>
                          {(STATUS_BIKE[bike.status_ketersediaan] || { label: bike.status_ketersediaan }).label}
                        </span>
                        <button onClick={() => setBikeStatusEdit({ id: bike.id, newStatus: bike.status_ketersediaan })} className="px-2 py-1 text-[8px] font-black text-[#a0a0a0] border border-[#333] rounded-lg hover:border-[#39FF14] hover:text-white transition-all uppercase">Status</button>
                        <button onClick={() => { setEditingBike(bike); setShowBikeForm(false); }} className="px-2 py-1 text-[8px] font-black text-[#39FF14] border border-[#39FF14]/30 rounded-lg hover:border-[#39FF14] transition-all uppercase">Edit</button>
                        <button onClick={() => setDeleteConfirm(bike.id)} className="px-2 py-1 text-[8px] font-black text-[#FF3E3E] border border-[#FF3E3E]/30 rounded-lg hover:border-[#FF3E3E] transition-all uppercase">Hapus</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ══ TAB: MONITOR TRANSAKSI ══ */}
          {tab === 'monitor' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-xl font-black text-white uppercase tracking-tight">Monitor Transaksi</h2>
                <p className="text-xs text-[#555] mt-0.5">{bookings.length} total booking di seluruh platform.</p>
              </div>

              {/* Legend */}
              <div className="flex gap-3 text-[9px] text-[#555] font-bold uppercase">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FFD700] inline-block" /> Ada bukti dikirim</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#333] inline-block" /> Belum ada bukti</span>
              </div>

              {bookings.length === 0 ? (
                <div className="text-center py-16 space-y-2">
                  <p className="text-4xl">📭</p>
                  <p className="text-sm font-bold text-white">Belum ada transaksi</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                  {bookings.map(b => {
                    const st = BOOKING_STATUS[b.status] || BOOKING_STATUS.pending;
                    const hasBukti = !!b.bukti_transfer;
                    const isExpanded = expandedBukti === b.kode_booking;

                    const handleAction = async (newStatus) => {
                      if (API_BASE_URL) {
                        try {
                          const headers = { 'Content-Type': 'application/json' };
                          if (token) headers['Authorization'] = `Bearer ${token}`;
                          const res = await fetch(`${API_BASE_URL}/bookings/status/${b.id}`, {
                            method: 'POST',
                            headers,
                            body: JSON.stringify({ status: newStatus })
                          });
                          const data = await res.json();
                          if (!res.ok) throw new Error(data.message || 'Gagal mengubah status booking.');
                          
                          setBookings(prev => prev.map(bk => bk.kode_booking === b.kode_booking ? { ...bk, status: newStatus } : bk));
                        } catch (err) {
                          alert(`❌ ${err.message}`);
                          return;
                        }
                      } else {
                        const all = JSON.parse(localStorage.getItem('pitrahan_demo_bookings') || '[]');
                        const updated = all.map(bk =>
                          bk.kode_booking === b.kode_booking ? { ...bk, status: newStatus } : bk
                        );
                        localStorage.setItem('pitrahan_demo_bookings', JSON.stringify(updated));
                        setBookings(updated);
                      }

                      if (logActivity) {
                        const actKey = newStatus === 'confirmed' ? 'BOOKING_CONFIRMED' : 'BOOKING_REJECTED';
                        const actDesc = newStatus === 'confirmed' 
                          ? `Admin mengkonfirmasi booking ${b.kode_booking} atas nama ${b.nama_pemesan}`
                          : `Admin menolak booking ${b.kode_booking} atas nama ${b.nama_pemesan}`;
                        logActivity(actKey, actDesc, 'admin', user?.nama || 'Admin');
                      }
                      alert(newStatus === 'confirmed' ? `✅ Booking ${b.kode_booking} telah dikonfirmasi!` : `❌ Booking ${b.kode_booking} telah ditolak.`);
                    };

                    const handleKonfirmasi = () => handleAction('confirmed');
                    const handleTolak = () => handleAction('rejected');

                    return (
                      <div key={b.kode_booking} className={`rounded-xl border transition-all overflow-hidden ${b.metode_pembayaran === 'offline' ? 'border-[#39FF14]/20 bg-[#39FF14]/2' : hasBukti ? 'border-[#FFD700]/30 bg-[#FFD700]/3' : 'border-[#2d2d2d] bg-[#111]'}`}>
                        {/* Row utama */}
                        <div className="p-3 flex items-start gap-2">
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-white">{b.sepeda}</span>
                              <Pill label={st.l} cls={st.cls} />
                              {hasBukti && (
                                <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/30 flex items-center gap-1">
                                  📎 Bukti Masuk
                                </span>
                              )}
                              {b.metode_pembayaran === 'offline' && (
                                <span className="px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase bg-[#39FF14]/15 text-[#39FF14] border border-[#39FF14]/30 flex items-center gap-1">
                                  💵 Bayar Offline
                                </span>
                              )}
                            </div>
                            <p className="text-[9px] font-mono text-[#555]">{b.kode_booking} &bull; 🏪 {b.nama_toko}</p>
                            <p className="text-[9px] text-[#a0a0a0]">
                              👤 {b.nama_pemesan} &bull; 📅 {fmtTgl(b.tanggal_ambil)} &bull; {b.durasi_sewa} {b.durasi_mode || 'hari'}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                            <p className="text-sm font-black text-white">Rp {parseFloat(b.total_harga).toLocaleString('id-ID')}</p>
                            {hasBukti && (
                              <button
                                onClick={() => setExpandedBukti(isExpanded ? null : b.kode_booking)}
                                className={`px-2 py-1 text-[8px] font-black uppercase rounded-lg border transition-all ${
                                  isExpanded
                                    ? 'bg-[#FFD700]/20 border-[#FFD700]/40 text-[#FFD700]'
                                    : 'border-[#FFD700]/30 text-[#FFD700] hover:bg-[#FFD700]/10'
                                }`}
                              >
                                {isExpanded ? 'Tutup' : 'Lihat Bukti'}
                              </button>
                            )}
                            {b.status === 'pending' && b.metode_pembayaran === 'offline' && (
                              <div className="flex gap-1.5">
                                <button
                                  onClick={handleKonfirmasi}
                                  className="px-2 py-1 text-[8px] font-black uppercase bg-[#39FF14] text-black rounded-lg hover:bg-white transition-all flex items-center gap-0.5"
                                >
                                  <span>✓</span> Konfirmasi
                                </button>
                                <button
                                  onClick={handleTolak}
                                  className="px-2 py-1 text-[8px] font-black uppercase border border-[#FF3E3E]/40 text-[#FF3E3E] rounded-lg hover:bg-[#FF3E3E] hover:text-white transition-all"
                                >
                                  Tolak
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Panel Bukti (expanded) */}
                        {isExpanded && hasBukti && (
                          <div className="px-3 pb-3 space-y-2 border-t border-[#FFD700]/10 pt-3">
                            <div className="flex items-center justify-between mb-1">
                              <p className="text-[9px] font-black uppercase text-[#FFD700]">📎 Bukti Pembayaran dari Pemesan</p>
                              {b.bukti_sent_at && (
                                <p className="text-[8px] text-[#555]">
                                  Dikirim: {new Date(b.bukti_sent_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                </p>
                              )}
                            </div>
                            <img
                              src={b.bukti_transfer}
                              alt="Bukti pembayaran"
                              className="w-full max-h-72 object-contain rounded-xl border border-[#FFD700]/20 bg-[#0d0d0d]"
                            />
                            {b.status === 'pending' && (
                              <div className="flex gap-2 pt-1">
                                <button
                                  onClick={handleKonfirmasi}
                                  className="flex-1 py-2.5 text-[10px] font-black uppercase bg-[#39FF14] text-black rounded-xl hover:bg-white transition-all flex items-center justify-center gap-1.5"
                                >
                                  <span>✓</span> Konfirmasi Booking
                                </button>
                                <button
                                  onClick={handleTolak}
                                  className="px-4 py-2.5 text-[10px] font-black uppercase border border-[#FF3E3E]/40 text-[#FF3E3E] rounded-xl hover:bg-[#FF3E3E]/10 transition-all"
                                >
                                  Tolak
                                </button>
                              </div>
                            )}
                            {b.status === 'confirmed' && (
                              <div className="flex items-center gap-2 py-2 text-[10px] font-black text-[#39FF14] uppercase">
                                <span className="w-4 h-4 rounded-full bg-[#39FF14] text-black flex items-center justify-center text-[8px]">✓</span>
                                Booking Sudah Dikonfirmasi
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {bookings.length > 0 && (
                <div className="p-3 bg-[#111] border border-[#2d2d2d] rounded-xl grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <p className="text-[8px] uppercase font-bold text-[#555]">Total Omzet</p>
                    <p className="font-black text-[#39FF14]">Rp {totalRevenue.toLocaleString('id-ID')}</p>
                  </div>
                  <div>
                    <p className="text-[8px] uppercase font-bold text-[#555]">Total Transaksi</p>
                    <p className="font-black text-white">{bookings.length} booking</p>
                  </div>
                  <div>
                    <p className="text-[8px] uppercase font-bold text-[#555]">Ada Bukti</p>
                    <p className="font-black text-[#FFD700]">{bookings.filter(b => b.bukti_transfer).length}</p>
                  </div>
                  <div>
                    <p className="text-[8px] uppercase font-bold text-[#555]">Pending</p>
                    <p className="font-black text-[#FF3E3E]">{bookings.filter(b => b.status === 'pending').length}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ TAB: LOG AKTIVITAS ══ */}
          {tab === 'logs' && (() => {
            const ACTION_LABELS = {
              LOGIN:              { l: 'Login',            cls: 'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/30' },
              LOGOUT:             { l: 'Logout',           cls: 'bg-[#555]/20 text-[#a0a0a0] border-[#555]/30' },
              BOOKING:            { l: 'Booking',          cls: 'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/30' },
              BOOKING_CONFIRMED:  { l: 'Konfirmasi',       cls: 'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/30' },
              BOOKING_REJECTED:   { l: 'Tolak Booking',    cls: 'bg-[#FF3E3E]/10 text-[#FF3E3E] border-[#FF3E3E]/30' },
              BOOKING_COMPLETED:  { l: 'Selesai',          cls: 'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/30' },
              OWNER_ACTIVATED:    { l: 'Aktifkan Mitra',   cls: 'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/30' },
              OWNER_REJECTED:     { l: 'Tolak Mitra',      cls: 'bg-[#FF3E3E]/10 text-[#FF3E3E] border-[#FF3E3E]/30' },
              USER_BANNED:        { l: 'Blokir User',      cls: 'bg-[#FF3E3E]/10 text-[#FF3E3E] border-[#FF3E3E]/30' },
              USER_UNBANNED:      { l: 'Buka Blokir',      cls: 'bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/30' },
              BIKE_STATUS:        { l: 'Status Sepeda',    cls: 'bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/30' },
              BIKE_ADD:           { l: 'Tambah Sepeda',    cls: 'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/30' },
              BIKE_EDIT:          { l: 'Edit Sepeda',      cls: 'bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/30' },
              BIKE_DELETE:        { l: 'Hapus Sepeda',     cls: 'bg-[#FF3E3E]/10 text-[#FF3E3E] border-[#FF3E3E]/30' },
              PAYMENT_PROOF:      { l: 'Kirim Bukti',      cls: 'bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/30' },
              KIRIM_BUKTI:        { l: 'Kirim Bukti',      cls: 'bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/30' },
              REGISTER:           { l: 'Registrasi',       cls: 'bg-[#a78bfa]/20 text-[#a78bfa] border-[#a78bfa]/30' },
              REGISTRASI:         { l: 'Registrasi',       cls: 'bg-[#a78bfa]/20 text-[#a78bfa] border-[#a78bfa]/30' },
              PASSWORD_CHANGE:    { l: 'Ganti Password',   cls: 'bg-[#fb923c]/20 text-[#fb923c] border-[#fb923c]/30' },
              UBAH_PASSWORD:      { l: 'Ganti Password',   cls: 'bg-[#fb923c]/20 text-[#fb923c] border-[#fb923c]/30' },
            };
            const ROLE_OPTS = ['all', 'admin', 'owner', 'customer', 'guest'];
            const ACTION_OPTS = ['all', ...Object.keys(ACTION_LABELS)];

            const filtered = allLogs.filter(l => {
              const roleOk   = logFilter === 'all'   || l.userType === logFilter;
              const actionOk = actionFilter === 'all' || l.action === actionFilter;
              const searchOk = !logSearch || [l.userName, l.details, l.action].join(' ').toLowerCase().includes(logSearch.toLowerCase());
              return roleOk && actionOk && searchOk;
            });

            return (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Log Aktivitas 📜</h2>
                    <p className="text-xs text-[#555] mt-0.5">{allLogs.length} total entri tersimpan · menampilkan {filtered.length}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (!window.confirm('Hapus semua log aktivitas? Tindakan ini tidak bisa dibatalkan.')) return;
                      localStorage.setItem('pitrahan_activity_logs', '[]');
                      setAllLogs([]);
                      window.dispatchEvent(new Event('pitrahan_new_activity'));
                    }}
                    className="px-3 py-1.5 text-[9px] font-black uppercase border border-[#FF3E3E]/30 text-[#FF3E3E] rounded-xl hover:bg-[#FF3E3E]/10 transition-all"
                  >
                    🗑 Hapus Semua Log
                  </button>
                </div>

                {/* Filters */}
                <div className="flex gap-2 flex-wrap">
                  <input
                    value={logSearch}
                    onChange={e => setLogSearch(e.target.value)}
                    placeholder="🔍 Cari nama / aksi / detail..."
                    className="flex-1 min-w-[180px] px-3 py-1.5 bg-[#0d0d0d] border border-[#333] text-white rounded-xl text-[10px] focus:outline-none focus:border-[#39FF14] transition-colors"
                  />
                  <select
                    value={logFilter}
                    onChange={e => setLogFilter(e.target.value)}
                    className="px-2 py-1.5 bg-[#0d0d0d] border border-[#333] text-[#a0a0a0] rounded-xl text-[10px] focus:outline-none focus:border-[#39FF14] uppercase"
                  >
                    {ROLE_OPTS.map(r => <option key={r} value={r}>{r === 'all' ? 'Semua Role' : r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select>
                  <select
                    value={actionFilter}
                    onChange={e => setActionFilter(e.target.value)}
                    className="px-2 py-1.5 bg-[#0d0d0d] border border-[#333] text-[#a0a0a0] rounded-xl text-[10px] focus:outline-none focus:border-[#39FF14] uppercase"
                  >
                    {ACTION_OPTS.map(a => <option key={a} value={a}>{a === 'all' ? 'Semua Aksi' : (ACTION_LABELS[a]?.l || a)}</option>)}
                  </select>
                </div>

                {/* Log list */}
                {filtered.length === 0 ? (
                  <div className="text-center py-16 space-y-2">
                    <p className="text-4xl">📭</p>
                    <p className="text-sm font-bold text-white">Tidak ada log yang cocok</p>
                    <p className="text-xs text-[#555]">Coba ubah filter pencarian</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                    {filtered.map(log => {
                      const st = ACTION_LABELS[log.action] || { l: log.action, cls: 'bg-[#555]/20 text-[#a0a0a0] border-[#555]/30' };
                      const ROLE_ICON = { admin: '⚙️', owner: '🏪', customer: '👤', guest: '👁' };
                      const ts = new Date(log.timestamp);
                      const fmtTs = ts.toLocaleString('id-ID', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit' });
                      return (
                        <div key={log.id} className="flex items-start gap-2.5 p-3 bg-[#111] border border-[#2d2d2d] rounded-xl hover:border-[#3d3d3d] transition-all">
                          <span className="text-base leading-none flex-shrink-0 mt-0.5">{ROLE_ICON[log.userType] || '👁'}</span>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase border ${st.cls}`}>{st.l}</span>
                              <span className="text-[9px] font-bold text-white truncate">{log.userName}</span>
                              <span className="text-[8px] text-[#555] font-bold uppercase">{log.userType}</span>
                            </div>
                            <p className="text-[10px] text-[#a0a0a0] leading-relaxed">{log.details}</p>
                          </div>
                          <p className="text-[8px] text-[#555] flex-shrink-0 font-mono text-right whitespace-nowrap">{fmtTs}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

        </div>
      </main>
    </div>
  );
}
