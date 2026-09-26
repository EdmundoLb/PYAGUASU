import { useId } from "react";

// "Profe Física" en grande: el mismo personaje de MascotaProfe (la carita del
// chat), pero de cuerpo entero para bienvenida, estados vacíos y el cierre
// de un problema. Es el núcleo del logo (sol ñandutí + órbita + electrón)
// convertido en personaje. SVG puro con colores de marca fijos: se ve igual
// en modo claro y oscuro.
//
// estado: "feliz" | "pensando" | "celebrando"
const BOCAS = {
  feliz: <path d="M50 75 Q60 84 70 75" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" />,
  pensando: <path d="M52 78 Q60 75 68 78" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" />,
  celebrando: (
    <>
      <path d="M47 72 Q60 92 73 72 Z" fill="#0b1440" />
      <path d="M53 81 Q60 86 67 81 Q60 78 53 81 Z" fill="#fd8041" />
    </>
  ),
};

export default function MascotaHero({ estado = "feliz", size = 120, animada = true, className = "" }) {
  const id = useId().replace(/:/g, "");
  const mirada = estado === "pensando" ? { x: 2, y: -2 } : { x: 1, y: 1 };

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      className={`${animada ? "flotar" : ""} ${className}`}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`cuerpo-${id}`} cx="38%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#4a63d6" />
          <stop offset="60%" stopColor="#253ea7" />
          <stop offset="100%" stopColor="#00248f" />
        </radialGradient>
      </defs>

      {/* sombra en el piso */}
      <ellipse cx="60" cy="112" rx="26" ry="4" fill="#00248f" opacity="0.14" />

      {/* órbita detrás del cuerpo */}
      <ellipse
        cx="60"
        cy="64"
        rx="55"
        ry="17"
        fill="none"
        stroke="#b9c3ff"
        strokeWidth="2"
        strokeDasharray="4 5"
        transform="rotate(-16 60 64)"
        opacity="0.9"
      />

      {/* antena: rayo del sol ñandutí */}
      <line x1="60" y1="26" x2="60" y2="14" stroke="#b9c3ff" strokeWidth="3" strokeLinecap="round" />
      <circle cx="60" cy="11" r="5.5" fill="#fd8041" />

      {/* cuerpo */}
      <circle cx="60" cy="62" r="37" fill={`url(#cuerpo-${id})`} />
      <ellipse cx="46" cy="42" rx="13" ry="7" fill="#fff" opacity="0.16" transform="rotate(-20 46 42)" />

      {/* ojos */}
      <g className={animada ? "parpadear" : ""}>
        <ellipse cx="47" cy="59" rx="8.5" ry="9.5" fill="#fff" />
        <ellipse cx="73" cy="59" rx="8.5" ry="9.5" fill="#fff" />
        {estado === "celebrando" ? (
          <>
            <path d="M41 61 Q47 53 53 61" fill="none" stroke="#0b1440" strokeWidth="3" strokeLinecap="round" />
            <path d="M67 61 Q73 53 79 61" fill="none" stroke="#0b1440" strokeWidth="3" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx={47 + mirada.x} cy={60 + mirada.y} r="4.4" fill="#0b1440" />
            <circle cx={73 + mirada.x} cy={60 + mirada.y} r="4.4" fill="#0b1440" />
            <circle cx={48.5 + mirada.x} cy={58 + mirada.y} r="1.4" fill="#fff" />
            <circle cx={74.5 + mirada.x} cy={58 + mirada.y} r="1.4" fill="#fff" />
          </>
        )}
      </g>

      {/* cachetes */}
      <circle cx="37" cy="73" r="5" fill="#fd8041" opacity="0.55" />
      <circle cx="83" cy="73" r="5" fill="#fd8041" opacity="0.55" />

      {BOCAS[estado] || BOCAS.feliz}

      {/* parte delantera de la órbita (pasa por delante del cuerpo) */}
      <path
        d="M8.5 78 Q60 100 111.5 50"
        fill="none"
        stroke="#b9c3ff"
        strokeWidth="2"
        strokeDasharray="4 5"
        opacity="0.55"
        transform="rotate(-2 60 64)"
      />

      {/* electrón orbitando */}
      <g className={animada ? "orbitar" : ""}>
        <circle cx="113" cy="50" r="5" fill="#77d7c8" />
        <circle cx="113" cy="50" r="8.5" fill="#77d7c8" opacity="0.25" />
      </g>

      {estado === "celebrando" && (
        <g fill="#fd8041">
          <path d="M18 24 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" />
          <path d="M100 18 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5z" fill="#77d7c8" />
          <path d="M104 92 l1.5 3.5 3.5 1.5 -3.5 1.5 -1.5 3.5 -1.5 -3.5 -3.5 -1.5 3.5 -1.5z" />
        </g>
      )}
    </svg>
  );
}
