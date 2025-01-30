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
      const filePath = `client/${clientName}/${format}/${file.name}`;

      const bucketName = process.env.FIREBASE_STORAGE_BUCKET;

      if (!bucketName) {
        console.error("Storage bucket name not specified");
        return NextResponse.json(
          { error: "Storage bucket name not specified" },
          { status: 500 }
        );
      }

      const bucket = adminStorage.bucket(bucketName);

      if (!bucket) {
        console.error("Could not get storage bucket");
        return NextResponse.json(
          { error: "Could not get storage bucket" },
          { status: 500 }
        );
      }

      const fileRef = bucket.file(filePath);

      await fileRef.save(buffer, {
        metadata: {
          contentType: file.type,
        },
      });

      // Make the file publicly accessible
      await fileRef.makePublic();

      // Update Firestore document
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

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;

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
