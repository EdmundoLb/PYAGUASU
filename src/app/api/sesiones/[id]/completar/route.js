import { completarSesion } from '@/lib/store/sesiones';

export async function POST(request, { params }) {
  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Body inválido, se esperaba JSON.' }, { status: 400 });
  }

  const { temaDetectado, errores, rachaMaxima } = body || {};

  try {
    const resultado = completarSesion({
      sesionId: id,
      temaDetectado,
      errores: Number.isFinite(errores) ? errores : 0,
      rachaMaxima: Number.isFinite(rachaMaxima) ? rachaMaxima : 0,
    });
    return Response.json(resultado);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
