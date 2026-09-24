import RenderizadorMatematico from "./RenderizadorMatematico";

// Ciclamos entre los 3 tintes "fixed" ya definidos en el theme — nada de
// paleta nueva, solo evitamos que sea gris plano (era el elemento más visto
// de toda la app y el único 100% neutro).
const TINTES = [
  "bg-primary-fixed text-on-primary-fixed hover:bg-primary-fixed-dim",
  "bg-secondary-fixed text-on-secondary-fixed hover:bg-secondary-fixed-dim",
  "bg-tertiary-fixed text-on-tertiary-fixed hover:bg-tertiary-fixed-dim",
];

export default function ChipsRespuesta({ opciones, onElegir, disabled }) {
  if (!Array.isArray(opciones) || opciones.length === 0) return null;

  return (
    <div className="mensaje-nuevo flex flex-wrap gap-2" role="group" aria-label="Respuestas sugeridas">
      {opciones.map((texto, i) => (
        <button
          key={i}
          type="button"
          disabled={disabled}
          onClick={() => onElegir(texto)}
          aria-label={`Responder "${texto}"`}
          className={`min-h-[44px] px-4 rounded-full text-body-sm font-medium shadow-elevation-1 active:scale-[0.98] hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:hover:translate-y-0 ${TINTES[i % TINTES.length]}`}
        >
          <RenderizadorMatematico texto={texto} />
        </button>
      ))}
    </div>
  );
}
