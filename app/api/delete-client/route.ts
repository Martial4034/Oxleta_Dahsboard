import { adminDb, adminStorage } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const clientId = url.searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: "Client ID is required" },
        { status: 400 }
      );
    }

    // 1. Supprimer les images du storage Firebase
    const bucket = adminStorage.bucket(process.env.FIREBASE_STORAGE_BUCKET);
    await bucket.deleteFiles({ prefix: `client/${clientId}/` });

    // 2. Supprimer le document Firestore
    await adminDb.collection("clients").doc(clientId).delete();

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error deleting client:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete client" },
      { status: 500 }
    );
  }
}
