import Icono from "./Icono";
import PasosOnboarding from "./PasosOnboarding";

const OPCIONES = [
  {
    valor: "jopara",
    titulo: "Jopara",
    descripcion: "Castellano mezclado con guaraní paraguayo, como se habla en el día a día.",
    // Una frase de muestra: se entiende mejor la diferencia "escuchando"
    // cómo te va a hablar el profe que leyendo una definición. Tomada de la
    // base jopara del equipo (L001, confianza "Consolidado") — no inventar
    // frases acá sin pasar por el lingüista.
    muestra: "Mba'éichapa! Jahecha ko ejercicio.",
    icono: "forum",
    acentoIcono: "bg-primary-fixed text-primary",
    recomendado: true,
  },
  // Castellano como alternativa: la guía del hackathon pide jopara como
  // idioma esencial y castellano como opción, y el 26% de los estudiantes
  // dice confundirse con los idiomas cuando le explican.
  {
    valor: "castellano",
    titulo: "Castellano",
    descripcion: "Español simple y directo, sin mezclar con guaraní.",
    muestra: "¡Hola! Veamos este ejercicio.",
    icono: "chat",
    acentoIcono: "bg-secondary-fixed text-secondary",
  },
  {
    valor: "guarani",
    titulo: "Guaraní",
    descripcion: "Guaraní paraguayo completo, sin mezclar con castellano.",
    icono: "translate",
    acentoIcono: "bg-tertiary-fixed text-tertiary",
  },
];

export default function PantallaIdioma({ onSeleccionar }) {
  return (
    <div className="flex flex-col gap-6 pt-1">
      <PasosOnboarding actual="idioma" />
      <section className="flex flex-col gap-1.5">
        <h1 className="text-[30px] leading-tight font-bold tracking-tight">
          ¿En qué idioma te hablo?
        </h1>
        <p className="text-on-surface-variant text-body-md leading-relaxed">
          Elegí el que te salga más natural. Lo podés cambiar cuando quieras.
        </p>
      </section>

      <div className="escalonado flex flex-col gap-3" role="group" aria-label="Idioma del tutor">
        {OPCIONES.map((opcion) => (
          <button
            key={opcion.valor}
            type="button"
            onClick={() => onSeleccionar(opcion.valor)}
            className={`tarjeta-interactiva group relative flex items-start gap-4 p-4 sm:p-5 rounded-3xl bg-surface-container-lowest border shadow-elevation-2 text-left ${
              opcion.recomendado ? "border-primary/40" : "border-surface-container-high"
            }`}
          >
            <span className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${opcion.acentoIcono}`}>
              <Icono nombre={opcion.icono} size={26} />
            </span>
            <span className="flex-1 flex flex-col gap-1 min-w-0">
              <span className="text-title-lg font-semibold flex items-center gap-2 flex-wrap">
                {opcion.titulo}
                {opcion.recomendado && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full boton-degradado text-label-sm font-semibold">
                    <Icono nombre="star" size={12} />
                    Recomendado
                  </span>
                )}
              </span>
              <span className="text-body-sm text-on-surface-variant leading-snug">{opcion.descripcion}</span>
              {opcion.muestra && (
                <span className="mt-1.5 self-start max-w-full px-3 py-1.5 rounded-2xl rounded-tl-sm bg-surface-container text-body-sm text-on-surface italic">
                  “{opcion.muestra}”
                </span>
              )}
            </span>
            <Icono
              nombre="arrow_forward"
              size={22}
              className="self-center text-outline group-hover:text-primary group-hover:translate-x-0.5 transition-all duration-200 flex-shrink-0"
            />
          </button>
        ))}
      </div>
    </div>
  );
}
