// Catálogo de insignias del MVP y las reglas para desbloquearlas. Reglas
// simples y deterministas (nada de azar), evaluadas cada vez que un alumno
// completa una sesión del tutor (ver store/repositorios/sesiones.js).

export const CATALOGO_INSIGNIAS = [
  {
    id: 'primera_tarea',
    nombre: 'Primer paso',
    icono: 'flag',
    descripcion: 'Completaste tu primer problema con el tutor.',
  },
  {
    id: 'racha_5',
    nombre: 'Racha de fuego',
    icono: 'local_fire_department',
    descripcion: 'Llegaste a una racha de 5 sesiones seguidas con actividad.',
  },
  {
    id: 'impecable',
    nombre: 'Impecable',
    icono: 'auto_awesome',
    descripcion: 'Resolviste un problema entero sin ningún error.',
  },
  {
    id: 'multi_tema',
    nombre: 'Explorador',
    icono: 'explore',
    descripcion: 'Resolviste problemas de 3 temas distintos.',
  },
];

/**
 * Devuelve los ids de insignias nuevas que corresponde otorgar, dado el
 * estado del perfil DESPUÉS de sumar el XP de la sesión recién completada
 * y el historial completo de sesiones completadas de ese alumno (incluida
 * la que se acaba de cerrar).
 */
export function evaluarInsigniasNuevas({ perfil, sesionesCompletadas, sesionRecien }) {
  const yaTiene = new Set(perfil.insigniasIds);
  const nuevas = [];

  const otorgar = (id) => {
    if (!yaTiene.has(id) && !nuevas.includes(id)) nuevas.push(id);
  };

  if (sesionesCompletadas.length >= 1) otorgar('primera_tarea');
  if (perfil.racha >= 5) otorgar('racha_5');
  if (sesionRecien.errores === 0) otorgar('impecable');

  const temasDistintos = new Set(sesionesCompletadas.map((s) => s.temaDetectado).filter(Boolean));
  if (temasDistintos.size >= 3) otorgar('multi_tema');

  return nuevas;
}
