# Fase 4: Spasi dan Backspace

Fase 4: pemisah dan animasi runtuh.

Tugas:
1. Tambahkan tipe Separator {id, x, width, kind: "road"|"river"|"park", progress} ke types.ts.
2. Reducer SPACE: tambahkan Separator di cursorX dengan lebar 40 sampai 90 px, kind dipilih deterministik (road, river, park bergantian dengan variasi seed), geser cursorX. Dua spasi berturut-turut tidak boleh menambah dua pemisah (abaikan yang kedua).
3. lib/render/separators.ts:
   - road: aspal gelap dengan garis putus-putus dan 1 sampai 2 lampu jalan kecil
   - river: air gelap kebiruan dengan gelombang tipis dan pantulan lampu dari gedung di sebelahnya (cukup garis vertikal kabur)
   - park: pohon-pohon siluet kecil dengan satu lampu taman
   Animasikan progress 0 ke 1 saat muncul.
4. Reducer BACKSPACE pada item terakhir:
   - jika Building: ubah state menjadi "collapsing"
   - jika Separator: mundurkan progress sampai 0 lalu hapus
   - jika kota kosong: tidak melakukan apa-apa dan tidak error
   - jika item terakhir sedang collapsing, tekanan berikutnya langsung mengantre item sebelumnya
   Setelah selesai runtuh, hapus item dan kembalikan cursorX ke posisi sebelum item itu.
5. Animasi runtuh: jendela padam berurutan dari atas ke bawah, lalu collapse naik 0 ke 1 selama sekitar 700 ms; tinggi berkurang dengan sedikit goyangan horizontal (maks 2 px) dan beberapa partikel debu kecil yang jatuh dan memudar.
6. Tangani menahan tombol backspace atau mengetik sangat cepat tanpa error atau melompat.
7. Tes Vitest: SPACE ganda tidak menambah 2 pemisah; BACKSPACE di kota kosong aman; setelah ketik 3 huruf lalu 3 backspace dan selesai animasi, items kosong dan cursorX kembali awal.

Batasan: belum ada kamera atau efek atmosfer.

Selesai jika: ketik, spasi, dan backspace bekerja penuh dan terasa halus, tanpa error saat input beruntun cepat.
