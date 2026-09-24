import { calcularNivel, xpParaNivel, xpParaSiguienteNivel, progresoDentroDelNivel } from "@/lib/gamificacion/niveles";

// Mismo patrón visual que IndicadorProgreso.js (barra segmentada de pasos),
// pero continua, para el progreso de XP dentro del nivel actual.
export default function BarraProgresoXp({ xp }) {
  const nivel = calcularNivel(xp);
  const xpDesde = xpParaNivel(nivel);
  const xpHasta = xpParaSiguienteNivel(nivel);
  const progreso = progresoDentroDelNivel(xp);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-label-md font-mono uppercase tracking-wider text-secondary font-bold">
          Nivel {nivel}
        </span>
        <span className="text-label-sm font-mono text-on-surface-variant">
          {xp - xpDesde} / {xpHasta - xpDesde} XP
        </span>
      </div>
      <div className="h-2.5 rounded-full bg-surface-container-highest overflow-hidden">
        <div
          className="h-full rounded-full boton-degradado transition-all duration-500"
          style={{ width: `${Math.round(progreso * 100)}%` }}
        />
      </div>
    </div>
  );
}
