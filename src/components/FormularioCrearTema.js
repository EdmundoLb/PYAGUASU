"use client";

import { useState } from "react";
import Icono from "./Icono";

export default function FormularioCrearTema({ onCrear }) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    if (!titulo.trim()) return;
    setEnviando(true);
    try {
      await onCrear({ titulo: titulo.trim(), descripcion: descripcion.trim() });
      setTitulo("");
      setDescripcion("");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-2.5 bg-surface-container-lowest rounded-2xl p-4 shadow-elevation-2">
      <span className="text-label-md font-mono text-on-surface-variant flex items-center gap-1.5">
        <Icono nombre="add" size={16} className="text-primary" />
        Agregar tema al plan de contenido
      </span>
      <input
        type="text"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Ej. Ondas mecánicas"
        className="w-full p-3 rounded-xl bg-surface-container-low text-on-surface placeholder:text-outline outline-none focus:bg-surface-container-high focus:ring-2 focus:ring-primary/30 transition-all text-body-md"
      />
      <input
        type="text"
        value={descripcion}
        onChange={(e) => setDescripcion(e.target.value)}
        placeholder="Descripción corta (opcional)"
        className="w-full p-3 rounded-xl bg-surface-container-low text-on-surface placeholder:text-outline outline-none focus:bg-surface-container-high focus:ring-2 focus:ring-primary/30 transition-all text-body-md"
      />
      <button
        type="submit"
        disabled={!titulo.trim() || enviando}
        className="min-h-[44px] rounded-full bg-primary text-on-primary font-semibold disabled:opacity-50 active:scale-[0.98] transition-all duration-200"
      >
        {enviando ? "Agregando..." : "Agregar tema"}
      </button>
    </form>
  );
}
