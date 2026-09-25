import { describe, it, expect } from 'vitest';
import { extraerEscenaDeEnunciado, sanearEscena } from '@/lib/fisica/escenaChoque';
import { formulasParaIncisos } from '@/lib/conceptos/incisos';

// Ejercicio planteado por el profe (tal cual lo escribió).
const EJERCICIO_PROFE = `un bloque de 5kg se desliza sobre una superficie sin rozamiento con una velocidad de 2m/seg y choca de frente con otro bloque de 3kg que viene a su encuentro con una velocidad de 10m/seg. Ambos quedan adheridos luego del choque y considerando que es perfectamente inelastico. Averiguo
a La cantidad de movimiento inicial de cada bloque
b La cantidad de movimiento inicial del sistema
c La velocidad final
d La cantidad de movimiento final del sistema`;

describe('extraerEscenaDeEnunciado', () => {
  it('ejercicio del profe: 5 kg a 2 m/s contra 3 kg a −10 m/s, inelástico', () => {
    expect(extraerEscenaDeEnunciado(EJERCICIO_PROFE)).toEqual({ m1: 5, v1: 2, m2: 3, v2: -10, tipo: 'inelastico' });
  });

  it('ejemplo de la app: el segundo en reposo', () => {
    const t = 'Un auto de 1200 kg viaja a 20 m/s y choca de frente contra otro auto de 800 kg que se encuentra en reposo. Después del impacto, ambos quedan enganchados.';
    expect(extraerEscenaDeEnunciado(t)).toEqual({ m1: 1200, v1: 20, m2: 800, v2: 0, tipo: 'inelastico' });
  });

  it('elástico y misma dirección (sin "a su encuentro" no cambia el signo)', () => {
    const t = 'Una bola de 2 kg a 6 m/s choca con otra de 1 kg que va a 1 m/s en la misma dirección. El choque es elástico.';
    expect(extraerEscenaDeEnunciado(t)).toEqual({ m1: 2, v1: 6, m2: 1, v2: 1, tipo: 'elastico' });
  });

  it('convierte km/h a m/s y gramos a kg', () => {
    const t = 'Un auto de 900 kg a 72 km/h choca con una moto de 150 kg que viene a su encuentro a 36 km/h. Quedan enganchados.';
    expect(extraerEscenaDeEnunciado(t)).toEqual({ m1: 900, v1: 20, m2: 150, v2: -10, tipo: 'inelastico' });
    const g = 'Una bala de 20 g a 300 m/s choca contra un bloque de 2 kg en reposo y queda incrustada, se mueven juntos.';
    expect(extraerEscenaDeEnunciado(g)).toEqual({ m1: 0.02, v1: 300, m2: 2, v2: 0, tipo: 'inelastico' });
  });

  it('la IA puede devolver los datos ya convertidos (72 km/h → 20 m/s)', () => {
    const t = 'Un auto de 900 kg a 72 km/h choca con una moto de 150 kg que viene a su encuentro a 36 km/h. Quedan enganchados.';
    expect(sanearEscena({ m1: 900, v1: 20, m2: 150, v2: -10, tipo: 'inelastico' }, t)).not.toBeNull();
  });

  it('no es un choque de dos cuerpos → null', () => {
    expect(extraerEscenaDeEnunciado('Un auto de 1000 kg acelera de 0 a 20 m/s en 5 s.')).toBeNull();
    expect(extraerEscenaDeEnunciado('Choca un camión de 5000 kg a 10 m/s.')).toBeNull();
    expect(extraerEscenaDeEnunciado(undefined)).toBeNull();
  });
});

describe('sanearEscena (datos de la IA)', () => {
  it('acepta datos que están en el enunciado', () => {
    expect(sanearEscena({ m1: 5, v1: 2, m2: 3, v2: -10, tipo: 'inelastico' }, EJERCICIO_PROFE)).toEqual({ m1: 5, v1: 2, m2: 3, v2: -10, tipo: 'inelastico' });
  });

  it('rechaza números inventados, masas no positivas o valores rotos', () => {
    expect(sanearEscena({ m1: 50, v1: 2, m2: 3, v2: -10 }, EJERCICIO_PROFE)).toBeNull();
    expect(sanearEscena({ m1: 0, v1: 2, m2: 3, v2: -10 }, EJERCICIO_PROFE)).toBeNull();
    expect(sanearEscena({ m1: '5', v1: 2, m2: 3, v2: -10 }, EJERCICIO_PROFE)).toBeNull();
    expect(sanearEscena(null, EJERCICIO_PROFE)).toBeNull();
  });
});

describe('formulasParaIncisos', () => {
  it('ejercicio del profe: a→p₁,p₂  b→pᵢ  c→v\'  d→p_f', () => {
    const incisos = formulasParaIncisos(EJERCICIO_PROFE);
    expect(incisos.map((i) => i.letra)).toEqual(['a', 'b', 'c', 'd']);
    expect(incisos[0].formulas).toEqual(['$p_1 = m_1 \\cdot v_1$', '$p_2 = m_2 \\cdot v_2$']);
    expect(incisos[1].formulas).toEqual(['$p_i = p_1 + p_2$']);
    expect(incisos[2].formulas[0]).toContain("v' =");
    expect(incisos[3].formulas[0]).toContain('p_f');
  });

  it('también con "a)" y en una sola línea', () => {
    const t = 'Dos carros chocan. a) Calculá la velocidad final. b) Calculá la cantidad de movimiento final del sistema.';
    expect(formulasParaIncisos(t).map((i) => i.letra)).toEqual(['a', 'b']);
  });

  it('sin incisos → vacío', () => {
    expect(formulasParaIncisos('Un auto de 1200 kg choca contra otro. ¿Cuál es la velocidad final?')).toEqual([]);
  });
});
