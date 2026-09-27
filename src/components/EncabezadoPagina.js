import Link from "next/link";
import LogoMarca from "./LogoMarca";
import Icono from "./Icono";
import BotonTema from "./BotonTema";

// Encabezado común de las pantallas secundarias (Progreso, Ranking, panel
// docente). Antes cada página copiaba el suyo, con "volver" como link
// subrayado: ahora es un botón redondo + título, igual en todas.
export default function EncabezadoPagina({ volverA, etiquetaVolver = "Volver", titulo, derecha }) {
  return (
    <header className="sticky top-0 z-10 bg-surface/85 backdrop-blur-xl border-b border-surface-container-high/70">
      <div className="max-w-[760px] mx-auto h-16 px-4 flex items-center gap-3">
        {volverA ? (
          <Link
            href={volverA}
            aria-label={etiquetaVolver}
            title={etiquetaVolver}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-surface-container-lowest text-on-surface shadow-elevation-1 hover:bg-surface-container-high active:scale-95 transition-all duration-200 flex-shrink-0"
          >
            <Icono nombre="arrow_back" size={20} />
          </Link>
        ) : (
          <LogoMarca size={38} className="rounded-[12px] shadow-elevation-1 flex-shrink-0" />
        )}
        <span className="flex-1 min-w-0 font-bold text-title-lg tracking-tight truncate">{titulo}</span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <BotonTema />
          {derecha}
        </div>
      </div>
    </header>
  );
}
