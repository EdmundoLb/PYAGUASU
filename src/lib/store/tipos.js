// Formas de datos del mock backend en memoria (sin TypeScript, JSDoc puro,
// mismo estilo que lib/quiz/diagnostico.js y lib/ai/schema.js). Este archivo
// no exporta nada ejecutable: es documentación viva de las entidades que
// vive en el store (src/lib/store/db.js) y que las API routes devuelven.
//
// ⚠️ Es un MVP de demo: no hay base de datos real, todo vive en memoria del
// proceso del servidor (ver db.js) y se pierde al reiniciarlo.

/**
 * @typedef {Object} Perfil
 * @property {string} id
 * @property {'alumno'|'docente'} rol
 * @property {string} nombre
 * @property {string} avatarEmoji
 * @property {string} [claseId] - solo alumnos: clase actual (1 clase por alumno en el MVP)
 * @property {string} [materia] - solo docentes: materia que dicta (default 'Física')
 * @property {number} xp - solo alumnos
 * @property {number} nivel - solo alumnos, derivado de xp pero cacheado
 * @property {number} racha - sesiones/días consecutivos con actividad
 * @property {string[]} insigniasIds
 * @property {string} creadoEn - ISO string
 */

/**
 * @typedef {Object} Materia
 * @property {string} id - ej. 'fisica'
 * @property {string} nombre - ej. 'Física'
 * @property {boolean} poblada - true solo para 'fisica' en el MVP
 */

/**
 * @typedef {Object} Clase
 * @property {string} id
 * @property {string} nombre - ej. "3º B - Física"
 * @property {string} materiaId
 * @property {string} docenteId
 * @property {string} codigoInvitacion - ej. "FIS3B01"
 * @property {string[]} alumnosIds
 * @property {string[]} temasIds - plan de contenido, ordenado
 * @property {string} creadaEn
 */

/**
 * @typedef {Object} Tema
 * Nodo del plan de contenido del docente. Genérico por materia.
 * @property {string} id
 * @property {string} materiaId
 * @property {string} titulo - ej. "Cantidad de movimiento"
 * @property {string} descripcion
 * @property {number} orden
 * @property {'facil'|'medio'|'dificil'} dificultadSugerida
 */

/**
 * @typedef {Object} Tarea
 * Una tarea = una sesión del tutor IA configurada y asignada a una clase.
 * @property {string} id
 * @property {string} claseId
 * @property {string} temaId
 * @property {string} titulo
 * @property {string} [enunciadoSugerido] - opcional, precargado por el docente
 * @property {'facil'|'medio'|'dificil'} dificultad
 * @property {string} [fechaLimite] - ISO, solo informativa en el MVP
 * @property {number} xpRecompensa
 * @property {string} creadaPorId - docenteId
 * @property {string} creadaEn
 */

/**
 * @typedef {Object} SesionTutor
 * Registro de una ejecución del tutor, vinculada o no a una Tarea. Es la
 * pieza que conecta el chat existente (api/tutor) con progreso/XP.
 * @property {string} id
 * @property {string} alumnoId
 * @property {string} [tareaId] - ausente si fue práctica libre
 * @property {string} temaDetectado - viene de turno.tema
 * @property {string} enunciado
 * @property {number} pasoActual
 * @property {number} totalPasosEstimados
 * @property {boolean} completada
 * @property {number} aciertos
 * @property {number} errores
 * @property {number} rachaMaxima
 * @property {number} xpGanada
 * @property {string} iniciadaEn
 * @property {string} [completadaEn]
 */

/**
 * @typedef {Object} Insignia
 * @property {string} id - ej. 'racha_5', 'primera_tarea', 'top_clase'
 * @property {string} nombre
 * @property {string} icono - nombre de Material Symbol, para <Icono/>
 * @property {string} descripcion
 */

export {};
