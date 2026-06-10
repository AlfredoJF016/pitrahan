import React, { useState, useEffect } from 'react';

async function hashPassword(pw) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(pw));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}


export default function ProfileDashboardModal({ user, token, API_BASE_URL, onClose }) {
  const [activeTab, setActiveTab] = useState('history'); // 'history' | 'password'
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Change Password Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passError, setPassError] = useState('');
  const [passSuccess, setPassSuccess] = useState('');
  const [passLoading, setPassLoading] = useState(false);

  // Fetch Booking History
  useEffect(() => {
    if (activeTab !== 'history') return;
    
    const fetchHistory = async () => {
      setLoading(true);
      try {
        if (API_BASE_URL && token) {
          const res = await fetch(`${API_BASE_URL}/bookings/my-bookings`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok) {
            setBookings(data.data || []);
          }
        } else {
          // Mode Demo: Get from localStorage
          await new Promise(r => setTimeout(r, 500));
          const allLocalBookings = JSON.parse(localStorage.getItem('pitrahan_demo_bookings') || '[]');
          
          // Filter bookings that match this user's email
          const userBookings = allLocalBookings.filter(b => b.email === user.email);
          setBookings(userBookings);
        }
      } catch (err) {
        console.error('Error fetching bookings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [activeTab, API_BASE_URL, token, user.email]);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassError('');
    setPassSuccess('');

    if (!oldPassword) return setPassError('Password lama wajib diisi.');
    if (newPassword.length < 6) return setPassError('Password baru minimal 6 karakter.');
    if (newPassword !== confirmNewPassword) return setPassError('Konfirmasi password baru tidak cocok.');

    setPassLoading(true);

    try {
      if (API_BASE_URL && token) {
        // Mode Online
        const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ oldPassword, newPassword })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Gagal mengubah password.');

        setPassSuccess('Kata sandi Anda berhasil diperbarui!');
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        // Mode Offline: Update in localStorage
        await new Promise(r => setTimeout(r, 600));
        const users = JSON.parse(localStorage.getItem('pitrahan_users') || '[]');
        const idx = users.findIndex(u => u.email.toLowerCase() === user.email.toLowerCase());
        
        if (idx === -1) throw new Error('Pengguna tidak ditemukan.');
        const hashedOld = await hashPassword(oldPassword);
        if (users[idx].passwordHash !== hashedOld) throw new Error('Password lama Anda salah.');

        users[idx].passwordHash = await hashPassword(newPassword);
        localStorage.setItem('pitrahan_users', JSON.stringify(users));

        setPassSuccess('Kata sandi berhasil diperbarui (Mode Demo)!');
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      }
    } catch (err) {
      setPassError(err.message);
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/80 z-50 p-4">
      <div className="bg-[#1e1e1e] border border-[#2d2d2d] rounded-2xl w-full max-w-2xl p-6 md:p-8 space-y-6 relative overflow-hidden flex flex-col max-h-[90vh]">
        {/* Glow bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#a0a0a0] hover:text-white text-xl font-bold transition-colors z-10"
        >
          &times;
        </button>

        {/* Top Profile Summary Card */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-[#121212] border border-[#2d2d2d] rounded-xl gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/30 flex items-center justify-center text-[#00E5FF] text-xl font-black uppercase">
              {user.nama.charAt(0)}
            </div>
            <div>
              <h4 className="font-extrabold text-white text-base tracking-tight">{user.nama}</h4>
              <p className="text-xs text-[#a0a0a0] font-mono">{user.email}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-[#39FF14]/10 border border-[#39FF14]/30 rounded-full text-[9px] font-black uppercase text-[#39FF14] tracking-wider">
              {user.role}
            </span>
            <span className="px-3 py-1 bg-[#1e1e1e] border border-[#2d2d2d] rounded-full text-[9px] font-bold text-[#a0a0a0]">
              Total Sewa: {bookings.length}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#2d2d2d] gap-6">
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'history' ? 'text-[#00E5FF] border-[#00E5FF]' : 'text-[#a0a0a0] hover:text-white border-transparent'
            }`}
          >
            Riwayat Booking
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`pb-3 text-xs font-black uppercase tracking-wider transition-all border-b-2 ${
              activeTab === 'password' ? 'text-[#00E5FF] border-[#00E5FF]' : 'text-[#a0a0a0] hover:text-white border-transparent'
            }`}
          >
            Ubah Password
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto min-h-[300px]">
          {activeTab === 'history' ? (
            /* BOOKING HISTORY TAB */
            loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-8 h-8 border-3 border-[#00E5FF] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-[#a0a0a0] font-bold uppercase tracking-wider">Memuat riwayat...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-16 bg-[#121212]/50 border border-dashed border-[#2d2d2d] rounded-xl">
                <p className="text-xs text-[#a0a0a0] font-semibold uppercase tracking-wider">Belum ada riwayat pemesanan sepeda.</p>
              </div>
            ) : (
              <div className="space-y-4 pr-1">
                {bookings.map((booking) => {
                  let statusBadge = 'bg-[#39FF14]/10 text-[#39FF14] border-[#39FF14]/20';
                  if (booking.status === 'confirmed') statusBadge = 'bg-[#00E5FF]/10 text-[#00E5FF] border-[#00E5FF]/20';
                  else if (booking.status === 'rejected' || booking.status === 'cancelled') statusBadge = 'bg-[#FF3E3E]/10 text-[#FF3E3E] border-[#FF3E3E]/20';

                  return (
                    <div
                      key={booking.id || booking.kode_booking}
                      className="p-4 bg-[#121212] border border-[#2d2d2d] rounded-xl flex flex-col sm:flex-row justify-between gap-4 hover:border-[#333333] transition-colors"
                    >
                      {/* Left: Product photo & Info */}
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-lg overflow-hidden border border-[#2d2d2d] bg-[#1a1a1a] flex-shrink-0">
                          {booking.foto_url ? (
                            <img src={booking.foto_url} alt={booking.sepeda} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] uppercase font-bold text-[#555] text-center p-1">
                              No Pic
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <h5 className="font-extrabold text-white text-sm uppercase tracking-tight line-clamp-1">{booking.sepeda}</h5>
                          <p className="text-xs text-[#a0a0a0]">Toko: <span className="text-white font-medium">{booking.nama_toko}</span></p>
                          <p className="text-[10px] text-[#555555]">
                            Tanggal Ambil: {new Date(booking.tanggal_ambil).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} ({booking.durasi_sewa} Hari)
                          </p>
                        </div>
                      </div>

                      {/* Right: Booking code, total, status */}
                      <div className="flex sm:flex-col justify-between items-end gap-2 text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-[#2d2d2d]">
                        <div className="text-left sm:text-right">
                          <span className="text-[9px] text-[#a0a0a0] uppercase block">Kode Booking</span>
                          <span className="text-white font-black font-mono tracking-widest text-sm uppercase select-all">{booking.kode_booking}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-[#00E5FF] block">
                            Rp {parseFloat(booking.total_harga).toLocaleString('id-ID')}
                          </span>
                          <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase border ${statusBadge} mt-1`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            /* CHANGE PASSWORD TAB */
            <form onSubmit={handleChangePassword} className="space-y-4 max-w-md mx-auto py-4">
              {passError && (
                <div className="p-3 bg-[#FF3E3E]/10 border border-[#FF3E3E]/30 rounded-xl text-xs font-semibold text-[#FF3E3E] text-center">
                  {passError}
                </div>
              )}
              {passSuccess && (
                <div className="p-3 bg-[#39FF14]/10 border border-[#39FF14]/30 rounded-xl text-xs font-semibold text-[#39FF14] text-center">
                  {passSuccess}
                </div>
              )}

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#a0a0a0] tracking-wider">Password Lama</label>
                <input
                  type="password"
                  required
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Masukkan password saat ini"
                  className="w-full px-4 py-3 bg-[#121212] border border-[#333333] focus:border-[#00E5FF] text-white rounded-xl text-sm focus:outline-none transition-all"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#a0a0a0] tracking-wider">Password Baru (Min 6 Karakter)</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan password baru"
                  className="w-full px-4 py-3 bg-[#121212] border border-[#333333] focus:border-[#00E5FF] text-white rounded-xl text-sm focus:outline-none transition-all"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#a0a0a0] tracking-wider">Konfirmasi Password Baru</label>
                <input
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="Ulangi password baru"
                  className="w-full px-4 py-3 bg-[#121212] border border-[#333333] focus:border-[#00E5FF] text-white rounded-xl text-sm focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={passLoading}
                className="w-full py-3 bg-[#00E5FF] text-black font-extrabold uppercase rounded-xl text-xs tracking-wider shadow-[0_0_15px_rgba(0,229,255,0.2)] hover:bg-white hover:shadow-none transition-all duration-300 disabled:opacity-50"
              >
                {passLoading ? 'Menyimpan...' : 'Perbarui Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
