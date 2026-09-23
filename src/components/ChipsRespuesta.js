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
          className="min-h-[44px] px-4 rounded-full bg-surface-container-high text-on-surface-variant text-body-sm font-medium shadow-elevation-1 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 hover:bg-surface-container-highest"
        >
          {texto}
        </button>
      ))}
    </div>
  );
}
