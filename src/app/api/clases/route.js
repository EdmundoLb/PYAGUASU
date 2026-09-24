import { listarClasesDeDocente, crearClase } from '@/lib/store/clases';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const docenteId = searchParams.get('docenteId');
  if (!docenteId) {
    return Response.json({ error: 'Falta docenteId.' }, { status: 400 });
  }
  return Response.json({ clases: listarClasesDeDocente(docenteId) });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Body inválido, se esperaba JSON.' }, { status: 400 });
  }

  try {
    const clase = crearClase(body || {});
    return Response.json({ clase }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
