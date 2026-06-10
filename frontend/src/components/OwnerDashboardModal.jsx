import React, { useState, useMemo } from 'react';

function fmtTgl(s) {
  if (!s) return '-';
  const raw = (s.includes('T') ? s.split('T')[0] : s) + 'T00:00:00';
  return new Date(raw).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
}

// ─── CSV Injection Protection ─────────────────────────────────────────────
// Menghapus karakter berbahaya di awal field: =, +, -, @, Tab, CR
function sanitizeCSV(val) {
  const s = String(val ?? '');
  return s.replace(/^[=+\-@\t\r]/, "'");  // prefix ' melindungi di Excel
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

// ─── Status configs ───────────────────────────────────────────────────────
const STATUS_BIKE = {
  tersedia: { label: 'Tersedia', cls: 'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/30' },
  disewa:   { label: 'Disewa',   cls: 'bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/30' },
  servis:   { label: 'Servis',   cls: 'bg-[#FF3E3E]/10 text-[#FF3E3E] border-[#FF3E3E]/30' },
};
const STATUS_BOOKING = {
  pending:   { label: 'Menunggu',      cls: 'bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/30' },
  confirmed: { label: 'Dikonfirmasi',  cls: 'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/30' },
  rejected:  { label: 'Ditolak',       cls: 'bg-[#FF3E3E]/10 text-[#FF3E3E] border-[#FF3E3E]/30' },
  completed: { label: 'Selesai',       cls: 'bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/30' },
  cancelled: { label: 'Dibatalkan',    cls: 'bg-[#555]/20 text-[#a0a0a0] border-[#555]/30' },
};

function StatusPill({ status, config }) {
  const cfg = config[status] || { label: status, cls: 'bg-[#333]/20 text-[#a0a0a0] border-[#333]' };
  return <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${cfg.cls}`}>{cfg.label}</span>;
}

// ─── Form Tambah/Edit Sepeda ──────────────────────────────────────────────
const BIKE_TYPES = [
  { val: 'gunung',    label: 'Gunung' },
  { val: 'lipat',     label: 'Lipat' },
  { val: 'onthel',    label: 'Onthel/Klasik' },
  { val: 'city_bike', label: 'City Bike' },
];

const EMPTY_BIKE = {
  nama_sepeda: '', jenis_sepeda: 'gunung', deskripsi: '',
  harga_per_hari: '', harga_per_jam: '', foto_url: '',
  status_ketersediaan: 'tersedia',
};

function BikeFormModal({ bike, ownerUser, onSave, onCancel }) {
  const [form, setForm] = useState(bike ? { ...bike } : { ...EMPTY_BIKE });
  const [preview, setPreview] = useState(bike?.foto_url || '');
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const inp = 'w-full px-3 py-2 bg-[#0d0d0d] border border-[#333] text-white rounded-lg text-xs focus:outline-none focus:border-[#FFD700] transition-colors placeholder:text-[#444]';
  const lbl = 'text-[9px] uppercase font-bold text-[#a0a0a0] tracking-wider';

  const handleSave = () => {
    if (!form.nama_sepeda.trim()) return alert('Nama sepeda wajib diisi.');
    if (!form.harga_per_hari || isNaN(form.harga_per_hari)) return alert('Harga per hari wajib diisi (angka).');
    if (!form.foto_url.trim()) return alert('URL foto wajib diisi.');
    onSave({
      ...form,
      id: form.id || Date.now(),
      nama_toko: ownerUser.nama_usaha || ownerUser.nama,
      alamat_toko: ownerUser.alamat_toko || '',
      no_telepon: ownerUser.no_hp_toko || ownerUser.no_telepon || '',
      jam_operasional: ownerUser.jam_operasional || '',
    });
  };

  return (
    <div className="p-4 bg-[#0d0d0d] border border-[#FFD700]/30 rounded-xl space-y-3">
      <p className="text-xs font-black text-[#FFD700] uppercase">{bike ? '✏️ Edit Sepeda' : '➕ Tambah Sepeda Baru'}</p>
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
          <label className={lbl}>Status Awal</label>
          <select value={form.status_ketersediaan} onChange={e => set('status_ketersediaan', e.target.value)} className={inp}>
            <option value="tersedia">Tersedia</option>
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
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2 text-[10px] font-black text-[#a0a0a0] border border-[#333] rounded-lg hover:border-[#555] uppercase">Batal</button>
        <button onClick={handleSave} className="flex-1 py-2 text-[10px] font-black bg-[#FFD700] text-black rounded-lg hover:bg-white transition-all uppercase">Simpan</button>
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
    <div className="fixed inset-0 flex items-center justify-center bg-black/70 z-[60] p-4">
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
export default function OwnerDashboardModal({ user, bikes: initialBikes, onUpdateBikeStatus, onAddBike, onEditBike, onDeleteBike, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');

  // Bikes dari prop (sumber kebenaran di App.jsx)
  const bikes = initialBikes;

  // Bookings – filter hanya milik toko ini (IDOR prevention)
  const ownerStoreName = user.nama_usaha || user.nama;
  const [bookings, setBookings] = useState(() => {
    try {
      const all = JSON.parse(localStorage.getItem('pitrahan_demo_bookings') || '[]');
      // Filter: hanya booking yang nama_toko-nya milik owner ini
      return all.filter(b => b.nama_toko === ownerStoreName || !b.nama_toko);
    } catch { return []; }
  });
  const saveBookings = (updated) => {
    // Merge kembali: keep booking toko lain, update toko ini
    const all = JSON.parse(localStorage.getItem('pitrahan_demo_bookings') || '[]');
    const otherStores = all.filter(b => b.nama_toko !== ownerStoreName && b.nama_toko);
    const merged = [...otherStores, ...updated];
    localStorage.setItem('pitrahan_demo_bookings', JSON.stringify(merged));
    setBookings(updated);
  };

  // ── State untuk CRUD & UI ──
  const [showBikeForm, setShowBikeForm]   = useState(false);   // tambah
  const [editingBike, setEditingBike]     = useState(null);    // edit
  const [bikeStatusEdit, setBikeStatusEdit] = useState(null);
  const [emailModal, setEmailModal]       = useState(null);    // { booking, type }
  const [deleteConfirm, setDeleteConfirm] = useState(null);    // bike id

  // ── Stats ──
  const stats = useMemo(() => {
    const pending   = bookings.filter(b => b.status === 'pending').length;
    const confirmed = bookings.filter(b => b.status === 'confirmed').length;
    const revenue   = bookings.filter(b => ['confirmed','completed'].includes(b.status))
                              .reduce((s, b) => s + parseFloat(b.total_harga||0), 0);
    const tersedia  = bikes.filter(b => b.status_ketersediaan === 'tersedia').length;
    return { pending, confirmed, revenue, tersedia, total: bikes.length };
  }, [bookings, bikes]);

  const pendingB  = bookings.filter(b => b.status === 'pending');
  const activeB   = bookings.filter(b => b.status === 'confirmed');
  const historyB  = bookings.filter(b => ['completed','rejected','cancelled'].includes(b.status));

  // ── Booking Actions ──
  const handleBookingAction = (kode, newStatus) => {
    const booking = bookings.find(b => b.kode_booking === kode);
    const updated = bookings.map(b => b.kode_booking === kode ? { ...b, status: newStatus } : b);
    saveBookings(updated);

    // Update status sepeda
    if (booking) {
      const bike = bikes.find(b => b.nama_sepeda === booking.sepeda);
      if (bike) {
        if (newStatus === 'confirmed') onUpdateBikeStatus(bike.id, 'disewa');
        if (['completed','rejected'].includes(newStatus)) onUpdateBikeStatus(bike.id, 'tersedia');
      }
    }

    // Tampil simulasi email
    if (booking && (newStatus === 'rejected' || newStatus === 'confirmed')) {
      setEmailModal({ booking, type: newStatus === 'rejected' ? 'rejected' : 'confirmed' });
    }
  };

  // ── CRUD Bike ──
  const handleSaveBike = (bikeData) => {
    if (bikeData.id && bikes.find(b => b.id === bikeData.id)) {
      onEditBike(bikeData);
    } else {
      onAddBike(bikeData);
    }
    setShowBikeForm(false);
    setEditingBike(null);
  };
  const handleDeleteBike = (id) => {
    onDeleteBike(id);
    setDeleteConfirm(null);
  };
  const handleBikeStatusSave = () => {
    if (bikeStatusEdit) {
      onUpdateBikeStatus(bikeStatusEdit.id, bikeStatusEdit.newStatus);
      setBikeStatusEdit(null);
    }
  };

  // ── Export CSV ──
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
      {emailModal && (
        <EmailSimModal booking={emailModal.booking} type={emailModal.type} onClose={() => setEmailModal(null)} />
      )}

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
                    { icon:'🚴', label:'Unit Tersedia', val: `${stats.tersedia}/${stats.total}`, color:'#00E5FF' },
                    { icon:'💰', label:'Omzet',         val: `Rp ${stats.revenue.toLocaleString('id-ID')}`, color:'#FF9F00' },
                  ].map(s => (
                    <div key={s.label} className="p-4 bg-[#121212] border border-[#2d2d2d] rounded-xl space-y-1.5 hover:border-[#3d3d3d] transition-colors">
                      <span className="text-2xl">{s.icon}</span>
                      <p className="text-[9px] text-[#a0a0a0] uppercase font-bold">{s.label}</p>
                      <p className="font-black text-lg" style={{ color: s.color }}>{s.val}</p>
                    </div>
                  ))}
                </div>

                {/* Pending booking preview */}
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
                                className="px-3 py-1.5 text-[9px] font-black uppercase bg-[#00E5FF] text-black rounded-lg hover:bg-white transition-all">Selesai</button>
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
                  <button onClick={() => { setShowBikeForm(true); setEditingBike(null); }}
                    className="px-4 py-2 text-[10px] font-black uppercase bg-[#FFD700] text-black rounded-xl hover:bg-white transition-all">
                    ➕ Tambah Sepeda
                  </button>
                </div>

                {/* Form Tambah */}
                {showBikeForm && !editingBike && (
                  <BikeFormModal ownerUser={user} onSave={handleSaveBike} onCancel={() => setShowBikeForm(false)} />
                )}

                {/* Form Edit */}
                {editingBike && (
                  <BikeFormModal bike={editingBike} ownerUser={user} onSave={handleSaveBike}
                    onCancel={() => setEditingBike(null)} />
                )}

                {/* Status edit inline */}
                {bikeStatusEdit && (
                  <div className="p-3 bg-[#FFD700]/5 border border-[#FFD700]/30 rounded-xl space-y-2">
                    <p className="text-[10px] font-bold text-white">
                      Ubah status: <span className="text-[#FFD700]">{bikes.find(b=>b.id===bikeStatusEdit.id)?.nama_sepeda}</span>
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

                <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                  {bikes.length === 0 && (
                    <div className="text-center py-10"><p className="text-3xl">🚴</p><p className="text-sm font-bold text-white mt-2">Belum ada sepeda. Klik "Tambah Sepeda"!</p></div>
                  )}
                  {bikes.map(bike => (
                    <div key={bike.id} className="flex items-center gap-3 p-3 bg-[#121212] border border-[#2d2d2d] rounded-xl hover:border-[#3d3d3d] transition-all">
                      <img src={bike.foto_url} alt={bike.nama_sepeda}
                        className="w-16 h-12 rounded-lg object-cover flex-shrink-0 bg-[#2d2d2d]"
                        onError={e => { e.target.src='https://placehold.co/64x48/1e1e1e/555?text=Bike'; }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-white truncate">{bike.nama_sepeda}</p>
                        <p className="text-[9px] text-[#a0a0a0] capitalize">
                          {bike.jenis_sepeda?.replace('_',' ')} • Rp {parseFloat(bike.harga_per_hari||0).toLocaleString('id-ID')}/hari
                          {bike.harga_per_jam ? ` • Rp ${parseFloat(bike.harga_per_jam).toLocaleString('id-ID')}/jam` : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <StatusPill status={bike.status_ketersediaan} config={STATUS_BIKE} />
                        <button onClick={() => setBikeStatusEdit({ id: bike.id, newStatus: bike.status_ketersediaan })}
                          className="px-2 py-1 text-[8px] font-black text-[#a0a0a0] border border-[#333] rounded-lg hover:border-[#FFD700] hover:text-[#FFD700] transition-all uppercase">
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
                  ))}
                </div>
              </div>
            )}

            {/* ══ RIWAYAT + CSV EXPORT ══ */}
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
                    {/* Summary omzet */}
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
