import { describe, it, expect } from 'vitest';
import { buscarConcepto } from '@/lib/conceptos';
import { CONCEPTO_CHOQUES } from '@/lib/conceptos/choques';
import { calcularChoque } from '@/lib/fisica/choques';
import { extraerNumeros } from '@/lib/ai/cierre';

describe('buscarConcepto', () => {
  it('encuentra choques por tema o por enunciado', () => {
    expect(buscarConcepto({ tema: 'Cantidad de movimiento' })?.id).toBe('choques');
    expect(buscarConcepto({ tema: 'Choques' })?.id).toBe('choques');
    expect(buscarConcepto({ tema: 'Física', enunciado: 'Dos autos chocan y quedan enganchados' })?.id).toBe('choques');
  });

  it('no muestra el botón en temas sin material cargado', () => {
    expect(buscarConcepto({ tema: 'Cinemática', enunciado: 'Un auto acelera de 0 a 20 m/s' })).toBeNull();
    expect(buscarConcepto({})).toBeNull();
  });
});

describe('contenido de choques', () => {
  it('el ejemplo resuelto coincide con la física (p₁, p₂, pᵢ, v\', p_f)', () => {
    const { datos, pasos } = CONCEPTO_CHOQUES.ejemplo;
    const r = calcularChoque({ ...datos, tipo: 'inelastico' });
    const ultimoNumero = (latex) => extraerNumeros(latex.replace(/\\text\{[^}]*\}/g, '')).at(-1);
    expect(ultimoNumero(pasos[0].latex)).toBe(r.p1);
    expect(ultimoNumero(pasos[1].latex)).toBe(r.p2);
    expect(ultimoNumero(pasos[2].latex)).toBe(r.pi);
    expect(ultimoNumero(pasos[3].latex)).toBe(r.v1Final);
    expect(r.pf).toBeCloseTo(r.pi);
  });

  it('el ejemplo NO usa los números del ejercicio de práctica (no regala la respuesta)', () => {
    expect(CONCEPTO_CHOQUES.ejemplo.datos).not.toEqual({ m1: 5, v1: 2, m2: 3, v2: -10 });
  });

  it('la fórmula general usa la velocidad final v\' (corrige el v1 del PDF)', () => {
    expect(CONCEPTO_CHOQUES.formulaGeneral.latex).toContain("(m_1 + m_2)\\,v'");
    expect(CONCEPTO_CHOQUES.formulaGeneral.latex).not.toMatch(/\(m_1 \+ m_2\)\s*\*?\s*v_1/);
  });

  it('los textos LaTeX no tienen caracteres de control (\\f de \\frac, \\t de \\text)', () => {
    const textos = [];
    const recorrer = (v) => {
      if (typeof v === 'string') textos.push(v);
      else if (Array.isArray(v)) v.forEach(recorrer);
      else if (v && typeof v === 'object' && !(v instanceof RegExp)) Object.values(v).forEach(recorrer);
    };
    recorrer(CONCEPTO_CHOQUES);
    expect(textos.length).toBeGreaterThan(20);
    for (const t of textos) expect(t, t).not.toMatch(/[\f\t\b\v]/);
    // Y el \frac / \text / \dfrac tienen que llegar con la barra.
    expect(textos.join(' ')).toContain('\\dfrac{');
  });
});
