"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import Icono from "./Icono";
import { leerPerfilActivo } from "@/lib/identidad/perfilActivo";

// Navegación tipo app (ícono + etiqueta siempre juntos, nunca solo ícono):
// el público de esta app son alumnos y docentes con poca experiencia técnica,
// así que se usa el patrón más reconocible posible (la barra inferior de
// WhatsApp/Instagram/Duolingo), no un menú hamburguesa con submenús.
const PESTAÑAS = [
  { href: "/", icono: "smart_toy", etiqueta: "Practicar" },
  { href: "/dashboard", icono: "insights", etiqueta: "Progreso" },
  { href: "/ranking", icono: "leaderboard", etiqueta: "Ranking" },
];

export default function NavegacionInferior() {
  const pathname = usePathname();
  const [posicion, setPosicion] = useState(null);

  // Se resuelve acá (no en cada página) para que la medallita de posición
  // esté siempre visible, sin tener que entrar a /ranking para saberlo.
  useEffect(() => {
    const perfil = leerPerfilActivo();
    if (!perfil?.claseId) return;
    let cancelado = false;
    fetch(`/api/ranking/${perfil.claseId}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelado) return;
        const fila = (data.ranking || []).find((f) => f.id === perfil.id);
        if (fila) setPosicion(fila.posicion);
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, [pathname]);

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-0 inset-x-0 z-20 bg-surface/95 backdrop-blur-xl border-t border-surface-container-high pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="max-w-[680px] mx-auto grid grid-cols-3">
        {PESTAÑAS.map((pestaña) => {
          const activa = pestaña.href === "/" ? pathname === "/" : pathname.startsWith(pestaña.href);
          return (
            <Link
              key={pestaña.href}
              href={pestaña.href}
              aria-current={activa ? "page" : undefined}
              className="relative flex flex-col items-center gap-0.5 py-2.5 min-h-[56px] justify-center active:scale-[0.96] transition-transform duration-150"
            >
              <span
                className={`relative flex items-center justify-center w-9 h-9 rounded-full transition-colors duration-200 ${
                  activa ? "bg-primary-fixed text-on-primary-fixed" : "text-on-surface-variant"
                }`}
              >
                <Icono nombre={pestaña.icono} size={22} />
                {pestaña.href === "/ranking" && posicion && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-secondary text-on-secondary text-[10px] font-mono font-bold flex items-center justify-center leading-none">
                    #{posicion}
                  </span>
                )}
              </span>
              <span className={`text-label-sm font-semibold ${activa ? "text-primary" : "text-on-surface-variant"}`}>
                {pestaña.etiqueta}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
