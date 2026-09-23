"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icono from "@/components/Icono";
import FormularioCrearClase from "@/components/FormularioCrearClase";
import { leerPerfilActivo } from "@/lib/identidad/perfilActivo";

export default function NuevaClasePage() {
  const router = useRouter();
  const [perfil, setPerfil] = useState(null);

  useEffect(() => {
    const p = leerPerfilActivo();
    if (!p || p.rol !== "docente") {
      router.replace("/");
      return;
    }
    setPerfil(p);
  }, [router]);

  async function crearClase({ nombre }) {
    const res = await fetch("/api/clases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nombre, materiaId: "fisica", docenteId: perfil.id }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
    router.push(`/docente/clases/${data.clase.id}`);
  }

  return (
    <>
      <header className="sticky top-0 z-10 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-1 bg-gradient-to-r from-primary via-secondary-container to-tertiary" />
        <div className="max-w-[680px] mx-auto h-16 px-4 flex items-center gap-2">
          <Link href="/docente" className="min-h-[44px] inline-flex items-center gap-1.5 text-body-sm text-secondary underline underline-offset-2">
            <Icono nombre="arrow_back" size={16} />
            Tus clases
          </Link>
        </div>
      </header>

      <main className="flex-1 w-full max-w-[680px] mx-auto px-4 pt-6 pb-10 flex flex-col gap-5">
        <h1 className="text-headline-lg tracking-tight leading-tight">Crear una clase nueva</h1>
        {perfil && <FormularioCrearClase onCrear={crearClase} />}
      </main>
    </>
  );
}
