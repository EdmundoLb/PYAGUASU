import { describe, it, expect } from 'vitest';
import {
  calcularNivel,
  xpParaNivel,
  progresoDentroDelNivel,
  calcularXpGanada,
} from '@/lib/gamificacion/niveles';
import { evaluarInsigniasNuevas } from '@/lib/gamificacion/insignias';
import { calcularEstiloPredominante, construirContextoAprendizaje, PREGUNTAS_DIAGNOSTICO } from '@/lib/quiz/diagnostico';

describe('niveles', () => {
  it('nivel 1 con 0 XP y con XP negativo', () => {
    expect(calcularNivel(0)).toBe(1);
    expect(calcularNivel(-100)).toBe(1);
  });

  it('umbrales de nivel coinciden con xpParaNivel', () => {
    for (let nivel = 1; nivel <= 10; nivel++) {
      expect(calcularNivel(xpParaNivel(nivel))).toBe(nivel);
      if (nivel > 1) expect(calcularNivel(xpParaNivel(nivel) - 1)).toBe(nivel - 1);
    }
  });

  it('progreso dentro del nivel está entre 0 y 1', () => {
    expect(progresoDentroDelNivel(0)).toBe(0);
    expect(progresoDentroDelNivel(49)).toBeCloseTo(49 / 50);
    for (const xp of [0, 1, 50, 199, 200, 1000, 12345]) {
      const p = progresoDentroDelNivel(xp);
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });

  it('XP ganado: base + bonus sin errores + recompensa de la tarea', () => {
    expect(calcularXpGanada({ errores: 0 })).toBe(35);
    expect(calcularXpGanada({ errores: 2 })).toBe(20);
    expect(calcularXpGanada({ errores: 0, xpRecompensaTarea: 45 })).toBe(80);
  });
});

describe('insignias', () => {
  const perfilBase = { insigniasIds: [], racha: 1 };

  it('primera sesión sin errores da primera_tarea + impecable', () => {
    const sesion = { errores: 0, temaDetectado: 'Cinemática' };
    expect(evaluarInsigniasNuevas({ perfil: perfilBase, sesionesCompletadas: [sesion], sesionRecien: sesion }))
      .toEqual(['primera_tarea', 'impecable']);
  });

  it('no repite insignias que ya tiene', () => {
    const perfil = { insigniasIds: ['primera_tarea', 'impecable'], racha: 1 };
    const sesion = { errores: 0, temaDetectado: 'X' };
    expect(evaluarInsigniasNuevas({ perfil, sesionesCompletadas: [sesion], sesionRecien: sesion })).toEqual([]);
  });

  it('racha_5 y multi_tema', () => {
    const sesiones = ['A', 'B', 'C'].map((t) => ({ errores: 1, temaDetectado: t }));
    const nuevas = evaluarInsigniasNuevas({
      perfil: { insigniasIds: ['primera_tarea'], racha: 5 },
      sesionesCompletadas: sesiones,
      sesionRecien: sesiones[2],
    });
    expect(nuevas).toEqual(['racha_5', 'multi_tema']);
  });
});

describe('quiz de diagnóstico', () => {
  it('cada pregunta tiene texto y opciones en jopara, guaraní y castellano', () => {
    for (const p of PREGUNTAS_DIAGNOSTICO) {
      expect(p.texto.jopara).toBeTruthy();
      expect(p.texto.guarani).toBeTruthy();
      expect(p.texto.castellano).toBeTruthy();
      expect(p.opciones).toHaveLength(3);
      for (const o of p.opciones) {
        expect(o.texto.jopara).toBeTruthy();
        expect(o.texto.guarani).toBeTruthy();
        expect(o.texto.castellano).toBeTruthy();
      }
    }
  });

  it('estilo predominante y desempate visual > auditor > kinestésico', () => {
    expect(calcularEstiloPredominante({ kinestheticScore: 2, visualScore: 1 })).toBe('kinestesico');
    expect(calcularEstiloPredominante({ auditoryScore: 1, kinestheticScore: 1, visualScore: 1 })).toBe('visual');
    expect(calcularEstiloPredominante({ auditoryScore: 1, kinestheticScore: 1 })).toBe('auditor');
    expect(calcularEstiloPredominante({})).toBe('visual');
  });

  it('el contexto de aprendizaje nunca nombra la categoría (regla del README)', () => {
    for (const nivel of ['visual', 'auditor', 'kinestesico']) {
      const texto = construirContextoAprendizaje(nivel).toLowerCase();
      expect(texto).not.toBe('');
      for (const prohibida of ['visual', 'auditiv', 'kinestésic', 'kinestesic', 'estilo de aprendizaje', 'vak']) {
        expect(texto, `${nivel} contiene "${prohibida}"`).not.toContain(prohibida);
      }
    }
    expect(construirContextoAprendizaje('')).toBe('');
  });
});
