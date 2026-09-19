// Reintentos con backoff para errores transitorios de los proveedores de IA
// (sobrecarga temporal: 503 en Gemini, 529 en Claude). Sin esto, un pico de
// demanda del lado del proveedor tira abajo la demo aunque el código esté
// bien — vimos justamente un 503 intermitente probando con la key real.

const CODIGOS_TRANSITORIOS = [429, 503, 529];

function obtenerCodigoHttp(error) {
  if (typeof error?.status === 'number') return error.status;
  const match = /"code"\s*:\s*(\d+)/.exec(error?.message || '');
  return match ? Number(match[1]) : null;
}

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function conReintentos(fn, { intentos = 3, esperaBaseMs = 800 } = {}) {
  let ultimoError;

  for (let intento = 1; intento <= intentos; intento++) {
    try {
      return await fn();
    } catch (error) {
      ultimoError = error;
      const codigo = obtenerCodigoHttp(error);
      const esTransitorio = codigo && CODIGOS_TRANSITORIOS.includes(codigo);

      if (!esTransitorio || intento === intentos) {
        throw error;
      }

      await esperar(esperaBaseMs * intento);
    }
  }

  throw ultimoError;
}
