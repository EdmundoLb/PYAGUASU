// Carita simple para "Profe Física": sin pipeline de ilustración en el
// proyecto, así que en vez de un ícono genérico dibuja ojos+boca con SVG
// liviano (hereda color del contenedor vía currentColor, no agrega paleta
// nueva). Cambia de expresión según el mismo estado que ya calcula
// BurbujaChat (ACENTO_POR_ESTADO) — nunca cambia el texto, solo la cara.
const EXPRESIONES = {
  pensando: {
    ojos: (
      <>
        <circle cx="5" cy="6" r="1.1" />
        <circle cx="11" cy="6" r="1.1" />
      </>
    ),
    boca: <line x1="5.5" y1="10.5" x2="10.5" y2="10.5" />,
  },
  nueva: {
    ojos: (
      <>
        <circle cx="5" cy="6" r="1.1" />
        <circle cx="11" cy="6" r="1.1" />
      </>
    ),
    boca: <path d="M5.5,9.5 Q8,11.5 10.5,9.5" />,
  },
  correcta: {
    ojos: (
      <>
        <path d="M4,6.5 Q5,5 6,6.5" />
        <path d="M10,6.5 Q11,5 12,6.5" />
      </>
    ),
    boca: <path d="M4,9 Q8,13 12,9" />,
  },
  incorrecta: {
    ojos: (
      <>
        <circle cx="5" cy="6" r="1.1" />
        <circle cx="11" cy="6" r="1.1" />
      </>
    ),
    boca: <circle cx="8" cy="10.2" r="1.3" fill="none" />,
  },
};

export default function MascotaProfe({ estado = "nueva", size = 18, className = "" }) {
  const expresion = EXPRESIONES[estado] || EXPRESIONES.nueva;

  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.1"
      strokeLinecap="round"
      className={`mascota-viva ${className}`}
      aria-hidden="true"
    >
      <g fill="currentColor" stroke="none">
        {expresion.ojos}
      </g>
      <g fill="none">{expresion.boca}</g>
    </svg>
  );
}
