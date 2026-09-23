"use client";

import { useState } from "react";
import Icono from "./Icono";
import RenderizadorMatematico from "./RenderizadorMatematico";

// Colapsada por defecto. Una vez abierta, se queda abierta (no hay forma de
// volver a colapsarla desde acá) — para "resetearla" ante una pista nueva,
// el padre debe montar una instancia nueva pasando una `key` distinta.
export default function TarjetaPista({ pista }) {
  const [abierta, setAbierta] = useState(false);

  if (!pista) return null;

  if (!abierta) {
    return (
      <button
        type="button"
        onClick={() => setAbierta(true)}
        aria-label="Mostrar pista de este paso"
        className="mensaje-nuevo min-h-[44px] w-full px-4 rounded-xl bg-surface-container-high text-on-surface-variant text-body-sm font-semibold flex items-center gap-2 justify-center active:scale-[0.98] transition-all duration-200 shadow-elevation-1"
      >
        <Icono nombre="lightbulb" size={18} />
        ¿Necesitás una pista?
      </button>
    );
  }

  return (
    <div className="mensaje-nuevo p-3.5 rounded-xl bg-secondary-fixed text-on-secondary-fixed text-body-sm shadow-elevation-1 flex items-start gap-2">
      <Icono nombre="lightbulb" size={18} className="flex-shrink-0 mt-0.5" />
      <p>
        <strong>Pista:</strong> <RenderizadorMatematico texto={pista} />
      </p>
    </div>
  );
}
