// ============================================
// CAMPUSFIND - Main JavaScript
// ============================================

const API_URL = 'http://localhost:5000/api';

// ===== TOKEN & AUTH =====
const getToken = () => localStorage.getItem('cf_token');
const getUser  = () => JSON.parse(localStorage.getItem('cf_user') || 'null');
const isLogin  = () => !!getToken();
const isAdmin  = () => { const u = getUser(); return u && u.role === 'admin'; };

const simpanLogin = (token, user) => {
  localStorage.setItem('cf_token', token);
  localStorage.setItem('cf_user', JSON.stringify(user));
};

const logout = () => {
  localStorage.removeItem('cf_token');
  localStorage.removeItem('cf_user');
  window.location.href = 'index.html';
};

// ===== FETCH HELPER =====
async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = 'Bearer ' + token;

  const res = await fetch(API_URL + endpoint, { ...options, headers });
  const data = await res.json();

  if (!res.ok) throw new Error(data.message || 'Terjadi kesalahan.');
  return data;
}

// ===== STATUS LABEL & BADGE =====
const statusLabel = {
  belum_ditemukan: 'Belum Ditemukan',
  sedang_diproses: 'Sedang Diproses',
  sudah_kembali: 'Sudah Kembali'
};

const statusBadgeClass = {
  belum_ditemukan: 'badge-hilang',
  sedang_diproses: 'badge-proses',
  sudah_kembali: 'badge-kembali'
};

const tipeBadgeClass = {
  hilang: 'badge-hilang',
  ditemukan: 'badge-ditemukan'
};

const tipeLabel = { hilang: 'Hilang', ditemukan: 'Ditemukan' };

// ===== FORMAT TANGGAL =====
function formatTanggal(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ===== UPDATE NAVBAR =====
function updateNavbar() {
  const user = getUser();
  const navActions = document.getElementById('nav-actions');
  if (!navActions) return;

  if (user) {
    navActions.innerHTML = `
      <span style="font-size:13px; color:#6B7280;">Halo, <b>${user.nama.split(' ')[0]}</b></span>
      ${isAdmin() ? '<a href="admin.html" class="btn btn-outline" style="font-size:12px;">Dashboard Admin</a>' : ''}
      <button onclick="logout()" class="btn btn-outline" style="font-size:12px;">Keluar</button>
    `;
  } else {
    navActions.innerHTML = `
      <a href="login.html" class="btn btn-outline">Masuk</a>
      <a href="register.html" class="btn btn-primary">Daftar</a>
    `;
  }
}

// ===== ALERT HELPER =====
function tampilAlert(elId, pesan, tipe = 'success') {
  const el = document.getElementById(elId);
  if (!el) return;
  el.className = `alert alert-${tipe}`;
  el.innerHTML = `<i class="ti ti-${tipe === 'success' ? 'circle-check' : 'alert-circle'}"></i> ${pesan}`;
  el.style.display = 'flex';
  setTimeout(() => { el.style.display = 'none'; }, 4000);
}

// ===== FOTO URL =====
function fotoUrl(filename) {
  if (!filename) return null;
  return `http://localhost:5000/uploads/${filename}`;
}

document.addEventListener('DOMContentLoaded', updateNavbar);
