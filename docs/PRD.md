# Night City Typer: PRD, Arsitektur, dan Workflow

Dokumen perencanaan lengkap · Next.js + Canvas · Deploy di Vercel

## 1. Ringkasan Produk

**Night City Typer** adalah web interaktif berbasis seni generatif. Pengunjung mengetik di keyboard, dan setiap huruf yang diketik menumbuhkan satu gedung di panorama kota malam. Jendela-jendela gedung menyala satu per satu, langit berbintang, dan kota terasa hidup.

| Input | Hasil |
| --- | --- |
| Huruf / angka | Gedung baru tumbuh dari tanah, jendelanya menyala bertahap |
| Spasi | Jeda: muncul jalan, sungai, atau taman kecil yang memisahkan blok kota |
| Backspace | Lampu gedung terakhir padam satu per satu, lalu gedung runtuh pelan |
| Enter (opsional) | Siklus waktu: malam → dini hari → fajar |

**Tujuan utama:** menjadi project portofolio yang langsung memberi kesan "wow" dalam 5 detik pertama, ringan, tanpa backend, dan mudah dibagikan lewat satu link.

**Catatan orisinalitas:** mekanik interaksi terinspirasi dari Type Garden. Semua aset, algoritma, palet warna, dan kode ditulis sendiri. Cantumkan atribusi inspirasi di halaman portofolio.

## 2. PRD (Product Requirements Document)

### 2.1 Latar Belakang dan Masalah

Portofolio developer sering berisi project yang mirip (to-do list, e-commerce, dashboard). Dibutuhkan satu project yang unik secara visual, menunjukkan kemampuan teknis (canvas, animasi, algoritma, performa), dan menarik dibagikan.

### 2.2 Tujuan (Goals)

- G1: Pengunjung memahami cara pakai tanpa instruksi panjang (maksimal 1 baris petunjuk).
- G2: Animasi halus, target 60 fps di laptop dan 30 fps atau lebih di HP kelas menengah.
- G3: Berjalan baik di desktop dan mobile (termasuk keyboard layar).
- G4: Pratinjau link (Open Graph) menarik saat dibagikan di WhatsApp, LinkedIn, dan X.
- G5: Deploy otomatis di Vercel setiap `git push`.

### 2.3 Non-Goals (di luar cakupan versi 1)

- Akun pengguna, login, atau database.
- Mode multiplayer.
- Penyimpanan kota di server.
- Editor kota manual (drag gedung).

### 2.4 Target Pengguna

| Persona | Kebutuhan |
| --- | --- |
| Recruiter / HRD | Melihat kualitas visual dan teknis dalam waktu singkat |
| Sesama developer | Melihat kode rapi dan teknik canvas yang menarik |
| Pengunjung umum | Hiburan singkat yang memuaskan dan layak dibagikan |

### 2.5 User Stories

1. Sebagai pengunjung, saya ingin mengetik kata dan melihat kota tumbuh agar merasa terhubung dengan karya.
2. Sebagai pengunjung HP, saya ingin keyboard muncul otomatis saat menyentuh layar agar bisa mengetik tanpa bingung.
3. Sebagai pengunjung, saya ingin menghapus huruf dan melihat gedung runtuh agar interaksinya terasa lengkap.
4. Sebagai pengunjung, saya ingin menyimpan kota saya sebagai gambar agar bisa dibagikan.
5. Sebagai pemilik portofolio, saya ingin pratinjau link yang bagus agar project menonjol saat dibagikan.

### 2.6 Functional Requirements

| ID | Kebutuhan | Prioritas |
| --- | --- | --- |
| FR-01 | Canvas memenuhi layar, tajam di layar retina (devicePixelRatio) | Must |
| FR-02 | Tiap karakter (huruf/angka) menumbuhkan satu gedung dengan animasi naik | Must |
| FR-03 | Jendela gedung menyala bertahap dengan warna hangat acak | Must |
| FR-04 | Spasi menyisipkan pemisah (jalan, sungai, taman) | Must |
| FR-05 | Backspace memadamkan lampu lalu meruntuhkan gedung terakhir | Must |
| FR-06 | Langit malam: gradien, bintang berkedip, bulan | Must |
| FR-07 | Kamera bergeser otomatis mengikuti gedung terbaru saat kota melebar melebihi layar | Must |
| FR-08 | Teks petunjuk awal yang hilang setelah ketikan pertama | Must |
| FR-09 | Dukungan keyboard layar di mobile lewat input tersembunyi | Must |
| FR-10 | Tombol simpan sebagai PNG | Should |
| FR-11 | Siklus waktu malam → fajar lewat Enter | Should |
| FR-12 | Efek tambahan: kendaraan lewat, kereta, kembang api saat kata selesai | Could |
| FR-13 | Suara ambient dan bunyi ketik halus (bisa dimatikan) | Could |
| FR-14 | Dukungan prefers-reduced-motion | Should |

### 2.7 Non-Functional Requirements

- **Performa:** First Contentful Paint di bawah 1,5 detik di jaringan 4G. Bundle JS awal di bawah 150 KB gzip.
- **Kompatibilitas:** Chrome, Safari, Firefox, Edge versi 2 tahun terakhir. iOS Safari dan Android Chrome.
- **Aksesibilitas:** Ada teks alternatif untuk canvas, kontras teks petunjuk memadai, hormati reduced motion.
- **Keamanan/Privasi:** Tanpa pengumpulan data pribadi. Analytics (jika dipasang) bersifat anonim.
- **Maintainability:** TypeScript strict, komponen terpisah, logika kota terpisah dari rendering.

### 2.8 Metrik Keberhasilan

| Metrik | Target |
| --- | --- |
| Skor Lighthouse Performance | 90 atau lebih |
| Waktu sampai ketikan pertama | di bawah 5 detik |
| Rata-rata panjang sesi | 30 detik atau lebih |
| Jumlah klik dari portofolio | dipantau lewat Vercel Analytics |

### 2.9 Acceptance Criteria (inti)

- Mengetik 20 karakter berurutan menghasilkan 20 gedung tanpa patah frame yang terlihat.
- Menekan backspace pada kota kosong tidak menimbulkan error.
- Resize jendela tidak merusak tampilan atau menghapus kota.
- Di HP, menyentuh layar memunculkan keyboard dan karakter yang diketik tampil sebagai gedung.
- Link yang dibagikan menampilkan gambar pratinjau dan judul yang benar.

## 3. Konsep Desain

### 3.1 Lapisan Visual (dari belakang ke depan)

| Layer | Isi | Perilaku |
| --- | --- | --- |
| 1. Langit | Gradien biru tua → ungu → oranye tipis di horizon | Berubah warna saat siklus waktu |
| 2. Bintang | Titik kecil acak | Berkedip pelan |
| 3. Bulan | Lingkaran bercahaya | Bergerak sangat lambat |
| 4. Gedung latar | Siluet gelap, kabur, tinggi acak | Parallax lambat |
| 5. Gedung utama | Gedung dari huruf yang diketik | Tumbuh, menyala, runtuh |
| 6. Jalan / sungai | Pemisah dari spasi, ada pantulan lampu | Statis, sedikit gelombang |
| 7. Partikel | Kunang-kunang, asap, kendaraan | Opsional |

### 3.2 Pemetaan Karakter ke Gedung

| Jenis karakter | Tipe gedung |
| --- | --- |
| Vokal (a, i, u, e, o) | Menara tinggi dengan antena dan lampu merah berkedip |
| Konsonan | Gedung kotak dengan tinggi sedang, variasi lebar |
| Angka | Rumah/ruko pendek dengan atap |
| Tanda baca | Lampu jalan atau pohon kecil |
| Huruf kapital | Gedung 1,3x lebih tinggi dengan penanda atap |

Bentuk akhir ditentukan oleh **seed** dari kombinasi karakter dan urutannya, sehingga kata yang sama selalu menghasilkan kota yang sama. Ini membuat hasilnya bisa dibagikan dan mudah diuji.

### 3.3 Palet Warna (contoh)

| Peran | Warna |
| --- | --- |
| Langit atas | `#050816` |
| Langit bawah | `#1b1140` |
| Horizon | `#ff7a59` (tipis) |
| Gedung | `#0b0f1e` sampai `#161b33` |
| Jendela hangat | `#ffd27a`, `#ffb454` |
| Jendela dingin | `#7fd6ff` |
| Aksen lampu merah | `#ff4d6d` |

Batasi warna agar kesan sinematik. Hindari terlalu banyak warna jenuh.

### 3.4 Tipografi

- Judul / petunjuk: font serif elegan (Playfair Display atau Cormorant Garamond) lewat `next/font/google`.
- Teks kecil/UI: font sans ringan (Inter atau Geist).

## 4. Arsitektur Sistem

### 4.1 Gambaran Umum

Aplikasi sepenuhnya **client-side** untuk logika dan rendering. Next.js hanya menyajikan halaman, metadata, dan aset statis. Tidak ada backend atau database.

```
┌─────────────────────── Browser ───────────────────────┐
│                                                        │
│  Input Layer ──► City State ──► Render Loop ──► Canvas │
│  (keyboard,       (reducer,     (rAF, layers)          │
│   hidden input)    seed RNG)                           │
│        ▲                │                              │
│        └── UI Overlay (petunjuk, tombol simpan)        │
└────────────────────────────────────────────────────────┘
                ▲
                │ static HTML/JS/OG image
┌───────────────┴──────────── Vercel ───────────────────┐
│  Next.js (App Router) · CDN Edge · Auto deploy (Git)   │
└────────────────────────────────────────────────────────┘
```

### 4.2 Tech Stack

| Kebutuhan | Pilihan | Alasan |
| --- | --- | --- |
| Framework | Next.js (App Router) + TypeScript | Sesuai target hosting di Vercel |
| Styling UI | Tailwind CSS | Cepat untuk overlay dan tombol |
| Rendering | HTML Canvas 2D | Ringan, cukup untuk 2D, tanpa dependensi berat |
| Animasi UI | Framer Motion (opsional) | Hanya untuk overlay, bukan canvas |
| State | `useReducer` + ref | Sederhana, tanpa library tambahan |
| Font | `next/font` | Optimal dan tanpa layout shift |
| Analytics | Vercel Analytics (opsional) | Satu baris pasang |
| Testing | Vitest (logika), Playwright (e2e opsional) | Logika murni mudah diuji |
| Lint/format | ESLint + Prettier | Kode konsisten |

Alternatif jika ingin efek lebih kaya: PixiJS (WebGL) untuk partikel dan glow. Untuk versi 1, Canvas 2D sudah cukup.

### 4.3 Struktur Folder

```
night-city-typer/
├─ app/
│  ├─ layout.tsx          # font, metadata, OG
│  ├─ page.tsx            # memuat <CityCanvas />
│  └─ globals.css
├─ components/
│  ├─ CityCanvas.tsx      # "use client": canvas, loop, input
│  ├─ HintOverlay.tsx     # petunjuk awal
│  ├─ Toolbar.tsx         # simpan PNG, mute, reset
│  └─ HiddenInput.tsx     # fokus keyboard mobile
├─ lib/
│  ├─ city/
│  │  ├─ types.ts         # tipe data
│  │  ├─ rng.ts           # seeded random
│  │  ├─ buildings.ts     # generator gedung dari karakter
│  │  ├─ reducer.ts       # aksi: tambah, spasi, hapus
│  │  └─ camera.ts        # pergeseran kamera
│  ├─ render/
│  │  ├─ sky.ts
│  │  ├─ stars.ts
│  │  ├─ drawBuilding.ts
│  │  ├─ separators.ts    # jalan/sungai/taman
│  │  └─ pipeline.ts      # urutan layer
│  └─ utils/
│     ├─ easing.ts
│     └─ colors.ts
├─ public/
│  └─ og.png              # 1200x630
├─ tests/
│  ├─ buildings.test.ts
│  └─ reducer.test.ts
└─ package.json
```

Prinsip: **logika kota (`lib/city`) tidak boleh mengimpor apa pun dari canvas atau React**, agar mudah diuji dan diganti.

### 4.4 Model Data

```ts
type BuildingKind = 'tower' | 'block' | 'house' | 'lamp';

interface Building {
  id: number;
  char: string;
  kind: BuildingKind;
  x: number;            // posisi dasar di dunia (px)
  width: number;
  height: number;       // tinggi target
  grow: number;         // 0..1 progres tumbuh
  windows: Window[];    // grid jendela
  state: 'growing' | 'alive' | 'collapsing';
  collapse: number;     // 0..1 progres runtuh
}

interface Window {
  col: number;
  row: number;
  lit: boolean;
  litAt: number;        // waktu mulai menyala (ms)
  hue: 'warm' | 'cool';
}

interface Separator {
  id: number;
  x: number;
  width: number;
  kind: 'road' | 'river' | 'park';
  progress: number;     // animasi muncul
}

interface CityState {
  items: (Building | Separator)[];
  cursorX: number;      // posisi pembangunan berikutnya
  cameraX: number;
  cameraTarget: number;
  timeOfDay: number;    // 0 malam .. 1 fajar
  seed: number;
}
```

### 4.5 Aksi (Reducer)

| Aksi | Efek |
| --- | --- |
| `TYPE_CHAR(c)` | Hitung bangunan dari `c` dan seed, tambahkan di `cursorX`, geser `cursorX` |
| `SPACE` | Tambah `Separator`, geser `cursorX` |
| `BACKSPACE` | Tandai item terakhir `collapsing`, setelah selesai hapus dan mundurkan `cursorX` |
| `ENTER` | Maju ke fase waktu berikutnya |
| `RESET` | Kosongkan kota |
| `RESIZE` | Perbarui dimensi dan posisi tanah |

### 4.6 Algoritma Generate Gedung

```ts
// rng.ts: generator acak deterministik
export function mulberry32(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// buildings.ts (ringkas)
export function makeBuilding(c: string, index: number, x: number, worldSeed: number): Building {
  const rand = mulberry32(worldSeed + c.charCodeAt(0) * 131 + index * 977);
  const kind = pickKind(c);               // vokal/konsonan/angka/tanda baca
  const width = 36 + rand() * 40;
  const base = kind === 'tower' ? 220 : kind === 'block' ? 140 : 70;
  const height = base * (0.7 + rand() * 0.7) * (isUpper(c) ? 1.3 : 1);
  const cols = Math.max(2, Math.floor(width / 14));
  const rows = Math.max(3, Math.floor(height / 18));
  const windows = buildWindowGrid(cols, rows, rand);
  return { id: index, char: c, kind, x, width, height, grow: 0, windows, state: 'growing', collapse: 0 };
}
```

Langkah penting:

1. Seed dunia dibuat sekali saat halaman dimuat, atau dari kata yang diketik jika ingin hasil bisa direproduksi.
2. Setiap karakter memakai RNG sendiri agar hasil stabil walau urutan render berubah.
3. Grid jendela dibuat sekali dan hanya properti `lit` yang berubah selama animasi.

### 4.7 Animasi Tumbuh, Menyala, dan Runtuh

- **Tumbuh:** `grow` naik dari 0 ke 1 dengan easing `easeOutCubic` selama sekitar 600 ms. Tinggi tampil = `height * grow`.
- **Menyala:** setelah `grow` melewati 0,6, jendela dinyalakan acak dengan jeda 30 sampai 120 ms per jendela. Sebagian kecil jendela dibiarkan padam agar natural.
- **Runtuh:** saat backspace, jendela padam berurutan dari atas ke bawah, lalu `collapse` naik ke 1 dengan tinggi berkurang dan sedikit goyangan horizontal, ditambah partikel debu kecil.
- **Pemisah:** jalan menggeser garis dan lampu kecil, sungai menampilkan gelombang tipis dengan pantulan lampu gedung sebelah.

### 4.8 Kamera

- Kota tumbuh ke kanan dari titik awal sekitar 15% lebar layar.
- Jika `cursorX` melewati 70% lebar layar, `cameraTarget` bergeser agar gedung terbaru berada di sekitar 60% layar.
- `cameraX` mengejar `cameraTarget` dengan interpolasi (lerp 0,08 per frame) agar halus.
- Saat backspace, kamera mundur dengan cara yang sama.

### 4.9 Input Layer

Desktop: dengarkan `keydown` di `window`.

```ts
function onKeyDown(e: KeyboardEvent) {
  if (e.metaKey || e.ctrlKey || e.altKey) return;   // jangan ganggu shortcut
  if (e.key === 'Backspace') dispatch({ type: 'BACKSPACE' });
  else if (e.key === ' ') { e.preventDefault(); dispatch({ type: 'SPACE' }); }
  else if (e.key === 'Enter') dispatch({ type: 'ENTER' });
  else if (e.key.length === 1) dispatch({ type: 'TYPE_CHAR', char: e.key });
}
```

Mobile: keyboard layar tidak mengirim `keydown` yang andal, jadi gunakan `<input>` tersembunyi yang selalu fokus dan baca event `input` serta `beforeinput`.

- Saat sentuh layar, panggil `inputRef.current.focus()`.
- Pakai `beforeinput` dengan `inputType === 'deleteContentBackward'` untuk backspace.
- Tambahkan `interactive-widget=resizes-content` pada meta viewport agar canvas menyesuaikan saat keyboard muncul.
- Atur `autocapitalize="off"`, `autocorrect="off"`, `spellcheck="false"`.

### 4.10 Render Loop

```ts
let last = performance.now();
function frame(now: number) {
  const dt = Math.min(50, now - last);   // batasi lonjakan
  last = now;
  update(state, dt);                     // tumbuh, menyala, kamera
  render(ctx, state);                    // urutan layer
  raf = requestAnimationFrame(frame);
}
```

Catatan penting:

- State animasi disimpan di **ref**, bukan state React, agar tidak memicu re-render 60 kali per detik.
- Hanya overlay UI yang memakai state React.
- Bersihkan `requestAnimationFrame` dan listener saat komponen di-unmount.
- Tangani `devicePixelRatio`: ukuran canvas = ukuran CSS x DPR, lalu `ctx.scale(DPR, DPR)`.

### 4.11 Strategi Performa

| Teknik | Manfaat |
| --- | --- |
| Gambar langit dan gedung latar ke **offscreen canvas** sekali, lalu salin tiap frame | Mengurangi pekerjaan per frame |
| Hanya gambar gedung yang terlihat di area kamera (culling) | Kota panjang tetap ringan |
| Batasi jumlah gedung (misalnya 200), yang tertua dipadatkan jadi siluet | Mencegah memori membengkak |
| Kelompokkan jendela dengan warna sama dalam satu path sebelum `fill()` | Mengurangi panggilan gambar |
| Batasi DPR maksimal 2 di perangkat berat | Menghindari lag di layar sangat padat |
| Kurangi partikel jika FPS turun di bawah ambang | Adaptif di HP lemah |
| Hormati `prefers-reduced-motion` | Aksesibilitas |

## 5. Metadata, SEO, dan Pratinjau

- Isi `metadata` di `app/layout.tsx`: `title`, `description`, `openGraph`, `twitter` (kartu `summary_large_image`).
- Buat `public/og.png` ukuran 1200x630 dari tangkapan layar kota yang sudah jadi.
- Deskripsi contoh: "Ketik, dan kota malam tumbuh dari hurufmu. Spasi membuat jalan, backspace memadamkan lampu."
- Atur `theme-color` ke warna langit gelap.
- Tambahkan `<noscript>` berisi penjelasan singkat dan `aria-label` pada canvas.

## 6. Workflow Pengembangan

### 6.1 Git dan Branching

- Branch `main`: selalu bisa di-deploy.
- Branch fitur: `feat/canvas-setup`, `feat/building-generator`, `feat/input-mobile`, dan seterusnya.
- Pull request ke `main` otomatis dibuatkan **Preview Deployment** oleh Vercel, jadi bisa dites di HP lewat link preview.
- Commit mengikuti pola: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`.

### 6.2 Rencana Per Fase

| Fase | Durasi | Hasil | Selesai jika |
| --- | --- | --- | --- |
| 0. Persiapan | 0,5 hari | Repo, Next.js, Tailwind, ESLint, deploy kosong ke Vercel | Halaman kosong live di Vercel |
| 1. Fondasi canvas | 1 hari | Canvas full screen, DPR, resize, loop, langit gradien | Langit tampil tajam dan responsif |
| 2. Input | 0,5 hari | Keyboard desktop, input tersembunyi mobile | Console mencatat karakter, spasi, backspace di desktop dan HP |
| 3. Gedung | 2 hari | Generator gedung, animasi tumbuh, jendela menyala | Mengetik menumbuhkan gedung berjendela |
| 4. Spasi dan backspace | 1 hari | Pemisah, animasi runtuh | Ketiga aksi inti berfungsi |
| 5. Kamera dan skala | 0,5 hari | Kamera mengikuti, culling | Kota panjang tetap lancar |
| 6. Atmosfer | 1,5 hari | Bintang, bulan, parallax, gedung latar, pantulan sungai | Tampilan sinematik |
| 7. Polesan UI | 1 hari | Petunjuk awal, tombol simpan PNG, reset, mute | UX lengkap |
| 8. Performa dan aksesibilitas | 1 hari | Offscreen canvas, reduced motion, uji HP | Lighthouse 90 atau lebih |
| 9. Metadata dan rilis | 0,5 hari | OG image, SEO, domain, analytics | Link tampil bagus saat dibagikan |
| 10. Portofolio | 0,5 hari | Kartu project, GIF/video, studi kasus singkat | Project terpasang di porto web |

Total sekitar 10 hari kerja santai. Bisa dipadatkan menjadi 5 sampai 6 hari jika fokus pada fase 0 sampai 4, 7, dan 9.

### 6.3 Urutan Setup Awal (Perintah)

```bash
npx create-next-app@latest night-city-typer --typescript --tailwind --app --eslint
cd night-city-typer
npm i -D vitest
git init && git add . && git commit -m "chore: init project"
# buat repo di GitHub, lalu:
git remote add origin <url-repo>
git push -u origin main
```

### 6.4 Prinsip Kerja

1. Bangun **prototipe paling sederhana dulu**: kotak berwarna naik saat mengetik. Baru percantik.
2. Uji di HP sejak fase 2, bukan di akhir.
3. Pisahkan logika dari render agar bisa diuji tanpa browser.
4. Tangkap layar dan rekam video tiap fase besar untuk bahan studi kasus portofolio.

## 7. Strategi Pengujian

| Jenis | Cakupan | Alat |
| --- | --- | --- |
| Unit | Generator gedung deterministik (karakter sama + seed sama = hasil sama), reducer (tambah, spasi, hapus, hapus saat kosong) | Vitest |
| Visual manual | Tampilan di laptop, tablet, HP, layar sangat lebar | Browser + Preview Deployment |
| Performa | FPS saat 100 sampai 200 gedung, memori | Chrome DevTools Performance |
| Lintas browser | Safari iOS, Chrome Android, Firefox | Perangkat nyata atau BrowserStack |
| E2E (opsional) | Ketik kata, cek jumlah gedung | Playwright |

Daftar kasus tepi: menahan tombol backspace, mengetik sangat cepat, paste teks panjang, rotasi layar, mengubah ukuran jendela saat animasi, tab di latar belakang lalu kembali (jangan melompatkan animasi).

## 8. Deployment di Vercel

1. Push kode ke GitHub.
2. Buka vercel.com, login dengan GitHub, pilih **Add New → Project**, impor repo.
3. Biarkan preset Next.js terdeteksi otomatis, klik **Deploy**.
4. Setiap push ke `main` menjadi deploy produksi, setiap pull request menjadi preview.
5. Ubah nama subdomain di **Settings → Domains** (misalnya `night-city-typer.vercel.app`) atau sambungkan domain sendiri.
6. Aktifkan **Vercel Analytics** jika ingin melihat jumlah kunjungan.
7. Setelah live, uji link di WhatsApp dan LinkedIn untuk memastikan pratinjau OG muncul. Jika masih memakai versi lama, gunakan alat debug sharing platform untuk menyegarkan cache.

Karena tidak ada backend, tidak perlu environment variable atau database.

## 9. Risiko dan Mitigasi

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Keyboard mobile tidak mengirim event yang diharapkan | Fitur inti gagal di HP | Pakai input tersembunyi + `beforeinput`, uji sejak fase 2 |
| Lag di HP lama | Pengalaman buruk | Culling, offscreen canvas, kurangi partikel adaptif |
| Terlalu mirip karya inspirasi | Kesan menjiplak | Tema, visual, dan algoritma milik sendiri, cantumkan atribusi |
| Layar sangat lebar memperlihatkan area kosong | Tampilan kurang rapi | Skala dunia mengikuti tinggi layar, gedung latar mengisi sisi kosong |
| Canvas buram di layar retina | Kesan murahan | Skala DPR dengan benar |
| Memori membengkak pada sesi panjang | Crash | Batasi jumlah gedung dan padatkan yang lama |

## 10. Checklist Rilis

- [ ] Ketik, spasi, backspace berfungsi di desktop
- [ ] Ketik, spasi, backspace berfungsi di iOS Safari dan Android Chrome
- [ ] Resize dan rotasi layar aman
- [ ] FPS stabil dengan 100 gedung atau lebih
- [ ] Tombol simpan PNG menghasilkan gambar benar
- [ ] Reduced motion dihormati
- [ ] `og.png`, judul, dan deskripsi terpasang
- [ ] Lighthouse Performance 90 atau lebih
- [ ] README berisi deskripsi, tangkapan layar, cara menjalankan
- [ ] Link live dan repo siap dipasang di portofolio

## 11. Bahan untuk Portofolio

**Kartu project:** judul, satu kalimat konsep, GIF atau video 5 sampai 10 detik saat mengetik, tombol "Lihat Live" dan "Kode".

**Studi kasus singkat (3 paragraf):**

1. *Konsep:* mengubah ketikan menjadi kota malam yang hidup, terinspirasi dari Type Garden.
2. *Tantangan teknis:* rendering canvas yang tajam dan ringan, input keyboard mobile, generator prosedural yang deterministik, animasi runtuh dan menyala.
3. *Hasil:* berjalan 60 fps di desktop, tanpa backend, deploy otomatis di Vercel, skor Lighthouse tinggi.

**Poin teknis yang bisa disorot:** seeded RNG, pemisahan logika dan render, offscreen canvas, culling, penanganan DPR, dukungan mobile dan aksesibilitas.

## 12. Backlog Pengembangan Lanjutan

- Bagikan kota lewat URL: seed dan kata diset sebagai query (`?w=halo-dunia`).
- Mode siang-malam otomatis mengikuti jam perangkat.
- Cuaca: hujan dengan pantulan lampu, kabut, petir jauh.
- Landmark lokal: huruf tertentu atau kata kunci memunculkan ikon kota (misalnya Jembatan Ampera untuk kata "palembang").
- Rekam sebagai video pendek (MediaRecorder dari canvas).
- Tema alternatif yang bisa diganti: kota cyberpunk, kota pesisir, kota di atas awan.
- Suara ambient kota malam dengan Web Audio API.

## 13. Langkah Berikutnya

1. Jalankan **Fase 0** (setup repo + deploy kosong ke Vercel).
2. Bangun **prototipe kotak naik** di Fase 1 sampai 3.
3. Minta kode awal `CityCanvas.tsx`, `reducer.ts`, dan `buildings.ts` jika ingin dipercepat.
