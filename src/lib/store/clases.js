// Repositorio de Clase, Tema y Tarea (el "plan de contenido" y las tareas
// asignadas por el docente). Las tareas son sesiones del tutor IA
// configuradas — no hay un banco de preguntas separado.

import { obtenerDb } from './db';
import { crearId } from './id';
import { obtenerPerfil } from './perfiles';

function generarCodigoInvitacion(materiaId) {
  const prefijo = (materiaId || 'CLS').slice(0, 3).toUpperCase();
  const sufijo = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefijo}${sufijo}`;
}

export function listarClasesDeDocente(docenteId) {
  const db = obtenerDb();
  return Array.from(db.clases.values()).filter((c) => c.docenteId === docenteId);
}

export function crearClase({ nombre, materiaId, docenteId }) {
  if (!nombre || !nombre.trim()) throw new Error('Falta el nombre de la clase.');
  if (!docenteId) throw new Error('Falta el docente de la clase.');

  const db = obtenerDb();
  const id = crearId('clase');
  const clase = {
    id,
    nombre: nombre.trim(),
    materiaId: materiaId || 'fisica',
    docenteId,
    codigoInvitacion: generarCodigoInvitacion(materiaId),
    alumnosIds: [],
    temasIds: [],
    creadaEn: new Date().toISOString(),
  };
  db.clases.set(id, clase);
  return clase;
}

// Detalle enriquecido para el panel docente: la clase + sus temas, tareas y
// el resumen de progreso de cada alumno.
export function obtenerClaseDetalle(claseId) {
  const db = obtenerDb();
  const clase = db.clases.get(claseId);
  if (!clase) return null;

  const temas = clase.temasIds.map((id) => db.temas.get(id)).filter(Boolean);
  const tareas = Array.from(db.tareas.values()).filter((t) => t.claseId === claseId);
  const alumnos = clase.alumnosIds
    .map((id) => obtenerPerfil(id))
    .filter(Boolean)
    .map((alumno) => ({
      id: alumno.id,
      nombre: alumno.nombre,
      avatarEmoji: alumno.avatarEmoji,
      xp: alumno.xp,
      nivel: alumno.nivel,
      racha: alumno.racha,
      insigniasIds: alumno.insigniasIds,
    }));

  return { ...clase, temas, tareas, alumnos };
}

export function unirseAClasePorCodigo({ alumnoId, codigo }) {
  const db = obtenerDb();
  const alumno = obtenerPerfil(alumnoId);
  if (!alumno || alumno.rol !== 'alumno') throw new Error('Perfil de alumno inválido.');

  const clase = Array.from(db.clases.values()).find(
    (c) => c.codigoInvitacion.toUpperCase() === String(codigo || '').toUpperCase()
  );
  if (!clase) throw new Error('No existe ninguna clase con ese código.');

  if (!clase.alumnosIds.includes(alumnoId)) clase.alumnosIds.push(alumnoId);
  alumno.claseId = clase.id;
  return clase;
}

export function agregarTema({ claseId, titulo, descripcion, dificultadSugerida }) {
  if (!titulo || !titulo.trim()) throw new Error('Falta el título del tema.');

  const db = obtenerDb();
  const clase = db.clases.get(claseId);
  if (!clase) throw new Error('Clase inexistente.');

  const id = crearId('tema');
  const tema = {
    id,
    materiaId: clase.materiaId,
    titulo: titulo.trim(),
    descripcion: descripcion || '',
    orden: clase.temasIds.length + 1,
    dificultadSugerida: dificultadSugerida || 'medio',
  };
  db.temas.set(id, tema);
  clase.temasIds.push(id);
  return tema;
}

export function agregarTarea({ claseId, temaId, titulo, dificultad, xpRecompensa, enunciadoSugerido, creadaPorId }) {
  if (!titulo || !titulo.trim()) throw new Error('Falta el título de la tarea.');

  const db = obtenerDb();
  const clase = db.clases.get(claseId);
  if (!clase) throw new Error('Clase inexistente.');
  if (!db.temas.get(temaId)) throw new Error('Tema inexistente.');

  const id = crearId('tarea');
  const tarea = {
    id,
    claseId,
    temaId,
    titulo: titulo.trim(),
    enunciadoSugerido: enunciadoSugerido || '',
    dificultad: dificultad || 'medio',
    xpRecompensa: Number.isFinite(xpRecompensa) ? xpRecompensa : 30,
    creadaPorId,
    creadaEn: new Date().toISOString(),
  };
  db.tareas.set(id, tarea);
  return tarea;
}

// Tareas de la clase del alumno, marcando cuáles ya completó (para
// distinguir pendientes de hechas en su dashboard).
export function listarTareasDeAlumno(alumnoId) {
  const db = obtenerDb();
  const alumno = obtenerPerfil(alumnoId);
  if (!alumno || !alumno.claseId) return [];

  const tareas = Array.from(db.tareas.values()).filter((t) => t.claseId === alumno.claseId);
  const sesiones = Array.from(db.sesiones.values()).filter((s) => s.alumnoId === alumnoId && s.completada);
  const tareaIdsCompletadas = new Set(sesiones.map((s) => s.tareaId).filter(Boolean));

  return tareas.map((tarea) => ({
    ...tarea,
    tema: db.temas.get(tarea.temaId) || null,
    completada: tareaIdsCompletadas.has(tarea.id),
  }));
}
