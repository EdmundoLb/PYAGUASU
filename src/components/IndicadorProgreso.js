export default function IndicadorProgreso({ pasoActual, totalPasos }) {
  if (!totalPasos) return null;
  const segmentos = Array.from({ length: totalPasos }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-label-md font-mono uppercase tracking-wider text-secondary font-bold">
          Resolución guiada
        </span>
        <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-mono text-label-sm font-bold">
          Paso {Math.min(pasoActual, totalPasos)} de {totalPasos}
        </span>
      </div>
      <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${totalPasos}, minmax(0, 1fr))` }}>
        {segmentos.map((s) => (
          <div
            key={s}
            className={`h-1.5 rounded-full transition-colors duration-300 ${
              s <= pasoActual ? "bg-primary" : "bg-surface-container-highest"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
