const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../db.js');
const { verifyToken, verifyAdmin } = require('./auth.js');

// Konfigurasi upload foto
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const unik = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unik + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const tipeIzin = /jpeg|jpg|png|webp/;
    const valid = tipeIzin.test(path.extname(file.originalname).toLowerCase());
    if (valid) cb(null, true);
    else cb(new Error('Hanya file gambar yang diizinkan (JPG, PNG, WEBP)'));
  }
});

// GET /api/laporan - ambil semua laporan (publik, sudah diverifikasi)
router.get('/', (req, res) => {
  const { tipe, kategori_id, lokasi, status, search } = req.query;

  let sql = `
    SELECT l.*, u.nama AS pelapor, k.nama AS kategori
    FROM laporan l
    JOIN users u ON l.user_id = u.id
    JOIN kategori k ON l.kategori_id = k.id
    WHERE l.verified = 1
  `;
  const params = [];

  if (tipe) { sql += ' AND l.tipe = ?'; params.push(tipe); }
  if (kategori_id) { sql += ' AND l.kategori_id = ?'; params.push(kategori_id); }
  if (lokasi) { sql += ' AND l.lokasi LIKE ?'; params.push('%' + lokasi + '%'); }
  if (status) { sql += ' AND l.status = ?'; params.push(status); }
  if (search) { sql += ' AND (l.nama_barang LIKE ? OR l.deskripsi LIKE ?)'; params.push('%' + search + '%', '%' + search + '%'); }

  sql += ' ORDER BY l.created_at DESC';

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ message: 'Gagal mengambil data.' });
    res.json(results);
  });
});

// GET /api/laporan/:id - detail satu laporan
router.get('/:id', (req, res) => {
  const sql = `
    SELECT l.*, u.nama AS pelapor, u.no_hp, k.nama AS kategori
    FROM laporan l
    JOIN users u ON l.user_id = u.id
    JOIN kategori k ON l.kategori_id = k.id
    WHERE l.id = ? AND l.verified = 1
  `;
  db.query(sql, [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ message: 'Kesalahan server.' });
    if (results.length === 0) return res.status(404).json({ message: 'Laporan tidak ditemukan.' });
    res.json(results[0]);
  });
});

// POST /api/laporan - buat laporan baru (login wajib)
router.post('/', verifyToken, upload.single('foto'), (req, res) => {
  const { tipe, nama_barang, kategori_id, deskripsi, lokasi, tanggal, kontak } = req.body;

  if (!tipe || !nama_barang || !kategori_id || !lokasi || !tanggal || !kontak) {
    return res.status(400).json({ message: 'Semua field wajib diisi.' });
  }

  const foto = req.file ? req.file.filename : null;

  const sql = `
    INSERT INTO laporan (user_id, tipe, nama_barang, kategori_id, deskripsi, lokasi, tanggal, foto, kontak)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  db.query(sql, [req.user.id, tipe, nama_barang, kategori_id, deskripsi || null, lokasi, tanggal, foto, kontak], (err, result) => {
    if (err) return res.status(500).json({ message: 'Gagal menyimpan laporan.' });
    res.status(201).json({ message: 'Laporan berhasil dikirim. Menunggu verifikasi admin.', id: result.insertId });
  });
});

// PUT /api/laporan/:id/status - ubah status laporan (login wajib, hanya pemilik atau admin)
router.put('/:id/status', verifyToken, (req, res) => {
  const { status } = req.body;
  const statusValid = ['belum_ditemukan', 'sedang_diproses', 'sudah_kembali'];

  if (!statusValid.includes(status)) {
    return res.status(400).json({ message: 'Status tidak valid.' });
  }

  let sql, params;
  if (req.user.role === 'admin') {
    sql = 'UPDATE laporan SET status = ? WHERE id = ?';
    params = [status, req.params.id];
  } else {
    sql = 'UPDATE laporan SET status = ? WHERE id = ? AND user_id = ?';
    params = [status, req.params.id, req.user.id];
  }

  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json({ message: 'Gagal mengubah status.' });
    if (result.affectedRows === 0) return res.status(403).json({ message: 'Tidak bisa mengubah laporan ini.' });
    res.json({ message: 'Status laporan berhasil diperbarui.' });
  });
});

// DELETE /api/laporan/:id - hapus laporan (admin atau pemilik)
router.delete('/:id', verifyToken, (req, res) => {
  let sql, params;
  if (req.user.role === 'admin') {
    sql = 'DELETE FROM laporan WHERE id = ?';
    params = [req.params.id];
  } else {
    sql = 'DELETE FROM laporan WHERE id = ? AND user_id = ?';
    params = [req.params.id, req.user.id];
  }

  db.query(sql, params, (err, result) => {
    if (err) return res.status(500).json({ message: 'Gagal menghapus laporan.' });
    if (result.affectedRows === 0) return res.status(403).json({ message: 'Tidak bisa menghapus laporan ini.' });
    res.json({ message: 'Laporan berhasil dihapus.' });
  });
});

module.exports = router;
