import Icono from "./Icono";

export default function TablaAlumnosClase({ alumnos }) {
  const ordenados = [...alumnos].sort((a, b) => b.xp - a.xp);

  if (ordenados.length === 0) {
    return <p className="text-body-sm text-on-surface-variant">Todavía no hay alumnos en esta clase.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {ordenados.map((alumno) => (
        <div key={alumno.id} className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-lowest shadow-elevation-1">
          <span className="text-2xl flex-shrink-0">{alumno.avatarEmoji}</span>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-body-md font-semibold truncate">{alumno.nombre}</span>
            <span className="text-label-sm text-on-surface-variant">Nivel {alumno.nivel}</span>
          </div>
          {alumno.racha >= 2 && (
            <span className="flex items-center gap-1 text-label-sm font-mono font-bold text-secondary flex-shrink-0">
              <Icono nombre="local_fire_department" size={14} />
              {alumno.racha}
            </span>
          )}
          <span className="font-mono font-bold flex-shrink-0">{alumno.xp} XP</span>
        </div>
      ))}
    </div>
  );
}
