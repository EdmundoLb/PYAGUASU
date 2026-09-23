// Ranking de una clase, ordenado por XP — la pieza que le da el efecto
// "tipo Kahoot" al modo alumno.

import { obtenerDb } from './db';

export function calcularRankingDeClase(claseId) {
  const db = obtenerDb();
  const clase = db.clases.get(claseId);
  if (!clase) return [];

  return clase.alumnosIds
    .map((id) => db.perfiles.get(id))
    .filter(Boolean)
    .sort((a, b) => b.xp - a.xp)
    .map((alumno, i) => ({
      posicion: i + 1,
      id: alumno.id,
      nombre: alumno.nombre,
      avatarEmoji: alumno.avatarEmoji,
      xp: alumno.xp,
      nivel: alumno.nivel,
      racha: alumno.racha,
    }));
}
