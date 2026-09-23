// Datos de ejemplo con los que arranca el store mock (ver db.js). Se corre
// una sola vez, la primera vez que algo llama a obtenerDb() en el proceso
// del servidor. La idea es que el ranking, el dashboard y el panel docente
// se vean "vivos" desde el primer arranque, sin que quien prueba la demo
// tenga que generar datos de otros alumnos a mano.

import { crearId } from './id';
import { calcularNivel } from '@/lib/gamificacion/niveles';
import { CATALOGO_INSIGNIAS } from '@/lib/gamificacion/insignias';

function crearPerfilAlumno(db, { nombre, avatarEmoji, xp, racha, insigniasIds = [] }) {
  const id = crearId('alumno');
  const perfil = {
    id,
    rol: 'alumno',
    nombre,
    avatarEmoji,
    claseId: undefined, // se completa después de crear la clase
    xp,
    nivel: calcularNivel(xp),
    racha,
    insigniasIds,
    creadoEn: new Date().toISOString(),
  };
  db.perfiles.set(id, perfil);
  return perfil;
}

function crearSesionHistorica(db, { alumnoId, tareaId, temaDetectado, enunciado, xpGanada, diasAtras }) {
  const id = crearId('sesion');
  const completadaEn = new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000).toISOString();
  const sesion = {
    id,
    alumnoId,
    tareaId,
    temaDetectado,
    enunciado,
    pasoActual: 3,
    totalPasosEstimados: 3,
    completada: true,
    aciertos: 3,
    errores: 0,
    rachaMaxima: 3,
    xpGanada,
    iniciadaEn: completadaEn,
    completadaEn,
  };
  db.sesiones.set(id, sesion);
  return sesion;
}

export function seedInicial(db) {
  // Catálogo de insignias disponibles (mismas para toda la app).
  for (const insignia of CATALOGO_INSIGNIAS) {
    db.insignias.set(insignia.id, insignia);
  }

  // Materia: solo Física está poblada con contenido real en el MVP.
  db.materias.set('fisica', { id: 'fisica', nombre: 'Física', poblada: true });

  // Docente.
  const docenteId = crearId('docente');
  db.perfiles.set(docenteId, {
    id: docenteId,
    rol: 'docente',
    nombre: 'Profe Rodríguez',
    avatarEmoji: '🧑‍🏫',
    materia: 'Física',
    xp: 0,
    nivel: 1,
    racha: 0,
    insigniasIds: [],
    creadoEn: new Date().toISOString(),
  });

  // Plan de contenido de Física.
  const temasDef = [
    { titulo: 'Cinemática', descripcion: 'Movimiento, velocidad y aceleración.', dificultadSugerida: 'facil' },
    { titulo: 'Dinámica y leyes de Newton', descripcion: 'Fuerzas y sus efectos sobre el movimiento.', dificultadSugerida: 'medio' },
    { titulo: 'Cantidad de movimiento', descripcion: 'Choques e impulso.', dificultadSugerida: 'medio' },
    { titulo: 'Trabajo y energía', descripcion: 'Trabajo mecánico, energía cinética y potencial.', dificultadSugerida: 'medio' },
    { titulo: 'Estática y equilibrio', descripcion: 'Cuerpos en reposo y equilibrio de fuerzas.', dificultadSugerida: 'dificil' },
  ];
  const temas = temasDef.map((t, i) => {
    const id = crearId('tema');
    const tema = { id, materiaId: 'fisica', orden: i + 1, ...t };
    db.temas.set(id, tema);
    return tema;
  });

  // Clase de ejemplo.
  const claseId = crearId('clase');

  // Alumnos con XP variada, para que el ranking se vea interesante desde
  // el arranque.
  const alumnosDef = [
    { nombre: 'Ana Benítez', avatarEmoji: '🦊', xp: 420, racha: 6, insigniasIds: ['primera_tarea', 'racha_5', 'impecable'] },
    { nombre: 'Diego Ovelar', avatarEmoji: '🐯', xp: 310, racha: 3, insigniasIds: ['primera_tarea', 'impecable'] },
    { nombre: 'Mía Ferreira', avatarEmoji: '🐨', xp: 275, racha: 2, insigniasIds: ['primera_tarea'] },
    { nombre: 'Tomás Duarte', avatarEmoji: '🦁', xp: 190, racha: 1, insigniasIds: ['primera_tarea'] },
    { nombre: 'Sofía Cabañas', avatarEmoji: '🐼', xp: 95, racha: 1, insigniasIds: [] },
    { nombre: 'Luis Acosta', avatarEmoji: '🐸', xp: 40, racha: 0, insigniasIds: [] },
  ];
  const alumnos = alumnosDef.map((def) => {
    const alumno = crearPerfilAlumno(db, def);
    alumno.claseId = claseId;
    return alumno;
  });

  db.clases.set(claseId, {
    id: claseId,
    nombre: "3º B - Física",
    materiaId: 'fisica',
    docenteId,
    codigoInvitacion: 'FIS3B01',
    alumnosIds: alumnos.map((a) => a.id),
    temasIds: temas.map((t) => t.id),
    creadaEn: new Date().toISOString(),
  });

  // Tareas asignadas por el docente (= sesiones de tutor configuradas).
  const tareasDef = [
    { tema: temas[0], titulo: 'Practicá cinemática básica', dificultad: 'facil', xpRecompensa: 30 },
    { tema: temas[2], titulo: 'Choques y cantidad de movimiento', dificultad: 'medio', xpRecompensa: 45 },
    { tema: temas[3], titulo: 'Trabajo y energía en la vida real', dificultad: 'medio', xpRecompensa: 45 },
  ];
  const tareas = tareasDef.map(({ tema, titulo, dificultad, xpRecompensa }) => {
    const id = crearId('tarea');
    const tarea = {
      id,
      claseId,
      temaId: tema.id,
      titulo,
      enunciadoSugerido: '',
      dificultad,
      fechaLimite: undefined,
      xpRecompensa,
      creadaPorId: docenteId,
      creadaEn: new Date().toISOString(),
    };
    db.tareas.set(id, tarea);
    return tarea;
  });

  // Historial de sesiones ya completadas, para que el dashboard y el
  // panel docente tengan contenido sin exigir jugar primero.
  crearSesionHistorica(db, {
    alumnoId: alumnos[0].id,
    tareaId: tareas[0].id,
    temaDetectado: 'Cinemática',
    enunciado: 'Un auto acelera de 0 a 20 m/s en 5 segundos, ¿cuál es su aceleración?',
    xpGanada: 35,
    diasAtras: 5,
  });
  crearSesionHistorica(db, {
    alumnoId: alumnos[0].id,
    tareaId: tareas[1].id,
    temaDetectado: 'Cantidad de movimiento',
    enunciado: 'Un auto de 1200 kg viaja a 20 m/s y choca contra otro de 800 kg en reposo, quedan enganchados.',
    xpGanada: 45,
    diasAtras: 1,
  });
  crearSesionHistorica(db, {
    alumnoId: alumnos[1].id,
    tareaId: tareas[0].id,
    temaDetectado: 'Cinemática',
    enunciado: 'Un ciclista recorre 100 m en 8 segundos, ¿cuál es su velocidad media?',
    xpGanada: 30,
    diasAtras: 3,
  });
}
