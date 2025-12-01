import { getSessionUser } from "@/app/lib/getSessionUser";
import ProfileClient from "./ProfileClient";
import { isAdmin, getUserProfile } from "@/app/lib/admin-roles";

// Página: /profile
// Descripción:
// - Página principal del perfil de usuario.
// - Renderizada en el servidor (async component) para validar sesión ANTES de enviar al cliente.
// - Si hay sesión: muestra formulario de edición de perfil.
// - Si NO hay sesión: muestra mensaje "No autenticado" con enlace a login.
// - Soporta vista admin: si el usuario es admin y accede con ?uid=OTHERID, carga ese perfil.
//
// Flujo de autenticación:
// 1) getSessionUser() verifica el cookie __session y lo decodifica con Firebase Admin.
// 2) Si decodificación falla, devuelve null (no autenticado).
// 3) Si tiene sesión y pasa ?uid=X, verifica si es admin usando isAdmin().
// 4) Si es admin, carga el perfil objetivo de Firestore.
// 5) Si no es admin o carga falla, muestra el propio perfil.

export default async function ProfilePage({ searchParams }: { searchParams?: { uid?: string } }) {
  // Obtiene la sesión actual del usuario autenticado (o null si no hay sesión válida)
  const user = await getSessionUser();

  // Inicializa viewUser con el perfil del usuario actual o null
  let viewUser: typeof user | null = user;
  let adminView = false;

  // Lógica de admin: permite editar perfiles de otros usuarios si se es admin
  if (user && searchParams?.uid) {
    try {
      // Verifica si el usuario actual es administrador
      const allowed = await isAdmin(user.uid);
      if (allowed) {
        // Si es admin, carga el perfil del usuario especificado en ?uid=
        const profile = await getUserProfile(searchParams.uid);
        if (profile) {
          // Convierte el perfil Firestore a la estructura esperada por ProfileClient
          viewUser = {
            uid: profile.uid,
            email: profile.email,
            name: profile.displayName ?? "",
            picture: profile.picture ?? "",
          };
          adminView = true;
        }
      }
    } catch (err) {
      // Si hay error (p.ej. Firebase no disponible), ignora la vista admin
      // y muestra el propio perfil del usuario actual
      console.error("Error loading admin profile view:", err);
      viewUser = user;
      adminView = false;
    }
  }

  return (
    <>
      <header className="w-full bg-gradient-to-r from-sky-400 to-blue-500 py-4 px-6 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="text-4xl font-bold text-yellow-300">Peque</span>
            <span className="text-4xl font-bold text-white">MATHS</span>
          </div>
          <a href="/." className="bg-white text-blue-500 px-6 py-2 rounded-full font-bold hover:bg-yellow-300 hover:text-blue-600 transition-all hover:scale-105">
            🏠 Inicio
          </a>
        </div>
      </header>

      <main className="min-h-screen bg-gradient-to-br from-sky-100 via-blue-50 to-purple-100 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {user ? (
            // Usuario autenticado: muestra el formulario de perfil
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              {/* Header del perfil */}
              <div className="bg-gradient-to-r from-sky-400 to-blue-500 p-8 text-center">
                <h1 className="text-4xl font-bold text-white mb-2">👤 Mi Perfil</h1>
                <p className="text-sky-100">Personaliza tu cuenta y edita tus datos</p>
              </div>

              {/* Contenido */}
              <div className="p-8">
                {viewUser ? (
                  // Renderiza el componente cliente con los datos del perfil (propio o admin)
                  <ProfileClient user={viewUser} editableUid={adminView ? viewUser.uid : undefined} isAdminView={adminView} />
                ) : (
                  // Si viewUser no cargó correctamente, muestra error
                  <div className="text-center text-gray-600">
                    <p className="text-lg">Error al cargar el perfil. Por favor, recarga la página.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            // Usuario NO autenticado: muestra mensaje y enlace a login
            <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-red-400 to-pink-500 p-12 text-center">
                <h1 className="text-4xl font-bold text-white mb-4">⚠ No autenticado</h1>
                <p className="text-lg text-red-50 mb-8">No estás conectado. Inicia sesión para acceder a tu perfil.</p>
                <a
                  href="/log-in"
                  className="inline-block px-8 py-3 bg-white text-red-500 font-bold rounded-full hover:bg-red-50 hover:scale-105 transition-all shadow-lg"
                >
                  🔐 Iniciar sesión
                </a>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}