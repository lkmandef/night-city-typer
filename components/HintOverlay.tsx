"use client";

interface HintOverlayProps {
  visible: boolean;
}

export default function HintOverlay({ visible }: HintOverlayProps) {
  return (
    <div
      className={`fixed inset-0 z-20 flex flex-col items-center justify-center pointer-events-none select-none px-6 text-center transition-all duration-700 ease-out ${
        visible ? "opacity-100 scale-100" : "opacity-0 scale-95"
      }`}
      aria-hidden={!visible}
    >
      <div className="max-w-md space-y-3.5">
        <h1
          className="text-3xl sm:text-4xl text-white/90 tracking-wide font-normal drop-shadow-[0_2px_16px_rgba(255,255,255,0.25)]"
          style={{ fontFamily: "var(--font-playfair), Georgia, Cambria, serif" }}
        >
          ketik sesuatu...
        </h1>
        <p className="text-xs sm:text-sm text-slate-300/60 tracking-wider font-light drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
          spasi membuat jalan &bull; backspace memadamkan lampu
        </p>
        <p className="text-[11px] text-slate-400/40 tracking-widest uppercase font-mono">
          enter mengganti suasana
        </p>
      </div>
    </div>
  );
}
