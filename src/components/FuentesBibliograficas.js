import Icono from "./Icono";

// Referencias bibliográficas del MEC de las que salen los conceptos, en letra
// chica debajo del concepto (formato APA: autor. (año). *Título*. Resto.).
export default function FuentesBibliograficas({ fuentes, className = "" }) {
  if (!fuentes?.length) return null;
  return (
    <div className={`flex flex-col gap-1 pt-2 border-t border-surface-container-high ${className}`}>
      <span className="flex items-center gap-1 text-label-sm font-semibold text-on-surface-variant">
        <Icono nombre="menu_book" size={14} />
        Fuentes
      </span>
      <ul className="flex flex-col gap-1">
        {fuentes.map((f) => (
          <li key={`${f.autor}-${f.anio}-${f.titulo}`} className="text-[11px] leading-snug text-on-surface-variant pl-5 -indent-3">
            {f.autor}. ({f.anio}). <cite className="italic">{f.titulo}</cite>.{f.resto ? ` ${f.resto}` : ""}
            {f.detalle && <span className="block not-italic">{f.detalle}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}
