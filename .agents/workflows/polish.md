---
description: Iterasi visual. Buka app di browser, ambil screenshot desktop dan HP, nilai terhadap PRD, lalu sesuaikan tampilan.
---

# polish

Gunakan setelah fase yang mengubah tampilan (misalnya fase gedung, spasi dan backspace, atmosfer, polesan UI).

1. Baca bagian Konsep Desain di docs/PRD.md (palet, lapisan visual, kriteria tampilan) dan AGENTS.md.
2. Pastikan dev server berjalan (npm run dev). Jika belum, jalankan di background dan catat URL-nya.
3. Buka URL itu di browser. Jika kamu tidak punya kemampuan browser atau screenshot, BERHENTI dan beri tahu saya.
4. Jalankan skenario berikut dan ambil screenshot tiap skenario di dua ukuran, desktop 1440x900 dan HP 390x844:
   a. Keadaan kosong (petunjuk awal terlihat).
   b. Ketik "halo kota".
   c. Ketik "halo kota", spasi, lalu "malam".
   d. Dari kondisi (c), tekan backspace 3 kali dan tunggu animasi runtuh selesai.
   e. Ketik 60 karakter berturut-turut untuk menguji kamera dan kota panjang.
5. Nilai setiap screenshot terhadap PRD: kesesuaian palet, kontras antar lapisan, keterbacaan teks petunjuk, jendela menyala terlihat natural, tidak ada elemen terpotong atau bertumpuk, dan kota tidak keluar dari layar. Tulis daftar masalah berurutan dari yang paling penting (maksimal 5).
6. Perbaiki hanya masalah dalam daftar itu, dengan perubahan sekecil mungkin (konstanta, warna, ukuran, gaya render). Jangan mengubah logika di lib/city dan jangan menambah fitur baru.
7. Ulangi langkah 4 sampai 6 maksimal 2 putaran.
8. Simpan screenshot final di docs/screenshots/ (dipakai nanti untuk og.png dan portofolio).
9. Jalankan lint, test, dan build. Jika lolos, jalankan git add -A lalu git commit -m "style: polish visual" dengan ringkasan singkat perubahan.
10. Tulis ringkasan: masalah yang ditemukan, nilai yang diubah, dan hal yang masih perlu saya nilai sendiri.
