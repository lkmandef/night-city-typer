# Fase 3: Gedung (Tumbuh dan Jendela Menyala)

Fase 3: generator gedung dan animasi tumbuh.

Tugas:
1. lib/city/rng.ts: implementasi mulberry32(seed) yang mengembalikan fungsi acak deterministik 0..1.
2. lib/city/types.ts: definisikan Building {id, char, kind, x, width, height, grow, windows, state, collapse}, Window {col,row,lit,litAt,hue}, CityState {items, cursorX, cameraX, cameraTarget, timeOfDay, seed}.
3. lib/city/buildings.ts: fungsi makeBuilding(char, index, x, worldSeed) yang menentukan:
   - kind: vokal = "tower" (tinggi, ada antena), konsonan = "block", angka = "house" (pendek), tanda baca = "lamp" (lampu jalan kecil)
   - huruf kapital 1.3x lebih tinggi
   - lebar 36 sampai 76 px, tinggi basis tower 220, block 140, house 70 (dikali variasi acak 0.7 sampai 1.4)
   - grid jendela (kolom = lebar/14, baris = tinggi/18) dengan hue warm (#ffd27a, #ffb454) atau cool (#7fd6ff)
   - RNG per karakter memakai seed dari worldSeed + kode karakter + index agar deterministik
4. lib/city/reducer.ts: reducer murni cityReducer(state, action). Untuk TYPE_CHAR: buat gedung di cursorX, tambahkan ke items, geser cursorX sebesar width + jarak kecil 4 px.
5. lib/render/drawBuilding.ts: gambar gedung sebagai persegi panjang gelap (#0b0f1e sampai #161b33) yang tumbuh dari tanah ke atas. Tinggi tampil = height * easeOutCubic(grow). Gambar antena dan lampu merah berkedip untuk tower.
6. Animasi: grow naik 0 ke 1 selama sekitar 600 ms. Setelah grow > 0.6, nyalakan jendela satu per satu dengan jeda acak 30 sampai 120 ms; sebagian kecil jendela dibiarkan padam. Kelompokkan jendela satu warna dalam satu path sebelum fill agar efisien.
7. lib/utils/easing.ts: easeOutCubic.
8. Hubungkan: aksi TYPE_CHAR dari Fase 2 masuk ke reducer, loop memperbarui animasi dan menggambar semua gedung di atas langit.
9. Tes Vitest: makeBuilding dengan input sama menghasilkan output sama; vokal menghasilkan tower; angka menghasilkan house; reducer menambah 1 item untuk 1 karakter.

Batasan: belum ada spasi/backspace, kamera, atau bintang. Logika di lib/city tidak boleh mengimpor React/canvas.

Selesai jika: mengetik kata "halo" menumbuhkan 4 gedung berbeda dengan jendela yang menyala bertahap, dan semua tes lolos.
