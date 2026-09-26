// Avatar con iniciales y un color estable por nombre: ayuda a encontrar a
// alguien de un vistazo en listas largas (perfiles, ranking, alumnos) sin
// necesitar fotos. Colores fijos de marca, legibles en claro y oscuro.
const PALETAS = [
  "linear-gradient(135deg, #253ea7, #4a63d6)",
  "linear-gradient(135deg, #a23f00, #fd8041)",
  "linear-gradient(135deg, #00534a, #1f9c8b)",
  "linear-gradient(135deg, #6a2fa0, #a66ae0)",
  "linear-gradient(135deg, #9a1b4b, #e0507f)",
  "linear-gradient(135deg, #0b6aa8, #3fa9e8)",
];

function iniciales(nombre = "") {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function indicePorNombre(nombre = "") {
  let h = 0;
  for (const c of nombre) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % PALETAS.length;
}

export default function Avatar({ nombre, size = 40, className = "" }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold text-white flex-shrink-0 select-none ring-2 ring-surface-container-lowest ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38), background: PALETAS[indicePorNombre(nombre)] }}
      aria-hidden="true"
    >
      {iniciales(nombre)}
    </span>
  );
}
