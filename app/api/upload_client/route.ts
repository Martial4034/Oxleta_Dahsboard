import { adminDb, adminStorage } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const clientName = formData.get("clientName") as string;
    const format = formData.get("format") as string;

    if (!file || !clientName || !format) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileExtension = file.name.split(".").pop();
      const filePath = `client/${clientName}/${format}/${format}.${fileExtension}`;

      const bucket = adminStorage.bucket(process.env.FIREBASE_STORAGE_BUCKET);

      // Supprimer l'ancienne image si elle existe
      try {
        const [files] = await bucket.getFiles({
          prefix: `client/${clientName}/${format}/`,
        });
        await Promise.all(files.map((file) => file.delete()));
      } catch (error) {
        console.log("No existing file to delete or error:", error);
      }

      const fileRef = bucket.file(filePath);
      await fileRef.save(buffer, {
        metadata: {
          contentType: file.type,
        },
      });

      await fileRef.makePublic();

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

      // Mettre à jour Firestore
      const clientsRef = adminDb.collection("clients");
      const clientSnapshot = await clientsRef
        .where("name", "==", clientName)
        .get();

      if (clientSnapshot.empty) {
        return NextResponse.json(
          { error: "Client not found" },
          { status: 404 }
        );
      }

      const clientDoc = clientSnapshot.docs[0];
      await clientDoc.ref.update({
        [`formats.${format}`]: true,
      });

      return NextResponse.json({
        success: true,
        message: "Image uploaded successfully",
        path: filePath,
        publicUrl,
      });
    } catch (error) {
      console.error("Storage/Firestore error:", error);
      return NextResponse.json(
        { error: "Failed to process upload" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
