import { listarPerfiles, crearPerfil } from '@/lib/store/perfiles';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rol = searchParams.get('rol');
  if (rol && rol !== 'alumno' && rol !== 'docente') {
    return Response.json({ error: 'rol debe ser "alumno" o "docente".' }, { status: 400 });
  }
  return Response.json({ perfiles: listarPerfiles({ rol }) });
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Body inválido, se esperaba JSON.' }, { status: 400 });
  }

  try {
    const perfil = crearPerfil(body || {});
    return Response.json({ perfil }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
