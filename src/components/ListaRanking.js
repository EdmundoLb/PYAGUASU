import Icono from "./Icono";

const MEDALLA = { 1: "🥇", 2: "🥈", 3: "🥉" };

export default function ListaRanking({ ranking, alumnoActivoId }) {
  return (
    <div className="flex flex-col gap-2">
      {ranking.map((fila) => {
        const esUno = fila.id === alumnoActivoId;
        return (
          <div
            key={fila.id}
            className={`flex items-center gap-3 p-3 rounded-2xl shadow-elevation-1 ${
              esUno ? "bg-primary-fixed text-on-primary-fixed" : "bg-surface-container-lowest"
            }`}
          >
            <span className="w-8 text-center font-mono font-bold text-title-md flex-shrink-0">
              {MEDALLA[fila.posicion] || fila.posicion}
            </span>
            <span className="text-2xl flex-shrink-0">{fila.avatarEmoji}</span>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-body-md font-semibold truncate">
                {fila.nombre}
                {esUno && " (vos)"}
              </span>
              <span className="text-label-sm text-on-surface-variant">Nivel {fila.nivel}</span>
            </div>
            {fila.racha >= 2 && (
              <span className="flex items-center gap-1 text-label-sm font-mono font-bold text-secondary flex-shrink-0">
                <Icono nombre="local_fire_department" size={14} />
                {fila.racha}
              </span>
            )}
            <span className="font-mono font-bold flex-shrink-0">{fila.xp} XP</span>
          </div>
        );
      })}
    </div>
  );
}
