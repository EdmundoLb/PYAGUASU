import MascotaHero from "./MascotaHero";

// Estado vacío con la mascota: "todavía no hay nada" se convierte en una
// invitación a hacer algo, en vez de una línea de texto gris suelta.
export default function EstadoVacio({ titulo, descripcion, estado = "feliz", children }) {
  return (
    <div className="flex flex-col items-center text-center gap-2 px-6 py-8 rounded-3xl bg-surface-container-lowest border border-dashed border-outline-variant">
      <MascotaHero estado={estado} size={88} />
      <p className="text-title-md font-semibold text-on-surface mt-1">{titulo}</p>
      {descripcion && <p className="text-body-sm text-on-surface-variant max-w-[36ch] leading-relaxed">{descripcion}</p>}
      {children && <div className="mt-2">{children}</div>}
    </div>
  );
}
