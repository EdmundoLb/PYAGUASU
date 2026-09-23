// Repositorio de SesionTutor: registra cada ejecución del tutor IA y es el
// punto donde se conecta esa conversación (stateless, en lib/ai/*) con
// XP/nivel/insignias. El tutor en sí nunca sabe que esto existe.

import { obtenerDb } from './db';
import { crearId } from './id';
import { obtenerPerfil } from './perfiles';
import { calcularNivel, calcularXpGanada } from '@/lib/gamificacion/niveles';
import { evaluarInsigniasNuevas } from '@/lib/gamificacion/insignias';

export function iniciarSesion({ alumnoId, tareaId, enunciado }) {
  const db = obtenerDb();
  const alumno = obtenerPerfil(alumnoId);
  if (!alumno || alumno.rol !== 'alumno') throw new Error('Perfil de alumno inválido.');
  if (tareaId && !db.tareas.get(tareaId)) throw new Error('Tarea inexistente.');

  const id = crearId('sesion');
  const sesion = {
    id,
    alumnoId,
    tareaId: tareaId || undefined,
    temaDetectado: '',
    enunciado: enunciado || '',
    pasoActual: 1,
    totalPasosEstimados: null,
    completada: false,
    aciertos: 0,
    errores: 0,
    rachaMaxima: 0,
    xpGanada: 0,
    iniciadaEn: new Date().toISOString(),
  };
  db.sesiones.set(id, sesion);
  return sesion;
}

export function completarSesion({ sesionId, temaDetectado, errores = 0, rachaMaxima = 0 }) {
  const db = obtenerDb();
  const sesion = db.sesiones.get(sesionId);
  if (!sesion) throw new Error('Sesión inexistente.');
  if (sesion.completada) {
    // Idempotente: si ya se completó (ej. doble click), no se vuelve a
    // otorgar XP de nuevo.
    return { xpGanada: 0, nivelNuevo: obtenerPerfil(sesion.alumnoId)?.nivel, subioDeNivel: false, insigniasNuevas: [] };
  }

  const tarea = sesion.tareaId ? db.tareas.get(sesion.tareaId) : null;
  const xpGanada = calcularXpGanada({ errores, xpRecompensaTarea: tarea?.xpRecompensa || 0 });

  sesion.completada = true;
  sesion.completadaEn = new Date().toISOString();
  sesion.temaDetectado = temaDetectado || sesion.temaDetectado;
  sesion.errores = errores;
  sesion.rachaMaxima = rachaMaxima;
  sesion.xpGanada = xpGanada;

  const perfil = obtenerPerfil(sesion.alumnoId);
  const nivelAnterior = perfil.nivel;
  perfil.xp += xpGanada;
  perfil.nivel = calcularNivel(perfil.xp);
  perfil.racha += 1;

  const sesionesCompletadas = Array.from(db.sesiones.values()).filter(
    (s) => s.alumnoId === perfil.id && s.completada
  );
  const insigniasNuevas = evaluarInsigniasNuevas({ perfil, sesionesCompletadas, sesionRecien: sesion });
  perfil.insigniasIds = [...perfil.insigniasIds, ...insigniasNuevas];

  return {
    xpGanada,
    nivelNuevo: perfil.nivel,
    subioDeNivel: perfil.nivel > nivelAnterior,
    insigniasNuevas,
  };
}

// Resumen de progreso para el dashboard del alumno: perfil + historial de
// sesiones completadas (más reciente primero) + insignias con su detalle.
export function obtenerProgresoAlumno(alumnoId) {
  const db = obtenerDb();
  const perfil = obtenerPerfil(alumnoId);
  if (!perfil) return null;

  const historial = Array.from(db.sesiones.values())
    .filter((s) => s.alumnoId === alumnoId && s.completada)
    .sort((a, b) => new Date(b.completadaEn) - new Date(a.completadaEn));

  const insignias = perfil.insigniasIds.map((id) => db.insignias.get(id)).filter(Boolean);

  return { perfil, historial, insignias };
}
