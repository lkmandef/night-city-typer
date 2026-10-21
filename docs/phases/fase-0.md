# Fase 0: Persiapan

Fase 0: persiapan project.

Konteks: project Next.js (App Router, TypeScript, Tailwind) bernama night-city-typer sudah dibuat atau akan dibuat dengan create-next-app.

Tugas:
1. Jika belum ada, buat project Next.js dengan TypeScript, Tailwind, ESLint, dan App Router.
2. Aktifkan TypeScript strict di tsconfig.
3. Pasang Vitest sebagai devDependency, tambahkan script "test": "vitest run" di package.json, dan buat satu tes contoh yang lolos.
4. Buat struktur folder kosong sesuai AGENTS.md (components, lib/city, lib/render, lib/utils, tests) dengan file placeholder seperlunya.
5. Ubah app/page.tsx menjadi halaman kosong berlatar hitam kebiruan (#050816) memenuhi layar, tanpa scroll.
6. Atur app/layout.tsx: lang="id", metadata sementara (title "Night City Typer").
7. Buat README singkat berisi cara menjalankan (npm run dev, npm test).

Batasan: jangan membuat canvas atau logika kota dulu.

Selesai jika: npm run dev menampilkan halaman gelap kosong, npm run build dan npm test lolos tanpa error.
