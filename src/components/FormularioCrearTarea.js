"use client";

import { useState } from "react";
import Icono from "./Icono";

const DIFICULTADES = [
  { valor: "facil", etiqueta: "Fácil", xp: 30 },
  { valor: "medio", etiqueta: "Medio", xp: 45 },
  { valor: "dificil", etiqueta: "Difícil", xp: 60 },
];

export default function FormularioCrearTarea({ temas, onCrear }) {
  const [titulo, setTitulo] = useState("");
  const [temaId, setTemaId] = useState(temas[0]?.id || "");
  const [dificultad, setDificultad] = useState("medio");
  const [enviando, setEnviando] = useState(false);

  if (temas.length === 0) {
    return (
      <p className="text-body-sm text-on-surface-variant p-4 bg-surface-container-lowest rounded-2xl shadow-elevation-1">
        Agregá al menos un tema al plan de contenido antes de crear una tarea.
      </p>
    );
  }

  async function enviar(e) {
    e.preventDefault();
    if (!titulo.trim() || !temaId) return;
    setEnviando(true);
    try {
      const xpRecompensa = DIFICULTADES.find((d) => d.valor === dificultad)?.xp || 30;
      await onCrear({ titulo: titulo.trim(), temaId, dificultad, xpRecompensa });
      setTitulo("");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-2.5 bg-surface-container-lowest rounded-2xl p-4 shadow-elevation-2">
      <span className="text-label-md font-mono text-on-surface-variant flex items-center gap-1.5">
        <Icono nombre="assignment_add" size={16} className="text-primary" />
        Asignar tarea (sesión del tutor)
      </span>
      <input
        type="text"
        value={titulo}
        onChange={(e) => setTitulo(e.target.value)}
        placeholder="Ej. Practicá cinemática básica"
        className="w-full p-3 rounded-xl bg-surface-container-low text-on-surface placeholder:text-outline outline-none focus:bg-surface-container-high focus:ring-2 focus:ring-primary/30 transition-all text-body-md"
      />
      <select
        value={temaId}
        onChange={(e) => setTemaId(e.target.value)}
        className="w-full p-3 rounded-xl bg-surface-container-low text-on-surface outline-none focus:bg-surface-container-high text-body-md"
      >
        {temas.map((tema) => (
          <option key={tema.id} value={tema.id}>
            {tema.titulo}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        {DIFICULTADES.map((d) => (
          <button
            key={d.valor}
            type="button"
            onClick={() => setDificultad(d.valor)}
            className={`flex-1 min-h-[44px] rounded-xl text-body-sm font-semibold transition-all duration-200 ${
              dificultad === d.valor ? "bg-primary text-on-primary" : "bg-surface-container-low text-on-surface-variant"
            }`}
          >
            {d.etiqueta}
            <span className="block text-label-sm font-mono opacity-80">+{d.xp} XP</span>
          </button>
        ))}
      </div>
      <button
        type="submit"
        disabled={!titulo.trim() || enviando}
        className="min-h-[44px] rounded-full bg-primary text-on-primary font-semibold disabled:opacity-50 active:scale-[0.98] transition-all duration-200"
      >
        {enviando ? "Asignando..." : "Asignar tarea"}
      </button>
    </form>
  );
}
