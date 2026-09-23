// Repositorio de Perfil (alumno/docente). Único lugar que sabe cómo se
// guarda un perfil en el store mock — las API routes solo llaman a estas
// funciones, nunca tocan `obtenerDb()` directamente.

import { obtenerDb } from './db';
import { crearId } from './id';

export function listarPerfiles({ rol } = {}) {
  const db = obtenerDb();
  const todos = Array.from(db.perfiles.values());
  return rol ? todos.filter((p) => p.rol === rol) : todos;
}

export function obtenerPerfil(id) {
  return obtenerDb().perfiles.get(id) || null;
}

const AVATARES_DISPONIBLES = ['🦊', '🐯', '🐨', '🦁', '🐼', '🐸', '🦉', '🐢', '🦜', '🐙'];

export function crearPerfil({ rol, nombre, avatarEmoji }) {
  if (rol !== 'alumno' && rol !== 'docente') {
    throw new Error('rol debe ser "alumno" o "docente".');
  }
  if (!nombre || !nombre.trim()) {
    throw new Error('Falta el nombre del perfil.');
  }

  const db = obtenerDb();
  const id = crearId(rol);
  const avatar = avatarEmoji || AVATARES_DISPONIBLES[Math.floor(Math.random() * AVATARES_DISPONIBLES.length)];

  const perfil = {
    id,
    rol,
    nombre: nombre.trim(),
    avatarEmoji: avatar,
    xp: 0,
    nivel: 1,
    racha: 0,
    insigniasIds: [],
    creadoEn: new Date().toISOString(),
    ...(rol === 'docente' ? { materia: 'Física' } : { claseId: undefined }),
  };

  db.perfiles.set(id, perfil);
  return perfil;
}
