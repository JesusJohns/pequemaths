// lib/admin-roles.ts
import { adminDb } from "./firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export type UserRole = "admin" | "usuario";

export type UserProfile = {
  uid: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string | null;
};

const USERS_COLLECTION = "users";

/**
 * Obtener el rol de un usuario
 */
export async function getUserRole(uid: string): Promise<UserRole | null> {
  try {
    const doc = await adminDb.collection(USERS_COLLECTION).doc(uid).get();
    
    if (!doc.exists) {
      return null;
    }
    
    const data = doc.data();
    return (data?.role as UserRole) || "usuario"; // Por defecto es usuario
  } catch (error) {
    console.error("Error obteniendo rol:", error);
    return null;
  }
}

/**
 * Verificar si un usuario es administrador
 */
export async function isAdmin(uid: string): Promise<boolean> {
  const role = await getUserRole(uid);
  return role === "admin";
}

/**
 * Crear perfil de usuario con rol
 */
export async function createUserProfile(
  uid: string,
  email: string,
  displayName: string | null,
  role: UserRole = "usuario"
): Promise<void> {
  try {
    await adminDb.collection(USERS_COLLECTION).doc(uid).set({
      email,
      displayName,
      role,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: null,
    });
  } catch (error) {
    console.error("Error creando perfil:", error);
    throw error;
  }
}

/**
 * Actualizar rol de usuario (solo admin puede hacer esto)
 */
export async function updateUserRole(
  uid: string,
  newRole: UserRole
): Promise<void> {
  try {
    await adminDb.collection(USERS_COLLECTION).doc(uid).update({
      role: newRole,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Error actualizando rol:", error);
    throw error;
  }
}

/**
 * Obtener perfil completo del usuario
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const doc = await adminDb.collection(USERS_COLLECTION).doc(uid).get();
    
    if (!doc.exists) {
      return null;
    }
    
    const data = doc.data();
    return {
      uid: doc.id,
      email: data?.email || "",
      displayName: data?.displayName || null,
      role: (data?.role as UserRole) || "usuario",
      createdAt: data?.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      updatedAt: data?.updatedAt?.toDate?.()?.toISOString() || null,
    };
  } catch (error) {
    console.error("Error obteniendo perfil:", error);
    return null;
  }
}

/**
 * Listar todos los usuarios con su rol
 */
export async function listAllUsers(): Promise<UserProfile[]> {
  try {
    const snapshot = await adminDb.collection(USERS_COLLECTION).get();
    
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        uid: doc.id,
        email: data.email || "",
        displayName: data.displayName || null,
        role: (data.role as UserRole) || "usuario",
        createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || null,
      };
    });
  } catch (error) {
    console.error("Error listando usuarios:", error);
    return [];
  }
}