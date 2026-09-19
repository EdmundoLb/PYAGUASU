export default function ChipDato({ etiqueta, valor }) {
  return (
    <div className="p-3 rounded-xl bg-surface-container-low flex flex-col gap-0.5 shadow-elevation-1">
      <span className="text-label-sm text-primary font-semibold uppercase tracking-wide">{etiqueta}</span>
      <span className="font-mono font-bold text-title-md text-on-surface">{valor}</span>
    </div>
  );
}
