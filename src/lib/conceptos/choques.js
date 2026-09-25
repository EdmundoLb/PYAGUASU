// Contenido del panel "Conceptos" para choques y cantidad de movimiento,
// tomado de CONCEPTO.pdf (material del docente del equipo). Dos correcciones
// respecto del PDF, a confirmar con el profesor:
//   - Fórmula general: el PDF dice "(m1+m2)*v1" del lado de después; es la
//     velocidad FINAL: (m₁+m₂)·v' (como el propio PDF usa más abajo).
//   - Unidades: el PDF dice "Kg = m (masa)" y "m/s = p (velocidad)"; queda
//     m (masa) en kg, v (velocidad) en m/s, p (cantidad de movimiento) en kg·m/s.
//
// Para sumar otro tema: crear un archivo como este y agregarlo al catálogo
// en ./index.js. Las fórmulas van en LaTeX entre $...$ (RenderizadorMatematico).

export const CONCEPTO_CHOQUES = {
  id: 'choques',
  titulo: 'Choques y cantidad de movimiento',
  // Se muestra el botón "Conceptos" si el tema o el enunciado del ejercicio
  // coinciden con esto.
  patron: /choque|chocan|colisi[oó]n|cantidad de movimiento|momento lineal|impulso|enganchad/i,

  introduccion: 'Un choque ocurre cuando dos cuerpos en movimiento entran en contacto.',

  tipos: [
    {
      id: 'elastico',
      nombre: 'Choque elástico',
      icono: 'sports_handball',
      descripcion:
        'Los cuerpos vuelven a separarse después del choque, cada uno con una velocidad y dirección (en general) distintas de las que tenían. La cantidad de movimiento de cada cuerpo cambia, porque cambia su velocidad, pero la cantidad de movimiento total del sistema se mantiene.',
    },
    {
      id: 'inelastico',
      nombre: 'Choque perfectamente inelástico',
      icono: 'link',
      descripcion:
        'Los cuerpos quedan unidos después del impacto y se mueven como una sola masa, igual a la suma de las dos: $m_1 + m_2$.',
    },
  ],

  caracteristicasInelastico: [
    'Después del choque, los dos cuerpos quedan unidos (enganchados).',
    'Se mueven juntos, con una misma velocidad final $v\'$.',
    'La masa después del choque es la suma: $m_1 + m_2$.',
    'La cantidad de movimiento total se conserva: la de después es igual a la de antes, $p_f = p_i$.',
  ],

  // Convención que usa el tutor en los ejercicios; sin ella el simulador no
  // se entiende (velocidades negativas).
  signos: 'Tomamos hacia la derecha como positivo: si un cuerpo viene en sentido contrario, su velocidad es negativa (ej. $-10\\text{ m/s}$).',

  formulaGeneral: {
    latex: "$m_1 v_1 + m_2 v_2 = (m_1 + m_2)\\,v'$",
    antes: 'antes del choque',
    despues: 'después del choque',
  },

  formulas: [
    { nombre: 'Cantidad de movimiento del bloque 1', latex: '$p_1 = m_1 \\cdot v_1$' },
    { nombre: 'Cantidad de movimiento del bloque 2', latex: '$p_2 = m_2 \\cdot v_2$' },
    { nombre: 'Cantidad de movimiento inicial del sistema', latex: '$p_i = p_1 + p_2$' },
    { nombre: 'Velocidad final (juntos)', latex: "$v' = \\dfrac{m_1 v_1 + m_2 v_2}{m_1 + m_2}$" },
    { nombre: 'Cantidad de movimiento final', latex: "$p_f = (m_1 + m_2) \\cdot v'$" },
  ],

  referencias: [
    ['$p$', 'Cantidad de movimiento'],
    ['$p_1$, $p_2$', 'Cantidad de movimiento inicial del bloque 1 y del bloque 2'],
    ['$p_i$', 'Cantidad de movimiento inicial del sistema'],
    ['$p_f$', 'Cantidad de movimiento final'],
    ['$m$', 'Masa'],
    ['$v$', 'Velocidad'],
    ["$v'$", 'Velocidad final'],
  ],

  unidades: [
    ['Masa ($m$)', '$\\text{kg}$'],
    ['Velocidad ($v$)', '$\\text{m/s}$'],
    ['Cantidad de movimiento ($p_1$, $p_2$, $p_i$, $p_f$)', '$\\text{kg}\\cdot\\text{m/s}$'],
  ],

  observacion: 'El resultado final $p_f$ tiene que dar igual a la cantidad de movimiento inicial del sistema $p_i$. Si no da igual, hay un error en alguna cuenta.',

  // A propósito con números DISTINTOS del ejercicio de práctica del tutor
  // (5 kg a 2 m/s y 3 kg a −10 m/s), para no regalarle la respuesta.
  ejemplo: {
    enunciado:
      'En la feria, un carrito de $4\\text{ kg}$ va a $6\\text{ m/s}$ hacia la derecha y choca de frente con otro de $2\\text{ kg}$ que viene en sentido contrario a $3\\text{ m/s}$. Quedan enganchados. ¿Con qué velocidad se mueven juntos?',
    datos: { m1: 4, v1: 6, m2: 2, v2: -3 },
    pasos: [
      { texto: 'Cantidad de movimiento del carrito 1:', latex: '$p_1 = 4\\text{ kg} \\cdot 6\\text{ m/s} = 24\\text{ kg·m/s}$' },
      { texto: 'El carrito 2 viene en sentido contrario, así que su velocidad es negativa:', latex: '$p_2 = 2\\text{ kg} \\cdot (-3\\text{ m/s}) = -6\\text{ kg·m/s}$' },
      { texto: 'Cantidad de movimiento inicial del sistema:', latex: '$p_i = 24\\text{ kg·m/s} + (-6\\text{ kg·m/s}) = 18\\text{ kg·m/s}$' },
      { texto: 'Velocidad final, con la masa total ($4 + 2 = 6\\text{ kg}$):', latex: "$v' = \\dfrac{18\\text{ kg·m/s}}{6\\text{ kg}} = 3\\text{ m/s}$" },
      { texto: 'Comprobación: la cantidad de movimiento final da igual a la inicial.', latex: "$p_f = 6\\text{ kg} \\cdot 3\\text{ m/s} = 18\\text{ kg·m/s} = p_i$ ✓" },
    ],
    respuesta: 'Se mueven juntos a $3\\text{ m/s}$ hacia la derecha.',
  },
};
