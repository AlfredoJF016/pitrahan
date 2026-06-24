import React, { useState, useEffect } from 'react';

// ─── SHA-256 hash (demo security) ───
async function hashPassword(pw) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}
async function verifyPassword(pw, hash) {
  return (await hashPassword(pw)) === hash;
}

const isValidEmail = e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const isValidPhone = p => /^[0-9+\- ]{8,20}$/.test(p.trim());

export default function LoginRegisterModal({ API_BASE_URL, onLoginSuccess, onClose, logActivity }) {
  const [activeTab, setActiveTab] = useState('login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');

  // Register fields
  const [nama, setNama]   = useState('');
  const [noHp, setNoHp]   = useState('');

  const [showLoginPw, setShowLoginPw] = useState(false);
  const [showRegisterPw, setShowRegisterPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  useEffect(() => {
    setEmail('');
    setPassword('');
    setConfirmPw('');
    setNama('');
    setNoHp('');
  }, []);

  const switchTab = tab => {
    setActiveTab(tab);
    setError(''); setSuccess('');
    setEmail(''); setPassword(''); setConfirmPw('');
    setNama(''); setNoHp('');
    setShowLoginPw(false); setShowRegisterPw(false); setShowConfirmPw(false);
  };

  // ══════ LOGIN ══════
  const handleLogin = async e => {
    e.preventDefault();
    const emailVal = email.trim().toLowerCase();
    if (!emailVal) return setError('Email wajib diisi.');
    if (!isValidEmail(emailVal)) return setError('Format email tidak valid.');
    if (!password) return setError('Password wajib diisi.');
    setError(''); setLoading(true);

    try {
      if (API_BASE_URL) {
        const res  = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emailVal, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Email atau password salah.');
        onLoginSuccess(data.user, data.token);
        setSuccess('Masuk berhasil!');
        setTimeout(onClose, 600);
      } else {
        await new Promise(r => setTimeout(r, 400));
        const users = JSON.parse(localStorage.getItem('pitrahan_users') || '[]');

        const found = users.find(u => u.email === emailVal);
        if (!found) throw new Error('Email belum terdaftar.');

        if (found.status === 'banned') throw new Error('Akun Anda telah diblokir. Hubungi admin.');

        if (!(await verifyPassword(password, found.passwordHash))) throw new Error('Password salah.');

        const token = `demo-${found.role}-${Date.now()}`;
        onLoginSuccess({
          id: found.id, nama: found.nama, email: found.email,
          no_telepon: found.no_telepon || '', role: found.role,
        }, token);
        setSuccess('Masuk berhasil!');
        setTimeout(onClose, 500);
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  // ══════ REGISTER ══════
  const handleRegister = async e => {
    e.preventDefault();
    setError(''); setSuccess('');
    const emailVal = email.trim().toLowerCase();
    const namaVal  = nama.trim();
    const hpVal    = noHp.trim();

    if (!namaVal || namaVal.length < 2)   return setError('Nama lengkap minimal 2 karakter.');
    if (!hpVal)                            return setError('Nomor telepon/WhatsApp wajib diisi.');
    if (!isValidPhone(hpVal))              return setError('Format nomor telepon tidak valid.');
    if (!emailVal)                         return setError('Email wajib diisi.');
    if (!isValidEmail(emailVal))           return setError('Format email tidak valid.');
    if (password.length < 6)              return setError('Password minimal 6 karakter.');
    if (password !== confirmPw)           return setError('Konfirmasi password tidak cocok.');

    setLoading(true);
    try {
      if (API_BASE_URL) {
        const res = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nama: namaVal, email: emailVal, password, role: 'customer' }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Gagal mendaftar.');
      } else {
        await new Promise(r => setTimeout(r, 400));
        const users = JSON.parse(localStorage.getItem('pitrahan_users') || '[]');
        if (users.some(u => u.email === emailVal)) throw new Error('Email sudah terdaftar.');

        const newUser = {
          id: `u${Date.now()}`,
          nama: namaVal, no_telepon: hpVal, email: emailVal,
          passwordHash: await hashPassword(password),
          role: 'customer',
          status: 'active',
        };
        users.push(newUser);
        localStorage.setItem('pitrahan_users', JSON.stringify(users));
        if (logActivity) {
          logActivity(
            'REGISTRASI',
            `Pengguna baru ${namaVal} (${emailVal}) berhasil terdaftar di platform (Demo Mode).`,
            'customer',
            namaVal
          );
        }
      }

      setSuccess('Pendaftaran berhasil! Silakan masuk dengan email Anda.');
      setTimeout(() => switchTab('login'), 2000);
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const inp = 'w-full px-4 py-2.5 bg-[#121212] border border-[#333] focus:border-[#39FF14] text-white rounded-xl text-sm focus:outline-none transition-all placeholder:text-[#444]';
  const lbl = 'text-[10px] uppercase font-bold text-[#a0a0a0] tracking-wider';

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50 p-4 overflow-y-auto">
      <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-2xl w-full max-w-md relative overflow-hidden my-4">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#39FF14] to-transparent" />
        <button onClick={onClose} className="absolute top-4 right-4 text-[#a0a0a0] hover:text-white text-xl font-bold z-10">×</button>

        <div className="p-6 pb-0">
          <div className="text-center space-y-0.5 mb-4">
            <p className="text-lg font-black text-[#39FF14] uppercase tracking-wider">piTrahan</p>
            <p className="text-xs text-[#a0a0a0]">{activeTab === 'login' ? 'Masuk ke akun Anda' : 'Buat akun baru'}</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#2d2d2d]">
            {[['login','Masuk'],['register','Daftar']].map(([t,l]) => (
              <button key={t} onClick={() => switchTab(t)}
                className={`flex-1 pb-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all ${
                  activeTab === t ? 'text-[#39FF14] border-[#39FF14]' : 'text-[#a0a0a0] border-transparent hover:text-white'
                }`}>{l}</button>
            ))}
          </div>
        </div>

        <div className="p-6 pt-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {error   && <div className="p-3 bg-[#FF3E3E]/10 border border-[#FF3E3E]/30 rounded-xl text-xs text-[#FF3E3E] text-center">⚠ {error}</div>}
          {success && <div className="p-3 bg-[#39FF14]/10 border border-[#39FF14]/30 rounded-xl text-xs text-[#39FF14] text-center">✓ {success}</div>}

          {/* ══════ LOGIN FORM ══════ */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className={lbl}>Alamat Email</label>
                <input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="email@contoh.com" className={inp} />
              </div>
              <div className="space-y-1.5">
                <label className={lbl}>Password</label>
                <div className="relative">
                  <input type={showLoginPw ? 'text' : 'password'} autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className={inp + ' pr-10'} />
                  <button
                    type="button"
                    onClick={() => setShowLoginPw(s => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#a0a0a0] text-sm transition-colors"
                    aria-label={showLoginPw ? 'Sembunyikan password' : 'Tampilkan password'}
                  >
                    {showLoginPw ? '🙈' : '👁'}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-[#39FF14] text-black font-extrabold uppercase rounded-xl text-xs tracking-wider hover:bg-white transition-all disabled:opacity-50">
                {loading ? <span className="flex items-center justify-center gap-2"><span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"/>Memproses...</span> : 'Masuk Sekarang'}
              </button>

              <p className="text-center text-[10px] text-[#a0a0a0]">Belum punya akun?{' '}
                <button type="button" onClick={() => switchTab('register')} className="text-[#39FF14] font-bold hover:underline">Daftar di sini</button>
              </p>
            </form>
          )}

          {/* ══════ REGISTER FORM ══════ */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-1.5">
                <label className={lbl}>Nama Lengkap *</label>
                <input type="text" autoComplete="name" required value={nama} onChange={e => setNama(e.target.value)} placeholder="Budi Santoso" className={inp} />
              </div>
              <div className="space-y-1.5">
                <label className={lbl}>Nomor Telepon / WhatsApp *</label>
                <input type="tel" autoComplete="tel" required value={noHp} onChange={e => setNoHp(e.target.value)} placeholder="08123456789" className={inp} />
                <p className="text-[9px] text-[#555]">Digunakan untuk konfirmasi booking via WhatsApp</p>
              </div>
              <div className="space-y-1.5">
                <label className={lbl}>Alamat Email *</label>
                <input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="email@contoh.com" className={inp} />
                <p className="text-[9px] text-[#555]">Notifikasi booking &amp; kode dikirim ke email ini</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className={lbl}>Password *</label>
                  <div className="relative">
                    <input type={showRegisterPw ? 'text' : 'password'} autoComplete="new-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 karakter" className={inp + ' pr-10'} />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPw(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#a0a0a0] text-sm transition-colors"
                      aria-label={showRegisterPw ? 'Sembunyikan password' : 'Tampilkan password'}
                    >
                      {showRegisterPw ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className={lbl}>Ulangi Password *</label>
                  <div className="relative">
                    <input type={showConfirmPw ? 'text' : 'password'} autoComplete="new-password" required value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="••••••••" className={inp + ' pr-10'} />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#555] hover:text-[#a0a0a0] text-sm transition-colors"
                      aria-label={showConfirmPw ? 'Sembunyikan password' : 'Tampilkan password'}
                    >
                      {showConfirmPw ? '🙈' : '👁'}
                    </button>
                  </div>
                </div>
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 bg-[#39FF14] text-black font-extrabold uppercase rounded-xl text-xs tracking-wider hover:bg-white transition-all disabled:opacity-50">
                {loading
                  ? <span className="flex items-center justify-center gap-2"><span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"/>Mendaftarkan...</span>
                  : 'Daftar Sekarang'
                }
              </button>

              <p className="text-center text-[10px] text-[#a0a0a0]">Sudah punya akun?{' '}
                <button type="button" onClick={() => switchTab('login')} className="text-[#39FF14] font-bold hover:underline">Masuk di sini</button>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
