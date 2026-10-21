---
trigger: always_on
---

# Night City Typer: Konteks Project

Kamu membantu membangun "Night City Typer", web interaktif seni generatif.

Konsep: pengunjung mengetik di keyboard. Setiap huruf/angka menumbuhkan satu gedung di panorama kota malam. Jendela gedung menyala bertahap. Spasi menyisipkan pemisah (jalan/sungai/taman). Backspace memadamkan lampu gedung terakhir lalu meruntuhkannya.

Stack: Next.js (App Router), TypeScript strict, Tailwind CSS, HTML Canvas 2D, Vitest. Tanpa backend dan tanpa database. Deploy ke Vercel.

Aturan kode:
- Logika kota ada di lib/city dan TIDAK boleh mengimpor React atau API canvas.
- Kode render ada di lib/render dan hanya menggambar, tidak mengubah state.
- State animasi disimpan di ref, bukan state React, agar tidak re-render 60 kali per detik.
- Semua acak harus deterministik memakai seeded RNG (mulberry32), bukan Math.random, untuk logika kota.
- Komponen yang memakai canvas atau event keyboard wajib "use client".
- Bersihkan requestAnimationFrame dan event listener saat unmount.
- Tangani devicePixelRatio (maks 2) agar canvas tajam.
- Tulis kode ringkas, beri komentar hanya pada bagian yang tidak jelas, tanpa library tambahan kecuali diminta.
- Setiap selesai tugas, jelaskan file apa yang dibuat/diubah dan cara mengujinya.

Struktur folder target:
app/ (layout.tsx, page.tsx, globals.css)
components/ (CityCanvas.tsx, HintOverlay.tsx, Toolbar.tsx)
lib/city/ (types.ts, rng.ts, buildings.ts, reducer.ts, camera.ts)
lib/render/ (sky.ts, stars.ts, drawBuilding.ts, separators.ts, pipeline.ts)
lib/utils/ (easing.ts, colors.ts)
tests/

Jangan mengerjakan fase lain di luar yang diminta.

Rujukan lengkap: docs/PRD.md (PRD, arsitektur, model data, algoritma, rencana fase). Prompt rinci tiap fase ada di docs/phases/fase-N.md.
