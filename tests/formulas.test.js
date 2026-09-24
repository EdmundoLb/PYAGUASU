import { describe, it, expect } from 'vitest';
import { dividirEnTrozos } from '@/lib/ui/formulas';

const formulas = (texto) => dividirEnTrozos(texto).filter((t) => t.formula).map((t) => t.valor);
const reconstruido = (texto) => dividirEnTrozos(texto).map((t) => t.original).join('');

describe('dividirEnTrozos', () => {
  it('fórmulas entre $...$ (caso reportado: "$v$, $a$ y $t$.")', () => {
    expect(formulas('Tenemos $v$, $a$ y $t$.')).toEqual(['v', 'a', 't']);
  });

  it('LaTeX sin $ (caso reportado): detecta la fórmula y deja el resto como texto', () => {
    const texto = 'La fórmula es d = v_0 \\cdot t + \\frac{1}{2} a t^2 acá, ¿viste?';
    expect(formulas(texto)).toEqual(['d = v_0 \\cdot t + \\frac{1}{2} a t^2']);
    expect(reconstruido(texto)).toBe(texto);
  });

  it('opción de quiz que es solo una fórmula sin $', () => {
    expect(formulas('d = v_0 \\cdot t + \\frac{1}{2} a t^2')).toEqual(['d = v_0 \\cdot t + \\frac{1}{2} a t^2']);
  });

  it('la puntuación final no entra en la fórmula', () => {
    const texto = 'Usamos v^2 = v_0^2 + 2ad. Después seguimos.';
    expect(formulas(texto)).toEqual(['v^2 = v_0^2 + 2ad']);
    expect(reconstruido(texto)).toBe(texto);
  });

  it('texto normal sin LaTeX queda intacto (sin falsos positivos)', () => {
    for (const texto of [
      'Mba\'éichapa! Néike, ñañepyrũ con el problema.',
      'El auto va a 20 m/s y la moto a 10 m/s, ¿cuál es más rápido?',
      'Iporãiterei! Rejapo porã.',
    ]) {
      expect(formulas(texto)).toEqual([]);
      expect(reconstruido(texto)).toBe(texto);
    }
  });

  it('mezcla de $...$ y LaTeX suelto en el mismo mensaje', () => {
    expect(formulas('Con $F = m a$ y después \\frac{F}{m} sale.')).toEqual(['F = m a', '\\frac{F}{m}']);
  });
});
