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

## Catatan Fitur Khusus: Karakter Berjalan di Depan Gedung (FR-16)

- **Prioritas:** Should (Functional Requirement FR-16).
- **Konsep:** Setiap kelompok 4 sampai 7 gedung bersebelahan memiliki satu karakter (manusia atau kucing) yang berjalan bolak-balik di tanah di depannya dan tidak keluar dari rentang kelompok itu.
- **Teknis:**
  - `computeGroups(items)` di `lib/city/groups.ts`: mengelompokkan rangkaian gedung tanpa pemisah (panjang 4-7 jadi 1 kelompok, >7 dipecah per 5 dengan sisa <4 digabung).
  - `updateWalkers(walkers, groups, dt, worldSeed, reducedMotion)` di `lib/city/walkers.ts`: spawn 50% kucing, 50% manusia; mesin keadaan (enter, walk, pause, sit, exit); batasan bounds `[minX, maxX]`; adaptif saat kelompok bertambah/menyusut/runtuh.
  - Sprite pixel-art di `lib/render/sprites.ts`: manusia (~5x9 px) dan kucing (~9x6 px) dirender ke offscreen canvas dan dicerminkan horizontal untuk arah gerak.
  - Render di `lib/render/walkers.ts`: di area tanah (di bawah baseline), elips bayangan kaki, dan gradien tipis cahaya jendela podium.

---

## Catatan Fitur Khusus: Pemilih Warna Huruf (FR-17)

- **Prioritas:** Should (Functional Requirement FR-17).
- **Konsep:** Pengunjung dapat mengganti warna huruf pada fasad gedung melalui menu warna di toolbar.
- **Teknis:**
  - Preset warna di `lib/city/palette.ts`: putih (`#ffffff`), emas (`#ffd24a`), cyan (`#5ff3ff`), hijau (`#6dff9c`), pink (`#ff6fb5`), ungu (`#b58cff`), merah (`#ff5a5a`), oranye (`#ff9a3c`), serta mode dinamis `"rainbow"`.
  - Fungsi murni `getLetterColor(setting, indexGedung)` dan `getGlowColor(hex, alpha)`.
  - Persistensi di `localStorage` (`nct:letter-color`) dan parameter URL `?warna=<id>`.
  - Kontras hangat: jika hue 20°-55° (emas, oranye), kecerahan jendela non-huruf di zona huruf dikalikan 0.7 dan saturasi diturunkan 30%.

---

## Catatan Fitur Khusus: Teks Ketikan Selalu Terlihat (FR-18)

- **Prioritas:** Must (Functional Requirement FR-18).
- **Konsep:** Pengunjung dapat membaca teks yang sedang mereka ketik meskipun kalimat sangat panjang dan gedung-gedung awal sudah tergeser keluar dari layar oleh kamera.
- **Teknis:**
  - Fungsi murni `buildTypedText(items)` di `lib/city/text.ts` menggabungkan karakter aktif gedung berglyph dan spasi dari pemisah (tanpa ghost).
  - Fungsi murni `tailText(text, max)` menampilkan akhiran teks dengan awalan "…" jika melebihi panjang maksimum.
  - Komponen `components/TypedTextOverlay.tsx` berupa pil kaca semi-transparan di tengah bawah layar (font serif Playfair, safe-area aware, debounced sr-only live region 500 ms, kursor berkedip menghormati reduced-motion).

---

## Catatan Fitur Khusus: Mode Ringkasan Seluruh Kota (FR-19)

- **Prioritas:** Should (Functional Requirement FR-19).
- **Konsep:** Pengunjung dapat melihat seluruh panorama kota dari awal sampai akhir tanpa terpotong batas viewport.
- **Teknis:**
  - Tombol "Lihat semua" di Toolbar dengan `preventDefault` pada pointerdown agar tidak merebut fokus keyboard.
  - Perhitungan zoom `zoomFactor = clamp(0.9 * lebarViewport / lebarTotalKota, 0.2, 1.0)` di `lib/city/text.ts`.
  - Kamera berpusat di titik tengah rentang gedung kota (`cityCenterX - worldScreenWidth / 2`).
  - Transisi zoom halus ~400 ms (`1 - Math.exp(-dt / 80)`).
  - Mengetik huruf baru, spasi, backspace, atau reset otomatis mengembalikan tampilan ke mode fokus gedung terbaru.

---

## Catatan Fitur Khusus: Tanah Hidup, Trotoar, Pantulan, dan Perabot Jalan (FR-20)

- **Prioritas:** Should (Functional Requirement FR-20).
- **Konsep:** Tanah kota tidak flat: memiliki kabut tipis di horizon, trotoar dengan pola paving dan curb, jalan dengan garis tengah putus-putus, kolam cahaya dan pantulan aspal basah di bawah tiap gedung, perabot jalan (lampu, pohon, bangku, mobil), serta karakter yang berjalan di 3 lajur trotoar dengan depth scaling dan gerak ekspresif.
- **Teknis:**
  - `lib/city/ground.ts`: fungsi murni `computeAdaptiveGround(viewportHeight, worldScale)` (menonaktifkan perabot & pantulan jika groundHeight < 60 CSS px), `getWalkerLaneY(laneIndex)` (3 lajur dalam trotoar), `getWalkerDepthScale(laneIndex)` (0.90 .. 1.15), dan `getBuildingFurniture(building, worldSeed)` (lampu 35%, pohon 20%, bangku 10%, mobil 10%, kosong 25%).
  - `lib/render/ground.ts`: `drawGround` (kabut horizon 16 px, pola paving trotoar 28 px via `createPattern`, garis curb 1 px, gradien aspal jalan dan garis tengah putus-putus 36 px bergeser mengikuti cameraX), serta `drawReflectionsAndPools` (satu gradien per gedung, kolam trotoar POOL_ALPHA dan pantulan jalan basah REFLECTION_ALPHA + pantulan warna huruf 0.08).
  - `lib/render/furniture.ts`: sprite offscreen Path2D yang di-cache (lampu jalan dengan glow & kolam cahaya, pohon pot, bangku kayu, siluet mobil parkir dengan lampu belakang merah).
  - `lib/city/walkers.ts` & `lib/render/walkers.ts`: 3 lajur trotoar, akselerasi/deselerasi ~0.3s, step bobbing 1 px, kibasan ekor kucing `idle_wag`, tolehan manusia saat jeda, bayangan tegas, dan rim light. Menghormati `prefers-reduced-motion`.


