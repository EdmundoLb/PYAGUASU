import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Simula la API de Google: `comportamiento(key, modelo)` decide qué responde.
let comportamiento;
const llamadas = [];
vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    constructor({ apiKey }) {
      this.models = {
        generateContent: async ({ model }) => {
          llamadas.push(`${apiKey}:${model}`);
          return comportamiento(apiKey, model);
        },
      };
    }
  },
}));

const saturado = () => {
  throw Object.assign(new Error('{"error":{"code":503,"message":"high demand"}}'), { status: 503 });
};
const ok = (texto = 'ok') => ({ text: JSON.stringify({ mensaje: texto }) });

const args = { historial: [], idioma: 'jopara', materia: 'Física', esInicial: true, enunciado: 'x', mensaje: '', pedirAyuda: false, learningLevel: '' };

describe('avanzarTurnoConGemini: cadena de respaldo', () => {
  let avanzarTurnoConGemini;
  beforeEach(async () => {
    vi.useFakeTimers({ toFake: ['setTimeout'] });
    llamadas.length = 0;
    vi.stubEnv('GEMINI_MODEL', 'principal');
    vi.stubEnv('GEMINI_MODEL_FALLBACK', 'respaldo1,respaldo2');
    vi.stubEnv('GEMINI_API_KEY', 'keyA,keyB');
    vi.resetModules();
    ({ avanzarTurnoConGemini } = await import('@/lib/ai/providers/gemini'));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
  });

  const correr = async () => {
    const p = avanzarTurnoConGemini(args);
    await vi.runAllTimersAsync();
    return p;
  };

  it('si el principal está saturado, usa el siguiente modelo', async () => {
    comportamiento = (key, modelo) => (modelo === 'principal' ? saturado() : ok(`${key}/${modelo}`));
    expect(await correr()).toEqual({ mensaje: 'keyA/respaldo1' });
    expect(llamadas).toEqual(['keyA:principal', 'keyA:principal', 'keyA:respaldo1']);
  });

  it('si todos los modelos de la primera key fallan, prueba con la segunda key', async () => {
    comportamiento = (key, modelo) => (key === 'keyA' ? saturado() : ok(`${key}/${modelo}`));
    expect(await correr()).toEqual({ mensaje: 'keyB/principal' });
  });

  it('una key inválida (403) salta directo a la siguiente key', async () => {
    comportamiento = (key, modelo) => {
      if (key === 'keyA') throw Object.assign(new Error('forbidden'), { status: 403 });
      return ok(`${key}/${modelo}`);
    };
    expect(await correr()).toEqual({ mensaje: 'keyB/principal' });
    expect(llamadas.filter((l) => l.startsWith('keyA'))).toEqual(['keyA:principal']);
  });

  it('si todo está saturado, devuelve el primer error (503)', async () => {
    comportamiento = saturado;
    const p = avanzarTurnoConGemini(args);
    const expectativa = expect(p).rejects.toMatchObject({ status: 503 });
    await vi.runAllTimersAsync();
    await expectativa;
    expect(llamadas).toHaveLength(2 + 2 + 3); // principal x2 + 2 respaldos (keyA) + 3 modelos (keyB)
  });
});
