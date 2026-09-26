"use client";

import { useState } from "react";
import Icono from "./Icono";

// Código de la clase grande y copiable: es lo que el docente más necesita
// compartir (pizarrón, grupo de WhatsApp), así que se copia de un toque.
export default function CodigoInvitacion({ codigo }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(codigo);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1800);
    } catch {
      // Sin permiso de portapapeles: el código igual queda visible para copiarlo a mano.
    }
  }

  return (
    <button
      type="button"
      onClick={copiar}
      aria-label={`Copiar código de invitación ${codigo}`}
      className="group inline-flex items-center gap-3 pl-4 pr-2 py-2 rounded-2xl bg-white/15 hover:bg-white/25 transition-colors duration-200 self-start"
    >
      <span className="flex flex-col items-start leading-none gap-1">
        <span className="text-[10px] uppercase tracking-widest opacity-80">Código para tus alumnos</span>
        <span className="font-mono font-bold text-[24px] tracking-[0.15em]">{codigo}</span>
      </span>
      <span
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200 ${
          copiado ? "bg-[#77d7c8] text-[#00302a]" : "bg-white text-[#00248f]"
        }`}
      >
        <Icono nombre={copiado ? "check" : "content_copy"} size={20} />
      </span>
      <span className="sr-only" aria-live="polite">
        {copiado ? "Código copiado" : ""}
      </span>
    </button>
  );
}
