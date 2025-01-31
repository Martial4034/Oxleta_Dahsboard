import { adminStorage } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { imagePath } = await req.json();

    const bucket = adminStorage.bucket(process.env.FIREBASE_STORAGE_BUCKET);
    const file = bucket.file(imagePath);

    // Rendre le fichier public
    await file.makePublic();

    // Générer l'URL publique
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${imagePath}`;

    return NextResponse.json({
      success: true,
      publicUrl,
    });
  } catch (error) {
    console.error("Error making file public:", error);
    return NextResponse.json(
      { success: false, error: "Failed to make file public" },
      { status: 500 }
    );
  }
}
