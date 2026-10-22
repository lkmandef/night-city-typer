# Fase 5: Kamera dan Skala

Fase 5: kamera mengikuti dan optimasi kota panjang.

Tugas:
1. lib/city/camera.ts: kota mulai dari x sekitar 15% lebar layar. Jika cursorX di layar melewati 70% lebar, cameraTarget bergeser agar gedung terbaru berada di sekitar 60% layar. cameraX mengejar cameraTarget dengan lerp (sekitar 0.08 per frame, disesuaikan dt). Saat backspace, kamera mundur dengan cara yang sama.
2. Terapkan translasi kamera saat menggambar gedung dan pemisah (ctx.translate(-cameraX, 0)).
3. Culling: hanya gambar item yang terlihat di area kamera (dengan margin kecil).
4. Batasi jumlah item aktif maksimal 200. Item tertua yang melewati batas dipadatkan menjadi siluet sederhana tanpa jendela (tidak dihapus agar kota tetap menyambung).
5. Tangani resize: posisi tanah dan kamera dihitung ulang tanpa menghapus kota.
6. Skala dunia responsif. Hitung worldScale = clamp(lebarViewport / 1100, 0.6, 1) dan terapkan ke lebar, tinggi, dan ukuran jendela gedung serta pemisah (via ctx.scale atau pengali saat generate, pilih yang paling sederhana dan tetap deterministik). Pastikan di HP (lebar sekitar 390 px) minimal 8 sampai 10 gedung terlihat sebelum kamera bergeser, dan resize tidak menghapus kota.
7. Tes Vitest untuk fungsi kamera (target bergeser saat cursorX melewati ambang; tidak bergeser saat kota pendek).

Batasan: tidak menambah efek visual baru.

Selesai jika: mengetik 100+ karakter tetap lancar, kamera bergeser halus mengikuti gedung terbaru, dan mundur saat backspace.
