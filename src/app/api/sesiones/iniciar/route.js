import { iniciarSesion } from '@/lib/store/sesiones';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Body inválido, se esperaba JSON.' }, { status: 400 });
  }

  const { alumnoId, tareaId, enunciado } = body || {};
  if (!alumnoId) {
    return Response.json({ error: 'Falta alumnoId.' }, { status: 400 });
  }

  try {
    const sesion = iniciarSesion({ alumnoId, tareaId, enunciado });
    return Response.json({ sesion }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
