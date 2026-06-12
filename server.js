const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Buat folder uploads otomatis jika belum ada
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Folder uploads dibuat otomatis.');
}

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Folder uploads dapat diakses publik
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===== ROUTES =====
app.use('/api/auth', require('./routes/auth'));
app.use('/api/laporan', require('./routes/laporan'));
app.use('/api/admin', require('./routes/admin'));

// Kategori (publik)
const db = require('./db.js');
app.get('/api/kategori', (req, res) => {
  db.query('SELECT * FROM kategori ORDER BY nama ASC', (err, results) => {
    if (err) return res.status(500).json({ message: 'Gagal mengambil kategori.' });
    res.json(results);
  });
});

// Riwayat laporan milik user yang login
const { verifyToken } = require('./routes/auth.js');
app.get('/api/riwayat', verifyToken, (req, res) => {
  const sql = `
    SELECT l.*, k.nama AS kategori
    FROM laporan l
    JOIN kategori k ON l.kategori_id = k.id
    WHERE l.user_id = ?
    ORDER BY l.created_at DESC
  `;
  db.query(sql, [req.user.id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Gagal mengambil riwayat.' });
    res.json(results);
  });
});

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'CampusFind API berjalan dengan baik!', version: '1.0.0' });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Terjadi kesalahan server.' });
});

app.listen(PORT, () => {
  console.log(`Server CampusFind berjalan di http://localhost:${PORT}`);
});