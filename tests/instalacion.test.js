import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Simula el navegador: userAgent, si ya está instalada y localStorage.
function simularNavegador({ userAgent = 'Mozilla/5.0 (Windows NT 10.0) Chrome/140', platform = 'Win32', maxTouchPoints = 0, instalada = false } = {}) {
  const guardado = new Map();
  const oyentes = {};
  vi.stubGlobal('window', {
    navigator: { userAgent, platform, maxTouchPoints, standalone: false },
    matchMedia: () => ({ matches: instalada }),
    localStorage: { getItem: (k) => guardado.get(k) ?? null, setItem: (k, v) => guardado.set(k, v) },
    addEventListener: (tipo, fn) => { oyentes[tipo] = fn; },
  });
  return oyentes;
}

const avisoDeChrome = () => {
  const evento = { preventDefault: vi.fn(), prompt: vi.fn(async () => {}), userChoice: Promise.resolve({ outcome: 'accepted' }) };
  return evento;
};

describe('instalar como app (lib/ui/instalacion.js)', () => {
  let lib;
  const cargar = async () => {
    vi.resetModules();
    lib = await import('@/lib/ui/instalacion');
  };
  afterEach(() => vi.unstubAllGlobals());

  describe('Android / Chrome', () => {
    let oyentes;
    beforeEach(async () => {
      oyentes = simularNavegador();
      await cargar();
      lib.iniciarCapturaInstalacion();
    });

    it('sin aviso del navegador no muestra nada', () => {
      expect(lib.estadoInstalacion()).toBe('oculto');
    });

    it('con el aviso lo guarda (sin el cartel del navegador) y muestra el botón', () => {
      const evento = avisoDeChrome();
      oyentes.beforeinstallprompt(evento);
      expect(evento.preventDefault).toHaveBeenCalled();
      expect(lib.estadoInstalacion()).toBe('android');
    });

    it('al instalar abre el diálogo una sola vez y se oculta', async () => {
      const evento = avisoDeChrome();
      oyentes.beforeinstallprompt(evento);
      await lib.instalarApp();
      expect(evento.prompt).toHaveBeenCalledTimes(1);
      expect(lib.estadoInstalacion()).toBe('oculto');
    });

    it('después de instalada (appinstalled) no aparece más', () => {
      oyentes.beforeinstallprompt(avisoDeChrome());
      oyentes.appinstalled();
      expect(lib.estadoInstalacion()).toBe('oculto');
    });

    it('si el alumno la cierra, no vuelve aunque llegue otro aviso', () => {
      oyentes.beforeinstallprompt(avisoDeChrome());
      lib.descartarInstalacion();
      oyentes.beforeinstallprompt(avisoDeChrome());
      expect(lib.estadoInstalacion()).toBe('oculto');
    });
  });

  it('iPhone: muestra los pasos (no existe el aviso del navegador)', async () => {
    simularNavegador({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Safari/604.1', platform: 'iPhone', maxTouchPoints: 5 });
    await cargar();
    expect(lib.estadoInstalacion()).toBe('ios');
  });

  it('iPad (se presenta como Mac con pantalla táctil): también muestra los pasos', async () => {
    simularNavegador({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15', platform: 'MacIntel', maxTouchPoints: 5 });
    await cargar();
    expect(lib.estadoInstalacion()).toBe('ios');
  });

  it('una Mac común (sin pantalla táctil) no muestra nada', async () => {
    simularNavegador({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15', platform: 'MacIntel', maxTouchPoints: 0 });
    await cargar();
    expect(lib.estadoInstalacion()).toBe('oculto');
  });

  it('si ya se abrió como app instalada, no muestra nada', async () => {
    simularNavegador({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)', instalada: true });
    await cargar();
    expect(lib.estadoInstalacion()).toBe('oculto');
  });
});
