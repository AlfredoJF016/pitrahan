import { useState, useCallback, useEffect } from 'react';
import HeroSection from './components/HeroSection';
import SearchFilter from './components/SearchFilter';
import BookingForm from './components/BookingForm';
import TicketModal from './components/TicketModal';
import LoginRegisterModal from './components/LoginRegisterModal';
import ProfileDashboardModal from './components/ProfileDashboardModal';

import AdminDashboardModal from './components/AdminDashboardModal';
import OwnerDashboardModal from './components/OwnerDashboardModal';

// ─────────────────────────────────────────────────────────────────────────────
// DATA SEPEDA DEFAULT (seed – hanya dipakai jika localStorage kosong)
// ─────────────────────────────────────────────────────────────────────────────
const SEED_BIKES = [
  {
    id: 1, nama_sepeda: 'Polygon Xtrada 5', jenis_sepeda: 'gunung',
    deskripsi: 'Sepeda gunung tangguh dengan suspensi depan, cocok untuk medan berbatu & wisata alam sekitar Yogyakarta.',
    harga_per_hari: '75000', harga_per_jam: '15000', deposit_fee: '50000',
    ukuran_frame: 'M', transmisi: '2x9 Speed', baterai: null,
    status_ketersediaan: 'tersedia',
    nama_toko: 'Rental Jogja Bikes', alamat_toko: 'Jl. Malioboro No. 15, Yogyakarta',
    no_telepon: '08123456789', jam_operasional: '07.00 – 21.00 WIB',
    foto_url: 'https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 2, nama_sepeda: 'Dahon Speed P8', jenis_sepeda: 'lipat',
    deskripsi: 'Sepeda lipat ringkas 8-speed, ideal untuk eksplorasi kota Yogyakarta & kampus UGM.',
    harga_per_hari: '90000', harga_per_jam: '18000', deposit_fee: '50000',
    ukuran_frame: 'One Size', transmisi: '8-Speed', baterai: null,
    status_ketersediaan: 'tersedia',
    nama_toko: 'UGM Bike Rental', alamat_toko: 'Jl. Bulaksumur No. 2, Sleman',
    no_telepon: '08198765432', jam_operasional: '06.00 – 22.00 WIB',
    foto_url: 'https://images.unsplash.com/photo-1571333250630-f0230c320b6d?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 3, nama_sepeda: 'Onthel Jawa Klasik', jenis_sepeda: 'onthel',
    deskripsi: 'Sepeda onthel autentik bergaya klasik Jawa, sempurna untuk foto di Candi Prambanan.',
    harga_per_hari: '40000', harga_per_jam: '8000', deposit_fee: '20000',
    ukuran_frame: 'L', transmisi: 'Single Speed', baterai: null,
    status_ketersediaan: 'disewa',
    nama_toko: 'Prambanan Vintage Rent', alamat_toko: 'Jl. Raya Prambanan KM 16, Klaten',
    no_telepon: '08776655443', jam_operasional: '07.00 – 18.00 WIB',
    foto_url: 'https://images.unsplash.com/photo-1519583272095-6433daf26b6e?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 4, nama_sepeda: 'Trek FX 2 Disc', jenis_sepeda: 'city_bike',
    deskripsi: 'City bike modern dengan disc brake, nyaman untuk komuter dan jalan aspal kota Yogyakarta.',
    harga_per_hari: '120000', harga_per_jam: '25000', deposit_fee: '80000',
    ukuran_frame: 'L', transmisi: '3x8 Speed', baterai: null,
    status_ketersediaan: 'tersedia',
    nama_toko: 'Rental Jogja Bikes', alamat_toko: 'Jl. Malioboro No. 15, Yogyakarta',
    no_telepon: '08123456789', jam_operasional: '07.00 – 21.00 WIB',
    foto_url: 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 5, nama_sepeda: 'Sepeda Lipat Brompton S2L', jenis_sepeda: 'lipat',
    deskripsi: 'Brompton premium buatan Inggris — ikon sepeda lipat dunia. Ringan, kompak, dan prestisius.',
    harga_per_hari: '200000', harga_per_jam: '40000', deposit_fee: '150000',
    ukuran_frame: 'One Size', transmisi: '2-Speed', baterai: null,
    status_ketersediaan: 'tersedia',
    nama_toko: 'Premium Bike Jogja', alamat_toko: 'Jl. Prawirotaman No. 7, Yogyakarta',
    no_telepon: '08998877665', jam_operasional: '08.00 – 20.00 WIB',
    foto_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 6, nama_sepeda: 'Polygon Heist 3', jenis_sepeda: 'city_bike',
    deskripsi: 'Fixie/single-speed urban yang trendi and ringan, cocok untuk gaya hidup aktif mahasiswa.',
    harga_per_hari: '65000', harga_per_jam: '13000', deposit_fee: '40000',
    ukuran_frame: 'M', transmisi: 'Single Speed', baterai: null,
    status_ketersediaan: 'servis',
    nama_toko: 'UGM Bike Rental', alamat_toko: 'Jl. Bulaksumur No. 2, Sleman',
    no_telepon: '08198765432', jam_operasional: '06.00 – 22.00 WIB',
    foto_url: 'https://images.unsplash.com/photo-1502744688674-c619d1586c9e?w=600&auto=format&fit=crop&q=80',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || null;

function generateBookingCode() {
  const ts = Date.now().toString(36).toUpperCase().slice(-4);
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let rand = '';
  for (let i = 0; i < 4; i++) rand += chars[Math.floor(Math.random() * chars.length)];
  return `PTR-${ts}${rand}`;
}

function getTodayLocal() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// NAVBAR
// ─────────────────────────────────────────────────────────────────────────────
function Navbar({ currentUser, onManageRental, onOpenAuth, onOpenProfile, onOpenOwnerDash, onOpenAdminDash, onLogout, onOpenNotifications, unreadCount }) {
  const role = currentUser?.role;
  return (
    <nav className="sticky top-0 z-40 w-full bg-[#121212]/90 backdrop-blur-md border-b border-[#2d2d2d]">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <span className="text-2xl font-black text-[#39FF14] uppercase tracking-tight glow-green">pi<span className="text-white">Trahan</span></span>
          <span className="hidden sm:block text-[9px] font-bold uppercase text-[#a0a0a0] border border-[#2d2d2d] px-2 py-0.5 rounded-full tracking-widest">Yogyakarta</span>
        </a>

        <div className="flex items-center gap-2">
          {/* Bell Notification Button */}
          <button onClick={onOpenNotifications}
            className="p-1.5 text-[#a0a0a0] border border-[#2d2d2d] hover:border-[#39FF14] hover:text-[#39FF14] rounded-xl transition-all relative flex items-center justify-center"
            title="Notifikasi Aktivitas">
            <span className="text-xs">🔔</span>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#FF3E3E] text-white rounded-full flex items-center justify-center text-[7px] font-black animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          <button onClick={onManageRental}
            id="btn-cek-booking"
            title="Sudah punya kode booking? Lacak status di sini"
            className="relative px-3 py-1.5 text-[10px] font-black uppercase text-[#39FF14] border border-[#39FF14]/60 hover:border-[#39FF14] hover:shadow-[0_0_10px_rgba(57,255,20,0.25)] rounded-xl transition-all flex items-center gap-1.5">
            🔍 Cek Booking
            <span className="absolute -top-1.5 -right-1.5 w-2 h-2 rounded-full bg-[#39FF14] animate-ping" />
            <span className="absolute -top-1.5 -right-1.5 w-2 h-2 rounded-full bg-[#39FF14]" />
          </button>

          {currentUser ? (
            <div className="flex items-center gap-2">
              {role === 'admin' && (
                <button onClick={onOpenAdminDash}
                  className="px-3 py-1.5 text-[10px] bg-[#FF3E3E]/10 text-[#FF3E3E] border border-[#FF3E3E]/30 font-black uppercase rounded-xl hover:bg-[#FF3E3E] hover:text-white transition-all">
                  🔐 Admin
                </button>
              )}
              {role === 'owner' && (
                <div className="flex gap-2">
                  <button onClick={onOpenOwnerDash}
                    className="px-3 py-1.5 text-[10px] bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30 font-black uppercase rounded-xl hover:bg-white hover:text-black transition-all">
                    🏪 Toko Dashboard
                  </button>
                </div>
              )}
              <button
                onClick={role !== 'admin' ? onOpenProfile : undefined}
                title={role !== 'admin' ? "Buka Profil & Dashboard" : "Admin piTrahan"}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 bg-[#121212] border border-[#2d2d2d] rounded-xl transition-all ${
                  role !== 'admin'
                    ? 'hover:border-[#39FF14] hover:shadow-[0_0_10px_rgba(57,255,20,0.15)] cursor-pointer'
                    : 'cursor-default'
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-[#39FF14]/20 flex items-center justify-center text-[#39FF14] text-[9px] font-black uppercase">
                  {currentUser.nama.charAt(0)}
                </div>
                <span className="text-[10px] text-white font-bold hidden sm:block max-w-[80px] truncate">
                  {currentUser.nama.split(' ')[0]}
                </span>
              </button>
              <button onClick={onLogout}
                className="px-3 py-1.5 text-[10px] text-[#FF3E3E] border border-[#FF3E3E]/20 font-black uppercase rounded-xl hover:border-[#FF3E3E]/60 transition-all">
                Keluar
              </button>
            </div>
          ) : (
            <button onClick={onOpenAuth}
              className="px-4 py-1.5 text-[10px] bg-[#39FF14] text-black font-black uppercase rounded-xl hover:bg-white transition-all shadow-[0_0_10px_rgba(57,255,20,0.2)]">
              Masuk / Daftar
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODAL CEK BOOKING
// ─────────────────────────────────────────────────────────────────────────────
function ManageRentalModal({ onClose }) {
  const [code, setCode] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const statusMap = {
    pending: { l: 'Menunggu Konfirmasi', cls: 'text-[#FFD700] border-[#FFD700]/30 bg-[#FFD700]/10' },
    confirmed: { l: 'Dikonfirmasi', cls: 'text-[#39FF14] border-[#39FF14]/30 bg-[#39FF14]/10' },
    rejected: { l: 'Ditolak', cls: 'text-[#FF3E3E] border-[#FF3E3E]/30 bg-[#FF3E3E]/10' },
    completed: { l: 'Selesai', cls: 'text-[#39FF14] border-[#39FF14]/30 bg-[#39FF14]/10' },
    cancelled: { l: 'Dibatalkan', cls: 'text-[#a0a0a0] border-[#555]/30 bg-[#555]/10' },
  };

  const handleCheck = async e => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return setError('Masukkan kode booking.');
    if (!/^(PTR-[A-Z0-9]{8}|PT-[A-Z2-9]{5})$/.test(trimmed)) return setError('Format tidak valid. Contoh: PTR-ABCD1234 atau PT-A2B3C');
    setError(''); setResult(null); setLoading(true);
    try {
      if (API_BASE_URL) {
        const r = await fetch(`${API_BASE_URL}/bookings/check/${trimmed}`);
        const d = await r.json();
        if (!r.ok) throw new Error(d.message);
        setResult(d);
      } else {
        await new Promise(r => setTimeout(r, 600));
        const all = JSON.parse(localStorage.getItem('pitrahan_demo_bookings') || '[]');
        const found = all.find(b => b.kode_booking === trimmed);
        if (!found) throw new Error('Kode booking tidak ditemukan.');
        setResult(found);
      }
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50 p-4">
      <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-2xl w-full max-w-md p-6 space-y-5 relative">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#39FF14] to-transparent" />
        <button onClick={onClose} className="absolute top-4 right-4 text-[#a0a0a0] hover:text-white text-xl font-bold">×</button>
        <div>
          <h3 className="text-xl font-black uppercase text-white">Cek Status Booking</h3>
          <p className="text-xs text-[#a0a0a0] mt-1">Masukkan kode booking Anda (contoh: PTR-ABCD1234)</p>
        </div>
        <form onSubmit={handleCheck} className="space-y-3">
          <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} maxLength={12}
            placeholder="PTR-ABCD1234"
            className="w-full px-4 py-3 bg-[#121212] border border-[#333] focus:border-[#39FF14] text-white rounded-xl text-sm font-mono uppercase tracking-widest focus:outline-none transition-all" />
          {error && <p className="text-xs text-[#FF3E3E]">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-3 bg-[#39FF14] text-black font-extrabold uppercase rounded-xl text-xs tracking-wider hover:bg-white transition-all disabled:opacity-50">
            {loading ? 'Mencari...' : 'Cek Sekarang'}
          </button>
        </form>
        {result && (
          <div className="p-4 bg-[#121212] border border-[#39FF14]/20 rounded-xl space-y-2 text-xs">
            {[
              ['Kode', result.kode_booking, 'font-mono tracking-widest'],
              ['Sepeda', result.sepeda, 'uppercase'],
              ['Pemesan', result.nama_pemesan, ''],
              ['Toko', result.nama_toko, ''],
              ['Tgl Ambil', (() => {
                const s = result.tanggal_ambil?.split('T')[0] || result.tanggal_ambil;
                return new Date(s + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
                  + (result.waktu_ambil ? ` — ${result.waktu_ambil} WIB` : '');
              })(), ''],
              ['Durasi', `${result.durasi_sewa} ${result.durasi_mode || 'hari'}`, ''],
              ['Total', `Rp ${parseFloat(result.total_harga).toLocaleString('id-ID')}`, 'text-[#39FF14] font-extrabold'],
            ].map(([k, v, cls]) => (
              <div key={k} className="flex justify-between items-center">
                <span className="text-[9px] uppercase font-bold text-[#a0a0a0]">{k}</span>
                <span className={`text-white font-bold ${cls}`}>{v}</span>
              </div>
            ))}
            <div className="flex justify-between items-center">
              <span className="text-[9px] uppercase font-bold text-[#a0a0a0]">Status</span>
              <span className={`px-3 py-0.5 rounded-full text-[9px] font-black uppercase border ${(statusMap[result.status] || statusMap.pending).cls}`}>
                {(statusMap[result.status] || statusMap.pending).l}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER
// ─────────────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="w-full border-t border-[#2d2d2d] bg-[#0d0d0d] py-10 px-4 mt-16">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-2">
          <span className="text-xl font-black text-[#39FF14] uppercase glow-green">pi<span className="text-white">Trahan</span></span>
          <p className="text-xs text-[#a0a0a0] leading-relaxed max-w-xs">
            Platform booking rental sepeda digital untuk wisatawan dan mahasiswa Yogyakarta. Pesan online, ambil di toko.
          </p>
        </div>
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase text-white tracking-wider">Jenis Sepeda</h4>
          {['Sepeda Gunung', 'Sepeda Lipat', 'Onthel / Klasik', 'City Bike'].map(t => (
            <p key={t} className="text-xs text-[#a0a0a0]">{t}</p>
          ))}
        </div>
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase text-white tracking-wider">Info Platform</h4>
          <p className="text-xs text-[#a0a0a0]">📍 Yogyakarta, Indonesia</p>
          <p className="text-xs text-[#a0a0a0]">🕐 Sewa per jam & per hari</p>
          <p className="text-xs text-[#a0a0a0]">📱 Konfirmasi via WhatsApp</p>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-[#2d2d2d] flex flex-col sm:flex-row justify-between items-center gap-2">
        <p className="text-[10px] text-[#555] uppercase tracking-widest">
          © {new Date().getFullYear()} piTrahan – Yogyakarta Bike Rental Platform
        </p>
        <p className="text-[10px] text-[#555]">
          {API_BASE_URL ? '🟢 Terhubung server' : '🟡 Mode Demo (localStorage)'}
        </p>
      </div>
    </footer>
  );
}

// ─── LOG ACTIVITY PERSISTENCE HELPER ───
export function logActivity(action, details, userType = 'guest', userName = 'Guest') {
  try {
    const logs = JSON.parse(localStorage.getItem('pitrahan_activity_logs') || '[]');
    const newLog = {
      id: Date.now() + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      action: action.toUpperCase(),
      details: details,
      userType: userType,
      userName: userName
    };
    logs.unshift(newLog);
    localStorage.setItem('pitrahan_activity_logs', JSON.stringify(logs.slice(0, 500)));
    window.dispatchEvent(new Event('pitrahan_new_activity'));
  } catch (e) {
    console.error('Error logging activity:', e);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// APP ROOT
// ─────────────────────────────────────────────────────────────────────────────
export default function App() {
  // ── Bikes state (termasuk CRUD oleh owner) ──
  const [bikes, setBikes] = useState(() => {
    try {
      const saved = localStorage.getItem('pitrahan_owner_bikes');
      return saved ? JSON.parse(saved) : SEED_BIKES;
    } catch { return SEED_BIKES; }
  });

  const saveBikes = (updated) => {
    setBikes(updated);
    localStorage.setItem('pitrahan_owner_bikes', JSON.stringify(updated));
  };

  const loadBikesFromServer = useCallback(async () => {
    if (!API_BASE_URL) return;
    try {
      const res = await fetch(`${API_BASE_URL}/bookings/bikes`);
      if (res.ok) {
        const d = await res.json();
        if (d.success && Array.isArray(d.data)) {
          const mapped = d.data.map(dbBike => {
            const seed = SEED_BIKES.find(s => s.id === dbBike.id) || {};
            return {
              ...seed,
              ...dbBike,
              no_telepon: dbBike.telp_toko || dbBike.no_telepon || seed.no_telepon,
              alamat_toko: dbBike.alamat_toko || seed.alamat_toko,
              jam_operasional: dbBike.jam_operasional || seed.jam_operasional || '08:00 – 20:00 WIB',
            };
          });
          setBikes(mapped);
          localStorage.setItem('pitrahan_owner_bikes', JSON.stringify(mapped));
        }
      }
    } catch (err) {
      console.error('Failed to load bikes from server:', err);
    }
  }, []);

  useEffect(() => {
    loadBikesFromServer();
  }, [loadBikesFromServer]);


  // ── Auth state ──
  const [currentUser, setCurrentUser] = useState(() => {
    try { const s = localStorage.getItem('pitrahan_user'); return s ? JSON.parse(s) : null; }
    catch { return null; }
  });
  const [token, setToken] = useState(() => localStorage.getItem('pitrahan_token') || null);

  const handleLoginSuccess = (user, jwtToken) => {
    setCurrentUser(user);
    setToken(jwtToken);
    localStorage.setItem('pitrahan_user', JSON.stringify(user));
    localStorage.setItem('pitrahan_token', jwtToken);
    logActivity('LOGIN', `Berhasil masuk ke platform sebagai ${user.role}`, user.role, user.nama || user.email);
    // Auto-open dashboards based on role
    if (user.role === 'admin') { setShowAuthModal(false); setShowAdminModal(true); }
    else if (user.role === 'owner') { setShowAuthModal(false); setShowOwnerModal(true); }
  };

  const handleLogout = () => {
    const loggedUser = currentUser;
    if (loggedUser) {
      logActivity('LOGOUT', `${loggedUser.nama || loggedUser.email} keluar dari platform`, loggedUser.role, loggedUser.nama || loggedUser.email);
    }
    setCurrentUser(null); setToken(null);
    localStorage.removeItem('pitrahan_user');
    localStorage.removeItem('pitrahan_token');
    setShowAdminModal(false); setShowProfileModal(false); setShowOwnerModal(false);
  };

  // ── Modal visibility ──
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showOwnerModal, setShowOwnerModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedBike, setSelectedBike] = useState(null);
  const [completedBooking, setCompletedBooking] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailNotification, setEmailNotification] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(null);

  // -- Activity logs state & events --
  const [activities, setActivities] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pitrahan_activity_logs') || '[]');
    } catch { return []; }
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const reloadActivities = useCallback(() => {
    try {
      const allLogs = JSON.parse(localStorage.getItem('pitrahan_activity_logs') || '[]');
      setActivities(allLogs);
      const lastRead = localStorage.getItem('pitrahan_last_read_activity') || '';
      if (!lastRead) {
        setUnreadCount(allLogs.length);
      } else {
        const count = allLogs.filter(l => l.timestamp > lastRead).length;
        setUnreadCount(count);
      }
    } catch {}
  }, []);

  useEffect(() => {
    window.addEventListener('pitrahan_new_activity', reloadActivities);
    reloadActivities();
    return () => window.removeEventListener('pitrahan_new_activity', reloadActivities);
  }, [reloadActivities]);

  const handleOpenNotifications = () => {
    setShowNotifications(true);
    setUnreadCount(0);
    localStorage.setItem('pitrahan_last_read_activity', new Date().toISOString());
  };

  // ── Seed users & bookings on mount ──
  useEffect(() => {
    async function seedUsers() {
      const hashPw = async (pw) => {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
      };

      let users = (() => {
        try { return JSON.parse(localStorage.getItem('pitrahan_users') || '[]'); }
        catch { return []; }
      })();

      // Clear futsal user data if present
      if (users.some(u => u.nama_usaha && u.nama_usaha.includes('Futsal'))) {
        localStorage.removeItem('pitrahan_users');
        users = [];
      }

      const hasAdmin = users.some(u => u.email === 'admin@gmail.com');
      if (hasAdmin) {
        return;
      }

      const [hadmin, howner, huser] = await Promise.all([
        hashPw('password123'), hashPw('password123'), hashPw('user123')
      ]);

      const presets = [
        { id: 'u_adm', nama: 'Admin piTrahan', no_telepon: '081122334455', email: 'admin@gmail.com', passwordHash: hadmin, role: 'admin', status: 'active', joined: '01 Jan 2026' },
        { id: 'u_owner', nama: 'Pak Eko', no_telepon: '08123456789', email: 'owner@gmail.com', passwordHash: howner, role: 'owner', status: 'active', nama_usaha: 'Rental Jogja Bikes', alamat_toko: 'Jl. Malioboro No. 15, Yogyakarta', joined: '05 Jan 2026' },
        { id: 'u_jdoe', nama: 'John Doe', no_telepon: '08123456781', email: 'john@example.com', passwordHash: huser, role: 'customer', status: 'active', joined: '12 Jan 2026' },
        { id: 'u_bsan', nama: 'Budi Santoso', no_telepon: '08123456782', email: 'budi@gmail.com', passwordHash: huser, role: 'customer', status: 'active', joined: '24 Feb 2026' },
        { id: 'u_ckir', nama: 'Citra Kirana', no_telepon: '08123456783', email: 'citra@mail.com', passwordHash: huser, role: 'customer', status: 'active', joined: '02 Mar 2026' },
        { id: 'u_dang', nama: 'Dimas Anggara', no_telepon: '08123456784', email: 'dimas@anggara.net', passwordHash: huser, role: 'customer', status: 'banned', joined: '18 Apr 2026' },
        { id: 'u_esap', nama: 'Eka Saputra', no_telepon: '08123456785', email: 'eka.saputra@outlook.com', passwordHash: huser, role: 'customer', status: 'active', joined: '05 Mei 2026' },
      ];

      localStorage.setItem('pitrahan_users', JSON.stringify(presets));
    }

    async function seedBookings() {
      let bookings = null;
      try { bookings = JSON.parse(localStorage.getItem('pitrahan_demo_bookings')); } catch(e){}

      // Clear futsal bookings OR old BK-format bookings — force re-seed
      const needsReseed = !bookings ||
        bookings.some(b => b.sepeda && b.sepeda.includes('Lapangan')) ||
        bookings.some(b => b.kode_booking && b.kode_booking.startsWith('BK-'));

      if (needsReseed) {
        localStorage.removeItem('pitrahan_demo_bookings');
        const demoBookings = [
          {
            id: 1780000000001,
            kode_booking: 'PTR-1A2B3C4D',
            sepeda: 'Polygon Xtrada 5',
            nama_pemesan: 'Budi Santoso',
            email: 'budi@gmail.com',
            tanggal_ambil: '2026-06-10',
            waktu_ambil: '15:00',
            total_harga: 75000,
            status: 'cancelled',
            durasi_sewa: 1,
            durasi_mode: 'hari',
            nama_toko: 'Rental Jogja Bikes',
            alamat_toko: 'Jl. Malioboro No. 15, Yogyakarta',
            created_at: new Date('2026-06-10T15:00:00Z').toISOString()
          },
          {
            id: 1780582718862,
            kode_booking: 'PTR-5E6F7G8H',
            sepeda: 'Dahon Speed P8',
            nama_pemesan: 'Eko Saputra',
            email: 'eka.saputra@outlook.com',
            tanggal_ambil: '2026-06-10',
            waktu_ambil: '19:00',
            total_harga: 90000,
            status: 'confirmed',
            durasi_sewa: 1,
            durasi_mode: 'hari',
            nama_toko: 'UGM Bike Rental',
            alamat_toko: 'Jl. Bulaksumur No. 2, Sleman',
            created_at: new Date('2026-06-10T19:00:00Z').toISOString()
          },
          {
            id: 1780590765455,
            kode_booking: 'PTR-9I0J1K2L',
            sepeda: 'Onthel Jawa Klasik',
            nama_pemesan: 'Citra Kirana',
            email: 'citra@mail.com',
            tanggal_ambil: '2026-06-09',
            waktu_ambil: '16:00',
            total_harga: 40000,
            status: 'confirmed',
            durasi_sewa: 1,
            durasi_mode: 'hari',
            nama_toko: 'Prambanan Vintage Rent',
            alamat_toko: 'Jl. Raya Prambanan KM 16, Klaten',
            created_at: new Date('2026-06-09T16:00:00Z').toISOString()
          },
          {
            id: 1780581411495,
            kode_booking: 'PTR-3M4N5O6P',
            sepeda: 'Dahon Speed P8',
            nama_pemesan: 'Budi Santoso',
            email: 'budi@gmail.com',
            tanggal_ambil: '2026-06-09',
            waktu_ambil: '10:00',
            total_harga: 90000,
            status: 'confirmed',
            durasi_sewa: 1,
            durasi_mode: 'hari',
            nama_toko: 'UGM Bike Rental',
            alamat_toko: 'Jl. Bulaksumur No. 2, Sleman',
            created_at: new Date('2026-06-09T10:00:00Z').toISOString()
          },
          {
            id: 1780597598866,
            kode_booking: 'PTR-7Q8R9S0T',
            sepeda: 'Polygon Xtrada 5',
            nama_pemesan: 'John Doe',
            email: 'john@example.com',
            tanggal_ambil: '2026-06-08',
            waktu_ambil: '17:00',
            total_harga: 75000,
            status: 'confirmed',
            durasi_sewa: 1,
            durasi_mode: 'hari',
            nama_toko: 'Rental Jogja Bikes',
            alamat_toko: 'Jl. Malioboro No. 15, Yogyakarta',
            created_at: new Date('2026-06-08T17:00:00Z').toISOString()
          },
          {
            id: 178058260128,
            kode_booking: 'PTR-1U2V3W4X',
            sepeda: 'Trek FX 2 Disc',
            nama_pemesan: 'Citra Kirana',
            email: 'citra@mail.com',
            tanggal_ambil: '2026-06-08',
            waktu_ambil: '09:00',
            total_harga: 120000,
            status: 'confirmed',
            durasi_sewa: 1,
            durasi_mode: 'hari',
            nama_toko: 'Rental Jogja Bikes',
            alamat_toko: 'Jl. Malioboro No. 15, Yogyakarta',
            created_at: new Date('2026-06-08T09:00:00Z').toISOString()
          },
          {
            id: 178058260999,
            kode_booking: 'PTR-5Y6Z7A8B',
            sepeda: 'Sepeda Lipat Brompton S2L',
            nama_pemesan: 'Budi Santoso',
            email: 'budi@gmail.com',
            tanggal_ambil: '2026-06-07',
            waktu_ambil: '14:00',
            total_harga: 200000,
            status: 'cancelled',
            durasi_sewa: 1,
            durasi_mode: 'hari',
            nama_toko: 'Premium Bike Jogja',
            alamat_toko: 'Jl. Prawirotaman No. 7, Yogyakarta',
            created_at: new Date('2026-06-07T14:00:00Z').toISOString()
          },
        ];
        localStorage.setItem('pitrahan_demo_bookings', JSON.stringify(demoBookings));
      }
    }

    seedUsers();
    seedBookings();
  }, []);

  // ── CRUD Bikes (owner) ──
  const handleUpdateBikeStatus = useCallback((id, newStatus) => {
    const bike = bikes.find(b => b.id === id);
    saveBikes(bikes.map(b => b.id === id ? { ...b, status_ketersediaan: newStatus } : b));
    if (bike) {
      logActivity('BIKE_STATUS', `Status sepeda "${bike.nama_sepeda}" diubah menjadi ${newStatus}`, currentUser?.role || 'owner', currentUser?.nama || currentUser?.email || 'Mitra');
    }
  }, [bikes, currentUser]);

  const handleAddBike = useCallback((bikeData) => {
    saveBikes([...bikes, bikeData]);
    logActivity('BIKE_ADD', `Sepeda baru "${bikeData.nama_sepeda}" ditambahkan ke katalog`, currentUser?.role || 'owner', currentUser?.nama || currentUser?.email || 'Mitra');
  }, [bikes, currentUser]);

  const handleEditBike = useCallback((bikeData) => {
    saveBikes(bikes.map(b => b.id === bikeData.id ? bikeData : b));
    logActivity('BIKE_EDIT', `Data sepeda "${bikeData.nama_sepeda}" diperbarui`, currentUser?.role || 'owner', currentUser?.nama || currentUser?.email || 'Mitra');
  }, [bikes, currentUser]);

  const handleDeleteBike = useCallback((id) => {
    const bike = bikes.find(b => b.id === id);
    saveBikes(bikes.filter(b => b.id !== id));
    if (bike) {
      logActivity('BIKE_DELETE', `Sepeda "${bike.nama_sepeda}" dihapus dari katalog`, currentUser?.role || 'owner', currentUser?.nama || currentUser?.email || 'Mitra');
    }
  }, [bikes, currentUser]);

  // ── Booking submit ──
  const handleSubmitBooking = async (formData) => {
    setIsSubmitting(true);
    try {
      if (API_BASE_URL) {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const res = await fetch(`${API_BASE_URL}/bookings`, { method: 'POST', headers, body: JSON.stringify(formData) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Gagal membuat booking.');
        const bike = bikes.find(b => Number(b.id) === Number(formData.bike_id));
        const bData = {
          ...data.data,
          ...bike,
          status: data.data.status_booking || 'pending',
          nama_pemesan: currentUser?.nama || formData.guest_name || 'Tamu',
          no_hp: currentUser?.no_telepon || formData.guest_phone || '-',
          email: currentUser?.email || formData.guest_email || ''
        };
        setCompletedBooking(bData);
        loadBikesFromServer();
        setTimeout(() => {
          setEmailNotification({
            subject: `Konfirmasi Pemesanan Sepeda - ${data.data.kode_booking || bData.kode_booking}`,
            recipient: bData.email || `${bData.nama_pemesan.toLowerCase().replace(/\s+/g, '')}@example.com`,
            booking: bData
          });
        }, 1200);
      } else {
        await new Promise(r => setTimeout(r, 700));
        const bike = bikes.find(b => b.id === formData.bike_id);
        if (!bike) throw new Error('Sepeda tidak ditemukan.');
        if (bike.status_ketersediaan !== 'tersedia') throw new Error('Maaf, sepeda tidak tersedia lagi.');

        const durasiMode = formData.durasi_mode || 'hari';
        const durasi = parseInt(formData.durasi_sewa);
        const harga = durasiMode === 'jam'
          ? parseFloat(bike.harga_per_jam || Math.round(bike.harga_per_hari / 8))
          : parseFloat(bike.harga_per_hari);
        const addonTotal = (formData.addons || []).reduce((acc, a) => {
          if (a.nama_alat === 'helm') return acc + 10000;
          if (a.nama_alat === 'kunci_pengaman') return acc + 5000;
          return acc;
        }, 0);
        const total = harga * durasi + addonTotal;

        // Hitung tanggal kembali (hanya relevan untuk mode hari)
        const tglKembali = (() => {
          if (durasiMode !== 'hari') return formData.tanggal_ambil;
          const d = new Date(formData.tanggal_ambil + 'T00:00:00');
          d.setDate(d.getDate() + durasi);
          return d.toISOString().split('T')[0];
        })();

        const demoBooking = {
          id: Date.now(),
          kode_booking: generateBookingCode(),
          sepeda: bike.nama_sepeda,
          foto_url: bike.foto_url,
          jenis_sepeda: bike.jenis_sepeda,
          durasi_sewa: durasi,
          durasi_mode: durasiMode,
          tanggal_ambil: formData.tanggal_ambil,
          waktu_ambil: formData.waktu_ambil || '09:00',
          tanggal_kembali: tglKembali,
          total_harga: total,
          status: 'pending',
          nama_toko: bike.nama_toko,
          alamat_toko: bike.alamat_toko,
          no_telepon: bike.no_telepon,
          jam_operasional: bike.jam_operasional,
          nama_pemesan: currentUser?.nama || formData.guest_name || 'Tamu',
          no_hp: currentUser?.no_telepon || formData.guest_phone || '-',
          email: currentUser?.email || formData.guest_email || '',
          metode_pembayaran: formData.metode_pembayaran,
          addons: formData.addons || [],
          created_at: new Date().toISOString(),
        };

        // Simpan ke localStorage
        const all = JSON.parse(localStorage.getItem('pitrahan_demo_bookings') || '[]');
        all.unshift(demoBooking);
        localStorage.setItem('pitrahan_demo_bookings', JSON.stringify(all));

        // Log activity
        const pemesan = demoBooking.nama_pemesan;
        const isGuest = !currentUser;
        logActivity(
          'BOOKING',
          `${isGuest ? 'Tamu' : 'Pelanggan'} ${pemesan} memesan "${demoBooking.sepeda}" (${demoBooking.kode_booking}) selama ${demoBooking.durasi_sewa} ${demoBooking.durasi_mode || 'hari'} · Rp ${parseFloat(demoBooking.total_harga).toLocaleString('id-ID')} · Bayar: ${demoBooking.metode_pembayaran === 'offline' ? 'Tunai/Offline' : 'Transfer'}`,
          isGuest ? 'guest' : 'customer',
          pemesan
        );

        setCompletedBooking(demoBooking);
        setTimeout(() => {
          setEmailNotification({
            subject: `Konfirmasi Pemesanan Sepeda - ${demoBooking.kode_booking}`,
            recipient: demoBooking.email || `${demoBooking.nama_pemesan.toLowerCase().replace(/\s+/g, '')}@example.com`,
            booking: demoBooking
          });
        }, 1200);
      }
      setSelectedBike(null);
    } catch (err) {
      alert(`❌ ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── If admin is logged in → render ONLY admin panel (no home page) ──
  if (currentUser?.role === 'admin') {
    return (
      <>
        <AdminDashboardModal
          user={currentUser}
          allBikes={bikes}
          onUpdateBikeStatus={handleUpdateBikeStatus}
          onAddBike={handleAddBike}
          onEditBike={handleEditBike}
          onDeleteBike={handleDeleteBike}
          onClose={handleLogout}
          logActivity={logActivity}
          onOpenProfile={() => setShowProfileModal(true)}
          API_BASE_URL={API_BASE_URL}
          token={token}
        />
        {showProfileModal && (
          <ProfileDashboardModal
            user={currentUser}
            token={token}
            API_BASE_URL={API_BASE_URL}
            onClose={() => setShowProfileModal(false)}
            logActivity={logActivity}
            onUserUpdate={(updatedUser) => setCurrentUser(updatedUser)}
            onForceLogout={handleLogout}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col">
      <Navbar
        currentUser={currentUser}
        onManageRental={() => setShowManageModal(true)}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenOwnerDash={() => setShowOwnerModal(true)}
        onOpenAdminDash={() => {}}
        onLogout={handleLogout}
        onOpenNotifications={handleOpenNotifications}
        unreadCount={unreadCount}
      />

      <HeroSection
        currentUser={currentUser}
        onStartRental={() => document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' })}
        onOpenAuth={() => setShowAuthModal(true)}
      />

      <section id="catalog-section" className="flex-1">
        <SearchFilter
          bikes={bikes}
          currentUser={currentUser}
          onSelectBike={setSelectedBike}
        />
      </section>

      <Footer />

      {/* ── Modals ── */}
      {showAuthModal && (
        <LoginRegisterModal API_BASE_URL={API_BASE_URL} onLoginSuccess={handleLoginSuccess} onClose={() => setShowAuthModal(false)} logActivity={logActivity} />
      )}

      {showProfileModal && currentUser && (
        <ProfileDashboardModal
          user={currentUser}
          token={token}
          API_BASE_URL={API_BASE_URL}
          onClose={() => setShowProfileModal(false)}
          logActivity={logActivity}
          onUserUpdate={(updatedUser) => setCurrentUser(updatedUser)}
          onForceLogout={handleLogout}
        />
      )}

      {showOwnerModal && currentUser?.role === 'owner' && (
        <OwnerDashboardModal
          user={currentUser}
          bikes={bikes}
          onUpdateBikeStatus={handleUpdateBikeStatus}
          onAddBike={handleAddBike}
          onEditBike={handleEditBike}
          onDeleteBike={handleDeleteBike}
          onClose={() => setShowOwnerModal(false)}
          logActivity={logActivity}
          API_BASE_URL={API_BASE_URL}
          token={token}
        />
      )}

      {selectedBike && !isSubmitting && (
        <BookingForm
          bike={selectedBike}
          currentUser={currentUser}
          getTodayLocal={getTodayLocal}
          onSubmitBooking={handleSubmitBooking}
          onClose={() => setSelectedBike(null)}
        />
      )}

      {isSubmitting && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#39FF14] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-bold text-white uppercase tracking-wider">Memproses Booking...</p>
          </div>
        </div>
      )}

      {completedBooking && (
        <TicketModal
          bookingData={completedBooking}
          onClose={() => setCompletedBooking(null)}
          onOpenEmail={() => setShowEmailModal({
            subject: `Konfirmasi Pemesanan Sepeda - ${completedBooking.kode_booking}`,
            recipient: completedBooking.email || `${completedBooking.nama_pemesan.toLowerCase().replace(/\s+/g, '')}@example.com`,
            booking: completedBooking
          })}
          API_BASE_URL={API_BASE_URL}
          token={token}
        />
      )}

      {showManageModal && (
        <ManageRentalModal onClose={() => setShowManageModal(false)} />
      )}

      {/* ── Email Notification Toast ── */}
      {emailNotification && (
        <div
          className="fixed bottom-6 right-6 z-50 animate-bounce max-w-sm bg-[#1e1e1e] border border-[#39FF14]/40 rounded-2xl p-4 shadow-[0_10px_30px_rgba(57,255,20,0.25)] flex gap-3 cursor-pointer hover:border-[#39FF14] transition-all"
          onClick={() => {
            setShowEmailModal(emailNotification);
            setEmailNotification(null);
          }}
        >
          <div className="w-10 h-10 rounded-full bg-[#39FF14]/10 flex items-center justify-center text-lg flex-shrink-0">
            📧
          </div>
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-[#39FF14]">Email Notifikasi Baru</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setEmailNotification(null);
                }}
                className="text-[#a0a0a0] hover:text-white text-xs font-bold"
              >
                &times;
              </button>
            </div>
            <p className="text-xs font-bold text-white line-clamp-1">{emailNotification.subject}</p>
            <p className="text-[10px] text-[#a0a0a0]">Dikirim ke: {emailNotification.recipient}</p>
            <p className="text-[9px] text-[#39FF14] underline font-bold mt-1">Ketuk untuk buka email receipt</p>
          </div>
        </div>
      )}

      {/* ── Email Modal Simulator ── */}
      {showEmailModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/95 z-[60] p-4 overflow-y-auto">
          <div className="bg-white text-[#333333] rounded-2xl w-full max-w-2xl overflow-hidden relative shadow-2xl my-8 border border-gray-200">
            {/* Header Email Client Mock */}
            <div className="bg-[#f2f6fc] px-6 py-4 border-b border-gray-200 flex justify-between items-center text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400" />
                <span className="w-3 h-3 rounded-full bg-yellow-400" />
                <span className="w-3 h-3 rounded-full bg-green-400" />
                <span className="ml-2 font-semibold text-gray-700">piTrahan Email Client Simulator</span>
              </div>
              <button onClick={() => setShowEmailModal(null)} className="text-gray-500 hover:text-black text-xl font-bold">&times;</button>
            </div>
            
            {/* Email Metadata */}
            <div className="p-6 border-b border-gray-100 bg-[#fafafa] space-y-2 text-xs">
              <div className="flex gap-2">
                <span className="font-bold w-12 text-gray-500">Dari:</span>
                <span className="text-gray-800">piTrahan Yogyakarta Rental &lt;<span className="text-blue-600 underline">noreply@pitrahan.com</span>&gt;</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold w-12 text-gray-500">Kepada:</span>
                <span className="text-gray-800 font-medium">{showEmailModal.recipient}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold w-12 text-gray-500">Subjek:</span>
                <span className="text-gray-800 font-extrabold">{showEmailModal.subject}</span>
              </div>
              <div className="flex gap-2">
                <span className="font-bold w-12 text-gray-500">Tanggal:</span>
                <span className="text-gray-600">{new Date(showEmailModal.booking.created_at || Date.now()).toLocaleString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} WIB</span>
              </div>
            </div>

            {/* Email Body */}
            <div className="p-8 max-h-[60vh] overflow-y-auto bg-[#f6f9fc] font-sans">
              <div className="max-w-xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-[#121212] px-6 py-8 text-center border-b-4 border-[#39FF14]">
                  <span className="text-2xl font-black text-[#39FF14] tracking-tight uppercase">pi<span className="text-white">Trahan</span></span>
                  <p className="text-gray-400 text-xs mt-1 uppercase tracking-widest">Yogyakarta Bicycles Rental</p>
                </div>
                
                <div className="p-6 space-y-6 text-sm text-gray-700">
                  <div className="space-y-1">
                    <p className="font-bold text-gray-900 text-base">Halo {showEmailModal.booking.nama_pemesan},</p>
                    <p className="text-gray-600">Terima kasih telah mempercayakan rental sepeda Anda kepada kami. Pemesanan Anda telah terdaftar dalam sistem.</p>
                  </div>

                  {/* Booking Code Card */}
                  <div className="bg-[#f9fafb] p-4 rounded-xl border border-gray-100 text-center space-y-1">
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Kode Booking Anda</p>
                    <p className="text-2xl font-black text-gray-900 font-mono tracking-widest uppercase">{showEmailModal.booking.kode_booking}</p>
                    <p className="text-[10px] text-gray-400">Gunakan kode di atas untuk mengambil sepeda di lokasi toko.</p>
                  </div>

                  {/* Booking Details Table */}
                  <div className="space-y-3">
                    <p className="text-xs font-bold text-gray-900 uppercase border-b border-gray-100 pb-1.5">Ringkasan Pesanan</p>
                    <table className="w-full text-xs text-left text-gray-600 border-collapse">
                      <tbody>
                        <tr className="border-b border-gray-50">
                          <th className="py-2 font-normal text-gray-500">Unit Sepeda</th>
                          <td className="py-2 text-right font-bold text-gray-900 uppercase">{showEmailModal.booking.sepeda}</td>
                        </tr>
                        <tr className="border-b border-gray-50">
                          <th className="py-2 font-normal text-gray-500">Toko Rental</th>
                          <td className="py-2 text-right font-bold text-gray-900">{showEmailModal.booking.nama_toko}</td>
                        </tr>
                        <tr className="border-b border-gray-50">
                          <th className="py-2 font-normal text-gray-500">Alamat Toko</th>
                          <td className="py-2 text-right text-gray-500 max-w-[200px] truncate">{showEmailModal.booking.alamat_toko}</td>
                        </tr>
                        <tr className="border-b border-gray-50">
                          <th className="py-2 font-normal text-gray-500">Tanggal Ambil</th>
                          <td className="py-2 text-right font-bold text-gray-900">{new Date(showEmailModal.booking.tanggal_ambil + 'T00:00:00').toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} — {showEmailModal.booking.waktu_ambil} WIB</td>
                        </tr>
                        <tr className="border-b border-gray-50">
                          <th className="py-2 font-normal text-gray-500">Durasi Sewa</th>
                          <td className="py-2 text-right font-bold text-gray-900">{showEmailModal.booking.durasi_sewa} {showEmailModal.booking.durasi_mode === 'jam' ? 'jam' : 'hari'}</td>
                        </tr>
                        <tr className="border-b border-gray-50">
                          <th className="py-2 font-normal text-gray-500">Metode Bayar</th>
                          <td className="py-2 text-right font-bold text-gray-900 uppercase">{showEmailModal.booking.metode_pembayaran}</td>
                        </tr>
                        {showEmailModal.booking.addons && showEmailModal.booking.addons.length > 0 && (
                          <tr className="border-b border-gray-50">
                            <th className="py-2 font-normal text-gray-500">Add-on</th>
                            <td className="py-2 text-right font-bold text-gray-900 uppercase">{showEmailModal.booking.addons.map(a => a.nama_alat).join(', ')}</td>
                          </tr>
                        )}
                        <tr>
                          <th className="py-2 font-bold text-gray-900">Total Harga</th>
                          <td className="py-2 text-right font-extrabold text-[#10B981] text-sm">Rp {parseFloat(showEmailModal.booking.total_harga).toLocaleString('id-ID')}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Instructions */}
                  <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 text-xs text-yellow-800 space-y-2">
                    <p className="font-bold flex items-center gap-1">⚠️ Syarat Pengambilan Sepeda:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Bawa KTP/SIM fisik asli atas nama pemesan.</li>
                      <li>Siapkan uang jaminan deposit (jika ada, sesuai ketentuan toko).</li>
                      <li>Tunjukkan email notifikasi ini atau kode booking ke petugas kasir.</li>
                    </ul>
                  </div>

                  <div className="text-center pt-4 border-t border-gray-100 text-[10px] text-gray-400">
                    <p>piTrahan Yogyakarta Rental Platform</p>
                    <p>Jl. Malioboro, Yogyakarta, Indonesia</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer buttons */}
            <div className="bg-[#fafafa] px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button onClick={() => setShowEmailModal(null)} className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all">
                Tutup Simulasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Slide-out Notification Drawer ── */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowNotifications(false)} />

          {/* Panel */}
          <div className="relative w-full max-w-sm bg-[#1a1a1a] border-l border-[#2d2d2d] h-full flex flex-col shadow-2xl z-10">
            {/* Header */}
            <div className="p-4 border-b border-[#2d2d2d] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-[#39FF14]">🔔</span>
                <h3 className="text-sm font-black uppercase tracking-wider text-white">Notifikasi & Transaksi</h3>
              </div>
              <button onClick={() => setShowNotifications(false)} className="text-[#a0a0a0] hover:text-white text-lg font-bold leading-none">&times;</button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {activities.length === 0 ? (
                <div className="text-center py-20 text-[#555] space-y-2">
                  <p className="text-4xl">🔔</p>
                  <p className="text-xs font-bold uppercase">Belum ada aktivitas</p>
                  <p className="text-[10px] text-[#444]">Buat booking pertama Anda!</p>
                </div>
              ) : (() => {
                const bookingLogs = activities.filter(l => l.action === 'BOOKING');
                const otherLogs   = activities.filter(l => l.action !== 'BOOKING').slice(0, 30);
                return (
                  <>
                    {/* ── Booking / Transaction Section ── */}
                    {bookingLogs.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-black uppercase text-[#39FF14] tracking-wider">🎫 Pesanan Terbaru</span>
                          <span className="text-[9px] text-[#555]">{bookingLogs.length} transaksi</span>
                        </div>

                        {bookingLogs.slice(0, 8).map(log => {
                          const kodeMatch = log.details.match(/\(([A-Z]+-[A-Z0-9]+)\)/);
                          const kode = kodeMatch ? kodeMatch[1] : null;
                          const date = new Date(log.timestamp);
                          const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                          const dateStr = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
                          return (
                            <div key={log.id} className="p-3 bg-[#39FF14]/5 border border-[#39FF14]/25 rounded-xl space-y-2 hover:border-[#39FF14]/50 transition-colors">
                              {/* Kode Booking — besar & mudah disalin */}
                              {kode && (
                                <div className="flex items-center gap-2 bg-[#0d0d0d] rounded-xl px-3 py-2.5 border border-[#39FF14]/20">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[8px] uppercase font-bold text-[#555] tracking-wider mb-0.5">Kode Booking</p>
                                    <p className="text-lg font-black text-[#39FF14] font-mono tracking-widest leading-none">{kode}</p>
                                  </div>
                                  <button
                                    id={`copy-${log.id}`}
                                    onClick={() => {
                                      navigator.clipboard?.writeText(kode).catch(() => {});
                                      const btn = document.getElementById(`copy-${log.id}`);
                                      if (btn) {
                                        const orig = btn.innerHTML;
                                        btn.innerHTML = '✓ Disalin';
                                        btn.className = btn.className.replace('text-[#39FF14]', 'text-white').replace('bg-[#39FF14]/10', 'bg-[#39FF14]');
                                        setTimeout(() => { btn.innerHTML = orig; btn.className = btn.className.replace('text-white', 'text-[#39FF14]').replace('bg-[#39FF14]', 'bg-[#39FF14]/10'); }, 1800);
                                      }
                                    }}
                                    className="px-2 py-1.5 text-[8px] font-black uppercase bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/30 rounded-lg hover:bg-[#39FF14]/20 transition-all flex-shrink-0 whitespace-nowrap"
                                  >
                                    📋 Salin
                                  </button>
                                </div>
                              )}
                              <p className="text-[10px] text-[#a0a0a0] leading-relaxed">{log.details}</p>
                              <div className="flex items-center justify-between">
                                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/20">
                                  {log.userType === 'guest' ? '👁 Tamu' : `👤 ${log.userName}`}
                                </span>
                                <span className="text-[8px] text-[#555] font-mono">{dateStr} {timeStr} WIB</span>
                              </div>
                            </div>
                          );
                        })}

                        {/* Shortcut: Cek status */}
                        <button
                          onClick={() => { setShowNotifications(false); setShowManageModal(true); }}
                          className="w-full py-2 text-[10px] font-black uppercase border border-[#39FF14]/25 text-[#39FF14] rounded-xl hover:bg-[#39FF14]/8 transition-all flex items-center justify-center gap-1.5"
                        >
                          🔍 Cek Status Booking
                        </button>
                      </div>
                    )}

                    {/* Divider */}
                    {bookingLogs.length > 0 && otherLogs.length > 0 && (
                      <div className="border-t border-[#2d2d2d] pt-3">
                        <p className="text-[9px] font-black uppercase text-[#444] tracking-wider">🕐 Aktivitas Platform</p>
                      </div>
                    )}

                    {/* ── Other Activity Logs ── */}
                    {otherLogs.map(log => {
                      const date = new Date(log.timestamp);
                      const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
                      const dateStr = date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
                      const roleCls = {
                        admin:    'text-[#FF3E3E] bg-[#FF3E3E]/10 border-[#FF3E3E]/20',
                        owner:    'text-[#FFD700] bg-[#FFD700]/10 border-[#FFD700]/20',
                        customer: 'text-[#39FF14] bg-[#39FF14]/10 border-[#39FF14]/20',
                        guest:    'text-white bg-[#2d2d2d] border-[#3d3d3d]',
                      }[log.userType] || 'text-[#a0a0a0] bg-[#121212] border-[#222]';
                      return (
                        <div key={log.id} className="p-3 bg-[#111] border border-[#2d2d2d] rounded-xl space-y-1 hover:border-[#3d3d3d] transition-colors">
                          <div className="flex justify-between items-center text-[9px] font-bold">
                            <span className={`px-2 py-0.5 rounded uppercase border ${roleCls}`}>{log.userName || log.userType}</span>
                            <span className="text-[#555] font-mono">{dateStr}, {timeStr}</span>
                          </div>
                          <p className="text-[10px] text-[#a0a0a0] leading-relaxed">{log.details}</p>
                        </div>
                      );
                    })}
                  </>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#2d2d2d] bg-[#111] flex gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  if (!window.confirm('Hapus semua notifikasi & transaksi?')) return;
                  try {
                    localStorage.setItem('pitrahan_activity_logs', '[]');
                  } catch (err) {
                    console.warn('Failed to clear pitrahan_activity_logs in localStorage:', err);
                  }
                  try {
                    localStorage.setItem('pitrahan_demo_bookings', '[]');
                  } catch (err) {
                    console.warn('Failed to clear pitrahan_demo_bookings in localStorage:', err);
                  }
                  setActivities([]);
                  setUnreadCount(0);
                  try {
                    window.dispatchEvent(new Event('pitrahan_new_activity'));
                  } catch (err) {}
                }}
                className="flex-1 py-2 text-[10px] font-black uppercase border border-[#FF3E3E]/30 text-[#FF3E3E] rounded-xl hover:bg-[#FF3E3E]/10 transition-all"
              >
                🗑 Hapus Semua
              </button>
              <button
                onClick={() => setShowNotifications(false)}
                className="flex-1 py-2 text-[10px] font-black uppercase bg-[#39FF14] text-black rounded-xl hover:bg-white transition-all"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Emergency WhatsApp FAB ── */}
      <a
        id="fab-whatsapp-support"
        href="https://wa.me/6281234567890?text=Halo%20piTrahan%2C%20saya%20butuh%20bantuan%20darurat."
        target="_blank"
        rel="noopener noreferrer"
        title="Bantuan darurat via WhatsApp"
        className="fixed bottom-6 left-6 z-50 group flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5a] text-white font-black rounded-2xl px-4 py-3 shadow-[0_4px_20px_rgba(37,211,102,0.35)] hover:shadow-[0_4px_28px_rgba(37,211,102,0.55)] transition-all duration-300 hover:-translate-y-0.5"
      >
        <span className="text-xl leading-none">📲</span>
        <div className="overflow-hidden max-w-0 group-hover:max-w-[160px] transition-all duration-300 whitespace-nowrap text-xs uppercase tracking-wide">
          Bantuan Darurat
        </div>
        <span className="absolute -top-1.5 -right-1.5 w-3 h-3 rounded-full bg-white/90 border-2 border-[#25D366] flex items-center justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse" />
        </span>
      </a>
    </div>
  );
}
