import { describe, it, expect } from 'vitest';
import base from '@/lib/ai/jopara/base_jopara_tutor.json';
import { construirGuiaDesdeBase, GUIA_BASE_JOPARA } from '@/lib/ai/jopara/guia';
import { construirInstruccionSistema } from '@/lib/ai/prompt';

describe('base jopara del equipo en el prompt', () => {
  it('incluye reglas, léxico consolidado, términos en castellano, errores y plantillas', () => {
    for (const regla of base.reglas_ia) expect(GUIA_BASE_JOPARA).toContain(regla);
    expect(GUIA_BASE_JOPARA).toContain("Ñamyatyrõ oñondive = Corrijamos juntos");
    expect(GUIA_BASE_JOPARA).toContain('masa');
    expect(GUIA_BASE_JOPARA).toContain("Traducir 'masa' como 'pohýi' → Mantener 'masa'.");
    expect(GUIA_BASE_JOPARA).toContain('Falta unidad');
  });

  it('deja afuera las entradas "Validar" (la base dice no usarlas sin revisión)', () => {
    const aValidar = base.lexico.filter((l) => l.confianza === 'Validar');
    expect(aValidar.length).toBeGreaterThan(0);
    for (const l of aValidar) expect(GUIA_BASE_JOPARA).not.toContain(`${l.termino} = `);
  });

  it('es compacta (no el JSON entero en cada consulta)', () => {
    expect(GUIA_BASE_JOPARA.length).toBeLessThan(JSON.stringify(base).length / 3);
  });

  it('se regenera desde el JSON: una entrada nueva del lingüista aparece sola', () => {
    const conNueva = { ...base, lexico: [...base.lexico, { id: 'L999', categoria: 'Aula', termino: 'Término nuevo', castellano: 'prueba', confianza: 'Consolidado', ejemplo: '', nota: '' }] };
    expect(construirGuiaDesdeBase(conNueva)).toContain('Término nuevo = prueba');
  });

  it('el prompt incluye la base solo en jopara y guaraní', () => {
    expect(construirInstruccionSistema({ idioma: 'jopara' })).toContain('BASE LÉXICA DEL EQUIPO');
    expect(construirInstruccionSistema({ idioma: 'guarani' })).toContain('BASE LÉXICA DEL EQUIPO');
    const castellano = construirInstruccionSistema({ idioma: 'castellano' });
    expect(castellano).not.toContain('BASE LÉXICA DEL EQUIPO');
    expect(castellano).not.toContain('Jopara = la mezcla natural');
    expect(castellano).toContain('Si el idioma pedido es "castellano"');
  });

  it('las frases del prompt ya no usan formas del borrador que no están en la base', () => {
    const s = construirInstruccionSistema({ idioma: 'jopara' });
    for (const borrador of ['Haimete', 'Opavave ojavy', 'Reentendépa', 'che amigo/a']) expect(s).not.toContain(borrador);
  });
});
