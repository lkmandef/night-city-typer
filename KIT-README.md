# Night City Typer: Kit Otomatisasi Antigravity

Isi kit ini siap ditaruh di root project (folder tempat package.json berada).

## Isi

| Path | Fungsi |
|---|---|
| `AGENTS.md` | Konteks project untuk agent |
| `.agent/rules/night-city-typer.md` | Versi Rule (selalu aktif) dari konteks yang sama |
| `.agent/workflows/fase-0.md` sampai `fase-10.md` | Satu workflow per fase |
| `.agent/workflows/build-all.md` | Menjalankan semua fase berurutan dengan titik berhenti manual |
| `.agent/workflows/status.md` | Cek progres dan langkah berikutnya |
| `.agent/workflows/review.md` | Review kode fase terakhir tanpa mengubah apa pun |
| `docs/PRD.md` | PRD, arsitektur, dan rencana lengkap |
| `docs/phases/fase-0.md` sampai `fase-10.md` | Prompt rinci tiap fase |

## Cara pasang

1. Buat folder project kosong (atau project Next.js yang sudah ada), lalu buka di Antigravity.
2. Salin semua isi kit ke root project, termasuk folder tersembunyi `.agent`.
3. Buka Customizations (menu "..." di panel agent). Pastikan Rule dan Workflow terbaca.
   - Jika versi Antigravity-mu memakai lokasi folder lain, buat Rule dan Workflow lewat panel itu, lalu tempel isi file yang bersangkutan.
4. Di panel agent, ketik `/build-all`.

- Jika create-next-app menolak membuat project karena folder tidak kosong, biarkan agent menanganinya di Fase 0 (membuat project di folder sementara lalu memindahkan isinya), atau jalankan create-next-app sendiri dulu, baru salin kit ke dalamnya.

## Cara pakai

- `/build-all`: jalan otomatis sampai CHECKPOINT. Di checkpoint agent berhenti dan menunggu kamu membalas `lanjut`.
- `/fase-N`: jalankan satu fase saja, misalnya `/fase-3`.
- `/status`: lihat sudah sampai mana.
- `/review`: minta review sebelum lanjut.

## Checkpoint manual

| Setelah fase | Yang kamu lakukan |
|---|---|
| 0 | Push ke GitHub dan deploy ke Vercel |
| 2 | Uji keyboard di HP lewat Preview Vercel |
| 4 | Cek rasa animasi tumbuh dan runtuh |
| 6 | Cek tampilan dan FPS di laptop dan HP |
| 9 | Ganti `public/og.png` dengan tangkapan layar asli, uji link di WhatsApp |

## Catatan

- Setiap fase di-commit otomatis hanya jika lint, test, dan build lolos.
- Jika sebuah fase gagal 3 kali, agent berhenti dan melapor.
- Agent biasanya meminta persetujuan sebelum menjalankan perintah terminal. Kamu bisa mengatur persetujuan otomatis di pengaturan Antigravity, tapi sebaiknya hanya untuk folder project ini.
- Kalau agent melenceng, perbaiki lewat prompt perbaikan di dokumen "Prompt Antigravity per Fase" (bank prompt di bagian akhir).
