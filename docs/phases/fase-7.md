# Fase 7: Polesan UI

Fase 7: UI overlay dan fitur tambahan.

Tugas:
1. components/HintOverlay.tsx: teks petunjuk di tengah layar (font serif elegan, misalnya Playfair Display lewat next/font/google) berbunyi seperti "ketik sesuatu..." dengan subteks kecil "spasi membuat jalan, backspace memadamkan lampu". Hilang dengan fade setelah ketikan pertama dan muncul lagi jika kota kosong.
2. components/Toolbar.tsx: tombol kecil di pojok (semi transparan, tidak mengganggu): Simpan PNG, Reset. Pastikan bisa diakses keyboard (focus ring) dan tidak menangkap karakter yang diketik.
3. Simpan PNG: ekspor canvas ke gambar (toDataURL atau toBlob) dan unduh dengan nama night-city-typer.png. Tambahkan watermark kecil teks "night-city-typer" di pojok bawah pada gambar hasil.
4. Aksi ENTER: ganti fase waktu (malam, dini hari, fajar) dengan transisi halus pada warna langit dan jumlah jendela menyala.
5. Reset: kosongkan kota dengan animasi runtuh beruntun cepat atau fade, lalu kembalikan petunjuk.
6. Pastikan tombol-tombol tidak merebut fokus dari input tersembunyi di HP.

Batasan: tanpa suara dulu. Tanpa library UI tambahan; cukup Tailwind.

Selesai jika: petunjuk muncul dan hilang dengan benar, tombol simpan menghasilkan PNG yang sesuai tampilan, dan ENTER mengubah suasana langit.
