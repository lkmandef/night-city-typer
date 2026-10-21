# Fase 8: Performa dan Aksesibilitas

Fase 8: performa, aksesibilitas, dan ketahanan.

Tugas:
1. Hormati prefers-reduced-motion: kurangi/hilangkan kedipan bintang, parallax, dan goyangan runtuh; animasi tumbuh tetap ada tetapi lebih singkat.
2. Tambahkan role="img" dan aria-label deskriptif pada canvas, serta elemen sr-only yang menyebutkan jumlah gedung saat ini (diperbarui dengan aria-live="polite" tidak terlalu sering).
3. Tangani visibilitychange: saat tab disembunyikan, hentikan loop; saat kembali, lanjutkan tanpa lonjakan dt.
4. Kualitas adaptif: ukur rata-rata FPS beberapa detik. Jika di bawah 40, kurangi partikel, matikan glow berat, dan turunkan DPR maksimal ke 1.5.
5. Tambahkan penghitung FPS kecil yang hanya tampil jika URL berisi ?debug=1.
6. Audit memory leak: pastikan semua listener dan raf dibersihkan, dan item yang dihapus tidak tertahan di memori.
7. Uji kasus tepi dan perbaiki bug: paste teks panjang, rotasi layar, resize saat animasi, menahan backspace, mengetik sangat cepat.
8. Jalankan Lighthouse (jika tersedia) dan perbaiki temuan Performance dan Accessibility yang mudah.

Batasan: jangan mengubah tampilan utama secara signifikan.

Selesai jika: tidak ada error di console pada skenario tepi, FPS stabil, dan Lighthouse Performance mendekati 90 atau lebih.
