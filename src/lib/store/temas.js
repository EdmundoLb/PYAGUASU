// Catálogo público de temas: a diferencia de clases.js (que solo expone
// temas a través de clase.temasIds), esto lista los temas de cualquier
// materia poblada SIN pasar por ninguna clase — es lo que le permite a un
// alumno practicar un tema por su cuenta, sin pertenecer a ningún curso.

import { obtenerDb } from './db';

export function listarTemasPoblados() {
  const db = obtenerDb();
  const materiasPobladas = new Set(
    Array.from(db.materias.values())
      .filter((m) => m.poblada)
      .map((m) => m.id)
  );
  return Array.from(db.temas.values())
    .filter((t) => materiasPobladas.has(t.materiaId))
    .sort((a, b) => a.orden - b.orden);
}
