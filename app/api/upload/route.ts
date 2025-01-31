import { adminStorage } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const country = formData.get("country") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convertir le File en Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Créer le chemin du fichier
    const weekNumber = formData.get("weekNumber");
    const position = file.name.split(".")[0]; // Le nom du fichier est la position
    const positionNumber = position.split("-")[2];

    const filePath = `pub_images/${country}/week${weekNumber}/${positionNumber}/${file.name}`;

    // Upload vers Firebase Storage
    const bucket = adminStorage.bucket(process.env.FIREBASE_STORAGE_BUCKET);
    const fileRef = bucket.file(filePath);

    try {
      await fileRef.save(buffer, {
        metadata: {
          contentType: file.type,
        },
      });

      // Rendre le fichier public
      await fileRef.makePublic();

      // Générer l'URL publique
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

      return NextResponse.json({
        success: true,
        filePath,
        publicUrl,
      });
    } catch (uploadError) {
      console.error("Error uploading to Firebase:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload file to storage" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in upload route:", error);
    return NextResponse.json(
      { error: "Failed to process upload request" },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
