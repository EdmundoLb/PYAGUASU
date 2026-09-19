import Icono from "./Icono";

export default function Encabezado({ conectado }) {
  return (
    <header className="sticky top-0 z-10 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="max-w-[680px] mx-auto h-16 sm:h-18 px-4 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <img src="/logo.svg" alt="" width={40} height={40} className="rounded-xl shadow-elevation-1 flex-shrink-0" />
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-title-md leading-none tracking-tight truncate">
              Néike Pyahureko
            </span>
            <div className="flex items-center gap-1 mt-1">
              <span
                className={`inline-block w-1.5 h-1.5 rounded-full ${
                  conectado ? "bg-tertiary animate-pulse" : "bg-outline"
                }`}
              />
              <span className="text-label-sm font-mono uppercase tracking-wider text-on-surface-variant">
                {conectado ? "IA conectada" : "Sin conexión a la IA"}
              </span>
            </div>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tertiary-fixed text-on-tertiary-fixed text-label-sm font-semibold flex-shrink-0">
          <Icono nombre="function" size={14} />
          Física · Nivel medio
        </span>
      </div>
    </header>
  );
}
