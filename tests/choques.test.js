import { describe, it, expect } from 'vitest';
import { calcularChoque, redondear } from '@/lib/fisica/choques';

describe('calcularChoque', () => {
  it('perfectamente inelástico: el ejercicio de práctica (5 kg a 2 m/s, 3 kg a −10 m/s)', () => {
    const r = calcularChoque({ m1: 5, v1: 2, m2: 3, v2: -10, tipo: 'inelastico' });
    expect(r).toMatchObject({ p1: 10, p2: -30, pi: -20, masaTotal: 8, v1Final: -2.5, v2Final: -2.5, chocan: true });
    expect(r.pf).toBeCloseTo(r.pi);
  });

  it('perfectamente inelástico: el ejemplo del panel (4 kg a 6 m/s, 2 kg a −3 m/s)', () => {
    const r = calcularChoque({ m1: 4, v1: 6, m2: 2, v2: -3, tipo: 'inelastico' });
    expect(r).toMatchObject({ p1: 24, p2: -6, pi: 18, v1Final: 3 });
    expect(r.pf).toBeCloseTo(18);
  });

  it('elástico: conserva cantidad de movimiento y energía cinética', () => {
    for (const d of [
      { m1: 5, v1: 2, m2: 3, v2: -10 },
      { m1: 1, v1: 8, m2: 9, v2: 0 },
      { m1: 4, v1: 6, m2: 4, v2: -6 },
    ]) {
      const r = calcularChoque({ ...d, tipo: 'elastico' });
      expect(r.pf).toBeCloseTo(r.pi, 9);
      const ecAntes = 0.5 * d.m1 * d.v1 ** 2 + 0.5 * d.m2 * d.v2 ** 2;
      const ecDespues = 0.5 * d.m1 * r.v1Final ** 2 + 0.5 * d.m2 * r.v2Final ** 2;
      expect(ecDespues).toBeCloseTo(ecAntes, 9);
    }
  });

  it('elástico con masas iguales: intercambian velocidades', () => {
    const r = calcularChoque({ m1: 2, v1: 5, m2: 2, v2: -1, tipo: 'elastico' });
    expect(r.v1Final).toBeCloseTo(-1);
    expect(r.v2Final).toBeCloseTo(5);
  });

  it('si el de atrás no es más rápido, no chocan', () => {
    expect(calcularChoque({ m1: 2, v1: 1, m2: 2, v2: 3, tipo: 'inelastico' }).chocan).toBe(false);
    expect(calcularChoque({ m1: 2, v1: -4, m2: 2, v2: 0, tipo: 'inelastico' }).chocan).toBe(false);
  });

  it('redondear', () => {
    expect(redondear(-2.5)).toBe(-2.5);
    expect(redondear(2 / 3)).toBe(0.67);
    expect(Object.is(redondear(-0.001), 0)).toBe(true);
  });
});
