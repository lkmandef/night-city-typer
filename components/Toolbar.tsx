"use client";

interface ToolbarProps {
  onSavePng: () => void;
  onReset: () => void;
  onEnter: () => void;
  timePhaseName?: string;
}

export default function Toolbar({
  onSavePng,
  onReset,
  onEnter,
  timePhaseName = "Malam",
}: ToolbarProps) {
  // Cegah tombol merebut fokus dari input tersembunyi (baik di desktop maupun di HP)
  const handlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    e.preventDefault();
  };

  // Kembalikan fokus ke input utama setelah aksi selesai
  const refocusInput = () => {
    if (typeof document !== "undefined") {
      document.getElementById("city-full-input")?.focus();
    }
  };

  // Cegah tombol menangkap karakter yang diketik saat tombol memiliki fokus keyboard
  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      // Izinkan enter atau spasi untuk mengaktifkan tombol jika difokuskan via keyboard
      return;
    }
    // Jika user mengetik huruf, backspace, dll., lepaskan fokus tombol agar masuk ke input kota
    e.currentTarget.blur();
    refocusInput();
  };

  return (
    <nav
      aria-label="Aksi Toolbar"
      className="fixed top-3.5 right-3.5 z-30 flex items-center gap-1.5 sm:gap-2 p-1 rounded-full bg-slate-950/45 backdrop-blur-md border border-white/10 shadow-lg text-white/80"
    >
      {/* Tombol Ganti Suasana (Malam / Dini Hari / Fajar) */}
      <button
        type="button"
        tabIndex={0}
        aria-label={`Suasana waktu saat ini: ${timePhaseName}. Tekan untuk ganti suasana`}
        title={`Ganti suasana waktu (Enter) - Saat ini: ${timePhaseName}`}
        onPointerDown={handlePointerDown}
        onKeyDown={handleKeyDown}
        onClick={() => {
          onEnter();
          refocusInput();
        }}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full bg-white/5 hover:bg-white/15 active:bg-white/20 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
      >
        <svg
          className="w-3.5 h-3.5 text-cyan-300"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
          />
        </svg>
        <span className="hidden sm:inline font-sans text-white/90">{timePhaseName}</span>
      </button>

      {/* Tombol Simpan PNG */}
      <button
        type="button"
        tabIndex={0}
        aria-label="Simpan panorama kota sebagai gambar PNG"
        title="Simpan PNG (night-city-typer.png)"
        onPointerDown={handlePointerDown}
        onKeyDown={handleKeyDown}
        onClick={() => {
          onSavePng();
          refocusInput();
        }}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full bg-white/5 hover:bg-white/15 active:bg-white/20 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
      >
        <svg
          className="w-3.5 h-3.5 text-emerald-300"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M7.5 12l4.5 4.5m0 0l4.5-4.5M12 3v13.5"
          />
        </svg>
        <span className="hidden sm:inline font-sans text-white/90">Simpan PNG</span>
      </button>

      {/* Tombol Reset */}
      <button
        type="button"
        tabIndex={0}
        aria-label="Reset panorama kota"
        title="Reset Kota"
        onPointerDown={handlePointerDown}
        onKeyDown={handleKeyDown}
        onClick={() => {
          onReset();
          refocusInput();
        }}
        className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full bg-white/5 hover:bg-red-500/20 active:bg-red-500/30 text-white/75 hover:text-red-300 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
      >
        <svg
          className="w-3.5 h-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>
        <span className="hidden sm:inline font-sans">Reset</span>
      </button>
    </nav>
  );
}
