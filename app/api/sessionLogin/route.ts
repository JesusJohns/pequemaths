// app/api/sessionLogin/route.ts
import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

const COOKIE = process.env.SESSION_COOKIE_NAME ?? "__session";
const MAX_AGE = Number(process.env.SESSION_COOKIE_MAX_AGE ?? 60 * 60 * 8);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { idToken, remember } = body;

    if (!idToken) {
      return NextResponse.json(
        { error: "Falta idToken" },
        { status: 400 }
      );
    }

    // Verificar el token
    const decoded = await adminAuth.verifyIdToken(idToken);
    const userRecord = await adminAuth.getUser(decoded.uid);

    // Crear o actualizar perfil en Firestore si no existe
    const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
    
    if (!userDoc.exists) {
      // Crear perfil por defecto (usuario normal)
      await adminDb.collection("users").doc(decoded.uid).set({
        email: userRecord.email || "",
        displayName: userRecord.displayName || null,
        role: "usuario", // Por defecto todos son usuarios
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: null,
      });
    }

    // Crear session cookie
    const expiresIn = (remember ? MAX_AGE : 2 * 60 * 60) * 1000;
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

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
    console.error("Error en sessionLogin:", error);
    return NextResponse.json(
      { error: "No se pudo crear la cookie de sesión" },
      { status: 401 }
    );
  }
}