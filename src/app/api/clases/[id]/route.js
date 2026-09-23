import { obtenerClaseDetalle } from '@/lib/store/clases';

export async function GET(request, { params }) {
  const { id } = await params;
  const clase = obtenerClaseDetalle(id);
  if (!clase) {
    return Response.json({ error: 'Clase inexistente.' }, { status: 404 });
  }
  return Response.json({ clase });
}
