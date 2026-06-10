import React, { useState, useMemo } from 'react';

function fmtTgl(s) {
  if (!s) return '-';
  const raw = (s.includes('T') ? s.split('T')[0] : s) + 'T00:00:00';
  return new Date(raw).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
}

const ROLE_LABEL   = { customer: '🛒 Customer', owner: '🏪 Owner', admin: '🔐 Admin' };
const STATUS_COLOR = {
  active:               'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/30',
  pending_verification: 'bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/30',
  banned:               'bg-[#FF3E3E]/10 text-[#FF3E3E] border-[#FF3E3E]/30',
};
const BOOKING_STATUS = {
  pending:   { l: 'Pending',    cls: 'bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/30' },
  confirmed: { l: 'Confirmed',  cls: 'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/30' },
  completed: { l: 'Selesai',   cls: 'bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/30' },
  rejected:  { l: 'Ditolak',   cls: 'bg-[#FF3E3E]/10 text-[#FF3E3E] border-[#FF3E3E]/30' },
  cancelled: { l: 'Batal',     cls: 'bg-[#555]/20 text-[#a0a0a0] border-[#555]/30' },
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

function AdminBikeForm({ bike, activeOwners, onSave, onCancel }) {
  const EMPTY_BIKE = {
    nama_sepeda: '', jenis_sepeda: 'gunung', deskripsi: '',
    harga_per_hari: '', harga_per_jam: '', foto_url: '',
    status_ketersediaan: 'tersedia',
    nama_toko: '', alamat_toko: '', no_telepon: '', jam_operasional: '07.00 – 21.00 WIB'
  };

  const [form, setForm] = useState(bike ? { ...bike } : { ...EMPTY_BIKE });
  const [selectedMitraId, setSelectedMitraId] = useState('');
  const [preview, setPreview] = useState(bike?.foto_url || '');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  
  const handleMitraChange = (e) => {
    const val = e.target.value;
    setSelectedMitraId(val);
    if (val === 'manual' || val === '') {
      set('nama_toko', '');
      set('alamat_toko', '');
      set('no_telepon', '');
      set('jam_operasional', '07.00 – 21.00 WIB');
    } else {
      const owner = activeOwners.find(o => o.id === val);
      if (owner) {
        set('nama_toko', owner.nama_usaha || owner.nama);
        set('alamat_toko', owner.alamat_toko || '');
        set('no_telepon', owner.no_hp_toko || owner.no_telepon || '');
        set('jam_operasional', owner.jam_operasional || '07.00 – 21.00 WIB');
      }
    }
  };

  const handleSave = () => {
    if (!form.nama_sepeda.trim()) return alert('Nama sepeda wajib diisi.');
    if (!form.harga_per_hari || isNaN(form.harga_per_hari)) return alert('Harga per hari wajib diisi (angka).');
    if (!form.foto_url.trim()) return alert('URL foto wajib diisi.');
    if (!form.nama_toko.trim()) return alert('Nama toko/rental wajib diisi.');
    
    onSave({
      ...form,
      id: form.id || Date.now(),
    });
  };

  const inp = 'w-full px-3 py-2 bg-[#0d0d0d] border border-[#333] text-white rounded-lg text-xs focus:outline-none focus:border-[#FF3E3E] transition-colors placeholder:text-[#444]';
  const lbl = 'text-[9px] uppercase font-bold text-[#a0a0a0] tracking-wider';

  return (
    <div className="p-4 bg-[#0d0d0d] border border-[#FF3E3E]/30 rounded-xl space-y-3 my-2">
      <p className="text-xs font-black text-[#FF3E3E] uppercase">{bike ? '✏️ Edit Sepeda (Admin)' : '➕ Tambah Sepeda Baru (Admin)'}</p>
      
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
        <div className="space-y-1">
          <label className={lbl}>Harga / Hari (Rp) *</label>
          <input type="number" min="0" value={form.harga_per_hari} onChange={e => set('harga_per_hari', e.target.value)} placeholder="75000" className={inp} />
        </div>
        <div className="space-y-1">
          <label className={lbl}>Harga / Jam (Rp)</label>
          <input type="number" min="0" value={form.harga_per_jam} onChange={e => set('harga_per_jam', e.target.value)} placeholder="15000" className={inp} />
        </div>
        <div className="col-span-2 space-y-1">
          <label className={lbl}>URL Foto *</label>
          <input value={form.foto_url} onChange={e => { set('foto_url', e.target.value); setPreview(e.target.value); }}
            placeholder="https://..." className={inp} />
          {preview && (
            <img src={preview} alt="preview" className="w-full h-28 object-cover rounded-lg mt-1 border border-[#333]"
              onError={e => { e.target.style.display='none'; }} onLoad={e => { e.target.style.display='block'; }} />
          )}
        </div>
        <div className="col-span-2 space-y-1">
          <label className={lbl}>Deskripsi</label>
          <textarea rows={2} value={form.deskripsi} onChange={e => set('deskripsi', e.target.value)}
            placeholder="Deskripsi singkat sepeda..." className={inp + ' resize-none'} />
        </div>
      </div>

      <div className="border-t border-[#2d2d2d] pt-3 my-2" />

      <div className="space-y-3 p-3 bg-[#121212] border border-[#2d2d2d] rounded-lg">
        <p className="text-[10px] font-black uppercase text-[#FFD700] tracking-wider">🏪 Hubungkan ke Toko / Rental</p>
        
        <div className="space-y-1">
          <label className={lbl}>Pilih Mitra Terdaftar</label>
          <select value={selectedMitraId} onChange={handleMitraChange} className={inp}>
            <option value="">-- Input Manual / Toko Lainnya --</option>
            {activeOwners.map(o => (
              <option key={o.id} value={o.id}>{o.nama_usaha || o.nama} ({o.email})</option>
            ))}
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
            <input value={form.jam_operasional} onChange={e => set('jam_operasional', e.target.value)} placeholder="07.00 – 21.00 WIB" className={inp} />
          </div>
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <button onClick={onCancel} className="flex-1 py-2 text-[10px] font-black text-[#a0a0a0] border border-[#333] rounded-lg hover:border-[#555] uppercase">Batal</button>
        <button onClick={handleSave} className="flex-1 py-2 text-[10px] font-black bg-[#FF3E3E] text-white rounded-lg hover:bg-white hover:text-black transition-all uppercase">Simpan</button>
      </div>
    </div>
  );
}

export default function AdminDashboardModal({ user, allBikes, onUpdateBikeStatus, onAddBike, onEditBike, onDeleteBike, onClose }) {
  const [tab, setTab] = useState('overview');

  // ── State Users ──
  const [users, setUsers] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pitrahan_users') || '[]'); }
    catch { return []; }
  });
  const saveUsers = (u) => { setUsers(u); localStorage.setItem('pitrahan_users', JSON.stringify(u)); };

  // ── State untuk CRUD Sepeda oleh Admin ──
  const [showBikeForm, setShowBikeForm]   = useState(false);
  const [editingBike, setEditingBike]     = useState(null);
  const [bikeStatusEdit, setBikeStatusEdit] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // ── State Bookings (semua toko, global view) ──
  const [bookings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pitrahan_demo_bookings') || '[]'); }
    catch { return []; }
  });

  // ── Modal: detail owner pending ──
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [banReason, setBanReason]         = useState('');

  // ── Actions ──
  const handleActivateOwner = (id) => {
    const updated = users.map(u => u.id === id ? { ...u, status: 'active' } : u);
    saveUsers(updated);
    setSelectedOwner(null);
  };
  const handleRejectOwner = (id) => {
    const updated = users.map(u => u.id === id ? { ...u, status: 'rejected' } : u);
    saveUsers(updated);
    setSelectedOwner(null);
  };
  const handleToggleBan = (id) => {
    const updated = users.map(u => {
      if (u.id !== id) return u;
      return { ...u, status: u.status === 'banned' ? 'active' : 'banned' };
    });
    saveUsers(updated);
  };

  // ── Derived ──
  const pendingOwners  = users.filter(u => u.role === 'owner' && u.status === 'pending_verification');
  const activeOwners   = users.filter(u => u.role === 'owner' && u.status === 'active');
  const customers      = users.filter(u => u.role === 'customer');
  const bannedCount    = users.filter(u => u.status === 'banned').length;
  const totalRevenue   = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed')
                                 .reduce((s, b) => s + parseFloat(b.total_harga||0), 0);

  const stats = useMemo(() => ({
    users:    users.length,
    owners:   activeOwners.length,
    pending:  pendingOwners.length,
    bikes:    allBikes.length,
    bookings: bookings.length,
    revenue:  totalRevenue,
  }), [users, bookings, allBikes]);

  const TABS = [
    { id: 'overview',  icon: '📊', label: 'Ringkasan' },
    { id: 'verify',    icon: '✅', label: 'Verifikasi Mitra', badge: pendingOwners.length },
    { id: 'users',     icon: '👥', label: 'Manajemen User' },
    { id: 'bikes',     icon: '🚴', label: 'Kelola Sepeda' },
    { id: 'monitor',   icon: '🌐', label: 'Monitor Platform' },
  ];

  const inputCls = 'w-full px-3 py-2 bg-[#0d0d0d] border border-[#333] text-white rounded-lg text-xs focus:outline-none focus:border-[#FF3E3E] transition-colors';

  return (
    <div className="fixed inset-0 flex items-start justify-center bg-black/90 z-50 p-3 overflow-y-auto">
      <div className="bg-[#111] border border-[#2d2d2d] rounded-2xl w-full max-w-4xl my-4 relative overflow-hidden">
        {/* Glow merah untuk admin */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#FF3E3E] to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2d2d2d]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF3E3E]/10 border border-[#FF3E3E]/30 flex items-center justify-center text-lg">🔐</div>
            <div>
              <h2 className="text-lg font-black uppercase text-white tracking-tight">Admin Panel — piTrahan</h2>
              <p className="text-[10px] text-[#a0a0a0]">Logged in as <span className="text-[#FF3E3E] font-bold">{user.nama}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#a0a0a0] hover:text-white text-2xl font-bold">×</button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#2d2d2d] px-2 overflow-x-auto">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-[10px] font-black uppercase tracking-wider whitespace-nowrap border-b-2 transition-all ${
                tab === t.id ? 'text-[#FF3E3E] border-[#FF3E3E]' : 'text-[#a0a0a0] border-transparent hover:text-white'
              }`}>
              {t.icon} {t.label}
              {t.badge > 0 && (
                <span className="ml-1 px-1.5 py-0.5 bg-[#FF3E3E] text-white rounded-full text-[8px] font-black animate-pulse">
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="p-5 md:p-6">

          {/* ══ TAB: OVERVIEW ══ */}
          {tab === 'overview' && (
            <div className="space-y-5">
              <p className="text-xs font-black uppercase text-[#a0a0a0] tracking-widest">Statistik Platform Global</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { icon:'👥', label:'Total User',       val: stats.users,    color:'#00E5FF' },
                  { icon:'🏪', label:'Mitra Aktif',      val: stats.owners,   color:'#FFD700' },
                  { icon:'⏳', label:'Menunggu Verif.',  val: stats.pending,  color:'#FF3E3E' },
                  { icon:'🚴', label:'Unit Sepeda',      val: stats.bikes,    color:'#39FF14' },
                  { icon:'📋', label:'Total Booking',    val: stats.bookings, color:'#a0a0a0' },
                  { icon:'💰', label:'Total Omzet',      val: `Rp ${stats.revenue.toLocaleString('id-ID')}`, color:'#FF9F00' },
                ].map(s => (
                  <div key={s.label} className="p-4 bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl space-y-1.5 hover:border-[#3d3d3d] transition-colors">
                    <span className="text-2xl">{s.icon}</span>
                    <p className="text-[9px] text-[#a0a0a0] uppercase font-bold">{s.label}</p>
                    <p className="font-black text-xl" style={{ color: s.color }}>{s.val}</p>
                  </div>
                ))}
              </div>

              {pendingOwners.length > 0 && (
                <div className="p-4 bg-[#FF3E3E]/5 border border-[#FF3E3E]/20 rounded-xl space-y-2">
                  <p className="text-xs font-black text-[#FF3E3E] uppercase flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#FF3E3E] animate-pulse" />
                    {pendingOwners.length} Mitra Menunggu Verifikasi!
                  </p>
                  <p className="text-[10px] text-[#a0a0a0]">Toko baru tidak akan muncul di katalog publik sampai diverifikasi.</p>
                  <button onClick={() => setTab('verify')}
                    className="px-4 py-2 text-[10px] font-black uppercase bg-[#FF3E3E] text-white rounded-lg hover:bg-white hover:text-[#FF3E3E] transition-all">
                    Verifikasi Sekarang →
                  </button>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl">
                  <p className="text-[9px] uppercase font-bold text-[#a0a0a0]">Mitra Rental Aktif</p>
                  <p className="font-black text-lg text-[#FFD700]">{activeOwners.length}</p>
                  {activeOwners.slice(0,3).map(o => (
                    <p key={o.id} className="text-[9px] text-[#a0a0a0] truncate">• {o.nama_usaha || o.nama}</p>
                  ))}
                </div>
                <div className="p-3 bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl">
                  <p className="text-[9px] uppercase font-bold text-[#a0a0a0]">User Dibanned</p>
                  <p className="font-black text-lg text-[#FF3E3E]">{bannedCount}</p>
                  <p className="text-[9px] text-[#a0a0a0] mt-1">Kelola di tab Manajemen User</p>
                </div>
              </div>
            </div>
          )}

          {/* ══ TAB: VERIFIKASI MITRA ══ */}
          {tab === 'verify' && (
            <div className="space-y-4">
              <p className="text-xs font-black uppercase text-[#a0a0a0] tracking-widest">
                Pendaftaran Mitra Rental ({pendingOwners.length} menunggu)
              </p>

              {/* Modal detail owner */}
              {selectedOwner && (
                <div className="p-4 bg-[#FFD700]/5 border border-[#FFD700]/30 rounded-xl space-y-3">
                  <div className="flex justify-between items-start">
                    <p className="text-sm font-black text-white">📋 Detail Pendaftaran Mitra</p>
                    <button onClick={() => setSelectedOwner(null)} className="text-[#a0a0a0] hover:text-white">×</button>
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
                    ].map(([k,v]) => (
                      <div key={k}>
                        <p className="text-[8px] uppercase font-bold text-[#a0a0a0]">{k}</p>
                        <p className="font-bold text-white text-[10px]">{v}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => handleRejectOwner(selectedOwner.id)}
                      className="flex-1 py-2 text-[10px] font-black uppercase border border-[#FF3E3E]/40 text-[#FF3E3E] rounded-lg hover:bg-[#FF3E3E]/10 transition-all">
                      ✗ Tolak Pendaftaran
                    </button>
                    <button onClick={() => handleActivateOwner(selectedOwner.id)}
                      className="flex-1 py-2 text-[10px] font-black uppercase bg-[#39FF14] text-black rounded-lg hover:bg-white transition-all">
                      ✓ Aktivasi Akun
                    </button>
                  </div>
                </div>
              )}

              {pendingOwners.length === 0 ? (
                <div className="text-center py-16 space-y-2">
                  <p className="text-4xl">✅</p>
                  <p className="text-sm font-bold text-white">Semua mitra sudah diverifikasi!</p>
                  <p className="text-xs text-[#a0a0a0]">Tidak ada pendaftaran toko baru yang menunggu.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {pendingOwners.map(o => (
                    <div key={o.id}
                      className="p-4 bg-[#1a1a1a] border border-[#FFD700]/20 rounded-xl hover:border-[#FFD700]/40 transition-all">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 min-w-0">
                          <p className="text-sm font-black text-white">{o.nama_usaha || 'Nama Usaha Belum Diisi'}</p>
                          <p className="text-[10px] text-[#a0a0a0]">
                            {o.nama} • {o.email} • NIB: {o.dokumen_nib || '-'}
                          </p>
                          <p className="text-[9px] text-[#a0a0a0]">📍 {o.alamat_toko || '-'}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => setSelectedOwner(o)}
                            className="px-3 py-1.5 text-[9px] font-black uppercase border border-[#FFD700]/40 text-[#FFD700] rounded-lg hover:bg-[#FFD700]/10 transition-all">
                            Detail
                          </button>
                          <button onClick={() => handleActivateOwner(o.id)}
                            className="px-3 py-1.5 text-[9px] font-black uppercase bg-[#39FF14] text-black rounded-lg hover:bg-white transition-all">
                            Aktifkan
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Daftar owner aktif */}
              {activeOwners.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-[#39FF14] tracking-widest">Mitra Aktif ({activeOwners.length})</p>
                  <div className="space-y-1.5 max-h-[30vh] overflow-y-auto pr-1">
                    {activeOwners.map(o => (
                      <div key={o.id} className="flex items-center justify-between p-2.5 bg-[#1a1a1a] border border-[#2d2d2d] rounded-lg">
                        <div>
                          <p className="text-xs font-bold text-white">{o.nama_usaha || o.nama}</p>
                          <p className="text-[9px] text-[#a0a0a0]">{o.email}</p>
                        </div>
                        <Pill label="Aktif" cls={STATUS_COLOR.active} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══ TAB: MANAJEMEN USER ══ */}
          {tab === 'users' && (
            <div className="space-y-4">
              <p className="text-xs font-black uppercase text-[#a0a0a0] tracking-widest">
                Semua Pengguna Platform ({users.filter(u => u.role !== 'admin').length})
              </p>
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {users.filter(u => u.role !== 'admin').map(u => (
                  <div key={u.id}
                    className={`p-3 border rounded-xl transition-all ${
                      u.status === 'banned' ? 'bg-[#FF3E3E]/5 border-[#FF3E3E]/20' : 'bg-[#1a1a1a] border-[#2d2d2d] hover:border-[#3d3d3d]'
                    }`}>
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-white">{u.nama}</span>
                          <Pill label={ROLE_LABEL[u.role] || u.role} cls={u.role === 'owner' ? 'bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/30' : 'bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/30'} />
                          <Pill label={u.status === 'banned' ? '🚫 Banned' : u.status === 'pending_verification' ? '⏳ Pending' : '✅ Aktif'} cls={STATUS_COLOR[u.status] || STATUS_COLOR.active} />
                        </div>
                        <p className="text-[9px] text-[#a0a0a0]">{u.email} • {u.no_telepon || '-'}</p>
                        {u.nama_usaha && <p className="text-[9px] text-[#FFD700]">🏪 {u.nama_usaha}</p>}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {u.status === 'pending_verification' && (
                          <button onClick={() => handleActivateOwner(u.id)}
                            className="px-2 py-1 text-[9px] font-black uppercase bg-[#39FF14] text-black rounded-lg hover:bg-white transition-all">
                            Aktifkan
                          </button>
                        )}
                        <button onClick={() => handleToggleBan(u.id)}
                          className={`px-2 py-1 text-[9px] font-black uppercase rounded-lg transition-all border ${
                            u.status === 'banned'
                              ? 'border-[#39FF14]/40 text-[#39FF14] hover:bg-[#39FF14]/10'
                              : 'border-[#FF3E3E]/40 text-[#FF3E3E] hover:bg-[#FF3E3E]/10'
                          }`}>
                          {u.status === 'banned' ? 'Unban' : 'Ban'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ TAB: KELOLA SEPEDA (ADMIN CRUD) ══ */}
          {tab === 'bikes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase text-[#a0a0a0] tracking-widest">
                  Kelola Semua Sepeda ({allBikes.length})
                </p>
                <button onClick={() => { setShowBikeForm(true); setEditingBike(null); }}
                  className="px-4 py-2 text-[10px] font-black uppercase bg-[#FF3E3E] text-white rounded-xl hover:bg-white hover:text-black transition-all">
                  ➕ Tambah Sepeda
                </button>
              </div>

              {/* Form Tambah Sepeda */}
              {showBikeForm && !editingBike && (
                <AdminBikeForm
                  activeOwners={activeOwners}
                  onSave={(data) => {
                    onAddBike(data);
                    setShowBikeForm(false);
                  }}
                  onCancel={() => setShowBikeForm(false)}
                />
              )}

              {/* Form Edit Sepeda */}
              {editingBike && (
                <AdminBikeForm
                  bike={editingBike}
                  activeOwners={activeOwners}
                  onSave={(data) => {
                    onEditBike(data);
                    setEditingBike(null);
                  }}
                  onCancel={() => setEditingBike(null)}
                />
              )}

              {/* Status Edit Inline */}
              {bikeStatusEdit && (
                <div className="p-3 bg-[#FF3E3E]/5 border border-[#FF3E3E]/30 rounded-xl space-y-2">
                  <p className="text-[10px] font-bold text-white">
                    Ubah status: <span className="text-[#FF3E3E]">{allBikes.find(b=>b.id===bikeStatusEdit.id)?.nama_sepeda}</span>
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {Object.entries(STATUS_BIKE).map(([k,{label,cls}]) => (
                      <button key={k} onClick={() => setBikeStatusEdit(p => ({...p,newStatus:k}))}
                        className={`px-3 py-1.5 text-[9px] font-black uppercase rounded-lg border transition-all ${bikeStatusEdit.newStatus===k?`${cls} scale-105`:'border-[#333] text-[#a0a0a0] hover:border-[#555]'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setBikeStatusEdit(null)} className="px-3 py-1.5 text-[9px] font-black text-[#a0a0a0] border border-[#333] rounded-lg uppercase">Batal</button>
                    <button onClick={() => {
                      onUpdateBikeStatus(bikeStatusEdit.id, bikeStatusEdit.newStatus);
                      setBikeStatusEdit(null);
                    }} className="px-3 py-1.5 text-[9px] font-black bg-[#FF3E3E] text-white rounded-lg uppercase">Simpan</button>
                  </div>
                </div>
              )}

              {/* Delete Confirm */}
              {deleteConfirm && (
                <div className="p-3 bg-[#FF3E3E]/5 border border-[#FF3E3E]/30 rounded-xl space-y-2">
                  <p className="text-[10px] font-bold text-white">🗑️ Hapus sepeda ini dari katalog global?</p>
                  <p className="text-[9px] text-[#a0a0a0]">Tindakan ini tidak bisa dibatalkan.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 text-[9px] font-black text-[#a0a0a0] border border-[#333] rounded-lg uppercase">Batal</button>
                    <button onClick={() => {
                      onDeleteBike(deleteConfirm);
                      setDeleteConfirm(null);
                    }} className="px-3 py-1.5 text-[9px] font-black bg-[#FF3E3E] text-white rounded-lg uppercase">Ya, Hapus</button>
                  </div>
                </div>
              )}

              {/* Bicycles List */}
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {allBikes.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-3xl">🚴</p>
                    <p className="text-sm font-bold text-white mt-2">Belum ada sepeda di katalog.</p>
                  </div>
                ) : (
                  allBikes.map(bike => (
                    <div key={bike.id} className="flex items-center gap-3 p-3 bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl hover:border-[#3d3d3d] transition-all">
                      <img src={bike.foto_url} alt={bike.nama_sepeda}
                        className="w-16 h-12 rounded-lg object-cover flex-shrink-0 bg-[#2d2d2d]"
                        onError={e => { e.target.src='https://placehold.co/64x48/1e1e1e/555?text=Bike'; }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-white truncate">{bike.nama_sepeda}</p>
                        <p className="text-[9px] text-[#a0a0a0] capitalize">
                          {bike.jenis_sepeda?.replace('_',' ')} • Rp {parseFloat(bike.harga_per_hari||0).toLocaleString('id-ID')}/hari
                          {bike.harga_per_jam ? ` • Rp ${parseFloat(bike.harga_per_jam).toLocaleString('id-ID')}/jam` : ''}
                        </p>
                        <p className="text-[9px] text-[#FFD700] truncate">🏪 {bike.nama_toko || 'General'}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${(STATUS_BIKE[bike.status_ketersediaan] || {cls:'bg-[#555]/20 text-[#a0a0a0] border-[#555]/30', label: bike.status_ketersediaan}).cls}`}>
                          {(STATUS_BIKE[bike.status_ketersediaan] || {label: bike.status_ketersediaan}).label}
                        </span>
                        <button onClick={() => setBikeStatusEdit({ id: bike.id, newStatus: bike.status_ketersediaan })}
                          className="px-2 py-1 text-[8px] font-black text-[#a0a0a0] border border-[#333] rounded-lg hover:border-[#FF3E3E] hover:text-white transition-all uppercase">
                          Status
                        </button>
                        <button onClick={() => { setEditingBike(bike); setShowBikeForm(false); }}
                          className="px-2 py-1 text-[8px] font-black text-[#00E5FF] border border-[#00E5FF]/30 rounded-lg hover:border-[#00E5FF] transition-all uppercase">
                          Edit
                        </button>
                        <button onClick={() => setDeleteConfirm(bike.id)}
                          className="px-2 py-1 text-[8px] font-black text-[#FF3E3E] border border-[#FF3E3E]/30 rounded-lg hover:border-[#FF3E3E] transition-all uppercase">
                          Hapus
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ══ TAB: MONITOR PLATFORM ══ */}
          {tab === 'monitor' && (
            <div className="space-y-4">
              <p className="text-xs font-black uppercase text-[#a0a0a0] tracking-widest">
                Semua Transaksi Platform ({bookings.length} booking)
              </p>
              {bookings.length === 0 ? (
                <div className="text-center py-16 space-y-2">
                  <p className="text-4xl">📭</p>
                  <p className="text-sm font-bold text-white">Belum ada transaksi</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                  {bookings.map(b => {
                    const st = BOOKING_STATUS[b.status] || BOOKING_STATUS.pending;
                    return (
                      <div key={b.kode_booking}
                        className="p-3 bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl hover:border-[#3d3d3d] transition-all">
                        <div className="flex items-center justify-between gap-2">
                          <div className="space-y-0.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-white">{b.sepeda}</span>
                              <Pill label={st.l} cls={st.cls} />
                            </div>
                            <p className="text-[9px] font-mono text-[#a0a0a0]">
                              {b.kode_booking} • 🏪 {b.nama_toko}
                            </p>
                            <p className="text-[9px] text-[#a0a0a0]">
                              👤 {b.nama_pemesan} • 📅 {fmtTgl(b.tanggal_ambil)} • ⏱ {b.durasi_sewa} {b.durasi_mode || 'hari'}
                            </p>
                          </div>
                          <p className="text-sm font-black text-white flex-shrink-0">
                            Rp {parseFloat(b.total_harga).toLocaleString('id-ID')}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Summary footer */}
              {bookings.length > 0 && (
                <div className="p-3 bg-[#1a1a1a] border border-[#2d2d2d] rounded-xl grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-[8px] uppercase font-bold text-[#a0a0a0]">Total Omzet (Terkonfirmasi)</p>
                    <p className="font-black text-[#39FF14]">Rp {totalRevenue.toLocaleString('id-ID')}</p>
                  </div>
                  <div>
                    <p className="text-[8px] uppercase font-bold text-[#a0a0a0]">Total Transaksi</p>
                    <p className="font-black text-white">{bookings.length} booking</p>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
