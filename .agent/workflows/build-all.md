---
description: Bangun seluruh project Night City Typer fase 0 sampai 10 dengan titik berhenti manual.
---

# build-all

1. Jalankan git log --oneline untuk melihat fase mana yang sudah selesai (cari commit yang menyebut "fase N"). Mulai dari fase pertama yang belum ada.
2. Jalankan workflow fase berikutnya satu per satu sesuai urutan di bawah. Setelah tiap fase selesai dan di-commit, lanjut ke fase berikutnya.
3. Jika sebuah fase gagal setelah 3 kali percobaan perbaikan, BERHENTI dan laporkan. Jangan melompati fase.
4. Di titik berhenti (ditandai CHECKPOINT) kamu WAJIB berhenti, tampilkan instruksi untuk saya, dan menunggu saya membalas "lanjut" sebelum meneruskan.

Urutan:

1. Jalankan /fase-0 (Persiapan).
2. CHECKPOINT: BERHENTI. Saya perlu: Push repo ke GitHub, lalu deploy ke Vercel (Add New, Project, impor repo, Deploy). Setelah live, balas 'lanjut'.
3. Jalankan /fase-1 (Fondasi Canvas).
4. Jalankan /fase-2 (Input Keyboard).
5. CHECKPOINT: BERHENTI. Saya perlu: Buka link Preview Vercel di HP dan uji ketik, spasi, backspace, serta keyboard layar. Balas 'lanjut' jika aman, atau jelaskan bug-nya.
6. Jalankan /fase-3 (Gedung (Tumbuh dan Jendela Menyala)).
7. Jalankan /fase-4 (Spasi dan Backspace).
8. CHECKPOINT: BERHENTI. Saya perlu: Cek rasa animasi tumbuh, menyala, dan runtuh di browser. Balas 'lanjut' jika sudah pas.
9. Jalankan /fase-5 (Kamera dan Skala).
10. Jalankan /fase-6 (Atmosfer).
11. CHECKPOINT: BERHENTI. Saya perlu: Cek tampilan keseluruhan dan FPS di laptop dan HP. Balas 'lanjut' jika sudah pas.
12. Jalankan /fase-7 (Polesan UI).
13. Jalankan /fase-8 (Performa dan Aksesibilitas).
14. Jalankan /fase-9 (Metadata dan Rilis).
15. CHECKPOINT: BERHENTI. Saya perlu: Ganti public/og.png dengan tangkapan layar asli (1200x630), push ke main, lalu uji link di WhatsApp/LinkedIn. Balas 'lanjut' jika sudah beres.
16. Jalankan /fase-10 (Bahan Portofolio).
