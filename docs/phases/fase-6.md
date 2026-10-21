# Fase 6: Atmosfer

Fase 6: atmosfer visual (bintang, bulan, parallax, pantulan).

Tugas:
1. lib/render/stars.ts: 80 sampai 150 bintang acak (deterministik dari seed) di langit atas dengan ukuran 0.5 sampai 1.8 px, berkedip pelan (opacity berosilasi dengan fase berbeda). Sebagian kecil bintang sedikit lebih terang.
2. Bulan: lingkaran dengan glow lembut (radial gradient) di sudut kanan atas, bergerak sangat lambat.
3. Gedung latar: dua lapis siluet gedung gelap dan kabur di belakang gedung utama (warna sedikit lebih terang dari langit bawah, opacity 0.5 dan 0.8), dengan parallax: bergeser 0.2x dan 0.4x kecepatan kamera. Beberapa jendela redup acak.
4. Optimasi: gambar langit gradien dan gedung latar ke offscreen canvas sekali (dan ulangi hanya saat resize), lalu salin ke canvas utama tiap frame.
5. Sungai: pantulan lampu gedung sebelahnya dengan efek riak tipis (offset sinus kecil).
6. Buat lib/render/pipeline.ts yang mengatur urutan layer: langit, bintang, bulan, gedung latar, gedung utama dan pemisah, partikel.
7. Opsional jika performa aman: kunang-kunang kecil melayang di dekat taman.

Batasan: palet tetap terbatas (3 sampai 4 warna dominan). Jangan menurunkan FPS di bawah 50 pada laptop biasa.

Selesai jika: tampilan terasa sinematik, bintang berkedip, parallax terasa saat kamera bergerak, dan FPS tetap stabil.
