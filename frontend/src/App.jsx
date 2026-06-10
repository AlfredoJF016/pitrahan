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
    harga_per_hari: '75000', harga_per_jam: '15000',
    status_ketersediaan: 'tersedia',
    nama_toko: 'Rental Jogja Bikes', alamat_toko: 'Jl. Malioboro No. 15, Yogyakarta',
    no_telepon: '08123456789', jam_operasional: '07.00 – 21.00 WIB',
    foto_url: 'https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 2, nama_sepeda: 'Dahon Speed P8', jenis_sepeda: 'lipat',
    deskripsi: 'Sepeda lipat ringkas 8-speed, ideal untuk eksplorasi kota Yogyakarta & kampus UGM.',
    harga_per_hari: '90000', harga_per_jam: '18000',
    status_ketersediaan: 'tersedia',
    nama_toko: 'UGM Bike Rental', alamat_toko: 'Jl. Bulaksumur No. 2, Sleman',
    no_telepon: '08198765432', jam_operasional: '06.00 – 22.00 WIB',
    foto_url: 'https://images.unsplash.com/photo-1571333250630-f0230c320b6d?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 3, nama_sepeda: 'Onthel Jawa Klasik', jenis_sepeda: 'onthel',
    deskripsi: 'Sepeda onthel autentik bergaya klasik Jawa, sempurna untuk foto di Candi Prambanan.',
    harga_per_hari: '40000', harga_per_jam: '8000',
    status_ketersediaan: 'disewa',
    nama_toko: 'Prambanan Vintage Rent', alamat_toko: 'Jl. Raya Prambanan KM 16, Klaten',
    no_telepon: '08776655443', jam_operasional: '07.00 – 18.00 WIB',
    foto_url: 'https://images.unsplash.com/photo-1519583272095-6433daf26b6e?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 4, nama_sepeda: 'Trek FX 2 Disc', jenis_sepeda: 'city_bike',
    deskripsi: 'City bike modern dengan disc brake, nyaman untuk komuter dan jalan aspal kota Yogyakarta.',
    harga_per_hari: '120000', harga_per_jam: '25000',
    status_ketersediaan: 'tersedia',
    nama_toko: 'Rental Jogja Bikes', alamat_toko: 'Jl. Malioboro No. 15, Yogyakarta',
    no_telepon: '08123456789', jam_operasional: '07.00 – 21.00 WIB',
    foto_url: 'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 5, nama_sepeda: 'Sepeda Lipat Brompton S2L', jenis_sepeda: 'lipat',
    deskripsi: 'Brompton premium buatan Inggris — ikon sepeda lipat dunia. Ringan, kompak, dan prestisius.',
    harga_per_hari: '200000', harga_per_jam: '40000',
    status_ketersediaan: 'tersedia',
    nama_toko: 'Premium Bike Jogja', alamat_toko: 'Jl. Prawirotaman No. 7, Yogyakarta',
    no_telepon: '08998877665', jam_operasional: '08.00 – 20.00 WIB',
    foto_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&auto=format&fit=crop&q=80',
  },
  {
    id: 6, nama_sepeda: 'Polygon Heist 3', jenis_sepeda: 'city_bike',
    deskripsi: 'Fixie/single-speed urban yang trendi dan ringan, cocok untuk gaya hidup aktif mahasiswa.',
    harga_per_hari: '65000', harga_per_jam: '13000',
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
function Navbar({ currentUser, onManageRental, onOpenAuth, onOpenProfile, onOpenOwnerDash, onOpenAdminDash, onLogout }) {
  const role = currentUser?.role;
  return (
    <nav className="sticky top-0 z-40 w-full bg-[#121212]/90 backdrop-blur-md border-b border-[#2d2d2d]">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <span className="text-2xl font-black text-[#39FF14] uppercase tracking-tight glow-green">piTrahan</span>
          <span className="hidden sm:block text-[9px] font-bold uppercase text-[#a0a0a0] border border-[#2d2d2d] px-2 py-0.5 rounded-full tracking-widest">Yogyakarta</span>
        </a>

        <div className="flex items-center gap-2">
          <button onClick={onManageRental}
            className="px-3 py-1.5 text-[10px] font-black uppercase text-[#a0a0a0] border border-[#2d2d2d] hover:border-[#a0a0a0] rounded-xl transition-all">
            Cek Booking
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
                <button onClick={onOpenOwnerDash}
                  className="px-3 py-1.5 text-[10px] bg-[#FFD700]/10 text-[#FFD700] border border-[#FFD700]/30 font-black uppercase rounded-xl hover:bg-white hover:text-black transition-all">
                  🏪 Toko Dashboard
                </button>
              )}
              {role === 'customer' && (
                <button onClick={onOpenProfile}
                  className="px-3 py-1.5 text-[10px] bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 font-black uppercase rounded-xl hover:bg-white hover:text-black transition-all">
                  Dashboard
                </button>
              )}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#121212] border border-[#2d2d2d] rounded-xl">
                <div className="w-5 h-5 rounded-full bg-[#39FF14]/20 flex items-center justify-center text-[#39FF14] text-[9px] font-black uppercase">
                  {currentUser.nama.charAt(0)}
                </div>
                <span className="text-[10px] text-white font-bold hidden sm:block max-w-[80px] truncate">
                  {currentUser.nama.split(' ')[0]}
                </span>
              </div>
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
    completed: { l: 'Selesai', cls: 'text-[#00E5FF] border-[#00E5FF]/30 bg-[#00E5FF]/10' },
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
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent" />
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
          <span className="text-xl font-black text-[#39FF14] uppercase glow-green">piTrahan</span>
          <p className="text-xs text-[#a0a0a0] leading-relaxed max-w-xs">
            Platform sewa sepeda digital untuk mahasiswa dan wisatawan Yogyakarta. Pesan online, ambil di lokasi.
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
          <p className="text-xs text-[#a0a0a0]">🕐 Jam operasional sesuai toko</p>
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
    // Auto-open dashboards based on role
    if (user.role === 'admin') { setShowAuthModal(false); setShowAdminModal(true); }
    else if (user.role === 'owner') { setShowAuthModal(false); setShowOwnerModal(true); }
  };

  const handleLogout = () => {
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

  // ── Seed users on mount (ensure all preset accounts exist) ──
  useEffect(() => {
    async function seedUsers() {
      const hashPw = async (pw) => {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
      };

      const users = (() => {
        try { return JSON.parse(localStorage.getItem('pitrahan_users') || '[]'); }
        catch { return []; }
      })();

      // Filter out old jogjafutsal entries if present
      const cleanUsers = users.filter(u => !u.email.includes('jogjafutsal.com'));

      const hasAdmin = cleanUsers.some(u => u.email === 'admin@gmail.com');
      if (hasAdmin) {
        if (cleanUsers.length !== users.length) {
          localStorage.setItem('pitrahan_users', JSON.stringify(cleanUsers));
        }
        return;
      }

      const [hadmin, howner, huser] = await Promise.all([
        hashPw('password123'), hashPw('password123'), hashPw('user123')
      ]);

      const presets = [
        // Admin utama
        { id: 'u_adm', nama: 'Admin piTrahan', no_telepon: '081122334455', email: 'admin@gmail.com', passwordHash: hadmin, role: 'admin', status: 'active' },
        // Owner / Pemilik Toko
        { id: 'u_owner', nama: 'Pak Eko', no_telepon: '08123456789', email: 'owner@gmail.com', passwordHash: howner, role: 'owner', status: 'active', nama_usaha: 'Rental Jogja Bikes', alamat_toko: 'Jl. Malioboro No. 15, Yogyakarta' },
        // Pengguna (customer)
        { id: 'u_jdoe', nama: 'John Doe', no_telepon: '08123456781', email: 'john@example.com', passwordHash: huser, role: 'customer', status: 'active' },
        { id: 'u_bsan', nama: 'Budi Santoso', no_telepon: '08123456782', email: 'budi@santoso.id', passwordHash: huser, role: 'customer', status: 'active' },
        { id: 'u_ckir', nama: 'Citra Kirana', no_telepon: '08123456783', email: 'citra@mail.com', passwordHash: huser, role: 'customer', status: 'active' },
        { id: 'u_dang', nama: 'Dimas Anggara', no_telepon: '08123456784', email: 'dimas@anggara.net', passwordHash: huser, role: 'customer', status: 'active' },
        { id: 'u_esap', nama: 'Eka Saputra', no_telepon: '08123456785', email: 'eka.saputra@outlook.com', passwordHash: huser, role: 'customer', status: 'active' },
      ].filter(Boolean);

      const merged = [...users];
      presets.forEach(p => {
        if (!merged.some(u => u.email === p.email)) merged.push(p);
      });
      localStorage.setItem('pitrahan_users', JSON.stringify(merged));
    }
    seedUsers();
  }, []);

  // ── CRUD Bikes (owner) ──
  const handleUpdateBikeStatus = useCallback((id, newStatus) => {
    saveBikes(bikes.map(b => b.id === id ? { ...b, status_ketersediaan: newStatus } : b));
  }, [bikes]);

  const handleAddBike = useCallback((bikeData) => {
    saveBikes([...bikes, bikeData]);
  }, [bikes]);

  const handleEditBike = useCallback((bikeData) => {
    saveBikes(bikes.map(b => b.id === bikeData.id ? bikeData : b));
  }, [bikes]);

  const handleDeleteBike = useCallback((id) => {
    saveBikes(bikes.filter(b => b.id !== id));
  }, [bikes]);

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
        const bike = bikes.find(b => b.id === formData.bike_id);
        setCompletedBooking({
          ...data.data,
          ...bike,
          nama_pemesan: currentUser?.nama || formData.guest_name || 'Tamu',
          no_hp: currentUser?.no_telepon || formData.guest_phone || '-'
        });
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
          email: currentUser?.email || '',
          metode_pembayaran: formData.metode_pembayaran,
          addons: formData.addons || [],
          created_at: new Date().toISOString(),
        };

        // Simpan ke localStorage
        const all = JSON.parse(localStorage.getItem('pitrahan_demo_bookings') || '[]');
        all.unshift(demoBooking);
        localStorage.setItem('pitrahan_demo_bookings', JSON.stringify(all));

        setCompletedBooking(demoBooking);
      }
      setSelectedBike(null);
    } catch (err) {
      alert(`❌ ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col">
      <Navbar
        currentUser={currentUser}
        onManageRental={() => setShowManageModal(true)}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenProfile={() => setShowProfileModal(true)}
        onOpenOwnerDash={() => setShowOwnerModal(true)}
        onOpenAdminDash={() => setShowAdminModal(true)}
        onLogout={handleLogout}
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
        <LoginRegisterModal API_BASE_URL={API_BASE_URL} onLoginSuccess={handleLoginSuccess} onClose={() => setShowAuthModal(false)} />
      )}

      {showProfileModal && currentUser?.role === 'customer' && (
        <ProfileDashboardModal user={currentUser} token={token} API_BASE_URL={API_BASE_URL} onClose={() => setShowProfileModal(false)} />
      )}

      {showAdminModal && currentUser?.role === 'admin' && (
        <AdminDashboardModal
          user={currentUser}
          allBikes={bikes}
          onUpdateBikeStatus={handleUpdateBikeStatus}
          onAddBike={handleAddBike}
          onEditBike={handleEditBike}
          onDeleteBike={handleDeleteBike}
          onClose={() => setShowAdminModal(false)}
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
        <TicketModal bookingData={completedBooking} onClose={() => setCompletedBooking(null)} />
      )}

      {showManageModal && (
        <ManageRentalModal onClose={() => setShowManageModal(false)} />
      )}
    </div>
  );
}
