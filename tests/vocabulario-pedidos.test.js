import { describe, it, expect } from 'vitest';
import { corregirVocabulario } from '@/lib/ai/vocabulario';
import { esPedidoDeAyudaExplicito } from '@/lib/ai/pedidos';
import { construirInstruccionSistema } from '@/lib/ai/prompt';

describe('corregirVocabulario', () => {
  it('caso reportado: "Ani ojepy\'apy" → "Ani ejepy\'apy" (respeta mayúscula)', () => {
    expect(corregirVocabulario("Ani ojepy'apy! La cantidad de movimiento...")).toBe("Ani ejepy'apy! La cantidad de movimiento...");
    expect(corregirVocabulario("tranqui, ani rejepy'apy.")).toBe("tranqui, ani ejepy'apy.");
    expect(corregirVocabulario('ANI OJEPY’APY')).toBe("Ani ejepy'apy");
  });

  it('errores de la base jopara: armonía nasal y plural tras numeral', () => {
    expect(corregirVocabulario('Jañepyrũ pe paso 1-gui.')).toBe('Ñañepyrũ pe paso 1-gui.');
    expect(corregirVocabulario('Oĩ mokõi bloquekuéra pe mesa ári.')).toBe('Oĩ mokõi bloque pe mesa ári.');
    expect(corregirVocabulario('umi temimbo\'ekuéra')).toBe('umi temimbo\'ekuéra'); // sin numeral: plural correcto
  });

  it('palabras mal armadas vistas en pruebas (26/09)', () => {
    expect(corregirVocabulario('Pe papapy -2.5 hekopeteĩnte oĩ!')).toBe('Pe papapy -2.5 hekopete oĩ!');
    expect(corregirVocabulario('upéva da 24000 kg·m/s')).toBe("upéva ha'e 24000 kg·m/s");
    // Corregido por el equipo (26/09): "ha katu" → "ha ikatu".
    expect(corregirVocabulario('Ha katu ani nderesarái')).toBe('Ha ikatu ani nderesarái');
    expect(corregirVocabulario('Pe fórmula iporã, ha katu pe cuenta ndaha\'éi.')).toBe('Pe fórmula iporã, ha ikatu pe cuenta ndaha\'éi.');
    expect(corregirVocabulario('ha ikatu')).toBe('ha ikatu'); // la forma correcta no cambia
    // "katu" solo (= en cambio, enfático) es otra entrada de la base: no se toca.
    expect(corregirVocabulario('Pe masa katu ndoñemoambuéi.')).toBe('Pe masa katu ndoñemoambuéi.');
  });

  it('el prompt guía la unidad con opciones y prohíbe revelar el resultado en un intento fallido', () => {
    const s = construirInstruccionSistema({ materia: 'Física', idioma: 'jopara' });
    expect(s).toContain('¿qué sale de multiplicar kg por m/s?');
    expect(s).toMatch(/opcionesRespuesta" con 3 o 4 unidades/);
    expect(s).toMatch(/en un intento fallido NO muestres la cuenta resuelta/);
  });

  it('no toca la forma correcta ni otro texto', () => {
    for (const t of ["Ani ejepy'apy!", 'Iporãiterei!', 'La fórmula es $p = m v$']) {
      expect(corregirVocabulario(t)).toBe(t);
    }
  });

  it('el prompt ya no enseña la forma incorrecta', () => {
    const s = construirInstruccionSistema({ materia: 'Física' });
    expect(s).not.toMatch(/"Ani rejepy'apy/);
    expect(s).toContain("\"Ani ejepy'apy\"");
  });
});

describe('esPedidoDeAyudaExplicito', () => {
  it('caso reportado y variantes: son pedidos', () => {
    for (const t of [
      'podes escribirme la formula',
      '¿Podés escribirme la fórmula?',
      'decime la fórmula',
      'dame la respuesta',
      'mostrame el paso',
      'me podés dar la fórmula?',
      'cuál es la fórmula?',
      'ehaimi la fórmula',
      "emombe'u chéve la fórmula",
    ]) {
      expect(esPedidoDeAyudaExplicito(t), t).toBe(true);
    }
  });

  it('no son pedidos: intentos, dudas, respuestas', () => {
    for (const t of [
      'p = m · v',
      '¿la fórmula es p = m·v?',
      'no entiendo la fórmula',
      'la fórmula de la cantidad de movimiento',
      '10 kg·m/s',
      'no sé',
      'multiplico la masa por la velocidad',
    ]) {
      expect(esPedidoDeAyudaExplicito(t), t).toBe(false);
    }
  });
});
