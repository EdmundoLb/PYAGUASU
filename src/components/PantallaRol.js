import Icono from "./Icono";

const OPCIONES = [
  {
    valor: "alumno",
    titulo: "Soy alumno/a",
    descripcion: "Quiero practicar, ver mi progreso y competir en el ranking de mi clase.",
    icono: "school",
    acentoBorde: "border-primary",
    acentoIcono: "bg-primary text-on-primary",
  },
  {
    valor: "docente",
    titulo: "Soy docente",
    descripcion: "Quiero crear mi clase, armar el plan de contenido y ver el progreso de mis alumnos.",
    icono: "co_present",
    acentoBorde: "border-tertiary",
    acentoIcono: "bg-tertiary text-on-tertiary",
  },
];

export default function PantallaRol({ onSeleccionar }) {
  return (
    <div className="flex flex-col gap-5 pt-1">
      <section className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-secondary-fixed text-on-secondary-fixed shadow-elevation-1">
            <Icono nombre="waving_hand" size={18} />
          </span>
          <span className="font-mono text-label-md uppercase tracking-wider text-secondary font-semibold">
            Antes de empezar
          </span>
        </div>
        <h1 className="text-headline-lg tracking-tight leading-tight">¿Sos alumno/a o docente?</h1>
        <p className="text-on-surface-variant text-body-md leading-relaxed">
          No hace falta contraseña: elegí tu rol y después tu perfil de la lista.
        </p>
      </section>

      <div className="flex flex-col gap-3" role="radiogroup" aria-label="Rol en la app">
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
              <span className="text-title-md font-semibold">{opcion.titulo}</span>
              <span className="text-body-sm text-on-surface-variant leading-snug">{opcion.descripcion}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
