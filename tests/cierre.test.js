import { describe, it, expect } from 'vitest';
import { esCierrePrematuro, anularCierre, extraerNumeros } from '@/lib/ai/cierre';

// Conversación del caso reportado (choque de 5 kg a 2 m/s con 3 kg a -10 m/s).
const historial = [
  { autor: 'estudiante', texto: 'Un bloque de 5 kg a 2 m/s choca con otro de 3 kg a -10 m/s y quedan unidos...' },
  { autor: 'tutor', texto: '¿Cuál es la cantidad de movimiento del primer bloque?' },
  { autor: 'estudiante', texto: '10' },
  { autor: 'tutor', texto: 'Ko\'ág̃a, ... Mboýpa la masa total y la velocidad final?' },
];
const turnoReportado = {
  correcta: true,
  mensaje: '¡Iporãiterei! La masa total es $m_1 + m_2 = 5\\text{ kg} + 3\\text{ kg} = 8\\text{ kg}$. Ko\'ág̃a, ecalculami la velocidad final ($v_f$).',
  formula: '$m_1 + m_2 = 8\\text{ kg}$',
  completado: true,
  resultadoFinal: { valor: '$-2.5$', unidad: 'm/s' },
  analogiaCotidiana: 'Como dos jugadores de fútbol que chocan.',
};

describe('extraerNumeros', () => {
  it('coma, punto, signo tipográfico, fracciones; ignora subíndices', () => {
    expect(extraerNumeros('−2,5 m/s')).toEqual([-2.5]);
    expect(extraerNumeros('$v_1 = 3$')).toEqual([3]);
    expect(extraerNumeros('-20/8')).toEqual(expect.arrayContaining([-2.5]));
    expect(extraerNumeros('$\\frac{-20}{8}$')).toEqual(expect.arrayContaining([-2.5]));
  });
});

describe('esCierrePrematuro', () => {
  it('caso reportado: resultado −2.5 que el estudiante nunca calculó → prematuro', () => {
    expect(esCierrePrematuro({ turno: turnoReportado, historial, mensaje: '-20 kgm/seg' })).toBe(true);
  });

  it('cierre legítimo: el estudiante acaba de dar el resultado (en cualquier formato)', () => {
    for (const mensaje of ['-2.5 m/s', '−2,5', '2.5 m/s hacia la izquierda', '-20/8', '-2.49']) {
      expect(esCierrePrematuro({ turno: turnoReportado, historial, mensaje }), mensaje).toBe(false);
    }
  });

  it('cierre legítimo: el resultado ya lo había dicho antes (ej. último paso conceptual)', () => {
    const conResultado = [...historial, { autor: 'estudiante', texto: 'vf = -2.5 m/s' }, { autor: 'tutor', texto: '¿Tiene sentido el signo?' }];
    expect(esCierrePrematuro({ turno: turnoReportado, historial: conResultado, mensaje: 'sí, va para la izquierda' })).toBe(false);
  });

  it('cierre legítimo: pidió ayuda directa, o el resultado no es numérico', () => {
    expect(esCierrePrematuro({ turno: turnoReportado, historial, mensaje: '', pedirAyuda: true })).toBe(false);
    const conceptual = { ...turnoReportado, resultadoFinal: { valor: 'Se conserva', unidad: '' } };
    expect(esCierrePrematuro({ turno: conceptual, historial, mensaje: 'no sé' })).toBe(false);
  });

  it('un turno que no cierra nunca es prematuro', () => {
    expect(esCierrePrematuro({ turno: { ...turnoReportado, completado: false }, historial, mensaje: 'x' })).toBe(false);
  });
});

describe('anularCierre', () => {
  it('saca resultado y analogía, conserva el mensaje que pide el cálculo', () => {
    const r = anularCierre(turnoReportado);
    expect(r).toMatchObject({ completado: false, resultadoFinal: undefined, analogiaCotidiana: '' });
    expect(r.mensaje).toContain('ecalculami la velocidad final');
    expect(r.formula).toBe(turnoReportado.formula); // "8 kg" no revela el −2.5
  });

  it('si la fórmula del paso ya muestra el resultado, también se oculta', () => {
    const r = anularCierre({ ...turnoReportado, formula: '$v_f = \\frac{-20}{8} = -2.5\\text{ m/s}$' });
    expect(r.formula).toBe('');
  });
});
