const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db.js'); // Corrected path
require('dotenv').config();

// REGISTER
router.post('/register', (req, res) => {
  const { nama, nim, email, no_hp, password } = req.body;

  if (!nama || !nim || !email || !no_hp || !password) {
    return res.status(400).json({ message: 'Semua field wajib diisi.' });
  }

  db.query('SELECT email FROM users WHERE email = ?', [email], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Kesalahan server saat cek email.' });
    }
    if (results.length > 0) return res.status(400).json({ message: 'Email sudah terdaftar.' });

    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Gagal mengenkripsi password.' });
      }

      const sql = 'INSERT INTO users (nama, nim, email, no_hp, password) VALUES (?, ?, ?, ?, ?)';
      db.query(sql, [nama, nim, email, no_hp, hash], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Gagal mendaftarkan user.' });
        }
        res.status(201).json({ message: 'Registrasi berhasil. Silakan login.' });
      });
    });
  });
});

// LOGIN
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email dan password wajib diisi.' });

  const sql = 'SELECT * FROM users WHERE email = ?';
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Kesalahan server saat login.' });
    }
    if (results.length === 0) return res.status(401).json({ message: 'Email atau password salah.' });

    const user = results[0];
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Kesalahan server saat bandingkan password.' });
      }
      if (!isMatch) return res.status(401).json({ message: 'Email atau password salah.' });

      const payload = { id: user.id, role: user.role };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '3d' });

      delete user.password; // Jangan kirim password ke client

      res.json({
        message: 'Login berhasil.',
        token,
        user
      });
    });
  });
});

// Middleware: cek token JWT
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'Token tidak ditemukan. Silakan login terlebih dahulu.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Token tidak valid atau sudah kadaluarsa.' });
  }
};

// Middleware: cek token JWT + role admin
const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Akses ditolak. Hanya admin yang diizinkan.' });
    }
    next();
  });
};

// Export router as default and middleware as named
module.exports = router;
module.exports.verifyToken = verifyToken;
module.exports.verifyAdmin = verifyAdmin;
