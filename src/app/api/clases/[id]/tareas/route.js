import { agregarTarea } from '@/lib/store/clases';

export async function POST(request, { params }) {
  const { id } = await params;
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Body inválido, se esperaba JSON.' }, { status: 400 });
  }

  try {
    const tarea = agregarTarea({ claseId: id, ...body });
    return Response.json({ tarea }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
