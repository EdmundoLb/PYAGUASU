"use client";

import { useEffect, useMemo, useState } from "react";
import Icono from "./Icono";
import { CATALOGO_INSIGNIAS } from "@/lib/gamificacion/insignias";

function prefiereMenosMovimiento() {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

// Colores tomados de la paleta de marca (primary/secondary/tertiary) para
// que el confetti se sienta parte del mismo sistema, no un elemento ajeno.
const COLORES_CONFETI = ["#00248F", "#FD8041", "#77D7C8", "#B9C3FF", "#A23F00"];

function useConteoXp(valorFinal) {
  const [valor, setValor] = useState(prefiereMenosMovimiento() ? valorFinal : 0);

  useEffect(() => {
    if (prefiereMenosMovimiento()) {
      setValor(valorFinal);
      return;
    }
    let inicio = null;
    const duracionMs = 600;
    let frame;
    function tick(ahora) {
      if (inicio === null) inicio = ahora;
      const avance = Math.min(1, (ahora - inicio) / duracionMs);
      setValor(Math.round(avance * valorFinal));
      if (avance < 1) frame = requestAnimationFrame(tick);
    }
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [valorFinal]);

  return valor;
}

function Confetti() {
  // Se genera una sola vez por montaje (no en cada render) para que la
  // caída no se reinicie sola.
  const piezas = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        izquierda: `${Math.random() * 100}%`,
        color: COLORES_CONFETI[i % COLORES_CONFETI.length],
        retraso: `${Math.random() * 250}ms`,
      })),
    []
  );

  if (prefiereMenosMovimiento()) return null;

  return (
    <div className="absolute inset-x-0 top-0 h-24 overflow-hidden pointer-events-none" aria-hidden="true">
      {piezas.map((p, i) => (
        <span
          key={i}
          className="pieza-confeti"
          style={{ left: p.izquierda, background: p.color, animationDelay: p.retraso }}
        />
      ))}
    </div>
  );
}

export default function TarjetaXpGanada({ resultado }) {
  const xpAnimado = useConteoXp(resultado?.xpGanada || 0);

  if (!resultado || !resultado.xpGanada) return null;
  const insigniasNuevas = (resultado.insigniasNuevas || [])
    .map((id) => CATALOGO_INSIGNIAS.find((i) => i.id === id))
    .filter(Boolean);

  return (
    <div className="celebrar relative overflow-hidden flex flex-col gap-2.5 p-4 rounded-2xl bg-gradient-to-br from-primary via-primary-container to-secondary-container text-on-primary shadow-elevation-2">
      {resultado.subioDeNivel && <Confetti />}

      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 font-semibold text-body-sm uppercase tracking-wide">
          <Icono nombre="bolt" size={20} />
          XP ganado
        </span>
        <span className="font-mono font-bold text-title-lg">+{xpAnimado} XP</span>
      </div>

      {resultado.subioDeNivel && (
        <div className="flex items-center gap-2 text-body-sm font-semibold">
          <Icono nombre="military_tech" size={18} />
          ¡Subiste a nivel {resultado.nivelNuevo}!
        </div>
      )}

      {insigniasNuevas.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-label-sm uppercase tracking-wider opacity-90">Insignia nueva</span>
          <div className="flex flex-wrap gap-2">
            {insigniasNuevas.map((insignia) => (
              <span
                key={insignia.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-label-sm font-semibold"
              >
                <Icono nombre={insignia.icono} size={16} />
                {insignia.nombre}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
