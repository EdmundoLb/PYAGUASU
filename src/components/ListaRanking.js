import Icono from "./Icono";
import Avatar from "./Avatar";

// Orden visual del podio: 2º a la izquierda, 1º al centro (más alto), 3º a
// la derecha — el patrón que cualquiera reconoce de una premiación.
const ORDEN_PODIO = [2, 1, 3];
const ESTILO_PODIO = {
  1: { alto: "h-28", medalla: "linear-gradient(135deg, #ffd766, #e0a200)", avatar: 64 },
  2: { alto: "h-20", medalla: "linear-gradient(135deg, #e6e9f2, #9aa3b8)", avatar: 52 },
  3: { alto: "h-14", medalla: "linear-gradient(135deg, #f3b98a, #b8662c)", avatar: 52 },
};

function Podio({ ranking, alumnoActivoId }) {
  return (
    <div className="grid grid-cols-3 items-end gap-2 pt-2" aria-label="Podio">
      {ORDEN_PODIO.map((pos) => {
        const fila = ranking.find((f) => f.posicion === pos);
        if (!fila) return <div key={pos} />;
        const estilo = ESTILO_PODIO[pos];
        const esUno = fila.id === alumnoActivoId;
        return (
          <div key={fila.id} className="flex flex-col items-center gap-1.5 min-w-0">
            <div className="relative">
              {pos === 1 && (
                <Icono nombre="crown" size={26} className="absolute -top-6 left-1/2 -translate-x-1/2 text-[#e0a200]" />
              )}
              <Avatar nombre={fila.nombre} size={estilo.avatar} className={esUno ? "ring-4 !ring-primary" : ""} />
            </div>
            <span className="text-body-sm font-semibold text-on-surface truncate max-w-full px-1">
              {fila.nombre.split(" ")[0]}
              {esUno && " (vos)"}
            </span>
            <span className="font-mono text-label-md font-bold text-on-surface-variant">{fila.xp} XP</span>
            <div
              className={`w-full ${estilo.alto} rounded-t-2xl flex items-start justify-center pt-2 shadow-elevation-2`}
              style={{ background: estilo.medalla }}
            >
              <span className="font-mono font-bold text-[22px] text-white drop-shadow">{pos}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function ListaRanking({ ranking, alumnoActivoId }) {
  const conPodio = ranking.length >= 3;
  const resto = conPodio ? ranking.filter((f) => f.posicion > 3) : ranking;

  return (
    <div className="flex flex-col gap-4">
      {conPodio && <Podio ranking={ranking} alumnoActivoId={alumnoActivoId} />}
      {resto.length > 0 && (
        <ol className="flex flex-col rounded-3xl bg-surface-container-lowest border border-surface-container-high shadow-elevation-1 overflow-hidden divide-y divide-surface-container-high">
          {resto.map((fila) => {
            const esUno = fila.id === alumnoActivoId;
            return (
              <li
                key={fila.id}
                aria-current={esUno ? "true" : undefined}
                className={`flex items-center gap-3 px-4 py-3 ${esUno ? "bg-primary-fixed text-on-primary-fixed" : ""}`}
              >
                <span className="w-7 text-center font-mono font-bold text-title-md text-on-surface-variant flex-shrink-0">
                  {fila.posicion}
                </span>
                <Avatar nombre={fila.nombre} size={38} />
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-body-md font-semibold truncate">
                    {fila.nombre}
                    {esUno && " (vos)"}
                  </span>
                  <span className="text-label-sm text-on-surface-variant">Nivel {fila.nivel}</span>
                </div>
                {fila.racha >= 2 && (
                  <span className="flex items-center gap-0.5 text-label-md font-mono font-bold text-secondary flex-shrink-0" title={`${fila.racha} sesiones seguidas`}>
                    <Icono nombre="local_fire_department" size={16} />
                    {fila.racha}
                  </span>
                )}
                <span className="font-mono font-bold text-body-md flex-shrink-0 tabular-nums">{fila.xp} XP</span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
