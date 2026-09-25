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
