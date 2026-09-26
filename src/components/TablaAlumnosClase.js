import Icono from "./Icono";
import Avatar from "./Avatar";
import EstadoVacio from "./EstadoVacio";
import { progresoDentroDelNivel } from "@/lib/gamificacion/niveles";

export default function TablaAlumnosClase({ alumnos }) {
  const ordenados = [...alumnos].sort((a, b) => b.xp - a.xp);

  if (ordenados.length === 0) {
    return (
      <EstadoVacio
        titulo="Todavía no hay alumnos"
        descripcion="Compartí el código de la clase: apenas se unan, vas a ver acá su nivel, racha y XP."
      />
    );
  }

  return (
    <ol className="flex flex-col rounded-3xl bg-surface-container-lowest border border-surface-container-high shadow-elevation-1 overflow-hidden divide-y divide-surface-container-high">
      {ordenados.map((alumno, i) => (
        <li key={alumno.id} className="flex items-center gap-3 px-4 py-3">
          <span className="w-5 text-center font-mono text-label-md font-bold text-on-surface-variant flex-shrink-0">{i + 1}</span>
          <Avatar nombre={alumno.nombre} size={38} />
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <span className="text-body-md font-semibold truncate">{alumno.nombre}</span>
            <span className="flex items-center gap-2">
              <span className="text-label-sm text-on-surface-variant flex-shrink-0">Nivel {alumno.nivel}</span>
              <span className="flex-1 max-w-[140px] h-1.5 rounded-full bg-surface-container-high overflow-hidden" aria-hidden="true">
                <span
                  className="block h-full rounded-full boton-degradado"
                  style={{ width: `${Math.max(4, Math.round(progresoDentroDelNivel(alumno.xp) * 100))}%` }}
                />
              </span>
            </span>
          </div>
          {alumno.racha >= 2 && (
            <span
              className="flex items-center gap-0.5 text-label-md font-mono font-bold text-secondary flex-shrink-0"
              title={`${alumno.racha} sesiones seguidas`}
            >
              <Icono nombre="local_fire_department" size={16} />
              {alumno.racha}
            </span>
          )}
          <span className="font-mono font-bold text-body-md flex-shrink-0 tabular-nums">{alumno.xp} XP</span>
        </li>
      ))}
    </ol>
  );
}
