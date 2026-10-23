# Night City Typer: Rencana & Log Fase Pengembangan

Dokumen pelacakan status dan detail per fase implementasi Night City Typer.

## Ringkasan Fase

| Fase | Nama Fase | Status | Fokus Utama |
| --- | --- | --- | --- |
| 0 | Persiapan Project | Selesai | Repo, Next.js App Router, Tailwind CSS, ESLint, Vitest, deploy Vercel |
| 1 | Fondasi Canvas | Selesai | Canvas responsif, DPR handling (maks 2), loop animasi rAF, gradien langit |
| 2 | Input Desktop & Mobile | Selesai | Event keyboard desktop & input tersembunyi mobile, integrasi iOS Safari |
| 3 | Gedung & Pertumbuhan | Selesai (Diperbarui) | Generator gedung deterministik (mulberry32), animasi naik, jendela menyala, **huruf terbaca pada fasad gedung (FR-15)** |
| 4 | Spasi dan Backspace | Selesai | Pemisah blok (jalan, sungai, taman), keruntuhan gedung bertingkat saat backspace |
| 5 | Kamera dan Skala | Selesai | Kamera mengikuti cursorX, worldScale responsif, culling viewport |
| 6 | Atmosfer Visual | Selesai | 140 bintang berkedip, bulan bergradien, 2-layer parallax skyline dengan offscreen canvas |
| 7 | Polesan UI | Siap Dikerjakan | Hint overlay, toolbar (simpan PNG, reset kota, mute toggle) |
| 8 | Performa & Aksesibilitas | Mendatang | Optimasi memori, culling agresif, prefers-reduced-motion, Lighthouse audit |
| 9 | Metadata & Rilis | Mendatang | SEO metadata, Open Graph preview image (1200x630), pengujian multi-platform |
| 10 | Bahan Portofolio | Mendatang | Dokumentasi teknis, rekaman demo, narasi studi kasus |

---

## Catatan Fitur Khusus: Huruf Terbaca di Fasad Gedung (FR-15)

- **Prioritas:** Must (Functional Requirement FR-15).
- **Konsep:** Setiap huruf/angka yang diketik ditampilkan secara terbaca lewat grid jendela menyala membentuk font piksel 5x7 pada fasad gedung.
- **Teknis:**
  - Font piksel 5x7 di `lib/city/glyphs.ts` (A-Z, 0-9, `.`, `,`, `!`, `?`, `-`).
  - Grid jendela minimal 5 kolom dan 9 baris untuk karakter ber-glyph.
  - Zona huruf 7 baris jendela di bagian atas gedung (margin 1 baris di bawah atap) dan 5 kolom di tengah.
  - Jendela pembentuk huruf menyala penuh dengan warna hangat seragam (`#ffd27a`), tidak padam acak.
  - Jendela lain di dalam zona huruf dipadamkan untuk kontras maksimal.
  - Animasi menyala bertahap (kiri ke kanan, jeda 20-40 ms per jendela) setelah gedung selesai tumbuh (`grow >= 1`).
  - Saat backspace, huruf padam seketika sebelum badan gedung runtuh.

---

## Catatan Fitur Khusus: Pemilih Warna Huruf (FR-17)

- **Prioritas:** Should (Functional Requirement FR-17).
- **Konsep:** Pengunjung dapat mengganti warna huruf pada fasad gedung melalui menu warna di toolbar.
- **Teknis:**
  - Preset warna di `lib/city/palette.ts`: putih (`#ffffff`), emas (`#ffd24a`), cyan (`#5ff3ff`), hijau (`#6dff9c`), pink (`#ff6fb5`), ungu (`#b58cff`), merah (`#ff5a5a`), oranye (`#ff9a3c`), serta mode dinamis `"rainbow"`.
  - Fungsi murni `getLetterColor(setting, indexGedung)` dan `getGlowColor(hex, alpha)`.
  - Persistensi di `localStorage` (`nct:letter-color`) dan parameter URL `?warna=<id>`.
  - Kontras hangat: jika hue 20°-55° (emas, oranye), kecerahan jendela non-huruf di zona huruf dikalikan 0.7 dan saturasi diturunkan 30%.
