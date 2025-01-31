import { adminStorage } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { clientName, format, weekNumber, position } = await req.json();

    const bucket = adminStorage.bucket(process.env.FIREBASE_STORAGE_BUCKET);

    // Vérifier si l'image source existe
    const sourcePrefix = `client/${clientName}/${format}/${format}`;
    const [sourceFiles] = await bucket.getFiles({ prefix: sourcePrefix });

    if (sourceFiles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Missing image format ${format} for client ${clientName}`,
        },
        { status: 400 }
      );
    }

    const sourceFile = sourceFiles[0];
    const fileExtension = sourceFile.name.split(".").pop();

    // Extraire le troisième chiffre de la position (ex: P-1-2-3 => 2)
    const positionNumber = position.split("-")[2];

    // Construire le chemin de destination
    const destPath = `pub_images/ALL/week${weekNumber}/${positionNumber}/${position}.${fileExtension}`;
    const destFile = bucket.file(destPath);

    // Copier le fichier
    await sourceFile.copy(destFile);
    await destFile.makePublic();

    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${destPath}`;

    return NextResponse.json({
      success: true,
      publicUrl,
      path: destPath,
    });
  } catch (error) {
    console.error("Error copying image:", error);
    return NextResponse.json(
      { success: false, error: "Failed to copy image" },
      { status: 500 }
    );
  }
}
