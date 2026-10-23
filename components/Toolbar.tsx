"use client";

import { useEffect, useRef, useState } from "react";
import { LETTER_PRESETS } from "@/lib/city/palette";

interface ToolbarProps {
  onSavePng: () => void;
  onReset: () => void;
  onEnter: () => void;
  timePhaseName?: string;
  selectedColorId?: string;
  onSelectColor?: (colorId: string) => void;
  isOverviewMode?: boolean;
  onToggleOverview?: () => void;
}

export default function Toolbar({
  onSavePng,
  onReset,
  onEnter,
  timePhaseName = "Malam",
  selectedColorId = "putih",
  onSelectColor,
  isOverviewMode = false,
  onToggleOverview,
}: ToolbarProps) {
  const [isColorMenuOpen, setIsColorMenuOpen] = useState(false);
  const colorMenuRef = useRef<HTMLDivElement>(null);
  const colorBtnRef = useRef<HTMLButtonElement>(null);

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

  // Menutup popover warna saat klik di luar
  useEffect(() => {
    if (!isColorMenuOpen) return;

    const handleOutsideClick = (e: PointerEvent | MouseEvent) => {
      const target = e.target as Node | null;
      if (
        colorMenuRef.current &&
        target &&
        !colorMenuRef.current.contains(target) &&
        colorBtnRef.current &&
        !colorBtnRef.current.contains(target)
      ) {
        setIsColorMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleOutsideClick);
    return () => {
      document.removeEventListener("pointerdown", handleOutsideClick);
    };
  }, [isColorMenuOpen]);

  // Menutup popover warna saat menekan tombol Esc (tanpa mengirim aksi ke kota)
  useEffect(() => {
    if (!isColorMenuOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setIsColorMenuOpen(false);
        refocusInput();
      }
    };

    window.addEventListener("keydown", handleEscape, true);
    return () => {
      window.removeEventListener("keydown", handleEscape, true);
    };
  }, [isColorMenuOpen]);

  // Daftar opsi warna: 8 preset + 1 mode pelangi (rainbow)
  const allColorOptions = [
    ...LETTER_PRESETS,
    {
      id: "rainbow",
      name: "Pelangi",
      hex: "linear-gradient(135deg, #ff5a5a, #ffd24a, #6dff9c, #5ff3ff, #b58cff)",
    },
  ];

  return (
    <div className="fixed top-3.5 right-3.5 z-30">
      <nav
        aria-label="Aksi Toolbar"
        className="flex items-center gap-1.5 sm:gap-2 p-1 rounded-full bg-slate-950/45 backdrop-blur-md border border-white/10 shadow-lg text-white/80"
      >
        {/* Tombol Pemilih Warna Huruf (FR-17) */}
        <button
          ref={colorBtnRef}
          type="button"
          tabIndex={0}
          aria-expanded={isColorMenuOpen}
          aria-haspopup="true"
          aria-label="Pilih warna huruf"
          title="Pilih warna huruf (Putih, Emas, Cyan, Pelangi, dll.)"
          onPointerDown={handlePointerDown}
          onKeyDown={handleKeyDown}
          onClick={() => {
            setIsColorMenuOpen((prev) => !prev);
            refocusInput();
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full bg-white/5 hover:bg-white/15 active:bg-white/20 transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
        >
          {/* Titik indikator warna aktif */}
          <span
            className="w-3.5 h-3.5 rounded-full border border-white/40 shadow-sm shrink-0"
            style={{
              background:
                selectedColorId === "rainbow"
                  ? "linear-gradient(135deg, #ff5a5a, #ffd24a, #5ff3ff, #b58cff)"
                  : LETTER_PRESETS.find((p) => p.id === selectedColorId)?.hex || "#ffffff",
            }}
            aria-hidden="true"
          />
          <span className="hidden sm:inline font-sans text-white/90">Warna</span>
        </button>

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

        {/* Tombol Lihat Semua (Overview Mode FR-19) */}
        <button
          type="button"
          tabIndex={0}
          aria-pressed={isOverviewMode}
          aria-label={isOverviewMode ? "Kembali ke fokus gedung" : "Lihat seluruh panorama kota"}
          title={isOverviewMode ? "Kembali ke mode fokus gedung" : "Lihat seluruh kota"}
          onPointerDown={handlePointerDown}
          onKeyDown={handleKeyDown}
          onClick={() => {
            onToggleOverview?.();
            refocusInput();
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none ${
            isOverviewMode
              ? "bg-cyan-500/25 text-cyan-200 border border-cyan-400/40"
              : "bg-white/5 hover:bg-white/15 active:bg-white/20 text-white/90"
          }`}
        >
          <svg
            className="w-3.5 h-3.5 text-cyan-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.8}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15"
            />
          </svg>
          <span className="hidden sm:inline font-sans">
            {isOverviewMode ? "Fokus" : "Lihat semua"}
          </span>
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

      {/* Popover Menu Pilihan Warna Huruf */}
      {isColorMenuOpen && (
        <div
          ref={colorMenuRef}
          role="dialog"
          aria-modal="true"
          aria-label="Menu pilihan warna huruf"
          className="absolute right-0 top-full mt-2.5 w-[218px] max-w-[calc(100vw-28px)] rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-white/15 p-3.5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 z-40 select-none"
        >
          <div className="text-[11px] font-medium text-slate-300/80 mb-2.5 tracking-wider uppercase font-mono px-0.5">
            Warna Huruf
          </div>
          <div
            role="radiogroup"
            aria-label="Pilihan warna huruf"
            className="grid grid-cols-3 gap-2.5 place-items-center"
          >
            {allColorOptions.map((opt) => {
              const isSelected = selectedColorId === opt.id;
              const isRainbow = opt.id === "rainbow";

              return (
                <button
                  key={opt.id}
                  type="button"
                  tabIndex={0}
                  role="radio"
                  aria-checked={isSelected}
                  aria-label={`Pilih warna ${opt.name}${isSelected ? " (terpilih)" : ""}`}
                  title={opt.name}
                  onPointerDown={handlePointerDown}
                  onKeyDown={handleKeyDown}
                  onClick={() => {
                    onSelectColor?.(opt.id);
                    setIsColorMenuOpen(false);
                    refocusInput();
                  }}
                  className={`relative w-10 h-10 min-w-[38px] min-h-[38px] rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                    isSelected
                      ? "ring-2 ring-white ring-offset-2 ring-offset-slate-950 scale-105"
                      : "border border-white/25 hover:border-white/60"
                  }`}
                  style={{
                    background: isRainbow ? opt.hex : opt.hex,
                  }}
                >
                  {/* Penanda ikon centang untuk warna yang terpilih */}
                  {isSelected && (
                    <svg
                      className={`w-4 h-4 ${
                        opt.id === "putih" || opt.id === "emas" || opt.id === "cyan" || opt.id === "hijau"
                          ? "text-slate-950"
                          : "text-white"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.5 12.75l6 6 9-13.5"
                      />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
