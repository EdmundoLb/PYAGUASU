"use client";

import { useState } from "react";
import Icono from "./Icono";

export default function FormularioCrearClase({ onCrear }) {
  const [nombre, setNombre] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  async function enviar(e) {
    e.preventDefault();
    if (!nombre.trim()) return;
    setEnviando(true);
    setError("");
    try {
      await onCrear({ nombre: nombre.trim() });
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-3 bg-surface-container-lowest rounded-2xl p-4 shadow-elevation-2">
      <label htmlFor="nombre-clase" className="text-label-md font-mono text-on-surface-variant flex items-center gap-1.5">
        <Icono nombre="school" size={16} className="text-primary" />
        Nombre de la clase
      </label>
      <input
        id="nombre-clase"
        type="text"
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder='Ej. "3º B - Física"'
        className="w-full p-3 rounded-xl bg-surface-container-low text-on-surface placeholder:text-outline outline-none focus:bg-surface-container-high focus:ring-2 focus:ring-primary/30 transition-all text-body-md"
      />
      <button
        type="submit"
        disabled={!nombre.trim() || enviando}
        className="boton-degradado min-h-[52px] rounded-full text-title-md font-semibold shadow-elevation-2 disabled:opacity-50 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
      >
        <Icono nombre="add_circle" size={20} />
        {enviando ? "Creando..." : "Crear clase"}
      </button>
      {error && <p className="text-body-sm text-error">{error}</p>}
    </form>
  );
}
