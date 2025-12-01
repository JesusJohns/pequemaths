"use client";

import { useState } from "react";
import Image from "next/image";

type User = {
  uid: string;
  email: string;
  name?: string;
  picture?: string;
};

export default function ProfileClient({ user }: { user: User }) {
  const [name, setName] = useState(user.name ?? "");
  const [picture, setPicture] = useState(user.picture ?? "");
  const [status, setStatus] = useState<null | { ok: boolean; msg?: string }>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, picture }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Error al guardar");

      setStatus({ ok: true, msg: "Perfil guardado correctamente" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatus({ ok: false, msg });
      console.error("Profile save failed:", err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center">
      {picture ? (
        <Image
          src={picture}
          alt="foto de perfil"
          width={96}
          height={96}
          className="rounded-full border shadow mb-4"
          unoptimized
        />
      ) : (
        <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-4">?
        </div>
      )}

      <form onSubmit={onSubmit} className="w-full">
        <label className="block text-sm font-medium text-gray-700">Nombre</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 mb-3 block w-full rounded-md border-gray-200 shadow-sm"
        />

        <label className="block text-sm font-medium text-gray-700">URL foto</label>
        <input
          value={picture}
          onChange={(e) => setPicture(e.target.value)}
          className="mt-1 mb-3 block w-full rounded-md border-gray-200 shadow-sm"
        />

        <p className="text-sm text-gray-600 mb-3">Email: {user.email}</p>

        <button
          type="submit"
          className="w-full py-3 bg-emerald-500 text-white font-bold rounded-lg hover:bg-emerald-600 transition"
          disabled={loading}
        >
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>

        {status && (
          <p className={`mt-3 text-center ${status.ok ? "text-green-600" : "text-red-600"}`}>
            {status.msg}
          </p>
        )}
      </form>
    </div>
  );
}
