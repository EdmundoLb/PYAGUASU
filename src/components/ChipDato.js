import RenderizadorMatematico from "./RenderizadorMatematico";

// La etiqueta también pasa por el renderizador: la IA a veces la manda con
// LaTeX ("Velocidad inicial ($v_0$)") y antes se veía el "$v_0$" crudo. Sin
// `uppercase`, que además convertía las variables (v → V).
export default function ChipDato({ etiqueta, valor }) {
  return (
    <div className="p-3 rounded-2xl bg-surface-container-low border border-surface-container-high flex flex-col gap-1">
      <span className="text-label-md text-primary font-semibold leading-tight">
        <RenderizadorMatematico texto={etiqueta} />
      </span>
      <span className="font-mono font-bold text-title-lg text-on-surface">
        <RenderizadorMatematico texto={valor} />
      </span>
    </div>
  );
}
