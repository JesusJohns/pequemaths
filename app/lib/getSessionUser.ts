import { cookies } from "next/headers";
import { adminAuth } from "./firebase-admin";

/**
 * Función: getSessionUser()
 * 
 * Descripción:
 * - Recupera y valida la sesión del usuario actual usando el cookie `__session`.
 * - Se ejecuta SIEMPRE en el servidor (Next.js Server Components).
 * - Es seguro porque el cookie es `httpOnly` (no accesible desde JavaScript cliente).
 *
 * Proceso de validación:
 * 1) Lee el cookie `__session` del navegador del cliente.
 * 2) Si existe, lo decodifica usando Firebase Admin SDK (`verifySessionCookie`).
 * 3) Si la decodificación falla (cookie expirado, alterado, inválido), devuelve null.
 * 4) Si es válido, extrae uid, email, name, picture del token decodificado.
 * 5) Devuelve un objeto User o null si no hay sesión válida.
 *
 * Retorno:
 * - User object: { uid, email, name, picture }
 * - null: si no hay sesión o la validación falla.
 *
 * Casos de fallo:
 * - No existe cookie __session → devuelve null.
 * - Cookie expirado → verifySessionCookie() lanza error → capturado y devuelve null.
 * - Cookie alterado → verifySessionCookie() rechaza → devuelve null.
 * - Firebase Admin no configurado → error capturado → devuelve null.
 */
export async function getSessionUser() {
  try {
    // Paso 1: Obtener el almacén de cookies desde el header de la petición
    const cookieStore = await cookies();
    
    // Paso 2: Leer el cookie específico `__session`
    const session = cookieStore.get("__session")?.value;

    // Paso 3: Si no existe el cookie, el usuario no tiene sesión válida
    if (!session) {
      console.warn("[getSessionUser] No session cookie found");
      return null;
    }

    // Paso 4: Decodificar y validar el token usando Firebase Admin
    // El segundo parámetro `true` indica que queremos validar que NO esté expirado
    const decoded = await adminAuth.verifySessionCookie(session, true);

    // Paso 5: Si llegamos aquí, la sesión es válida. Extraer datos del token.
    return {
      uid: decoded.uid,
      email: decoded.email ?? "",
      name: decoded.name ?? "",
      picture: decoded.picture ?? "",
    };
  } catch (err) {
    // Si cualquier cosa falla (cookie inválido, expirado, error Firebase, etc.),
    // registrar el error y devolver null para indicar "no autenticado"
    console.error("[getSessionUser] Session verification failed:", err);
    return null;
  }
}