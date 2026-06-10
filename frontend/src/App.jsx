import { useState } from 'react';
import HeroSection from './components/HeroSection';
import SearchFilter from './components/SearchFilter';
import BookingForm from './components/BookingForm';
import TicketModal from './components/TicketModal';

// ────────────────────────────────────────────────────────────────────────────
// MOCK DATA – data sepeda contoh agar UI bisa dilihat tanpa backend
// ────────────────────────────────────────────────────────────────────────────
const MOCK_BIKES = [
  {
    id: 1,
    nama_sepeda: 'Polygon Xtrada 5',
    jenis_sepeda: 'gunung',
    harga_per_hari: '75000',
    status_ketersediaan: 'tersedia',
    nama_toko: 'Rental Jogja Bikes',
    alamat_toko: 'Jl. Malioboro No. 15, Yogyakarta',
    foto_url: null,
  },
  {
    id: 2,
    nama_sepeda: 'Dahon Speed P8',
    jenis_sepeda: 'lipat',
    harga_per_hari: '90000',
    status_ketersediaan: 'tersedia',
    nama_toko: 'UGM Bike Rental',
    alamat_toko: 'Jl. Bulaksumur No. 2, Sleman',
    foto_url: null,
  },
  {
    id: 3,
    nama_sepeda: 'Onthel Jawa Klasik',
    jenis_sepeda: 'onthel',
    harga_per_hari: '40000',
    status_ketersediaan: 'disewa',
    nama_toko: 'Prambanan Vintage Rent',
    alamat_toko: 'Jl. Raya Prambanan KM 16, Klaten',
    foto_url: null,
  },
  {
    id: 4,
    nama_sepeda: 'Trek FX 2 Disc',
    jenis_sepeda: 'city_bike',
    harga_per_hari: '120000',
    status_ketersediaan: 'tersedia',
    nama_toko: 'Rental Jogja Bikes',
    alamat_toko: 'Jl. Malioboro No. 15, Yogyakarta',
    foto_url: null,
  },
  {
    id: 5,
    nama_sepeda: 'Sepeda Lipat Brompton S2L',
    jenis_sepeda: 'lipat',
    harga_per_hari: '200000',
    status_ketersediaan: 'tersedia',
    nama_toko: 'Premium Bike Jogja',
    alamat_toko: 'Jl. Prawirotaman No. 7, Yogyakarta',
    foto_url: null,
  },
  {
    id: 6,
    nama_sepeda: 'Polygon Heist 3',
    jenis_sepeda: 'city_bike',
    harga_per_hari: '65000',
    status_ketersediaan: 'servis',
    nama_toko: 'UGM Bike Rental',
    alamat_toko: 'Jl. Bulaksumur No. 2, Sleman',
    foto_url: null,
  },
];

// ────────────────────────────────────────────────────────────────────────────
// Konfigurasi API Backend (isi dengan URL Vercel backend Anda setelah deploy)
// Contoh: const API_BASE_URL = 'https://pitrahan-api.vercel.app/api';
// ────────────────────────────────────────────────────────────────────────────
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || null;

// ────────────────────────────────────────────────────────────────────────────
// Helper: generate kode booking lokal (fallback jika tidak ada backend)
// ────────────────────────────────────────────────────────────────────────────
function generateLocalBookingCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'PTR-';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// ────────────────────────────────────────────────────────────────────────────
// Navbar
// ────────────────────────────────────────────────────────────────────────────
function Navbar({ onManageRental }) {
  return (
    <nav className="sticky top-0 z-40 w-full bg-[#121212]/80 backdrop-blur-md border-b border-[#2d2d2d]">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <span className="text-2xl font-black text-[#39FF14] uppercase tracking-tight glow-green">
            piTrahan
          </span>
          <span className="hidden sm:block text-[10px] font-bold uppercase text-[#a0a0a0] tracking-widest border border-[#2d2d2d] px-2 py-0.5 rounded-full">
            Yogyakarta
          </span>
        </a>

        <div className="flex items-center gap-3">
          <button
            id="btn-manage-rental-nav"
            onClick={onManageRental}
            className="px-4 py-2 text-xs font-bold uppercase text-[#a0a0a0] hover:text-white border border-[#2d2d2d] hover:border-[#a0a0a0] rounded-xl transition-all duration-300"
          >
            Cek Booking
          </button>
          <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[#39FF14] uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-[#39FF14] animate-pulse" />
            Online
          </span>
        </div>
      </div>
    </nav>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Modal: Cek Status Booking
// ────────────────────────────────────────────────────────────────────────────
function ManageRentalModal({ onClose }) {
  const [code, setCode] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCheck = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Masukkan kode booking terlebih dahulu.');
      return;
    }
    setError('');
    setLoading(true);

    if (API_BASE_URL) {
      try {
        const res = await fetch(`${API_BASE_URL}/bookings/check/${code.trim().toUpperCase()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Tidak ditemukan.');
        setStatus(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      // Mode demo tanpa backend
      setTimeout(() => {
        setStatus({
          kode_booking: code.toUpperCase(),
          sepeda: 'Polygon Xtrada 5',
          nama_toko: 'Rental Jogja Bikes',
          tanggal_ambil: '2025-12-20',
          durasi_sewa: 2,
          total_harga: '150000',
          status: 'aktif',
        });
        setLoading(false);
      }, 800);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50 p-4">
      <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-2xl w-full max-w-md p-6 space-y-5 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#a0a0a0] hover:text-white text-xl font-bold transition-colors"
        >
          &times;
        </button>
        <div>
          <h3 className="text-xl font-black uppercase text-white tracking-tight">Cek Status Booking</h3>
          <p className="text-xs text-[#a0a0a0] mt-1">Masukkan kode booking yang Anda terima saat memesan.</p>
        </div>

        <form onSubmit={handleCheck} className="space-y-3">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Contoh: PTR-ABCD1234"
            className="w-full px-4 py-3 bg-[#121212] border border-[#333333] focus:border-[#39FF14] text-white rounded-xl text-sm font-mono uppercase tracking-widest focus:outline-none transition-all"
          />
          {error && <p className="text-xs text-[#FF3E3E] font-medium">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#39FF14] text-black font-extrabold uppercase rounded-xl text-xs tracking-wider transition-all duration-300 hover:bg-white disabled:opacity-50"
          >
            {loading ? 'Mencari...' : 'Cek Sekarang'}
          </button>
        </form>

        {status && (
          <div className="p-4 bg-[#121212] border border-[#39FF14]/20 rounded-xl space-y-3 fade-in">
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-[#a0a0a0]">Kode Booking</span>
              <span className="text-white font-black font-mono tracking-widest">{status.kode_booking}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-[#a0a0a0]">Sepeda</span>
              <span className="text-white font-bold text-sm">{status.sepeda}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-[#a0a0a0]">Total Bayar</span>
              <span className="text-[#39FF14] font-extrabold">
                Rp {parseFloat(status.total_harga).toLocaleString('id-ID')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] uppercase font-bold text-[#a0a0a0]">Status</span>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-[#39FF14]/10 text-[#39FF14] border border-[#39FF14]/30">
                {status.status}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Footer
// ────────────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="w-full border-t border-[#2d2d2d] bg-[#0d0d0d] py-10 px-4 mt-16">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-2">
          <span className="text-xl font-black text-[#39FF14] uppercase glow-green">piTrahan</span>
          <p className="text-xs text-[#a0a0a0] leading-relaxed max-w-xs">
            Platform sewa sepeda digital modern untuk mahasiswa dan wisatawan Yogyakarta. Tanpa akun, bayar tunai.
          </p>
        </div>
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase text-white tracking-wider">Jenis Sepeda</h4>
          {['Sepeda Gunung', 'Sepeda Lipat', 'Onthel / Klasik', 'City Bike'].map(t => (
            <p key={t} className="text-xs text-[#a0a0a0] hover:text-[#39FF14] cursor-pointer transition-colors">{t}</p>
          ))}
        </div>
        <div className="space-y-3">
          <h4 className="text-xs font-black uppercase text-white tracking-wider">Kontak</h4>
          <p className="text-xs text-[#a0a0a0]">📍 Yogyakarta, Indonesia</p>
          <p className="text-xs text-[#a0a0a0]">🕐 Buka setiap hari 07.00 – 21.00</p>
          <p className="text-xs text-[#a0a0a0]">📱 WhatsApp per toko masing-masing</p>
        </div>
      </div>
      <div className="max-w-6xl mx-auto mt-8 pt-6 border-t border-[#2d2d2d] flex flex-col sm:flex-row justify-between items-center gap-2">
        <p className="text-[10px] text-[#555555] uppercase tracking-widest">
          © {new Date().getFullYear()} piTrahan. Yogyakarta Bike Rental Platform.
        </p>
        <p className="text-[10px] text-[#555555]">
          {API_BASE_URL ? '🟢 Terhubung ke server' : '🟡 Mode Demo (tanpa backend)'}
        </p>
      </div>
    </footer>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// App Root
// ────────────────────────────────────────────────────────────────────────────
export default function App() {
  const [bikes] = useState(MOCK_BIKES);
  const [selectedBike, setSelectedBike] = useState(null);
  const [completedBooking, setCompletedBooking] = useState(null);
  const [showManageModal, setShowManageModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Scroll ke katalog sepeda
  const handleStartRental = () => {
    document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  // Submit booking ke backend atau mode demo
  const handleSubmitBooking = async (formData) => {
    setIsSubmitting(true);
    try {
      if (API_BASE_URL) {
        const res = await fetch(`${API_BASE_URL}/bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Gagal membuat booking.');
        setCompletedBooking(data);
      } else {
        // ── Mode Demo: simulasi booking berhasil ──
        await new Promise((r) => setTimeout(r, 700));
        const bike = bikes.find((b) => b.id === formData.bike_id);
        const durationDays = formData.durasi_sewa;
        const addonTotal = formData.addons.reduce(
          (acc, a) => acc + (a.nama_alat === 'helm' ? 10000 : a.nama_alat === 'kunci_pengaman' ? 5000 : 0),
          0
        );
        const total = parseFloat(bike.harga_per_hari) * durationDays + addonTotal;
        setCompletedBooking({
          kode_booking: generateLocalBookingCode(),
          sepeda: bike.nama_sepeda,
          durasi_sewa: durationDays,
          tanggal_ambil: formData.tanggal_ambil,
          total_harga: total,
        });
      }
      setSelectedBike(null);
    } catch (err) {
      alert(`❌ Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col">
      {/* Navbar */}
      <Navbar onManageRental={() => setShowManageModal(true)} />

      {/* Hero */}
      <HeroSection
        onStartRental={handleStartRental}
        onManageRental={() => setShowManageModal(true)}
      />

      {/* Catalog Section */}
      <section id="catalog-section" className="flex-1 fade-in">
        <SearchFilter bikes={bikes} onSelectBike={setSelectedBike} />
      </section>

      {/* Footer */}
      <Footer />

      {/* ── Modals ── */}

      {/* Booking Form */}
      {selectedBike && !isSubmitting && (
        <BookingForm
          bike={selectedBike}
          currentUser={null}
          onSubmitBooking={handleSubmitBooking}
          onClose={() => setSelectedBike(null)}
        />
      )}

      {/* Loading state saat submit */}
      {isSubmitting && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#39FF14] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-bold text-white uppercase tracking-wider">Memproses Booking...</p>
          </div>
        </div>
      )}

      {/* Ticket Success Modal */}
      {completedBooking && (
        <TicketModal
          bookingData={completedBooking}
          onClose={() => setCompletedBooking(null)}
        />
      )}

      {/* Manage/Cek Booking Modal */}
      {showManageModal && (
        <ManageRentalModal onClose={() => setShowManageModal(false)} />
      )}
    </div>
  );
}
