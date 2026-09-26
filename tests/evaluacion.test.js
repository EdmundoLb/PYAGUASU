import { describe, it, expect } from 'vitest';
import { esFalsoIncorrecto, quitarRespuestaDeSugerencias, valorCorrectoDelPaso, faltaUnidadEnRespuesta, avanzoSinUnidad, reveloResultado, estaPidiendoUnidad, opcionesDeUnidad, esChipNumerico } from '@/lib/ai/evaluacion';

// Caso reportado: "sumá 10 kg·m/s y -30 kg·m/s"; el estudiante respondió
// "-20 kg·m/s" (correcto) y el tutor dijo "¡Casi!", ofreciendo "-20" como opción.
const turnoReportado = {
  correcta: false,
  esIntento: true,
  mensaje: '¡Casi! Acordate de sumar ambas cantidades de movimiento. ¿Cuánto da esa suma?',
  verificacionRespuesta: { expresion: '10 + (-30)' },
  opcionesRespuesta: ['$-20\\text{ kg·m/s}$', '$40\\text{ kg·m/s}$', '$-40\\text{ kg·m/s}$'],
  requiereOpcion: false,
  opciones: [],
};

describe('esFalsoIncorrecto', () => {
  it('caso reportado: "-20 kg·m/s" marcado incorrecto → falso incorrecto', () => {
    expect(valorCorrectoDelPaso(turnoReportado)).toBe(-20);
    expect(esFalsoIncorrecto({ turno: turnoReportado, mensaje: '-20 kg·m/s' })).toBe(true);
  });

  it('acepta otros formatos del mismo valor y mira el último número', () => {
    for (const mensaje of ['−20', '-20,0 kg m/s', '10 + (-30) = -20', '-19.8']) {
      expect(esFalsoIncorrecto({ turno: turnoReportado, mensaje }), mensaje).toBe(true);
    }
  });

  it('una respuesta realmente incorrecta no se toca (incluido el signo)', () => {
    for (const mensaje of ['40', '20 kg·m/s', '-40', '-20 + 10 = -10', 'no sé']) {
      expect(esFalsoIncorrecto({ turno: turnoReportado, mensaje }), mensaje).toBe(false);
    }
  });

  it('no aplica a pedidos de ayuda, a no-intentos, a turnos correctos ni sin cuenta', () => {
    expect(esFalsoIncorrecto({ turno: turnoReportado, mensaje: '-20', pedirAyuda: true })).toBe(false);
    expect(esFalsoIncorrecto({ turno: { ...turnoReportado, esIntento: false }, mensaje: '-20' })).toBe(false);
    expect(esFalsoIncorrecto({ turno: { ...turnoReportado, correcta: true }, mensaje: '-20' })).toBe(false);
    expect(esFalsoIncorrecto({ turno: { ...turnoReportado, verificacionRespuesta: undefined }, mensaje: '-20' })).toBe(false);
    expect(esFalsoIncorrecto({ turno: { ...turnoReportado, verificacionRespuesta: { expresion: 'sum(1)' } }, mensaje: '-20' })).toBe(false);
  });
});

describe('unidades', () => {
  // Caso reportado: "-20" (sin unidad) y el tutor dijo "¡Correcto!" y avanzó.
  const avanzo = {
    correcta: true,
    mensaje: 'Iporãiterei! ... mboýpa la masa total del sistema?',
    verificacionRespuesta: { expresion: '10 + (-30)', unidad: 'kg·m/s' },
  };

  it('detecta respuestas sin unidad', () => {
    for (const t of ['-20', '−20', 'p = -20', '-20.0', '10 + (-30) = -20']) expect(faltaUnidadEnRespuesta(t), t).toBe(true);
    for (const t of ['-20 kg·m/s', '-20 kg * m/s', '-20 kgm/seg', '-20 (kg m/s)', 'no sé']) expect(faltaUnidadEnRespuesta(t), t).toBe(false);
  });

  it('caso reportado: avanzó con "-20" sin unidad → hay que corregir', () => {
    expect(avanzoSinUnidad({ turno: avanzo, mensaje: '-20' })).toBe(true);
  });

  it('no aplica si puso unidad, si el número es otro, si el paso no tiene unidad o si no avanzó', () => {
    expect(avanzoSinUnidad({ turno: avanzo, mensaje: '-20 kg·m/s' })).toBe(false);
    expect(avanzoSinUnidad({ turno: avanzo, mensaje: '40' })).toBe(false);
    expect(avanzoSinUnidad({ turno: { ...avanzo, verificacionRespuesta: { expresion: '2+2', unidad: '' } }, mensaje: '4' })).toBe(false);
    expect(avanzoSinUnidad({ turno: { ...avanzo, correcta: false }, mensaje: '-20' })).toBe(false);
    expect(avanzoSinUnidad({ turno: avanzo, mensaje: '-20', pedirAyuda: true })).toBe(false);
  });

  it('pedir la unidad (correcta=false) no se confunde con un falso "incorrecto"', () => {
    const pideUnidad = { correcta: false, esIntento: true, verificacionRespuesta: { expresion: '10 + (-30)', unidad: 'kg·m/s' } };
    expect(esFalsoIncorrecto({ turno: pideUnidad, mensaje: '-20' })).toBe(false);
    expect(esFalsoIncorrecto({ turno: pideUnidad, mensaje: '-20 kg·m/s' })).toBe(true);
  });
});

describe('reveloResultado (escalera de pistas)', () => {
  // Caso reportado: p₁ de un auto de 1200 kg a 20 m/s; el alumno dijo "800".
  const historial = [{ autor: 'estudiante', texto: 'Un auto de 1200 kg a 20 m/s choca con otro de 800 kg en reposo...' }];
  const revelo = {
    correcta: false,
    esIntento: true,
    mensaje: 'Ñamyatyrõ oñondive: $12 \\cdot 2 = 24$, ha upe rire ñamoĩ mbohapy cero, upéva da $24000\\text{ kg·m/s}$. Ko\'ág̃a pe mokõiha auto: ¿mboýpa $p_2$?',
    formula: '$p_1 = 24000\\text{ kg·m/s}$',
    verificacionRespuesta: { expresion: '1200*20', unidad: 'kg·m/s' },
  };

  it('caso reportado: "800" incorrecto y el tutor mostró 24000 → hay que corregir', () => {
    expect(reveloResultado({ turno: revelo, mensaje: '800', historial })).toBe(true);
  });

  it('una pista sin el resultado está bien (aunque use los datos del enunciado)', () => {
    const pista = { ...revelo, mensaje: 'Oĩ peteĩ jejavy\'i: 800 kg ha\'e pe mokõiha auto masa. Emañamína: $p_1 = m_1 \\cdot v_1$, ¿mba\'épa pe $m_1$?', formula: '' };
    expect(reveloResultado({ turno: pista, mensaje: '800', historial })).toBe(false);
  });

  it('no aplica a "Mostrame este paso", a aciertos ni a no-intentos', () => {
    expect(reveloResultado({ turno: revelo, mensaje: '', historial, pedirAyuda: true })).toBe(false);
    expect(reveloResultado({ turno: { ...revelo, correcta: true }, mensaje: '24000', historial })).toBe(false);
    expect(reveloResultado({ turno: { ...revelo, esIntento: false }, mensaje: 'no sé', historial })).toBe(false);
  });

  it('si el valor ya estaba en la conversación (lo dijo el alumno o era un dato), no cuenta como revelar', () => {
    expect(reveloResultado({ turno: revelo, mensaje: '24000', historial })).toBe(false);
  });
});

describe('quitarRespuestaDeSugerencias', () => {
  it('caso reportado: nunca quedan solo opciones incorrectas para tocar (se sacan todas las numéricas)', () => {
    // Antes se sacaba solo la correcta (10) y quedaban "7" y "2.5": una trampa.
    const turno = { ...turnoReportado, verificacionRespuesta: { expresion: '5*2' }, opcionesRespuesta: ['10 kg·m/s', '7 kg·m/s', '2.5 kg·m/s'] };
    expect(quitarRespuestaDeSugerencias(turno).opcionesRespuesta).toEqual([]);
    expect(quitarRespuestaDeSugerencias(turnoReportado).opcionesRespuesta).toEqual([]);
  });

  it('se mantienen los chips de ayuda, fórmulas y unidades', () => {
    const turno = { ...turnoReportado, opcionesRespuesta: ['No sé por dónde empezar', '¿Qué fórmula uso?', '$p = m \\cdot v$', 'kg·m/s', '-20', '$2.5$'] };
    expect(quitarRespuestaDeSugerencias(turno).opcionesRespuesta).toEqual(['No sé por dónde empezar', '¿Qué fórmula uso?', '$p = m \\cdot v$', 'kg·m/s']);
  });

  it('esChipNumerico reconoce números con o sin unidad y no confunde fórmulas', () => {
    for (const t of ['10', '−20', '2,5', '10 kg·m/s', '$2.5\\text{ kg·m/s}$', '24000 kg m/s', '9.8 m/s²']) expect(esChipNumerico(t), t).toBe(true);
    for (const t of ['kg·m/s', '$v = \\frac{d}{t}$', '$E_c = \\frac{1}{2} m v^2$', 'No sé', 'Paso 2 otra vez']) expect(esChipNumerico(t), t).toBe(false);
  });

  it('opción múltiple con la respuesta numérica pasa a respuesta libre', () => {
    const quiz = { ...turnoReportado, requiereOpcion: true, opciones: [{ texto: '$-20$', correcta: true }, { texto: '$40$' }] };
    expect(quitarRespuestaDeSugerencias(quiz)).toMatchObject({ requiereOpcion: false, opciones: [] });
  });

  it('también al avanzar de paso: sin números para tocar, pero se mantiene la opción múltiple conceptual', () => {
    const avanza = { ...turnoReportado, correcta: true, opcionesRespuesta: ['8 kg', 'No sé'], requiereOpcion: true, opciones: [{ texto: '$v = \\frac{d}{t}$', correcta: true }, { texto: '$p = m v$' }] };
    const r = quitarRespuestaDeSugerencias(avanza);
    expect(r.opcionesRespuesta).toEqual(['No sé']);
    expect(r).toMatchObject({ requiereOpcion: true });
    expect(r.opciones).toHaveLength(2);
  });
});

describe('opciones de unidad', () => {
  const pideUnidad = { correcta: false, esIntento: false, opcionesRespuesta: [], verificacionRespuesta: { expresion: '10 + (-30)', unidad: 'kg·m/s' } };

  it('caso reportado: "-20" sin unidad → el tutor está pidiendo la unidad', () => {
    expect(estaPidiendoUnidad({ turno: pideUnidad, mensaje: '-20' })).toBe(true);
    expect(estaPidiendoUnidad({ turno: pideUnidad, mensaje: '-20 kg·m/s' })).toBe(false);
    expect(estaPidiendoUnidad({ turno: { ...pideUnidad, esIntento: true }, mensaje: '40' })).toBe(false);
  });

  it('arma 4 opciones con la correcta incluida, sin repetir', () => {
    for (const u of ['kg·m/s', 'm/s', 'N', 'kg*m/seg']) {
      const ops = opcionesDeUnidad(u);
      expect(ops).toHaveLength(4);
      expect(ops).toContain(u);
      expect(new Set(ops.map((o) => o.replace(/[*.]/g, '·').replace('seg', 's'))).size).toBe(4);
    }
  });
});
