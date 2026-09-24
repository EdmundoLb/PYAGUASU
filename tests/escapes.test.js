import { describe, it, expect } from 'vitest';
import { repararEscapesLatex, repararEscapesEnObjeto, repararEscapesInvalidosEnJson } from '@/lib/latex/escapes';
import { dividirEnTrozos } from '@/lib/ui/formulas';

// JSON tal como lo mandó el modelo en el caso reportado: "\text" y "\times"
// con una sola barra (en JSON, "\t" = tabulación).
const JSON_DEL_MODELO = String.raw`{"mensaje":"¡Upéichaite! $p_2 = 3\text{ kg} \times (-10\text{ m/s}) = -30\text{ kg} \times \text{m/s}$"}`;

describe('repararEscapesLatex', () => {
  it('caso reportado: "3extkg imes" vuelve a ser \\text y \\times', () => {
    const { mensaje } = JSON.parse(JSON_DEL_MODELO);
    expect(mensaje).toContain('\text{ kg}'); // así llega: TAB + "ext"
    expect(repararEscapesLatex(mensaje)).toBe(
      String.raw`¡Upéichaite! $p_2 = 3\text{ kg} \times (-10\text{ m/s}) = -30\text{ kg} \times \text{m/s}$`
    );
  });

  it('\\frac, \\beta, \\rho y \\neq dañados también se reparan', () => {
    const danado = JSON.parse(String.raw`"$\frac{1}{2} \beta \rho$ y $a \neq b$"`);
    expect(repararEscapesLatex(danado)).toBe(String.raw`$\frac{1}{2} \beta \rho$ y $a \neq b$`);
  });

  it('no toca texto normal ni saltos de línea legítimos', () => {
    for (const t of ['Mba\'éichapa!\nAhora seguimos.', 'Iporãiterei, 20 m/s.', 'línea 1\nlínea 2', String.raw`$\text{ok}$`]) {
      expect(repararEscapesLatex(t)).toBe(t);
    }
  });

  it('repara en todo el turno, incluidos objetos y arrays anidados', () => {
    const turno = JSON.parse(String.raw`{"datos":[{"valor":"$3\text{ kg}$"}],"resultadoFinal":{"valor":"$-30$","unidad":"\text{kg·m/s}"},"completado":true}`);
    const r = repararEscapesEnObjeto(turno);
    expect(r.datos[0].valor).toBe(String.raw`$3\text{ kg}$`);
    expect(r.resultadoFinal.unidad).toBe(String.raw`\text{kg·m/s}`);
    expect(r.completado).toBe(true);
  });
});

describe('repararEscapesInvalidosEnJson', () => {
  it('"\\cdot" con barra simple ya no rompe JSON.parse', () => {
    const crudo = String.raw`{"mensaje":"$p = 5 \cdot 2$ y $\Delta v$","ok":"a\"b"}`;
    expect(() => JSON.parse(crudo)).toThrow();
    const r = JSON.parse(repararEscapesInvalidosEnJson(crudo));
    expect(r.mensaje).toBe(String.raw`$p = 5 \cdot 2$ y $\Delta v$`);
    expect(r.ok).toBe('a"b');
  });
});

describe('renderizador', () => {
  it('un mensaje dañado que ya está en el chat se renderiza bien', () => {
    const { mensaje } = JSON.parse(JSON_DEL_MODELO);
    const formulas = dividirEnTrozos(mensaje).filter((t) => t.formula).map((t) => t.valor);
    expect(formulas).toEqual([String.raw`p_2 = 3\text{ kg} \times (-10\text{ m/s}) = -30\text{ kg} \times \text{m/s}`]);
  });
});
