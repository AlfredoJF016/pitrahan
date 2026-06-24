import React, { useState, useEffect, useRef, useCallback } from 'react';

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/** SHA-256 hash via Web Crypto API (Demo Mode password verification) */
async function hashPassword(pw) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Validate Indonesian WhatsApp number: +62xxx / 62xxx / 08xxx */
function isValidWA(v) {
  return /^(\+62|62|0)8[1-9][0-9]{6,11}$/.test(v.replace(/\s|-/g, ''));
}

/** Sanitize text input to prevent XSS — strip HTML tags */
function sanitize(str) {
  return str.replace(/<[^>]*>/g, '').trim();
}

/** Read file as base64 DataURL */
function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = e => resolve(e.target.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

/** Compute password strength score 0-4 */
function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: '' };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  const levels = [
    { label: 'Sangat Lemah', color: '#FF3E3E', bg: 'bg-[#FF3E3E]', glow: 'shadow-[0_0_8px_rgba(255,62,62,0.5)]' },
    { label: 'Lemah',        color: '#FF7A00', bg: 'bg-[#FF7A00]', glow: 'shadow-[0_0_8px_rgba(255,122,0,0.5)]' },
    { label: 'Cukup',        color: '#FFD700', bg: 'bg-[#FFD700]', glow: 'shadow-[0_0_8px_rgba(255,215,0,0.5)]' },
    { label: 'Kuat',         color: '#00E5FF', bg: 'bg-[#00E5FF]', glow: 'shadow-[0_0_8px_rgba(0,229,255,0.5)]' },
    { label: 'Sangat Kuat',  color: '#39FF14', bg: 'bg-[#39FF14]', glow: 'shadow-[0_0_8px_rgba(57,255,20,0.5)]' },
  ];
  return { score, ...levels[score] };
}

/** Simulate browser/device fingerprint for activity log */
function getDeviceInfo() {
  const ua = navigator.userAgent;
  let device = 'Desktop';
  if (/Mobi|Android/i.test(ua)) device = 'Mobile';
  else if (/Tablet|iPad/i.test(ua)) device = 'Tablet';
  const browser = /Chrome/.test(ua) ? 'Chrome' : /Firefox/.test(ua) ? 'Firefox'
    : /Safari/.test(ua) ? 'Safari' : /Edge/.test(ua) ? 'Edge' : 'Browser';
  return `${device} · ${browser}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

/** Inline bukti payment upload per booking */
function saveBukti(kode, b64) {
  const all = JSON.parse(localStorage.getItem('pitrahan_demo_bookings') || '[]');
  localStorage.setItem('pitrahan_demo_bookings', JSON.stringify(
    all.map(b => b.kode_booking === kode ? { ...b, bukti_transfer: b64, bukti_sent_at: new Date().toISOString() } : b)
  ));
}
function getBukti(kode) {
  try { return JSON.parse(localStorage.getItem('pitrahan_demo_bookings') || '[]').find(b => b.kode_booking === kode)?.bukti_transfer || null; }
  catch { return null; }
}

function BuktiWidget({ kode_booking, logActivity, user }) {
  const fileRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState(() => getBukti(kode_booking));
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(!!getBukti(kode_booking));

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Pilih file gambar (JPG/PNG/WEBP).'); return; }
    if (file.size > 5 * 1024 * 1024) { alert('Ukuran file maksimal 5 MB.'); return; }
    setLoading(true);
    try {
      const b64 = await readFileAsBase64(file);
      setPreview(b64); saveBukti(kode_booking, b64); setSent(true);
      if (logActivity) logActivity('KIRIM_BUKTI', `Mengunggah bukti pembayaran booking ${kode_booking}.`, user?.role || 'customer', user?.nama || 'Customer');
    } finally { setLoading(false); }
  };

  if (!open) return (
    <button onClick={() => setOpen(true)} className={`mt-2 w-full py-2 text-[10px] font-black uppercase rounded-xl flex items-center justify-center gap-1.5 transition-all ${sent ? 'bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14] hover:bg-[#39FF14]/20' : 'bg-[#FFD700]/10 border border-[#FFD700]/40 text-[#FFD700] hover:bg-[#FFD700]/20'}`}>
      <span>📎</span>{sent ? 'Bukti Terkirim — Lihat / Ganti' : 'Kirim Bukti Pembayaran'}
    </button>
  );

  return (
    <div className="mt-3 p-3 bg-[#0d0d0d] border border-[#FFD700]/20 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-black uppercase text-[#FFD700]">📎 Bukti Pembayaran</p>
        <button onClick={() => setOpen(false)} className="text-[#555] hover:text-white text-base leading-none">&times;</button>
      </div>
      {preview ? (
        <div className="relative">
          <img src={preview} alt="Bukti" className="w-full max-h-48 object-contain rounded-lg border border-[#333] bg-[#121212]" />
          {sent && <span className="absolute top-2 right-2 px-2 py-0.5 bg-[#39FF14] text-black text-[8px] font-black rounded-lg uppercase">✓ Dikirim</span>}
        </div>
      ) : (
        <button onClick={() => fileRef.current?.click()} disabled={loading} className="w-full h-28 border-2 border-dashed border-[#FFD700]/20 rounded-xl flex flex-col items-center justify-center gap-1.5 hover:border-[#FFD700]/40 hover:bg-[#FFD700]/5 transition-all">
          <span className="text-2xl">{loading ? '⏳' : '🖼️'}</span>
          <p className="text-[9px] text-[#a0a0a0]">{loading ? 'Memproses...' : 'Ketuk untuk pilih foto bukti'}</p>
          <p className="text-[8px] text-[#555]">JPG / PNG / WEBP &bull; Maks. 5 MB</p>
        </button>
      )}
      <div className="flex gap-2">
        {preview && <button onClick={() => { setPreview(null); setSent(false); fileRef.current?.click(); }} className="flex-1 py-2 text-[9px] font-black uppercase border border-[#333] text-[#a0a0a0] rounded-lg hover:border-[#555] transition-all">Ganti Foto</button>}
        {!preview && <button onClick={() => fileRef.current?.click()} disabled={loading} className="flex-1 py-2 text-[9px] font-black uppercase bg-[#FFD700] text-black rounded-lg hover:bg-white transition-all">{loading ? 'Memproses...' : 'Pilih Foto'}</button>}
        {sent && <div className="flex-1 flex items-center justify-center gap-1 py-2 text-[9px] font-black text-[#39FF14] bg-[#39FF14]/10 border border-[#39FF14]/30 rounded-lg uppercase"><span>✓</span> Diterima</div>}
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}

/** Password Strength Meter visual bar */
function StrengthMeter({ password }) {
  const { score, label, bg, glow } = getPasswordStrength(password);
  if (!password) return null;
  return (
    <div className="space-y-1.5 mt-2">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${i < score ? `${bg} ${i === score - 1 ? glow : ''}` : 'bg-[#2d2d2d]'}`} />
        ))}
      </div>
      <p className="text-[9px] font-bold" style={{ color: getPasswordStrength(password).color }}>
        Kekuatan: {label}
      </p>
    </div>
  );
}

/** Reusable password input with show/hide toggle */
function PasswordInput({ value, onChange, placeholder, id, label }) {
  const [show, setShow] = useState(false);
  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={id} className="text-[10px] uppercase font-bold text-[#a0a0a0] tracking-wider block">{label}</label>}
      <div className="relative">
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete="new-password"
          className="w-full px-4 py-3 pr-11 bg-[#0d0d0d] border border-[#333333] focus:border-[#39FF14] focus:shadow-[0_0_10px_rgba(57,255,20,0.15)] text-white rounded-xl text-sm focus:outline-none transition-all"
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#a0a0a0] text-sm transition-colors"
          aria-label={show ? 'Sembunyikan password' : 'Tampilkan password'}
        >
          {show ? '🙈' : '👁'}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export default function ProfileDashboardModal({ user, token, API_BASE_URL, onClose, logActivity, onUserUpdate, onForceLogout }) {
  // ── Active Tab ──
  const [activeTab, setActiveTab] = useState('history');

  // ── Booking History ──
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // ── Activity Logs ──
  const [myLogs, setMyLogs] = useState([]);

  // ── Account Info Form ──
  const [accountForm, setAccountForm] = useState({
    nama: user.nama || '',
    no_telepon: user.no_telepon || '',
    email: user.email || '',
    // Owner-specific
    nama_usaha: user.nama_usaha || '',
    alamat_toko: user.alamat_toko || '',
    shop_lat: user.shop_lat || '',
    shop_lng: user.shop_lng || '',
  });
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountMsg, setAccountMsg] = useState({ type: '', text: '' });
  const [avatarPreview, setAvatarPreview] = useState(user.avatar_url || null);
  const [avatarUrl, setAvatarUrl] = useState('');
  const avatarFileRef = useRef(null);

  // ── KYC Upload ──
  const [kycDoc, setKycDoc] = useState(user.kyc_doc_url || null);
  const [kycLoading, setKycLoading] = useState(false);
  const [kycStatus, setKycStatus] = useState(user.is_kyc_verified ? 'verified' : (user.kyc_doc_url ? 'pending' : 'none'));
  const kycFileRef = useRef(null);

  // ── Security — Change Password ──
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg] = useState({ type: '', text: '' });
  const [pwLoading, setPwLoading] = useState(false);

  // ── Security — Session Revoke ──
  const [revokeLoading, setRevokeLoading] = useState(false);

  // ── Security — Login Logs ──
  const [loginLogs, setLoginLogs] = useState([]);

  // ── Privacy — Delete Account ──
  const [deleteConfirmPw, setDeleteConfirmPw] = useState('');
  const [deleteMsg, setDeleteMsg] = useState({ type: '', text: '' });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // ── Privacy — Export ──
  const [exportLoading, setExportLoading] = useState(false);

  // ─── Fetch Booking History ──────────────────────────────────────────────────
  const reloadBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      if (API_BASE_URL && token) {
        const res = await fetch(`${API_BASE_URL}/bookings/my-bookings`, { headers: { Authorization: `Bearer ${token}` } });
        const d = await res.json();
        if (res.ok) setBookings(d.data || []);
      } else {
        await new Promise(r => setTimeout(r, 200));
        const all = JSON.parse(localStorage.getItem('pitrahan_demo_bookings') || '[]');
        setBookings(all.filter(b => b.email === user.email));
      }
    } catch (e) { console.error(e); }
    finally { setLoadingBookings(false); }
  }, [API_BASE_URL, token, user.email]);

  useEffect(() => {
    if (activeTab === 'history') {
      reloadBookings();
    }
  }, [activeTab, reloadBookings]);

  // ─── Load Activity Logs ─────────────────────────────────────────────────────
  const reloadLogs = useCallback(() => {
    try {
      const logs = JSON.parse(localStorage.getItem('pitrahan_activity_logs') || '[]');
      setMyLogs(logs.filter(l => l.userName === user.nama));
      // Extract login-specific logs for Security tab
      setLoginLogs(logs.filter(l => ['LOGIN', 'LOGOUT', 'UBAH_PASSWORD', 'REVOKE_SESSIONS'].includes(l.action) && l.userName === user.nama));
    } catch {}
  }, [user.nama]);

  useEffect(() => {
    reloadLogs();
    const handleActivityUpdate = () => {
      reloadLogs();
      reloadBookings();
    };
    window.addEventListener('pitrahan_new_activity', handleActivityUpdate);
    return () => window.removeEventListener('pitrahan_new_activity', handleActivityUpdate);
  }, [reloadLogs, reloadBookings]);

  // ─── Helper: update user in localStorage ───────────────────────────────────
  const updateUserInStorage = (patch) => {
    const users = JSON.parse(localStorage.getItem('pitrahan_users') || '[]');
    const idx = users.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
    if (idx !== -1) {
      users[idx] = { ...users[idx], ...patch };
      localStorage.setItem('pitrahan_users', JSON.stringify(users));
    }
    // Also update current session user
    const sessionUser = JSON.parse(localStorage.getItem('pitrahan_user') || 'null');
    if (sessionUser) {
      const updated = { ...sessionUser, ...patch };
      localStorage.setItem('pitrahan_user', JSON.stringify(updated));
      if (onUserUpdate) onUserUpdate(updated);
    }
    return users[idx] || null;
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB: ACCOUNT INFO — Handlers
  // ═══════════════════════════════════════════════════════════════════════════

  const handleAvatarFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('Pilih file gambar.'); return; }
    if (file.size > 3 * 1024 * 1024) { alert('Ukuran foto profil maksimal 3 MB.'); return; }
    const b64 = await readFileAsBase64(file);
    setAvatarPreview(b64);
    setAvatarUrl('');
  };

  const handleApplyAvatarUrl = () => {
    if (!avatarUrl.startsWith('http')) { alert('Masukkan URL yang valid (dimulai dengan http).'); return; }
    setAvatarPreview(avatarUrl);
  };

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    setAccountMsg({ type: '', text: '' });

    // Validate
    const nama = sanitize(accountForm.nama);
    const telepon = sanitize(accountForm.no_telepon);
    const email = sanitize(accountForm.email);

    if (!nama || nama.length < 2) return setAccountMsg({ type: 'error', text: 'Nama minimal 2 karakter.' });
    if (telepon && !isValidWA(telepon)) return setAccountMsg({ type: 'error', text: 'Format nomor WA tidak valid (contoh: 081234567890 atau +628xxx).' });
    if (!email.includes('@')) return setAccountMsg({ type: 'error', text: 'Email tidak valid.' });

    setAccountSaving(true);
    try {
      if (API_BASE_URL && token) {
        // ── Online Mode ──
        const res = await fetch(`${API_BASE_URL}/profile/update`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            nama, no_telepon: telepon, email,
            avatar_url: avatarPreview || null,
            nama_usaha: sanitize(accountForm.nama_usaha),
            alamat_toko: sanitize(accountForm.alamat_toko),
            shop_lat: accountForm.shop_lat, shop_lng: accountForm.shop_lng,
          })
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.message || 'Gagal memperbarui profil.');
      } else {
        // ── Demo Mode ──
        await new Promise(r => setTimeout(r, 500));
        updateUserInStorage({
          nama, no_telepon: telepon, email,
          avatar_url: avatarPreview || null,
          nama_usaha: sanitize(accountForm.nama_usaha),
          alamat_toko: sanitize(accountForm.alamat_toko),
          shop_lat: accountForm.shop_lat, shop_lng: accountForm.shop_lng,
        });
      }
      if (logActivity) logActivity('UPDATE_PROFIL', `Memperbarui informasi akun (nama, WA, email${avatarPreview ? ', avatar' : ''}).`, user.role, nama);
      setAccountMsg({ type: 'success', text: '✓ Informasi akun berhasil disimpan!' });
    } catch (err) {
      setAccountMsg({ type: 'error', text: err.message });
    } finally {
      setAccountSaving(false);
    }
  };

  // ─── KYC Upload ────────────────────────────────────────────────────────────
  const handleKycUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      alert('Upload foto KTP/SIM/KTM (JPG/PNG/WEBP) atau PDF.'); return;
    }
    if (file.size > 5 * 1024 * 1024) { alert('Ukuran dokumen maksimal 5 MB.'); return; }
    setKycLoading(true);
    try {
      const b64 = await readFileAsBase64(file);
      setKycDoc(b64);
      setKycStatus('pending');
      updateUserInStorage({ kyc_doc_url: b64, is_kyc_verified: false });
      if (logActivity) logActivity('KYC_UPLOAD', 'Mengunggah dokumen identitas untuk verifikasi KYC.', user.role, user.nama);
    } finally { setKycLoading(false); }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB: SECURITY — Handlers
  // ═══════════════════════════════════════════════════════════════════════════

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMsg({ type: '', text: '' });
    if (!oldPw) return setPwMsg({ type: 'error', text: 'Password lama wajib diisi.' });
    if (newPw.length < 8) return setPwMsg({ type: 'error', text: 'Password baru minimal 8 karakter.' });
    if (getPasswordStrength(newPw).score < 2) return setPwMsg({ type: 'error', text: 'Password terlalu lemah. Tambahkan huruf kapital, angka, atau simbol.' });
    if (newPw !== confirmPw) return setPwMsg({ type: 'error', text: 'Konfirmasi password baru tidak cocok.' });

    setPwLoading(true);
    try {
      if (API_BASE_URL && token) {
        // ── Online Mode ──
        const res = await fetch(`${API_BASE_URL}/profile/change-password`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw })
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.message || 'Gagal mengubah password.');
      } else {
        // ── Demo Mode ──
        await new Promise(r => setTimeout(r, 600));
        const users = JSON.parse(localStorage.getItem('pitrahan_users') || '[]');
        const idx = users.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
        if (idx === -1) throw new Error('Pengguna tidak ditemukan.');
        const hashedOld = await hashPassword(oldPw);
        if (users[idx].passwordHash !== hashedOld) throw new Error('Password lama Anda salah.');
        users[idx].passwordHash = await hashPassword(newPw);
        localStorage.setItem('pitrahan_users', JSON.stringify(users));
      }
      if (logActivity) logActivity('UBAH_PASSWORD', 'Berhasil mengubah kata sandi akun.', user.role, user.nama);
      setPwMsg({ type: 'success', text: '✓ Kata sandi berhasil diperbarui!' });
      setOldPw(''); setNewPw(''); setConfirmPw('');
    } catch (err) {
      setPwMsg({ type: 'error', text: err.message });
    } finally {
      setPwLoading(false);
    }
  };

  const handleRevokeSessions = async () => {
    if (!window.confirm('Ini akan mengeluarkan Anda dari SEMUA perangkat (termasuk perangkat ini). Lanjutkan?')) return;
    setRevokeLoading(true);
    try {
      if (API_BASE_URL && token) {
        await fetch(`${API_BASE_URL}/profile/revoke-sessions`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await new Promise(r => setTimeout(r, 700));
        localStorage.removeItem('pitrahan_token');
      }
      if (logActivity) logActivity('REVOKE_SESSIONS', 'Semua sesi aktif telah dicabut dari seluruh perangkat.', user.role, user.nama);
      setTimeout(() => { if (onForceLogout) onForceLogout(); }, 1000);
    } catch (err) {
      alert('Gagal mencabut sesi: ' + err.message);
    } finally {
      setRevokeLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // TAB: PRIVACY — Handlers
  // ═══════════════════════════════════════════════════════════════════════════

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const allBookings = JSON.parse(localStorage.getItem('pitrahan_demo_bookings') || '[]');
      const myBookings = allBookings.filter(b => b.email === user.email);
      const myActivity = JSON.parse(localStorage.getItem('pitrahan_activity_logs') || '[]').filter(l => l.userName === user.nama);

      // Sanitize: Remove sensitive fields from export
      const exportPayload = {
        exported_at: new Date().toISOString(),
        platform: 'piTrahan – Yogyakarta Bike Rental',
        profile: {
          nama: user.nama, email: user.email,
          no_telepon: user.no_telepon || null,
          role: user.role,
          joined: user.joined || null,
          is_kyc_verified: user.is_kyc_verified || false,
        },
        bookings: myBookings.map(b => ({
          kode_booking: b.kode_booking, sepeda: b.sepeda,
          nama_toko: b.nama_toko, tanggal_ambil: b.tanggal_ambil,
          durasi_sewa: b.durasi_sewa, durasi_mode: b.durasi_mode,
          total_harga: b.total_harga, status: b.status,
          metode_pembayaran: b.metode_pembayaran, created_at: b.created_at,
        })),
        activity_log: myActivity.map(l => ({
          action: l.action, details: l.details, timestamp: l.timestamp
        })),
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `pitrahan-data-export-${user.email.split('@')[0]}-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      if (logActivity) logActivity('EXPORT_DATA', 'Mengunduh salinan data pribadi (GDPR Compliance).', user.role, user.nama);
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    setDeleteMsg({ type: '', text: '' });
    if (!deleteConfirmPw) return setDeleteMsg({ type: 'error', text: 'Masukkan password untuk konfirmasi.' });

    setDeleteLoading(true);
    try {
      if (API_BASE_URL && token) {
        const res = await fetch(`${API_BASE_URL}/profile/delete-account`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ password: deleteConfirmPw })
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.message || 'Gagal menghapus akun.');
      } else {
        // ── Demo Mode: Anonymize user ──
        await new Promise(r => setTimeout(r, 800));
        const users = JSON.parse(localStorage.getItem('pitrahan_users') || '[]');
        const idx = users.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
        if (idx === -1) throw new Error('Akun tidak ditemukan.');
        const hashedPw = await hashPassword(deleteConfirmPw);
        if (users[idx].passwordHash !== hashedPw) throw new Error('Password salah. Penghapusan akun dibatalkan.');

        // Anonymize — preserve relational integrity of bookings
        const userId = users[idx].id || `del_${Date.now()}`;
        users[idx] = {
          ...users[idx],
          nama: '[Akun Dihapus]',
          email: `deleted_${userId}@removed.com`,
          no_telepon: null,
          avatar_url: null,
          kyc_doc_url: null,
          is_anonymized: true,
          anonymized_at: new Date().toISOString(),
        };
        localStorage.setItem('pitrahan_users', JSON.stringify(users));
      }
      // Clear session & force logout
      localStorage.removeItem('pitrahan_user');
      localStorage.removeItem('pitrahan_token');
      if (logActivity) logActivity('DELETE_ACCOUNT', `Akun ${user.email} telah dianonimkan dan dihapus secara permanen.`, user.role, user.nama);
      setTimeout(() => { if (onForceLogout) onForceLogout(); }, 1500);
      setDeleteMsg({ type: 'success', text: '✓ Akun berhasil dihapus. Mengalihkan...' });
    } catch (err) {
      setDeleteMsg({ type: 'error', text: err.message });
    } finally {
      setDeleteLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // TABS CONFIG
  // ═══════════════════════════════════════════════════════════════════════════

  const TABS = [
    { id: 'history',  label: 'Riwayat',  icon: '📋' },
    { id: 'account',  label: 'Akun',     icon: '⚙️' },
    { id: 'security', label: 'Keamanan', icon: '🔒' },
  ];

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS BADGE MAPS
  // ═══════════════════════════════════════════════════════════════════════════

  const STATUS_MAP = {
    pending:   { cls: 'bg-[#FFD700]/10 text-[#FFD700] border-[#FFD700]/30',   label: 'Menunggu' },
    confirmed: { cls: 'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/30',   label: 'Dikonfirmasi' },
    completed: { cls: 'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/30',   label: 'Selesai' },
    rejected:  { cls: 'bg-[#FF3E3E]/10 text-[#FF3E3E] border-[#FF3E3E]/30',   label: 'Ditolak' },
    cancelled: { cls: 'bg-[#555]/20 text-[#a0a0a0] border-[#555]/30',         label: 'Dibatalkan' },
  };

  const ACTION_ICONS = {
    LOGIN: '🔑', LOGOUT: '🚪', BOOKING: '🎫', KIRIM_BUKTI: '📎',
    UBAH_PASSWORD: '🔒', UPDATE_PROFIL: '✏️', KYC_UPLOAD: '🪪',
    EXPORT_DATA: '📥', DELETE_ACCOUNT: '🗑️', REVOKE_SESSIONS: '🚨',
    REGISTRASI: '✨', REGISTER: '✨',
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/85 z-50 p-2 sm:p-4 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-[#111111] border border-[#252525] rounded-2xl w-full max-w-2xl flex flex-col relative overflow-hidden max-h-[96vh] shadow-[0_0_40px_rgba(0,0,0,0.8)]">

        {/* ── Top Glow Bar ── */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#39FF14] to-transparent" />

        {/* ── Header ── */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 sm:p-5 border-b border-[#1e1e1e]">
          {/* Avatar + User Info */}
          <div className="flex items-center gap-3">
            <div className="relative">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-11 h-11 rounded-full object-cover border-2 border-[#39FF14]/40 shadow-[0_0_12px_rgba(57,255,20,0.2)]" />
              ) : (
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#39FF14]/20 to-[#00E5FF]/10 border-2 border-[#39FF14]/30 flex items-center justify-center text-[#39FF14] text-lg font-black uppercase shadow-[0_0_12px_rgba(57,255,20,0.15)]">
                  {user.nama.charAt(0)}
                </div>
              )}
              {kycStatus === 'verified' && (
                <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-[#39FF14] rounded-full flex items-center justify-center text-black text-[8px] font-black border border-[#111]" title="KYC Terverifikasi">✓</span>
              )}
            </div>
            <div>
              <h3 className="font-extrabold text-white text-sm leading-tight">{user.nama}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[8px] text-[#a0a0a0] font-mono">{user.email}</span>
                <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase ${
                  user.role === 'admin' ? 'bg-[#FF3E3E]/10 text-[#FF3E3E] border border-[#FF3E3E]/30' :
                  user.role === 'owner' ? 'bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30' :
                  'bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/30'
                }`}>{user.role}</span>
                {kycStatus === 'verified' && <span className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/30">✓ KYC</span>}
                {kycStatus === 'pending' && <span className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30">⏳ KYC Review</span>}
              </div>
            </div>
          </div>

          {/* Close Button */}
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-[#555] hover:text-white hover:bg-[#2d2d2d] rounded-lg transition-all text-lg font-bold">
            &times;
          </button>
        </div>

        {/* ── Tab Navigation ── */}
        <div className="flex-shrink-0 flex border-b border-[#1e1e1e] overflow-x-auto scrollbar-hide">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[72px] flex flex-col items-center gap-0.5 px-2 py-3 text-[9px] font-black uppercase tracking-wider transition-all whitespace-nowrap border-b-2 ${
                activeTab === tab.id
                  ? 'text-[#39FF14] border-[#39FF14] bg-[#39FF14]/5'
                  : 'text-[#555] hover:text-[#a0a0a0] border-transparent hover:bg-[#1a1a1a]'
              }`}
            >
              <span className="text-base leading-none">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Content Area ── */}
        <div className="flex-1 overflow-y-auto">

          {/* ══════════════════════════════════════════════════════════════════
              TAB: RIWAYAT BOOKING
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'history' && (
            <div className="p-4 sm:p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-black uppercase text-white tracking-wider">Riwayat Pemesanan</h4>
                <span className="px-2 py-0.5 bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/30 rounded-full text-[9px] font-black">{bookings.length} Booking</span>
              </div>
              {loadingBookings ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-8 h-8 border-2 border-[#39FF14] border-t-transparent rounded-full animate-spin" />
                  <p className="text-[11px] text-[#a0a0a0] font-bold uppercase tracking-wider">Memuat riwayat...</p>
                </div>
              ) : bookings.length === 0 ? (
                <div className="text-center py-16 border border-dashed border-[#2d2d2d] rounded-xl space-y-3">
                  <span className="text-4xl block">🚲</span>
                  <p className="text-xs text-[#a0a0a0] font-semibold uppercase tracking-wider">Belum ada riwayat pemesanan.</p>
                  <p className="text-[10px] text-[#555]">Temukan sepeda impian Anda di halaman utama!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.map(booking => {
                    const { cls, label } = STATUS_MAP[booking.status] || STATUS_MAP.pending;
                    return (
                      <div key={booking.id || booking.kode_booking} className="p-4 bg-[#0d0d0d] border border-[#1e1e1e] hover:border-[#2d2d2d] rounded-xl flex flex-col gap-3 transition-colors">
                        <div className="flex flex-col sm:flex-row justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="w-14 h-14 rounded-lg overflow-hidden border border-[#2d2d2d] bg-[#1a1a1a] flex-shrink-0">
                              {booking.foto_url ? <img src={booking.foto_url} alt={booking.sepeda} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[8px] uppercase font-bold text-[#555]">No Pic</div>}
                            </div>
                            <div className="space-y-0.5">
                              <h5 className="font-extrabold text-white text-[13px] uppercase tracking-tight line-clamp-1">{booking.sepeda}</h5>
                              <p className="text-[10px] text-[#a0a0a0]">🏪 {booking.nama_toko}</p>
                              <p className="text-[9px] text-[#555]">
                                📅 {new Date((booking.tanggal_ambil?.split('T')[0] || booking.tanggal_ambil) + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} · {booking.durasi_sewa} {booking.durasi_mode === 'jam' ? 'jam' : 'hari'}
                              </p>
                              <p className="text-[9px] text-[#555]">💳 {booking.metode_pembayaran === 'offline' ? 'Tunai/Offline' : 'Transfer'}</p>
                            </div>
                          </div>
                          <div className="flex sm:flex-col justify-between items-end gap-2 text-right border-t sm:border-t-0 pt-2 sm:pt-0 border-[#1e1e1e]">
                            <div className="text-left sm:text-right">
                              <span className="text-[8px] text-[#555] uppercase block">Kode Booking</span>
                              <span className="text-white font-black font-mono tracking-widest text-[11px] uppercase select-all">{booking.kode_booking}</span>
                            </div>
                            <div className="text-right space-y-1">
                              <span className="text-[11px] font-black text-[#39FF14] block">Rp {parseFloat(booking.total_harga).toLocaleString('id-ID')}</span>
                              <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase border ${cls}`}>{label}</span>
                            </div>
                          </div>
                        </div>
                        {(booking.status === 'pending' || booking.status === 'confirmed') && booking.metode_pembayaran !== 'offline' && (
                          <BuktiWidget kode_booking={booking.kode_booking} logActivity={logActivity} user={user} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB: INFORMASI AKUN
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'account' && (
            <div className="p-4 sm:p-5 space-y-6">

              {/* ── Avatar Section ── */}
              <div className="p-4 bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl space-y-3">
                <h4 className="text-[10px] font-black uppercase text-[#a0a0a0] tracking-wider">📸 Foto Profil</h4>
                <div className="flex items-center gap-4">
                  <div className="relative flex-shrink-0">
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Preview" className="w-16 h-16 rounded-full object-cover border-2 border-[#39FF14]/40 shadow-[0_0_15px_rgba(57,255,20,0.2)]" />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#39FF14]/20 to-[#00E5FF]/10 border-2 border-[#39FF14]/30 flex items-center justify-center text-[#39FF14] text-2xl font-black uppercase">
                        {user.nama.charAt(0)}
                      </div>
                    )}
                    {avatarPreview && (
                      <button onClick={() => setAvatarPreview(null)} className="absolute -top-1 -right-1 w-5 h-5 bg-[#FF3E3E] rounded-full text-white text-[9px] flex items-center justify-center hover:bg-red-600 transition-all" title="Hapus foto">×</button>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <button onClick={() => avatarFileRef.current?.click()} className="w-full py-2 text-[10px] font-black uppercase bg-[#1e1e1e] border border-[#2d2d2d] hover:border-[#39FF14]/40 text-[#a0a0a0] hover:text-[#39FF14] rounded-lg transition-all flex items-center justify-center gap-1.5">
                      📁 Upload Foto (Maks. 3MB)
                    </button>
                    <div className="flex gap-2">
                      <input
                        value={avatarUrl} onChange={e => setAvatarUrl(e.target.value)}
                        placeholder="Atau tempel URL foto..."
                        className="flex-1 px-3 py-2 bg-[#111] border border-[#2d2d2d] focus:border-[#39FF14]/40 text-white rounded-lg text-[10px] focus:outline-none transition-all"
                      />
                      <button onClick={handleApplyAvatarUrl} className="px-3 py-2 bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14] text-[10px] font-black rounded-lg hover:bg-[#39FF14]/20 transition-all">Terapkan</button>
                    </div>
                  </div>
                  <input ref={avatarFileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
                </div>
              </div>

              {/* ── Account Form ── */}
              <form onSubmit={handleSaveAccount} className="space-y-4">
                {accountMsg.text && (
                  <div className={`p-3 rounded-xl text-[11px] font-semibold text-center ${accountMsg.type === 'success' ? 'bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14]' : 'bg-[#FF3E3E]/10 border border-[#FF3E3E]/30 text-[#FF3E3E]'}`}>
                    {accountMsg.text}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Nama */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-[#a0a0a0] tracking-wider block">Nama Lengkap <span className="text-[#FF3E3E]">*</span></label>
                    <input
                      value={accountForm.nama}
                      onChange={e => setAccountForm(f => ({ ...f, nama: e.target.value }))}
                      placeholder="Nama lengkap Anda"
                      required
                      className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#2d2d2d] focus:border-[#39FF14] focus:shadow-[0_0_10px_rgba(57,255,20,0.1)] text-white rounded-xl text-sm focus:outline-none transition-all"
                    />
                  </div>

                  {/* WhatsApp */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-bold text-[#a0a0a0] tracking-wider block">Nomor WhatsApp</label>
                    <input
                      value={accountForm.no_telepon}
                      onChange={e => setAccountForm(f => ({ ...f, no_telepon: e.target.value }))}
                      placeholder="0812-3456-7890 / +62812..."
                      type="tel"
                      className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#2d2d2d] focus:border-[#39FF14] focus:shadow-[0_0_10px_rgba(57,255,20,0.1)] text-white rounded-xl text-sm focus:outline-none transition-all"
                    />
                    {accountForm.no_telepon && !isValidWA(accountForm.no_telepon) && (
                      <p className="text-[9px] text-[#FF3E3E] flex items-center gap-1">⚠ Format nomor WA tidak valid</p>
                    )}
                    {accountForm.no_telepon && isValidWA(accountForm.no_telepon) && (
                      <p className="text-[9px] text-[#39FF14] flex items-center gap-1">✓ Format valid</p>
                    )}
                  </div>

                  {/* Email */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-[10px] uppercase font-bold text-[#a0a0a0] tracking-wider block">Email <span className="text-[#FF3E3E]">*</span></label>
                    <input
                      value={accountForm.email}
                      onChange={e => setAccountForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="email@example.com"
                      type="email"
                      required
                      className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#2d2d2d] focus:border-[#39FF14] focus:shadow-[0_0_10px_rgba(57,255,20,0.1)] text-white rounded-xl text-sm focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* ── Owner-Only Fields ── */}
                {user.role === 'owner' && (
                  <div className="p-4 bg-[#0d0d0d] border border-[#FFD700]/20 rounded-xl space-y-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm">🏪</span>
                      <h5 className="text-[10px] font-black uppercase text-[#FFD700] tracking-wider">Data Toko Mitra</h5>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-[#a0a0a0] tracking-wider block">Nama Toko</label>
                        <input value={accountForm.nama_usaha} onChange={e => setAccountForm(f => ({ ...f, nama_usaha: e.target.value }))} placeholder="Nama usaha rental Anda" className="w-full px-4 py-3 bg-[#121212] border border-[#FFD700]/20 focus:border-[#FFD700]/50 focus:shadow-[0_0_10px_rgba(255,215,0,0.1)] text-white rounded-xl text-sm focus:outline-none transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-[#a0a0a0] tracking-wider block">Alamat Toko</label>
                        <input value={accountForm.alamat_toko} onChange={e => setAccountForm(f => ({ ...f, alamat_toko: e.target.value }))} placeholder="Jl. Malioboro No. 15..." className="w-full px-4 py-3 bg-[#121212] border border-[#FFD700]/20 focus:border-[#FFD700]/50 text-white rounded-xl text-sm focus:outline-none transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-[#a0a0a0] tracking-wider block">Latitude (GPS)</label>
                        <input value={accountForm.shop_lat} onChange={e => setAccountForm(f => ({ ...f, shop_lat: e.target.value }))} placeholder="-7.7956" type="number" step="0.000001" className="w-full px-4 py-3 bg-[#121212] border border-[#FFD700]/20 focus:border-[#FFD700]/50 text-white rounded-xl text-sm focus:outline-none transition-all" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase font-bold text-[#a0a0a0] tracking-wider block">Longitude (GPS)</label>
                        <input value={accountForm.shop_lng} onChange={e => setAccountForm(f => ({ ...f, shop_lng: e.target.value }))} placeholder="110.3695" type="number" step="0.000001" className="w-full px-4 py-3 bg-[#121212] border border-[#FFD700]/20 focus:border-[#FFD700]/50 text-white rounded-xl text-sm focus:outline-none transition-all" />
                      </div>
                    </div>
                    <p className="text-[9px] text-[#555]">💡 Koordinat GPS untuk fitur peta dan kalkulasi jarak ke toko. Cek koordinat di maps.google.com.</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={accountSaving}
                  className="w-full py-3 bg-[#39FF14] text-black font-extrabold uppercase rounded-xl text-xs tracking-wider shadow-[0_0_15px_rgba(57,255,20,0.25)] hover:bg-white hover:shadow-none transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {accountSaving ? '⏳ Menyimpan...' : '✓ Simpan Perubahan'}
                </button>
              </form>

              {/* ── KYC Section ── */}
              {user.role === 'customer' && (
                <div className="p-4 bg-[#0d0d0d] border border-[#00E5FF]/20 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">🪪</span>
                      <div>
                        <h5 className="text-[10px] font-black uppercase text-[#00E5FF] tracking-wider">Verifikasi Identitas (KYC)</h5>
                        <p className="text-[9px] text-[#555] mt-0.5">Upload KTP / SIM / Kartu Mahasiswa untuk mempercepat proses pickup.</p>
                      </div>
                    </div>
                    {kycStatus === 'verified' && <span className="px-2 py-1 bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/30 rounded-lg text-[8px] font-black uppercase">✓ Terverifikasi</span>}
                    {kycStatus === 'pending' && <span className="px-2 py-1 bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30 rounded-lg text-[8px] font-black uppercase">⏳ Menunggu Review</span>}
                    {kycStatus === 'none' && <span className="px-2 py-1 bg-[#555]/20 text-[#555] border border-[#555]/30 rounded-lg text-[8px] font-black uppercase">Belum Diverifikasi</span>}
                  </div>

                  {kycDoc ? (
                    <div className="relative rounded-lg overflow-hidden border border-[#00E5FF]/20">
                      <img src={kycDoc} alt="KYC Dokumen" className="w-full max-h-36 object-cover bg-[#0a0a0a]" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-2">
                        <button onClick={() => kycFileRef.current?.click()} className="px-2 py-1 bg-black/70 border border-[#00E5FF]/30 text-[#00E5FF] text-[8px] font-black rounded uppercase">Ganti Dokumen</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => kycFileRef.current?.click()}
                      disabled={kycLoading}
                      className="w-full h-24 border-2 border-dashed border-[#00E5FF]/20 hover:border-[#00E5FF]/40 hover:bg-[#00E5FF]/5 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all"
                    >
                      <span className="text-xl">{kycLoading ? '⏳' : '📁'}</span>
                      <p className="text-[10px] text-[#a0a0a0] font-semibold">{kycLoading ? 'Memproses...' : 'Ketuk untuk upload dokumen identitas'}</p>
                      <p className="text-[9px] text-[#555]">JPG / PNG / PDF · Maks. 5 MB · Data terenkripsi & aman</p>
                    </button>
                  )}
                  <input ref={kycFileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={handleKycUpload} />
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════════
              TAB: KEAMANAN
          ══════════════════════════════════════════════════════════════════ */}
          {activeTab === 'security' && (
            <div className="p-4 sm:p-5 space-y-6">

              {/* ── Change Password ── */}
              <div className="p-4 bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl space-y-4">
                <h4 className="text-[10px] font-black uppercase text-white tracking-wider flex items-center gap-2">🔑 Ubah Kata Sandi</h4>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  {pwMsg.text && (
                    <div className={`p-3 rounded-xl text-[11px] font-semibold text-center ${pwMsg.type === 'success' ? 'bg-[#39FF14]/10 border border-[#39FF14]/30 text-[#39FF14]' : 'bg-[#FF3E3E]/10 border border-[#FF3E3E]/30 text-[#FF3E3E]'}`}>
                      {pwMsg.text}
                    </div>
                  )}
                  <PasswordInput id="old-pw" label="Password Saat Ini *" value={oldPw} onChange={e => setOldPw(e.target.value)} placeholder="Masukkan password lama" />
                  <div>
                    <PasswordInput id="new-pw" label="Password Baru * (Min. 8 Karakter)" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Password baru yang kuat" />
                    <StrengthMeter password={newPw} />
                    {newPw && (
                      <div className="mt-2 grid grid-cols-2 gap-1">
                        {[
                          { ok: newPw.length >= 8, label: '≥ 8 karakter' },
                          { ok: /[A-Z]/.test(newPw), label: 'Huruf kapital (A-Z)' },
                          { ok: /[0-9]/.test(newPw), label: 'Angka (0-9)' },
                          { ok: /[^A-Za-z0-9]/.test(newPw), label: 'Simbol (!@#...)' },
                        ].map(req => (
                          <div key={req.label} className={`flex items-center gap-1 text-[9px] font-medium ${req.ok ? 'text-[#39FF14]' : 'text-[#555]'}`}>
                            <span>{req.ok ? '✓' : '○'}</span> {req.label}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <PasswordInput id="confirm-pw" label="Konfirmasi Password Baru *" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Ulangi password baru" />
                  {confirmPw && newPw && (
                    <p className={`text-[9px] font-bold ${confirmPw === newPw ? 'text-[#39FF14]' : 'text-[#FF3E3E]'}`}>
                      {confirmPw === newPw ? '✓ Password cocok' : '✗ Password tidak cocok'}
                    </p>
                  )}
                  <button type="submit" disabled={pwLoading} className="w-full py-3 bg-[#39FF14] text-black font-extrabold uppercase rounded-xl text-xs tracking-wider shadow-[0_0_15px_rgba(57,255,20,0.25)] hover:bg-white hover:shadow-none transition-all disabled:opacity-50">
                    {pwLoading ? '⏳ Memperbarui...' : '🔒 Perbarui Password'}
                  </button>
                </form>
              </div>

              {/* ── Login Activity Log ── */}
              <div className="p-4 bg-[#0d0d0d] border border-[#1e1e1e] rounded-xl space-y-3">
                <h4 className="text-[10px] font-black uppercase text-white tracking-wider flex items-center gap-2">📋 Riwayat Sesi Login</h4>
                {loginLogs.length === 0 ? (
                  <p className="text-[10px] text-[#555] text-center py-6">Belum ada riwayat sesi yang tercatat.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {loginLogs.slice(0, 10).map(log => {
                      const d = new Date(log.timestamp);
                      return (
                        <div key={log.id} className="flex items-center justify-between p-2.5 bg-[#111] border border-[#1e1e1e] rounded-lg">
                          <div className="flex items-center gap-2.5">
                            <span className="text-sm flex-shrink-0">{ACTION_ICONS[log.action] || '📌'}</span>
                            <div>
                              <p className="text-[10px] text-white font-semibold">{log.details}</p>
                              <p className="text-[8px] text-[#555] font-mono mt-0.5">{getDeviceInfo()}</p>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-[9px] text-[#a0a0a0] font-mono">{d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</p>
                            <p className="text-[8px] text-[#555] font-mono">{d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── Revoke All Sessions ── */}
              <div className="p-4 bg-[#0d0d0d] border border-[#FF3E3E]/20 rounded-xl space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0">🚨</span>
                  <div>
                    <h4 className="text-[10px] font-black uppercase text-[#FF3E3E] tracking-wider">Keluar dari Semua Perangkat</h4>
                    <p className="text-[9px] text-[#555] mt-1 leading-relaxed">Cabut semua sesi aktif sekarang jika Anda mencurigai akun Anda telah diakses oleh pihak lain. Anda akan keluar dari perangkat ini juga.</p>
                  </div>
                </div>
                <button
                  onClick={handleRevokeSessions}
                  disabled={revokeLoading}
                  className="w-full py-2.5 bg-[#FF3E3E]/10 border border-[#FF3E3E]/40 text-[#FF3E3E] font-extrabold uppercase rounded-xl text-[10px] tracking-wider hover:bg-[#FF3E3E]/20 hover:shadow-[0_0_15px_rgba(255,62,62,0.2)] transition-all disabled:opacity-50"
                >
                  {revokeLoading ? '⏳ Mencabut Sesi...' : '🚨 Keluar dari Semua Perangkat'}
                </button>
              </div>
            </div>
          )}



        </div>{/* end content area */}
      </div>
    </div>
  );
}
