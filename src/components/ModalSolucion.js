"use client";

import { useEffect } from "react";
import Icono from "./Icono";
import RenderizadorMatematico from "./RenderizadorMatematico";

// Solo muestra pasos que el estudiante ya se ganó (acertó o pidió ayuda) —
// nunca adelanta pasos que todavía no se resolvieron en la conversación.
export default function ModalSolucion({ pasos, resultadoFinal, analogiaCotidiana, onCerrar }) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onCerrar();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onCerrar]);

  return (
    <div
      className="backdrop-nuevo fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-inverse-surface/60 backdrop-blur-sm p-4"
      onClick={onCerrar}
    >
      <div
        className="mensaje-nuevo w-full max-w-[520px] max-h-[80vh] overflow-y-auto bg-surface-container-lowest rounded-2xl p-5 shadow-elevation-3 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Solución confirmada hasta ahora"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-title-md font-semibold">
            <Icono nombre="functions" size={22} className="text-primary" />
            Fórmulas confirmadas
          </span>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar solución"
            className="min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high active:scale-[0.98] transition-all duration-200"
          >
            <Icono nombre="close" size={22} />
          </button>
        </div>

        <ol className="flex flex-col gap-2.5">
          {pasos.map((p, i) => (
            <li key={i} className="flex items-start gap-2.5">
              <span className="mt-0.5 w-6 h-6 rounded-full bg-primary text-on-primary text-label-sm font-bold flex items-center justify-center flex-shrink-0">
                {p.paso ?? i + 1}
              </span>
              <div className="flex-1 px-3.5 py-2.5 rounded-lg bg-surface-container-low border-l-4 border-tertiary font-mono text-body-sm text-primary font-bold overflow-x-auto">
                <RenderizadorMatematico texto={p.formula} />
              </div>
            </li>
          ))}
        </ol>

        {resultadoFinal && (
          <div className="p-4 rounded-xl bg-tertiary-fixed text-on-tertiary-fixed flex items-center justify-between gap-3">
            <span className="font-semibold text-body-sm uppercase tracking-wide">Resultado</span>
            <span className="font-mono font-bold text-title-lg">
              <RenderizadorMatematico texto={resultadoFinal.valor} /> {resultadoFinal.unidad || ""}
            </span>
          </div>
        )}

        {analogiaCotidiana && (
          <p className="text-body-sm text-on-surface-variant leading-relaxed">{analogiaCotidiana}</p>
        )}

        <button
          type="button"
          onClick={onCerrar}
          className="min-h-[48px] rounded-full bg-primary text-on-primary text-title-md font-semibold shadow-elevation-2 active:scale-[0.98] transition-all duration-200"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}
