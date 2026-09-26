import Icono from "./Icono";
import MascotaHero from "./MascotaHero";

const OPCIONES = [
  {
    valor: "alumno",
    titulo: "Soy alumno/a",
    descripcion: "Practicá paso a paso, sumá XP y competí en el ranking de tu clase.",
    icono: "school",
    acentoIcono: "bg-primary-fixed text-primary",
  },
  {
    valor: "docente",
    titulo: "Soy docente",
    descripcion: "Creá tu clase, armá el plan de contenido y seguí el progreso de tus alumnos.",
    icono: "co_present",
    acentoIcono: "bg-tertiary-fixed text-tertiary",
  },
];

// Lo que hace distinta a la app, en tres frases cortas (propuesta de valor
// visible ANTES de pedirle nada al usuario).
const PROMESAS = [
  { icono: "stairs", texto: "Paso a paso, sin darte todo resuelto" },
  { icono: "forum", texto: "Te habla en jopara, castellano o guaraní" },
  { icono: "bolt", texto: "Ganás XP e insignias mientras aprendés" },
];

export default function PantallaRol({ onSeleccionar }) {
  return (
    <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:items-center lg:min-h-[calc(100dvh-10rem)]">
      <section className="escalonado flex flex-col gap-3 sm:gap-4 items-center text-center lg:items-start lg:text-left">
        <MascotaHero size={132} className="w-[88px] h-[88px] sm:w-[132px] sm:h-[132px]" />
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-label-md font-semibold">
          <Icono nombre="waving_hand" size={16} />
          {"Mba'éichapa! Soy Profe Física"}
        </span>
        <h1 className="text-[38px] leading-[1.05] sm:text-[52px] font-bold tracking-tight text-on-surface">
          Física,{" "}
          <span className="bg-gradient-to-r from-primary via-primary-container to-secondary-container bg-clip-text text-transparent">
            sin miedo.
          </span>
        </h1>
        <p className="text-body-lg text-on-surface-variant leading-relaxed max-w-[44ch]">
          Tu tutor con IA que te acompaña a resolver cada problema — vos pensás, yo te guío.
        </p>
        {/* En celular se omite: la tarjeta de rol (la única acción) tiene
            que verse sin scrollear; "paso a paso" ya está en la bajada. */}
        <ul className="hidden sm:flex flex-col gap-2 w-full max-w-[420px] text-left">
          {PROMESAS.map((p) => (
            <li key={p.texto} className="flex items-center gap-3 text-body-md text-on-surface">
              <span className="w-8 h-8 rounded-xl bg-surface-container-lowest shadow-elevation-1 text-primary flex items-center justify-center flex-shrink-0">
                <Icono nombre={p.icono} size={18} />
              </span>
              {p.texto}
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-title-lg font-semibold text-on-surface">¿Cómo querés entrar?</h2>
        <div className="escalonado flex flex-col gap-3" role="group" aria-label="Rol en la app">
          {OPCIONES.map((opcion) => (
            <button
              key={opcion.valor}
              type="button"
              onClick={() => onSeleccionar(opcion.valor)}
              className="tarjeta-interactiva group flex items-center gap-4 p-4 sm:p-5 rounded-3xl bg-surface-container-lowest border border-surface-container-high shadow-elevation-2 text-left hover:border-primary/40"
            >
              <span className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${opcion.acentoIcono}`}>
                <Icono nombre={opcion.icono} size={30} />
              </span>
              <span className="flex-1 flex flex-col gap-1 min-w-0">
                <span className="text-title-lg font-semibold text-on-surface">{opcion.titulo}</span>
                <span className="text-body-sm text-on-surface-variant leading-snug">{opcion.descripcion}</span>
              </span>
              <span className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant group-hover:bg-primary group-hover:text-on-primary transition-colors duration-200 flex-shrink-0">
                <Icono nombre="arrow_forward" size={20} />
              </span>
            </button>
          ))}
        </div>
        <p className="flex items-center justify-center lg:justify-start gap-1.5 text-body-sm text-on-surface-variant mt-1">
          <Icono nombre="lock_open" size={16} />
          Sin contraseña: elegís tu perfil de una lista.
        </p>
      </section>
    </div>
  );
}
