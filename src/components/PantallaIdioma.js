import Icono from "./Icono";

const OPCIONES = [
  {
    valor: "jopara",
    titulo: "Jopara",
    descripcion: "Castellano mezclado con guaraní paraguayo, como se habla en el día a día.",
    icono: "forum",
    acentoBorde: "border-primary",
    acentoIcono: "bg-primary text-on-primary",
    recomendado: true,
  },
  // Castellano como alternativa: la guía del hackathon pide jopara como
  // idioma esencial y castellano como opción, y el 26% de los estudiantes
  // dice confundirse con los idiomas cuando le explican.
  {
    valor: "castellano",
    titulo: "Castellano",
    descripcion: "Español simple y directo, sin mezclar con guaraní.",
    icono: "chat",
    acentoBorde: "border-secondary",
    acentoIcono: "bg-secondary text-on-secondary",
  },
  {
    valor: "guarani",
    titulo: "Guaraní",
    descripcion: "Guaraní paraguayo completo, sin mezclar con castellano.",
    icono: "translate",
    acentoBorde: "border-tertiary",
    acentoIcono: "bg-tertiary text-on-tertiary",
  },
];

export default function PantallaIdioma({ onSeleccionar }) {
  return (
    <div className="flex flex-col gap-5 pt-1">
      <section className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-secondary-fixed text-on-secondary-fixed shadow-elevation-1">
            <Icono nombre="translate" size={18} />
          </span>
          <span className="font-mono text-label-md uppercase tracking-wider text-secondary font-semibold">
            Antes de empezar
          </span>
        </div>
        <h1 className="text-headline-lg tracking-tight leading-tight">
          ¿En qué idioma querés que te hable tu profe?
        </h1>
        <p className="text-on-surface-variant text-body-md leading-relaxed">
          Elegí la variante que te resulte más natural.
        </p>
      </section>

      <div className="flex flex-col gap-3" role="radiogroup" aria-label="Idioma del tutor">
        {OPCIONES.map((opcion) => (
          <button
            key={opcion.valor}
            type="button"
            role="radio"
            aria-checked={false}
            onClick={() => onSeleccionar(opcion.valor)}
            className={`min-h-[72px] flex items-center gap-3 p-4 rounded-2xl bg-surface-container-lowest border-l-4 ${opcion.acentoBorde} shadow-elevation-2 text-left active:scale-[0.98] hover:shadow-elevation-3 transition-all duration-200`}
          >
            <span className={`inline-flex items-center justify-center w-11 h-11 rounded-full flex-shrink-0 shadow-elevation-1 ${opcion.acentoIcono}`}>
              <Icono nombre={opcion.icono} size={22} />
            </span>
            <span className="flex flex-col gap-0.5 min-w-0">
              <span className="text-title-md font-semibold flex items-center gap-2 flex-wrap">
                {opcion.titulo}
                {opcion.recomendado && (
                  <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed text-label-sm font-mono font-semibold">
                    Recomendado
                  </span>
                )}
              </span>
              <span className="text-body-sm text-on-surface-variant leading-snug">{opcion.descripcion}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
