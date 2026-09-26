import { describe, it, expect } from 'vitest';
import { detectarConceptos, contenidoEnTuEjercicio, incisosDelConcepto, GLOSARIO } from '@/lib/conceptos/glosario';

const ids = (texto) => detectarConceptos(texto).map((c) => c.id);
const ESCENA = { m1: 5, v1: 2, m2: 3, v2: -10, tipo: 'inelastico' };
const ENUNCIADO = `un bloque de 5kg ... choca de frente con otro bloque de 3kg que viene a su encuentro ... Averiguo
a La cantidad de movimiento inicial de cada bloque
b La cantidad de movimiento inicial del sistema
c La velocidad final
d La cantidad de movimiento final del sistema`;

describe('detectarConceptos (frases reales del tutor)', () => {
  it('choque inelástico y velocidad final', () => {
    expect(ids("Iporãiterei! Mokõive bloque opyta oñondive (choque inelástico). ¿Mboýpa pe velocidad final $v_f$?")).toEqual([
      'velocidad_final',
      'choque_inelastico',
    ]);
  });

  it('cantidad de movimiento del sistema (inciso b)', () => {
    expect(ids("jahecha la parte b: mboýpa ha'e pe cantidad de movimiento total inicial ($p_{total inicial}$) pe sistema-gui?")[0]).toBe(
      'cantidad_movimiento_sistema'
    );
  });

  it('cantidad de movimiento de un bloque y signo', () => {
    expect(ids('Como este bloque viene a su encuentro, su velocidad es negativa: ¿cuál es $p_2$?')).toEqual([
      'cantidad_movimiento',
      'signo_velocidad',
    ]);
  });

  it('"elástico" no se confunde con "inelástico"', () => {
    expect(ids('Es un choque perfectamente inelástico')).not.toContain('choque_elastico');
    expect(ids('En un choque elástico los cuerpos rebotan')).toContain('choque_elastico');
  });

  it('como máximo 2 chips por mensaje', () => {
    expect(ids('Choque inelástico: la velocidad final, la cantidad de movimiento del sistema, su conservación y la unidad').length).toBe(2);
  });

  it('mensajes sin conceptos → sin chips', () => {
    for (const t of ["Mba'éichapa! Eñeha'ã jey.", 'Ani rekyhyje jejavýgui.', '', undefined]) expect(ids(t)).toEqual([]);
  });

  it('todos los conceptos tienen título, ícono y explicación', () => {
    for (const [id, c] of Object.entries(GLOSARIO)) {
      expect(c.titulo, id).toBeTruthy();
      expect(c.icono, id).toBeTruthy();
      expect(c.explicacion.length, id).toBeGreaterThan(0);
    }
  });
});

describe('contenidoEnTuEjercicio', () => {
  it('mientras no termina, los resultados quedan en "?"', () => {
    const texto = ['cantidad_movimiento', 'cantidad_movimiento_sistema', 'velocidad_final', 'choque_inelastico']
      .flatMap((id) => contenidoEnTuEjercicio(id, ESCENA, false))
      .join(' ');
    expect(texto).toContain('$m_1 = 5\\text{ kg}$');
    expect(texto).toContain('$v_2 = -10\\text{ m/s}$');
    expect(texto).toContain('p_1 = ?');
    expect(texto).toContain("v' = ?");
    for (const resultado of ['10\\text{ kg·m/s}', '-30', '-20', '-2.5', '8\\text{ kg}']) expect(texto).not.toContain(resultado);
  });

  it('al terminar muestra los valores correctos', () => {
    expect(contenidoEnTuEjercicio('cantidad_movimiento', ESCENA, true).join(' ')).toMatch(/p_1 = 10\\text\{ kg·m\/s\}.*p_2 = -30\\text\{ kg·m\/s\}/);
    expect(contenidoEnTuEjercicio('cantidad_movimiento_sistema', ESCENA, true)[0]).toContain('-20\\text{ kg·m/s}');
    expect(contenidoEnTuEjercicio('velocidad_final', ESCENA, true)[1]).toContain("v' = -2.5\\text{ m/s}");
    expect(contenidoEnTuEjercicio('conservacion', ESCENA, true)[0]).toContain('p_f = p_i = -20');
  });

  it('se adapta al tipo de choque y al signo', () => {
    expect(contenidoEnTuEjercicio('velocidad_final', { ...ESCENA, tipo: 'elastico' }, false)[0]).toMatch(/rebotan/);
    expect(contenidoEnTuEjercicio('signo_velocidad', ESCENA, false)[0]).toMatch(/sentido contrario/);
    expect(contenidoEnTuEjercicio('signo_velocidad', { ...ESCENA, v2: 0 }, false)[0]).toMatch(/reposo/);
  });

  it('sin datos del choque → sin sección "en tu ejercicio"', () => {
    expect(contenidoEnTuEjercicio('velocidad_final', null)).toEqual([]);
  });
});

describe('incisosDelConcepto', () => {
  it('ejercicio del profe: cada concepto apunta a su inciso', () => {
    expect(incisosDelConcepto('cantidad_movimiento', ENUNCIADO)).toEqual(['a']);
    expect(incisosDelConcepto('cantidad_movimiento_sistema', ENUNCIADO)).toEqual(['b']);
    expect(incisosDelConcepto('velocidad_final', ENUNCIADO)).toEqual(['c']);
    expect(incisosDelConcepto('conservacion', ENUNCIADO)).toEqual(['d']);
    expect(incisosDelConcepto('signo_velocidad', ENUNCIADO)).toEqual([]);
  });
});
