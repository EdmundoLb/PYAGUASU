import { calcularNivel, progresoDentroDelNivel } from "@/lib/gamificacion/niveles";

// Nivel como anillo de progreso (el patrón de "anillos de actividad"): el
// número del nivel en el centro y el arco muestra cuánto falta para el
// siguiente. Pensado para ir sobre .superficie-marca (trazo blanco).
export default function AnilloNivel({ xp, size = 96 }) {
  const nivel = calcularNivel(xp);
  const progreso = progresoDentroDelNivel(xp);
  const radio = 42;
  const circunferencia = 2 * Math.PI * radio;

  return (
    <div
      className="relative flex-shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Nivel ${nivel}, ${Math.round(progreso * 100)}% hacia el nivel ${nivel + 1}`}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} className="-rotate-90">
        <circle cx="50" cy="50" r={radio} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="9" />
        <circle
          cx="50"
          cy="50"
          r={radio}
          fill="none"
          stroke="url(#anillo-nivel)"
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circunferencia}
          strokeDashoffset={circunferencia * (1 - Math.max(0.03, progreso))}
          style={{ transition: "stroke-dashoffset 900ms cubic-bezier(0.2, 0.8, 0.2, 1)" }}
        />
        <defs>
          <linearGradient id="anillo-nivel" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#77d7c8" />
            <stop offset="100%" stopColor="#fd8041" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
        <span className="text-[10px] font-semibold uppercase tracking-widest opacity-80">Nivel</span>
        <span className="font-mono font-bold text-[30px] mt-0.5">{nivel}</span>
      </div>
    </div>
  );
}
