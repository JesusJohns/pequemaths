import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware de Next.js
 * 
 * Descripción:
 * - Se ejecuta ANTES de que cualquier página se renderice.
 * - Protege rutas que requieren autenticación verificando el cookie de sesión.
 * - Si el usuario no está autenticado y trata de acceder a una ruta protegida,
 *   lo redirige automáticamente a /log-in.
 * 
 * Rutas protegidas:
 * - /profile
 * - /admin (si lo implementas más adelante)
 * 
 * Flujo:
 * 1) Verifica si la ruta actual está en la lista de rutas protegidas.
 * 2) Lee el cookie __session de la petición.
 * 3) Si no hay cookie y la ruta está protegida, redirige a /log-in.
 * 4) Si hay cookie o la ruta no está protegida, permite el acceso.
 */
export function middleware(request: NextRequest) {
  // Obtener el cookie de sesión
  const sessionCookie = request.cookies.get("__session");
  
  // Lista de rutas que requieren autenticación
  const protectedPaths = ["/profile", "/admin"];
  
  // Verificar si la ruta actual está protegida
  const isProtectedPath = protectedPaths.some(path => 
    request.nextUrl.pathname.startsWith(path)
  );
  
  // Si la ruta está protegida y no hay sesión, redirigir a login
  if (isProtectedPath && !sessionCookie) {
    console.log("[Middleware] Acceso denegado a:", request.nextUrl.pathname);
    // Construir URL de login con redirect para volver después de autenticarse
    const loginUrl = new URL("/log-in", request.url);
    loginUrl.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // Permitir acceso a todas las demás rutas
  return NextResponse.next();
}

/**
 * Configuración del middleware
 * 
 * matcher: Define en qué rutas se ejecutará este middleware.
 * - Excluye archivos estáticos (_next/static, favicon.ico, etc.)
 * - Se ejecuta en todas las demás rutas
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    "/((?!_next/static|_next/image|favicon.ico|imagenes|.*\\.svg$|.*\\.png$).*)",
  ],
};