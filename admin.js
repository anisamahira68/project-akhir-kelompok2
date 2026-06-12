const express = require('express');
const router = express.Router();
const db = require('../db.js');
const { verifyAdmin } = require('./auth.js');

// GET /api/admin/laporan - semua laporan termasuk belum diverifikasi
router.get('/laporan', verifyAdmin, (req, res) => {
  const sql = `
    SELECT l.*, u.nama AS pelapor, u.email, k.nama AS kategori
    FROM laporan l
    JOIN users u ON l.user_id = u.id
    JOIN kategori k ON l.kategori_id = k.id
    ORDER BY l.created_at DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: 'Kesalahan server.' });
    res.json(results);
  });
});

// PUT /api/admin/laporan/:id/verifikasi - verifikasi atau tolak laporan
router.put('/laporan/:id/verifikasi', verifyAdmin, (req, res) => {
  const { verified } = req.body; // 1 = verifikasi, 0 = tolak/hapus verifikasi
  const sql = 'UPDATE laporan SET verified = ? WHERE id = ?';
  db.query(sql, [verified, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Gagal memverifikasi.' });
    if (result.affectedRows === 0) return res.status(404).json({ message: 'Laporan tidak ditemukan.' });
    res.json({ message: verified ? 'Laporan berhasil diverifikasi.' : 'Laporan ditolak.' });
  });
});

// PUT /api/admin/laporan/:id/status - admin ubah status laporan
router.put('/laporan/:id/status', verifyAdmin, (req, res) => {
  const { status } = req.body;
  const statusValid = ['belum_ditemukan', 'sedang_diproses', 'sudah_kembali'];
  if (!statusValid.includes(status)) return res.status(400).json({ message: 'Status tidak valid.' });

  db.query('UPDATE laporan SET status = ? WHERE id = ?', [status, req.params.id], (err, result) => {
    if (err) return res.status(500).json({ message: 'Gagal mengubah status.' });
    res.json({ message: 'Status berhasil diperbarui.' });
  });
});

// GET /api/admin/statistik - statistik dashboard
router.get('/statistik', verifyAdmin, (req, res) => {
  const queries = {
    total: 'SELECT COUNT(*) AS total FROM laporan',
    hilang: "SELECT COUNT(*) AS total FROM laporan WHERE tipe = 'hilang' AND verified = 1",
    ditemukan: "SELECT COUNT(*) AS total FROM laporan WHERE tipe = 'ditemukan' AND verified = 1",
    kembali: "SELECT COUNT(*) AS total FROM laporan WHERE status = 'sudah_kembali'",
    pending: 'SELECT COUNT(*) AS total FROM laporan WHERE verified = 0'
  };

  const hasil = {};
  let selesai = 0;
  const totalQuery = Object.keys(queries).length;

  for (const [key, sql] of Object.entries(queries)) {
    db.query(sql, (err, results) => {
      if (!err) hasil[key] = results[0].total;
      selesai++;
      if (selesai === totalQuery) res.json(hasil);
    });
  }
});

// GET /api/admin/users - daftar semua user
router.get('/users', verifyAdmin, (req, res) => {
  const sql = 'SELECT id, nama, email, nim, no_hp, role, created_at FROM users ORDER BY created_at DESC';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: 'Kesalahan server.' });
    res.json(results);
  });
});

module.exports = router;
