import { getSessionUser } from "@/app/lib/getSessionUser";
import ProfileClient from "./ProfileClient";

export default async function ProfilePage() {
  const user = await getSessionUser();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="max-w-md w-full bg-white shadow-xl rounded-xl p-8">
        <h2 className="text-3xl font-bold text-center mb-6">Perfil del Usuario</h2>

        {user ? (
          <>
            <ProfileClient user={user} />

            <form action="/." method="POST" className="mt-4">
              <button
                type="submit"
                className="w-full py-3 bg-pink-300 text-white font-bold rounded-lg hover:bg-red-600 transition"
              >
                Inicio
              </button>
            </form>
          </>
        ) : (
          <div className="text-center">
            <p className="mb-4">No estás autenticado. Inicia sesión para editar tu perfil.</p>
            <a
              href="/log-in"
              className="inline-block px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600"
            >
              Iniciar sesión
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
