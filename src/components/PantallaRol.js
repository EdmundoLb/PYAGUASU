import Icono from "./Icono";
import MascotaHero from "./MascotaHero";
import BotonInstalar from "./BotonInstalar";

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

// Lo que hace distinta a la app, como franja de datos cortos (idea de
// midu.dev): visible también en celular, y solo datos reales.
const DATOS = [
  { destacado: "3", texto: "idiomas" },
  { destacado: "Paso", texto: "a paso" },
  { destacado: "0", texto: "contraseñas" },
];

export default function PantallaRol({ onSeleccionar }) {
  return (
    <div className="grid gap-6 sm:gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:items-center lg:min-h-[calc(100dvh-10rem)]">
      <section className="escalonado flex flex-col gap-3 sm:gap-4 items-center text-center lg:items-start lg:text-left">
        <MascotaHero size={132} className="w-[88px] h-[88px] sm:w-[132px] sm:h-[132px]" />
        {/* Punto que late: el mismo "Profe en línea" del encabezado */}
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-lowest border border-surface-container-high shadow-elevation-1 text-label-md font-semibold text-on-surface">
          <span className="w-2 h-2 rounded-full bg-tertiary pulso-presencia" aria-hidden="true" />
          {"Néike, py'aguasu! Soy Profe Física"}
        </span>
        <h1 className="text-[38px] leading-[1.15] sm:text-[52px] font-bold tracking-tight text-on-surface">
          {/* "Física" en una cajita que brilla (idea de midu.dev) */}
          <span className="inline-block px-2.5 sm:px-3 py-0.5 mr-1 rounded-2xl border border-primary/30 bg-primary-fixed/60 text-primary shadow-[0_0_28px_-6px_color-mix(in_srgb,var(--color-primary)_55%,transparent)]">
            Física,
          </span>{" "}
          <span className="bg-gradient-to-r from-primary via-primary-container to-secondary-container bg-clip-text text-transparent">
            sin miedo.
          </span>
        </h1>
        <p className="text-body-lg text-on-surface-variant leading-relaxed max-w-[44ch]">
          Tu tutor con IA que te acompaña a resolver cada problema — vos pensás, yo te guío.
        </p>
        <ul className="flex items-stretch rounded-full border border-surface-container-high bg-surface-container-lowest/80 shadow-elevation-1 divide-x divide-surface-container-high text-body-sm">
          {DATOS.map((d) => (
            <li key={d.texto} className="px-3.5 sm:px-4 py-2 whitespace-nowrap text-on-surface-variant">
              <strong className="text-primary font-bold">{d.destacado}</strong> {d.texto}
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
        <BotonInstalar className="mt-2" />
      </section>
    </div>
  );
}
