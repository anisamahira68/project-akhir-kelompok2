-- ============================================================
-- CampusFind Database
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
SET NAMES utf8mb4;

CREATE DATABASE IF NOT EXISTS `campusfind_db`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `campusfind_db`;

-- ============================================================
-- Tabel: users
-- ============================================================
CREATE TABLE `users` (
  `id`         int(11)                     NOT NULL AUTO_INCREMENT,
  `nama`       varchar(100)                NOT NULL,
  `email`      varchar(100)                NOT NULL,
  `password`   varchar(255)                NOT NULL,
  `nim`        varchar(20)                 DEFAULT NULL,
  `no_hp`      varchar(20)                 DEFAULT NULL,
  `role`       enum('mahasiswa','admin')   DEFAULT 'mahasiswa',
  `created_at` timestamp                   NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Seed users (password di-hash dengan bcrypt, cost=10)
-- admin@campusfind.id   → password: admin123
-- aidilumsu@gmail.com   → password: aidilganteng
-- syahrialhusna@gmail.com → password: bangiyal123
-- Password asli: admin123 | aidilganteng | bangiyal123
INSERT INTO `users` (`id`, `nama`, `email`, `password`, `nim`, `no_hp`, `role`) VALUES
(1, 'Admin Kampus',    'admin@campusfind.id',       '$2a$10$QP.hVbsRbmLiaRm2RQtbO.ZLRHtHSNy9z7tj40chr1brOtimi1a3.', NULL,       '081200000001', 'admin'),
(2, 'Aidil Taufik',   'aidilumsu@gmail.com',        '$2a$10$V8YoNaj4nZraj0TzLBZW8uNHceuM3xAFiOnjp9wuQSzSnOcjAdH66', '20220001', '082111222333', 'mahasiswa'),
(3, 'Syahrial Husna', 'syahrialhusna@gmail.com',    '$2a$10$v6FbaJFq4LHazIhzw6l8uekpf6s1qs3P.GCTS.qI4XIiw7D2siiZy', '20220002', '085344556677', 'mahasiswa');

-- ============================================================
-- Tabel: kategori
-- ============================================================
CREATE TABLE `kategori` (
  `id`   int(11)      NOT NULL AUTO_INCREMENT,
  `nama` varchar(100) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `kategori` (`id`, `nama`) VALUES
(1, 'Elektronik'),
(2, 'Dompet / Tas'),
(3, 'Kunci'),
(4, 'Kartu / Dokumen'),
(5, 'Pakaian / Aksesoris'),
(6, 'Alat Tulis / Buku'),
(7, 'Lainnya');

-- ============================================================
-- Tabel: laporan
-- ============================================================
CREATE TABLE `laporan` (
  `id`          int(11)                                              NOT NULL AUTO_INCREMENT,
  `user_id`     int(11)                                              NOT NULL,
  `tipe`        enum('hilang','ditemukan')                           NOT NULL,
  `nama_barang` varchar(150)                                         NOT NULL,
  `kategori_id` int(11)                                              NOT NULL,
  `deskripsi`   text                                                 DEFAULT NULL,
  `lokasi`      varchar(200)                                         NOT NULL,
  `tanggal`     date                                                 NOT NULL,
  `foto`        varchar(255)                                         DEFAULT NULL,
  `kontak`      varchar(20)                                          NOT NULL,
  `status`      enum('belum_ditemukan','sedang_diproses','sudah_kembali') DEFAULT 'belum_ditemukan',
  `verified`    tinyint(1)                                           DEFAULT 0,
  `created_at`  timestamp                                            NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `fk_laporan_user`     (`user_id`),
  KEY `fk_laporan_kategori` (`kategori_id`),
  CONSTRAINT `fk_laporan_user`     FOREIGN KEY (`user_id`)     REFERENCES `users`     (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_laporan_kategori` FOREIGN KEY (`kategori_id`) REFERENCES `kategori`  (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Contoh data laporan (sudah terverifikasi)
INSERT INTO `laporan` (`user_id`, `tipe`, `nama_barang`, `kategori_id`, `deskripsi`, `lokasi`, `tanggal`, `kontak`, `status`, `verified`) VALUES
(2, 'hilang',    'Dompet Kulit Hitam',  2, 'Isi: KTM, uang tunai, kartu ATM BRI', 'Kantin Pusat Lantai 1',    '2026-06-01', '082111222333', 'belum_ditemukan', 1),
(3, 'ditemukan', 'Charger Laptop ASUS', 1, 'Warna putih, kabel 1.5m',             'Lab Komputer Gedung B',    '2026-06-03', '085344556677', 'sedang_diproses',  1),
(2, 'hilang',    'Kunci Motor Honda',   3, 'Gantungan kunci warna merah',          'Parkiran Gedung Rektorat', '2026-06-04', '082111222333', 'belum_ditemukan', 1),
(3, 'ditemukan', 'KTM / Kartu Mahasiswa', 4, 'Atas nama mahasiswa Teknik',        'Perpustakaan Pusat',       '2026-06-05', '085344556677', 'sudah_kembali',   1);

COMMIT;
