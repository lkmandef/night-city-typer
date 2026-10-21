# Fase 2: Input Keyboard

Fase 2: sistem input yang bekerja di desktop dan HP.

Tugas:
1. Buat lib/city/types.ts berisi tipe aksi: TYPE_CHAR {char}, SPACE, BACKSPACE, ENTER, RESET.
2. Di CityCanvas, tangkap input desktop lewat event keydown di window:
   - abaikan jika metaKey/ctrlKey/altKey ditekan
   - Backspace menjadi BACKSPACE
   - spasi menjadi SPACE dan panggil preventDefault agar halaman tidak scroll
   - Enter menjadi ENTER
   - karakter tunggal (huruf, angka, tanda baca) menjadi TYPE_CHAR
3. Buat components/HiddenInput.tsx: elemen <input> tersembunyi (bukan display:none; gunakan opacity 0 dan posisi fixed di luar layar) untuk memunculkan keyboard layar di HP.
   - fokus otomatis saat pengguna menyentuh/klik layar
   - gunakan event beforeinput: inputType "deleteContentBackward" menjadi BACKSPACE, insertText dengan data " " menjadi SPACE, insertText lainnya menjadi TYPE_CHAR per karakter
   - kosongkan nilai input setelah tiap event agar tidak menumpuk
   - atur autocapitalize="off", autocorrect="off", spellcheck="false"
4. Pastikan satu aksi tidak terkirim dua kali (desktop keydown vs input tersembunyi).
5. Di layout.tsx, atur viewport: width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content.
6. Sementara, tampilkan log aksi di console dan teks debug kecil di pojok layar (hanya di mode development) berisi aksi terakhir.

Batasan: belum menggambar gedung. Jangan memakai library tambahan.

Selesai jika: di desktop dan di HP (Preview Vercel), mengetik huruf, spasi, dan backspace menghasilkan aksi yang benar sekali per tekanan, dan keyboard layar muncul saat menyentuh layar.
