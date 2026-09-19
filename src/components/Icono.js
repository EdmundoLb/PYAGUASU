export default function Icono({ nombre, className = "", size = 20 }) {
  return (
    <span
      className={`material-symbols-outlined leading-none select-none ${className}`}
      style={{ fontSize: size }}
      aria-hidden="true"
    >
      {nombre}
    </span>
  );
}
