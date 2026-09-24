import { unirseAClasePorCodigo } from '@/lib/store/clases';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Body inválido, se esperaba JSON.' }, { status: 400 });
  }

  const { alumnoId, codigo } = body || {};
  if (!alumnoId || !codigo) {
    return Response.json({ error: 'Faltan alumnoId y/o codigo.' }, { status: 400 });
  }

  try {
    const clase = unirseAClasePorCodigo({ alumnoId, codigo });
    return Response.json({ clase });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
