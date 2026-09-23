import Icono from "./Icono";

export default function IndicadorProgreso({ pasoActual, totalPasos, racha = 0 }) {
  if (!totalPasos) return null;
  const segmentos = Array.from({ length: totalPasos }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-label-md font-mono uppercase tracking-wider text-secondary font-bold">
          Resolución guiada
        </span>
        <div className="flex items-center gap-1.5">
          {racha >= 2 && (
            <span className="mensaje-nuevo racha-viva flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r from-secondary-container to-secondary text-on-secondary font-mono text-label-sm font-bold">
              <Icono nombre="local_fire_department" size={13} />
              {racha}
            </span>
          )}
          <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-mono text-label-sm font-bold">
            Paso {Math.min(pasoActual, totalPasos)} de {totalPasos}
          </span>
        </div>
      </div>
      <div
        key={totalPasos}
        className="mensaje-nuevo grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${totalPasos}, minmax(0, 1fr))` }}
      >
        {segmentos.map((s) => {
          const cerrado = s < pasoActual;
          const activo = s === pasoActual;
          return (
            <div
              key={s}
              className={`h-1.5 rounded-full transition-colors duration-300 flex items-center justify-center overflow-hidden ${
                cerrado ? "bg-tertiary-container" : activo ? "bg-primary" : "bg-surface-container-highest"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
