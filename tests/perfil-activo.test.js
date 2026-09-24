import { describe, it, expect, beforeEach } from 'vitest';
import { guardarPerfilActivo, leerPerfilActivo, limpiarPerfilActivo, perfilActivoServidor } from '@/lib/identidad/perfilActivo';

// localStorage mínimo para correr en node.
beforeEach(() => {
  const datos = new Map();
  globalThis.window = {
    localStorage: {
      getItem: (k) => (datos.has(k) ? datos.get(k) : null),
      setItem: (k, v) => datos.set(k, String(v)),
      removeItem: (k) => datos.delete(k),
    },
  };
});

describe('perfilActivo', () => {
  it('guarda y lee el perfil', () => {
    guardarPerfilActivo({ id: 'alumno-1', rol: 'alumno' });
    expect(leerPerfilActivo()).toEqual({ id: 'alumno-1', rol: 'alumno' });
  });

  // useSyncExternalStore exige que getSnapshot devuelva el MISMO valor
  // (Object.is) mientras el store no cambió; si no, React entra en loop
  // ("Maximum update depth exceeded") en /ranking y las páginas /docente.
  it('el snapshot es estable mientras no cambie el perfil', () => {
    guardarPerfilActivo({ id: 'alumno-1', rol: 'alumno' });
    expect(Object.is(leerPerfilActivo(), leerPerfilActivo())).toBe(true);
  });

  it('el snapshot cambia cuando se guarda o se limpia el perfil', () => {
    guardarPerfilActivo({ id: 'alumno-1', rol: 'alumno' });
    const antes = leerPerfilActivo();
    guardarPerfilActivo({ id: 'alumno-1', rol: 'alumno', claseId: 'clase-1' });
    const despues = leerPerfilActivo();
    expect(despues).not.toBe(antes);
    expect(despues.claseId).toBe('clase-1');
    limpiarPerfilActivo();
    expect(leerPerfilActivo()).toBeNull();
  });

  it('el snapshot del servidor es undefined (distinto de "sin perfil")', () => {
    expect(perfilActivoServidor()).toBeUndefined();
  });
});
