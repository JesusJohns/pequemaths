"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// Tipo de usuario que se espera recibir como props
type User = {
  uid: string;
  email: string;
  name?: string;
  picture?: string;
};

// Componente Cliente: ProfileClient
// Descripción:
// - Componente React cliente (con "use client") que renderiza el formulario de edición de perfil.
// - Gestiona estado local: nombre, foto, loading, mensajes de estado.
// - Permite editar nombre y URL de foto de perfil.
// - Incluye funcionalidad de logout (con modal de confirmación).
//
// Props recibidos:
// - `user`: objeto User con uid, email, name, picture del perfil a mostrar/editar.
// - `editableUid` (opcional): si está presente, indica que se está editando otro perfil (admin).
//   En ese caso, se incluye en la petición POST para que el servidor verifique permisos.
// - `isAdminView` (opcional): bandera que indica si se está en modo admin.
//
// Flujo de edición:
// 1) Usuario modifica campos (nombre, URL de foto).
// 2) Click en "Guardar cambios" → onSubmit().
// 3) onSubmit() valida que nombre no esté vacío.
// 4) Envía POST a /api/profile con { name, picture, [uid si admin] }.
// 5) Servidor valida sesión y permisos antes de actualizar Firebase.
// 6) Muestra mensaje de éxito o error en la UI.

export default function ProfileClient({ user, editableUid, isAdminView }: { user: User; editableUid?: string; isAdminView?: boolean }) {
  const router = useRouter();
  
  // Debug log en el cliente para diagnosticar qué datos se cargaron
  console.log("[ProfileClient] Loaded with user:", { uid: user?.uid, name: user?.name, hasEditableUid: !!editableUid, isAdminView });
  
  // Estado del componente
  const [name, setName] = useState(user.name ?? "");
  const [picture, setPicture] = useState(user.picture ?? "");
  const [status, setStatus] = useState<null | { ok: boolean; msg?: string }>(null);
  const [loading, setLoading] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // onSubmit:
  // - Manejador del formulario de edición de perfil.
  // - Valida que el nombre no esté vacío.
  // - Construye el body con name, picture y opcionalmente uid si es admin.
  // - Envía POST a /api/profile.
  // - Muestra mensaje de éxito o error basado en la respuesta.
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!name.trim()) {
      setStatus({ ok: false, msg: "El nombre no puede estar vacío" });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      // Construye el body para la petición
      const body: Record<string, unknown> = { name, picture };
      // Si se está editando otro perfil (admin), incluye el uid objetivo
      // para que el servidor verifique permisos
      if (editableUid) body.uid = editableUid;

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error al guardar");

      setStatus({ ok: true, msg: "✅ Perfil guardado correctamente" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus({ ok: false, msg: "❌ " + msg });
      console.error("Profile save failed:", err);
    } finally {
      setLoading(false);
    }
  }

  // handleLogout:
  // - Envía petición POST a /api/sessionLogout para destruir el cookie de sesión.
  // - Si tiene éxito, redirige a la página principal.
  async function handleLogout() {
    try {
      const res = await fetch("/api/sessionLogout", { method: "POST" });
      if (res.ok) {
        router.push("/");
      }
    } catch (err) {
      console.error("Logout failed:", err);
      alert("Error al cerrar sesión");
    }
  }

  // Notas de seguridad:
  // - Este componente es cliente y CONFÍA en que props.user viene del servidor.
  // - El servidor (profile/page.tsx) ya validó que user es el actual o admin lo autoriza.
  // - La API /api/profile vuelve a validar sesión y permisos en el servidor ANTES de guardar.
  // - Si se intenta editar otro perfil sin ser admin, la API rechaza con 403.


  return (
    <div className="space-y-8">
      {isAdminView && (
        <div className="text-sm text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-md p-2 text-center">
          Modo administrador: editando perfil de <strong>{editableUid ?? user.uid}</strong>
        </div>
      )}
      {/* Sección de Foto de Perfil */}
      <div className="flex flex-col items-center">
        <div className="relative mb-6">
          {picture ? (
            <Image
              src={picture}
              alt="foto de perfil"
              width={120}
              height={120}
              className="rounded-full border-4 border-blue-400 shadow-lg object-cover"
              unoptimized
            />
          ) : (
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-200 to-purple-200 flex items-center justify-center shadow-lg text-4xl font-bold text-blue-600">
              {name?.charAt(0)?.toUpperCase() || "?"}
            </div>
          )}
          <div className="absolute bottom-0 right-0 bg-blue-500 text-white rounded-full p-3 shadow-lg">
            👤
          </div>
        </div>
        <p className="text-sm text-gray-600">ID: {user.uid.slice(0, 8)}...</p>
      </div>

      {/* Formulario */}
      <form onSubmit={onSubmit} className="space-y-4">
        {/* Email (solo lectura) */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">📧 Email</label>
          <input
            type="email"
            value={user.email}
            disabled
            className="w-full px-4 py-3 bg-gray-100 border-2 border-gray-300 rounded-lg text-gray-600 font-medium cursor-not-allowed"
          />
          <p className="text-xs text-gray-500 mt-1">Tu email no puede ser modificado</p>
        </div>

        {/* Nombre */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">📝 Nombre completo</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Escribe tu nombre"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
          />
        </div>

        {/* URL de Foto */}
        <div>
          <label className="block text-sm font-bold text-gray-700 mb-2">🖼 URL de foto de perfil</label>
          <input
            type="url"
            value={picture}
            onChange={(e) => setPicture(e.target.value)}
            placeholder="https://ejemplo.com/foto.jpg"
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 transition"
          />
          <p className="text-xs text-gray-500 mt-1">Asegúrate de que la URL sea válida (https)</p>
        </div>

        {/* Botón Guardar */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-emerald-400 to-emerald-600 text-white font-bold rounded-lg hover:from-emerald-500 hover:to-emerald-700 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "⏳ Guardando..." : "💾 Guardar cambios"}
        </button>

        {/* Mensaje de estado */}
        {status && (
          <div
            className={`p-3 rounded-lg text-center font-semibold ${status.ok ? 'bg-green-100 text-green-700 border-2 border-green-300' : 'bg-red-100 text-red-700 border-2 border-red-300'}`}
          >
            {status.msg}
          </div>
        )}
      </form>

      {/* Separador */}
      <div className="border-t-2 border-gray-200 pt-6">
        {/* Botón Logout */}
        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full py-3 bg-gradient-to-r from-red-400 to-red-600 text-white font-bold rounded-lg hover:from-red-500 hover:to-red-700 hover:shadow-lg transition-all"
        >
          🚪 Cerrar sesión
        </button>
      </div>

      {/* Modal de Confirmación de Logout */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-sm shadow-2xl animate-scale-in">
            <div className="text-5xl mb-4 text-center">⚠</div>
            <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">¿Cerrar sesión?</h2>
            <p className="text-gray-600 text-center mb-6">¿Estás seguro de que quieres cerrar tu sesión?</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2 bg-gray-300 text-gray-800 font-bold rounded-lg hover:bg-gray-400 transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 transition"
              >
                Sí, cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes scale-in {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scale-in {
          animation: scale-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}