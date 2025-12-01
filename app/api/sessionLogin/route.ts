// app/api/sessionLogin/route.ts
import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import type { DecodedIdToken } from "firebase-admin/auth";

const COOKIE = process.env.SESSION_COOKIE_NAME ?? "__session";
const MAX_AGE = Number(process.env.SESSION_COOKIE_MAX_AGE ?? 60 * 60 * 8);

/**
 * POST /api/sessionLogin
 * - Recibe { idToken, remember } desde el cliente (Firebase client ID token)
 * - Verifica el idToken con Firebase Admin
 * - Crea/actualiza el documento del usuario en Firestore si falta
 * - Genera una session cookie y la envía en la respuesta (httpOnly)
 *
 * Respuestas:
 * - 200 { ok: true } + cookie en caso de éxito
 * - 400 si falta idToken
 * - 401 si el idToken es inválido/expirado
 * - 500 en caso de error inesperado
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { idToken, remember } = body;

    if (!idToken) {
      console.warn("[/api/sessionLogin] POST sin idToken en body");
      return NextResponse.json({ error: "Falta idToken" }, { status: 400 });
    }

    // Verificar el token (puede fallar si el idToken es inválido/expirado)
    let decoded: DecodedIdToken;
    try {
      decoded = await adminAuth.verifyIdToken(idToken);
    } catch (err) {
      console.error("[/api/sessionLogin] verifyIdToken fallo:", err);
      return NextResponse.json({ error: "Token inválido o expirado" }, { status: 401 });
    }

    const userRecord = await adminAuth.getUser(decoded.uid);

    // Crear o actualizar perfil en Firestore si no existe
    const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
    if (!userDoc.exists) {
      await adminDb.collection("users").doc(decoded.uid).set({
        email: userRecord.email || "",
        displayName: userRecord.displayName || null,
        role: "usuario",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: null,
      });
    }

    // Crear session cookie
    const expiresIn = (remember ? MAX_AGE : 2 * 60 * 60) * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: remember ? MAX_AGE : 2 * 60 * 60,
    });

    return res;
  } catch (error) {
    console.error("[/api/sessionLogin] Error inesperado:", error);
    return NextResponse.json({ error: "Error interno creando la sesión" }, { status: 500 });
  }
}