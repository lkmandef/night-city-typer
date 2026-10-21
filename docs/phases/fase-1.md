# Fase 1: Fondasi Canvas

Fase 1: fondasi canvas dan langit malam.

Tugas:
1. Buat components/CityCanvas.tsx ("use client") berisi satu <canvas> yang memenuhi seluruh viewport.
2. Tangani devicePixelRatio (maks 2): ukuran buffer canvas = ukuran CSS x DPR, lalu ctx.scale(DPR, DPR).
3. Tangani resize jendela dengan ResizeObserver atau event resize, tanpa membuat canvas buram atau melebar.
4. Buat game loop dengan requestAnimationFrame. Hitung dt (milidetik) dan batasi maksimal 50 ms agar tidak melompat saat tab tidak aktif.
5. Buat lib/render/sky.ts dengan fungsi drawSky(ctx, width, height) yang menggambar gradien vertikal: #050816 (atas), #1b1140 (tengah), lalu semburat oranye tipis #ff7a59 di dekat horizon dengan opacity rendah.
6. Buat garis tanah di sekitar 85% tinggi layar (warna gelap #0b0f1e) sebagai dasar gedung nanti.
7. Render CityCanvas dari app/page.tsx.
8. Bersihkan loop dan listener saat unmount.

Batasan: belum ada gedung, bintang, atau input.

Selesai jika: langit gradien tampil tajam di layar retina, tetap rapi saat jendela di-resize, dan tidak ada warning di console.
