import { NextResponse } from "next/server";
import { getSessionUser } from "@/app/lib/getSessionUser";
import { adminAuth, adminDb } from "@/app/lib/firebase-admin";
import { isAdmin } from "@/app/lib/admin-roles";

// API Route: POST /api/profile
// Descripción:
// - Endpoint que actualiza el perfil del usuario autenticado o de otro usuario (si es admin).
// - Valida la sesión en el servidor ANTES de permitir cualquier cambio.
// - Implementa autorización: solo el usuario puede editar su propio perfil,
//   a menos que sea admin (en cuyo caso puede editar otros perfiles si pasa body.uid).
//
// Parámetros esperados en el body:
// - `name` (string): nombre completo del usuario.
// - `picture` (string): URL de la foto de perfil.
// - `uid` (string, opcional): si se proporciona y el usuario es admin, edita este uid en lugar del propio.
//
// Respuestas:
// - 200 OK: { ok: true } si la actualización fue exitosa.
// - 400 Bad Request: si los datos están malformados.
// - 401 Unauthorized: si no hay sesión válida.
// - 403 Forbidden: si intenta editar otro perfil sin ser admin.
// - 500 Internal Server Error: si hay error en Firebase o Firestore.
//
// Flujo de seguridad:
// 1) Verifica que existe sesión válida (getSessionUser()).
// 2) Parsea y valida body (name y picture deben ser strings).
// 3) Si body.uid !== user.uid, verifica que el usuario actual es admin (isAdmin()).
// 4) Si no es admin, rechaza con 403.
// 5) Actualiza Firebase Auth (displayName, photoURL) y Firestore (users/{uid}).
// 6) Devuelve respuesta de éxito o error.

export async function POST(req: Request) {
  try {
    // Paso 1: Verificar sesión del usuario actual
    const user = await getSessionUser();
    console.log("[/api/profile] Session user:", user?.uid || "none");
    
    if (!user) {
      console.warn("[/api/profile] Not authenticated");
      return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
    }

    // Paso 2: Parsear y validar body de la petición
    const body = await req.json();
    console.log("[/api/profile] Request body:", { name: body?.name, uid: body?.uid });
    
    const name = typeof body.name === "string" ? body.name.trim() : null;
    const picture = typeof body.picture === "string" ? body.picture.trim() : null;

    // Paso 3: Determinar a quién se le actualizará el perfil
    // Por defecto, es el usuario actual (user.uid)
    let targetUid = user.uid;
    
    // Si se intenta editar otro uid, verificar que el usuario actual es admin
    if (body?.uid && typeof body.uid === "string" && body.uid !== user.uid) {
      const allowed = await isAdmin(user.uid);
      console.log("[/api/profile] Admin check for user", user.uid, ":", allowed);
      if (!allowed) {
        console.warn("[/api/profile] User not admin, cannot edit other profiles");
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
      targetUid = body.uid;
    }

    console.log("[/api/profile] Updating profile for uid:", targetUid);

    // Paso 4: Actualizar Firebase Auth con displayName y photoURL
    await adminAuth.updateUser(targetUid, {
      displayName: name ?? undefined,
      photoURL: picture ?? undefined,
    });

    // Paso 5: Persistir cambios en Firestore (colección users, documento uid)
    try {
      await adminDb.collection("users").doc(targetUid).set({ name: name ?? null, picture: picture ?? null }, { merge: true });
    } catch (e) {
      // Advertencia si Firestore falla (no es crítico, ya actualizó Auth)
      console.warn("Firestore write failed for user profile update", e);
    }

    console.log("[/api/profile] Profile updated successfully");
    return NextResponse.json({ ok: true });
  } catch (err) {
    // Paso 6: Manejar errores y devolver respuesta apropiada
    const message = err instanceof Error ? err.message : String(err);
    console.error("/api/profile error:", err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
