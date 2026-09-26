import { useId } from "react";

// Logo de la app: la cara del Profe en versión "ícono de app" (sin sombra,
// sin brillitos y sin flotar) dentro de un cuadrado lila. Es de la misma
// familia que MascotaHero, pero no compite con ella: la mascota grande sigue
// siendo la protagonista y esto es su sello.
//
// Además reacciona al estado del Profe que muestra el encabezado:
// "feliz" (en línea) | "pensando" | "celebrando" | "dormido" (sin conexión).
// Los mismos trazos están en public/logo.svg y src/app/icon.svg (versión
// "feliz", estática): si se cambia el dibujo acá, cambiarlo allá también.

const OJOS = {
  feliz: { dx: 0.4, dy: 0.5 },
  pensando: { dx: 1, dy: -1.3 },
};

function Ojos({ estado }) {
  if (estado === "celebrando") {
    return (
      <g fill="none" stroke="#0b1440" strokeWidth="1.9" strokeLinecap="round">
        <path d="M16 27 Q19 23.2 22 27" />
        <path d="M26 27 Q29 23.2 32 27" />
      </g>
    );
  }
  if (estado === "dormido") {
    return (
      <g fill="none" stroke="#0b1440" strokeWidth="1.9" strokeLinecap="round">
        <path d="M16.3 26.6 Q19 28.2 21.7 26.6" />
        <path d="M26.3 26.6 Q29 28.2 31.7 26.6" />
      </g>
    );
  }
  const { dx, dy } = OJOS[estado] || OJOS.feliz;
  return (
    <>
      <circle cx={19 + dx} cy={26 + dy} r="1.9" fill="#0b1440" />
      <circle cx={29 + dx} cy={26 + dy} r="1.9" fill="#0b1440" />
      <circle cx={19.7 + dx} cy={25.2 + dy} r="0.65" fill="#fff" />
      <circle cx={29.7 + dx} cy={25.2 + dy} r="0.65" fill="#fff" />
    </>
  );
}

const BOCAS = {
  feliz: <path d="M20.6 31.3 Q24 34.3 27.4 31.3" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />,
  pensando: <path d="M21.8 32.6 L26.6 31.4" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />,
  celebrando: <path d="M20 30.6 Q24 36.6 28 30.6 Z" fill="#0b1440" />,
  dormido: <path d="M22.2 32 L25.8 32" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />,
};

export default function LogoMarca({ estado = "feliz", size = 40, className = "" }) {
  const id = useId().replace(/:/g, "");

  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`fondo-${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f1f3ff" />
          <stop offset="100%" stopColor="#c9d1ff" />
        </linearGradient>
        <radialGradient id={`cuerpo-${id}`} cx="38%" cy="30%" r="75%">
          <stop offset="0%" stopColor="#4a63d6" />
          <stop offset="60%" stopColor="#253ea7" />
          <stop offset="100%" stopColor="#00248f" />
        </radialGradient>
      </defs>

      <rect width="48" height="48" rx="13" fill={`url(#fondo-${id})`} />

      {/* órbita (mitad de atrás) */}
      <ellipse cx="24" cy="28" rx="20" ry="6.5" fill="none" stroke="#1f9c8b" strokeWidth="2" transform="rotate(-16 24 28)" />

      {/* antena: el rayo del sol ñandutí del logo anterior */}
      <line x1="24" y1="14" x2="24" y2="8.5" stroke="#253ea7" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="24" cy="7" r="3" fill="#fd8041" />

      {/* cuerpo */}
      <circle cx="24" cy="27" r="13.5" fill={`url(#cuerpo-${id})`} />
      <ellipse cx="19" cy="19.5" rx="5" ry="2.6" fill="#fff" opacity="0.18" transform="rotate(-20 19 19.5)" />

      {/* cara (cambia según el estado) */}
      <g key={estado}>
        <ellipse cx="19" cy="26" rx="3.4" ry="3.9" fill="#fff" />
        <ellipse cx="29" cy="26" rx="3.4" ry="3.9" fill="#fff" />
        <Ojos estado={estado} />
        {BOCAS[estado] || BOCAS.feliz}
      </g>

      {/* órbita (mitad de adelante, pasa por delante del cuerpo) */}
      <path d="M44 28 A20 6.5 0 0 1 4 28" fill="none" stroke="#1f9c8b" strokeWidth="2" strokeLinecap="round" transform="rotate(-16 24 28)" />
      {/* electrón */}
      <circle cx="43.2" cy="22.5" r="2.4" fill="#77d7c8" stroke="#1f9c8b" strokeWidth="1" />
    </svg>
  );
}
