import { adminStorage } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const weekNumber = formData.get("weekNumber") as string;
    const position = formData.get("position") as string;
    const positionNumber = position.split("-")[2];

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Déterminer l'extension en fonction du type MIME
    let fileExtension = "";
    switch (file.type) {
      case "image/jpeg":
        fileExtension = "jpg";
        break;
      case "image/png":
        fileExtension = "png";
        break;
      case "image/webp":
        fileExtension = "webp";
        break;
      case "image/svg+xml":
        fileExtension = "svg";
        break;
      default:
        fileExtension = file.name.split(".").pop()?.toLowerCase() || "jpg";
    }

    // Construire le chemin de stockage avec l'extension
    const storagePath = `pub_images/ALL/week${weekNumber}/${positionNumber}/${position}.${fileExtension}`;

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const bucket = adminStorage.bucket();
    const fileRef = bucket.file(storagePath);

    await fileRef.save(buffer, {
      metadata: {
        contentType: file.type,
      },
    });

    await fileRef.makePublic();
    const publicUrl = `https://storage.googleapis.com/${process.env.FIREBASE_STORAGE_BUCKET}/${storagePath}`;

    return NextResponse.json({ publicUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
