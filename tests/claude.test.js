import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TURNO_TOOL_NAME } from '@/lib/ai/schema';

// Simula la API de Anthropic: `respuesta` decide qué devuelve messages.create.
let respuesta;
const pedidos = [];
const opcionesCliente = [];
vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    constructor(opciones) {
      opcionesCliente.push(opciones);
      this.beta = {
        messages: {
          create: async (pedido) => {
            pedidos.push(pedido);
            return respuesta;
          },
        },
      };
    }
  },
}));

const turno = { mensaje: 'Néike, py\'aguasu!', pasoActual: 1 };
const conHerramienta = (stop_reason = 'tool_use') => ({
  stop_reason,
  content: [{ type: 'tool_use', name: TURNO_TOOL_NAME, input: turno }],
});

const args = { historial: [], idioma: 'jopara', materia: 'Física', esInicial: true, enunciado: 'x', mensaje: '', pedirAyuda: false, learningLevel: '' };

describe('avanzarTurnoConClaude (respaldo de Gemini)', () => {
  let avanzarTurnoConClaude;
  beforeEach(async () => {
    pedidos.length = 0;
    opcionesCliente.length = 0;
    vi.stubEnv('ANTHROPIC_API_KEY', 'clave-de-prueba');
    vi.stubEnv('CLAUDE_MODEL', '');
    vi.stubEnv('CLAUDE_EFFORT', '');
    vi.resetModules();
    ({ avanzarTurnoConClaude } = await import('@/lib/ai/providers/claude'));
  });
  afterEach(() => vi.unstubAllEnvs());

  it('sin ANTHROPIC_API_KEY avisa claro', async () => {
    vi.stubEnv('ANTHROPIC_API_KEY', '');
    await expect(avanzarTurnoConClaude(args)).rejects.toThrow(/ANTHROPIC_API_KEY/);
  });

  it('pide Opus 5 con respaldo ante rechazos, espacio para pensar, poco esfuerzo y caché', async () => {
    respuesta = conHerramienta();
    await expect(avanzarTurnoConClaude(args)).resolves.toEqual(turno);
    const [pedido] = pedidos;
    expect(pedido.model).toBe('claude-opus-5');
    expect(pedido.betas).toEqual(['server-side-fallback-2026-07-01']);
    expect(pedido.fallbacks).toBe('default');
    expect(pedido.max_tokens).toBe(16000);
    expect(pedido.output_config).toEqual({ effort: 'low' });
    expect(pedido.cache_control).toEqual({ type: 'ephemeral' });
    expect(pedido.tool_choice).toEqual({ type: 'tool', name: TURNO_TOOL_NAME });
    // Los reintentos los hace el SDK (sin una segunda capa propia encima).
    expect(opcionesCliente[0]).toMatchObject({ maxRetries: 2, timeout: 45_000 });
  });

  it('respeta CLAUDE_MODEL y CLAUDE_EFFORT si se configuran', async () => {
    vi.stubEnv('CLAUDE_MODEL', 'claude-sonnet-5');
    vi.stubEnv('CLAUDE_EFFORT', 'medium');
    vi.resetModules();
    ({ avanzarTurnoConClaude } = await import('@/lib/ai/providers/claude'));
    respuesta = conHerramienta();
    await avanzarTurnoConClaude(args);
    expect(pedidos[0].model).toBe('claude-sonnet-5');
    expect(pedidos[0].output_config).toEqual({ effort: 'medium' });
  });

  it('un rechazo de seguridad da un error claro (y el index pasa al otro proveedor)', async () => {
    respuesta = { stop_reason: 'refusal', content: [] };
    await expect(avanzarTurnoConClaude(args)).rejects.toThrow(/rechazo de seguridad/);
  });

  it('si se cortó por el límite no usa un turno a medias', async () => {
    respuesta = conHerramienta('max_tokens');
    await expect(avanzarTurnoConClaude(args)).rejects.toThrow(/se cortó/);
  });

  it('sin la herramienta en la respuesta avisa', async () => {
    respuesta = { stop_reason: 'end_turn', content: [{ type: 'text', text: 'hola' }] };
    await expect(avanzarTurnoConClaude(args)).rejects.toThrow(/turno estructurado/);
  });
});
