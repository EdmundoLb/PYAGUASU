"use client";

import { useEffect } from "react";
import Icono from "./Icono";
import RenderizadorMatematico from "./RenderizadorMatematico";
import { GLOSARIO, contenidoEnTuEjercicio, incisosDelConcepto } from "@/lib/conceptos/glosario";

// Repaso de UN concepto, abierto desde el chip "Repasar: …" de un mensaje
// del tutor. Muestra el concepto (material del profe) y cómo se aplica al
// ejercicio actual, con los resultados en "?" hasta terminarlo.
export default function ModalConcepto({ id, escena, enunciado, ejercicioTerminado, onCerrar, onAbrirPanel }) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onCerrar();
    }
    document.addEventListener("keydown", onKeyDown);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflowAnterior;
    };
  }, [onCerrar]);

  const concepto = GLOSARIO[id];
  if (!concepto) return null;
  const enTuEjercicio = contenidoEnTuEjercicio(id, escena, ejercicioTerminado);
  const incisos = incisosDelConcepto(id, enunciado);
  const esLista = concepto.explicacion.length > 1;

  return (
    <div
      className="backdrop-nuevo fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-inverse-surface/60 backdrop-blur-sm p-4"
      onClick={onCerrar}
    >
      <div
        className="mensaje-nuevo w-full max-w-[520px] max-h-[85vh] overflow-y-auto bg-surface-container-lowest rounded-2xl shadow-elevation-3 flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Repaso: ${concepto.titulo}`}
      >
        <div className="px-4 pt-4 pb-3 flex items-center justify-between gap-2 bg-gradient-to-r from-primary to-primary-container text-on-primary rounded-t-2xl">
          <span className="flex items-center gap-2 min-w-0">
            <span className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
              <Icono nombre={concepto.icono} size={20} />
            </span>
            <span className="flex flex-col min-w-0">
              <span className="text-label-sm uppercase tracking-wider opacity-80">Repaso</span>
              <span className="text-title-md font-semibold">{concepto.titulo}</span>
            </span>
          </span>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar el repaso y volver al ejercicio"
            className="min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center hover:bg-white/15 active:scale-[0.98] transition-all duration-200"
          >
            <Icono nombre="close" size={22} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-3">
          {esLista ? (
            <ul className="flex flex-col gap-1.5">
              {concepto.explicacion.map((t, i) => (
                <li key={i} className="flex items-start gap-2 text-body-sm leading-relaxed">
                  <Icono nombre={i === 0 ? "lightbulb" : "check_circle"} size={18} className={`flex-shrink-0 mt-0.5 ${i === 0 ? "text-primary" : "text-tertiary"}`} />
                  <span>
                    <RenderizadorMatematico texto={t} />
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-body-md leading-relaxed flex items-start gap-2">
              <Icono nombre="lightbulb" size={20} className="text-primary flex-shrink-0 mt-0.5" />
              <span>
                <RenderizadorMatematico texto={concepto.explicacion[0]} />
              </span>
            </p>
          )}

          {concepto.formulas.length > 0 && (
            <div className="flex flex-col gap-2">
              {concepto.formulas.map((f) => (
                <div key={f} className="px-3.5 py-3 rounded-xl bg-surface-container-low border-l-4 border-tertiary text-center font-bold text-primary overflow-x-auto">
                  <RenderizadorMatematico texto={f} />
                </div>
              ))}
            </div>
          )}

          {enTuEjercicio.length > 0 && (
            <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-secondary-fixed/60">
              <span className="flex items-center gap-1.5 text-label-md font-semibold text-on-secondary-fixed flex-wrap">
                <Icono nombre="assignment" size={18} />
                En tu ejercicio
                {incisos.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-secondary text-on-secondary text-label-sm">
                    {incisos.length === 1 ? `inciso ${incisos[0]}` : `incisos ${incisos.join(", ")}`}
                  </span>
                )}
              </span>
              {enTuEjercicio.map((linea, i) => (
                <p key={i} className="text-body-sm leading-relaxed">
                  <RenderizadorMatematico texto={linea} />
                </p>
              ))}
              {!ejercicioTerminado && /\?/.test(enTuEjercicio.join(" ")) && (
                <span className="text-label-sm text-on-surface-variant">El &quot;?&quot; lo calculás vos con el tutor.</span>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 pt-1">
            {escena && (
              <button
                type="button"
                onClick={() => onAbrirPanel("accion")}
                className="boton-degradado min-h-[48px] rounded-full text-title-md font-semibold shadow-elevation-2 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Icono nombre="play_circle" size={22} />
                Verlo en el simulador
              </button>
            )}
            <button
              type="button"
              onClick={() => onAbrirPanel("conceptos")}
              className="min-h-[44px] rounded-full bg-surface-container-high text-body-sm font-semibold text-primary flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all duration-200"
            >
              <Icono nombre="auto_stories" size={18} />
              Ver todos los conceptos
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
