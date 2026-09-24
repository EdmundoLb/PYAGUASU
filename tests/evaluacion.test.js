import { describe, it, expect } from 'vitest';
import { esFalsoIncorrecto, quitarRespuestaDeSugerencias, valorCorrectoDelPaso } from '@/lib/ai/evaluacion';

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

describe('quitarRespuestaDeSugerencias', () => {
  it('caso reportado: saca el chip con la respuesta; si quedan menos de 2, no muestra chips', () => {
    expect(quitarRespuestaDeSugerencias(turnoReportado).opcionesRespuesta).toEqual(['$40\\text{ kg·m/s}$', '$-40\\text{ kg·m/s}$']);
    const conDos = { ...turnoReportado, opcionesRespuesta: ['$-20$', '$40$'] };
    expect(quitarRespuestaDeSugerencias(conDos).opcionesRespuesta).toEqual([]);
  });

  it('opción múltiple con la respuesta numérica pasa a respuesta libre', () => {
    const quiz = { ...turnoReportado, requiereOpcion: true, opciones: [{ texto: '$-20$', correcta: true }, { texto: '$40$' }] };
    expect(quitarRespuestaDeSugerencias(quiz)).toMatchObject({ requiereOpcion: false, opciones: [] });
  });

  it('si el estudiante acertó (avanza de paso), no toca las sugerencias', () => {
    const avanza = { ...turnoReportado, correcta: true };
    expect(quitarRespuestaDeSugerencias(avanza)).toBe(avanza);
  });
});
