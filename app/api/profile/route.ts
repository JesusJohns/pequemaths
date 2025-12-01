import { NextResponse } from "next/server";
import { getSessionUser } from "@/app/lib/getSessionUser";
import { adminAuth, adminDb } from "@/app/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "not_authenticated" }, { status: 401 });

    const body = await req.json();
    const name = typeof body.name === "string" ? body.name.trim() : null;
    const picture = typeof body.picture === "string" ? body.picture.trim() : null;

    // Update Firebase Auth profile
    await adminAuth.updateUser(user.uid, {
      displayName: name ?? undefined,
      photoURL: picture ?? undefined,
    });

    // Optionally persist in Firestore under `users/{uid}`
    try {
      await adminDb.collection("users").doc(user.uid).set({ name: name ?? null, picture: picture ?? null }, { merge: true });
    } catch (e) {
      console.warn("Firestore write failed for user profile update", e);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("/api/profile error:", err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
