import { adminDb, adminStorage } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function DELETE(request: Request) {
  try {
    const { docId, imagePath } = await request.json();

    console.log("Attempting to delete:", { docId, imagePath });

    // Vérifier si le document existe avant de le supprimer
    const doc = await adminDb.collection("game-images").doc(docId).get();
    console.log("Document exists:", doc.exists);
    if (!doc.exists) {
      // Liste tous les documents pour debug
      const snapshot = await adminDb.collection("game-images").get();
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        data: doc.data(),
      }));
      console.log("Available documents:", docs);

      return NextResponse.json(
        {
          error: `Document '${docId}' not found in Firestore. Available IDs: ${docs
            .map((d) => d.id)
            .join(", ")}`,
        },
        { status: 404 }
      );
    }

    // Supprimer le document de Firestore
    await adminDb.collection("game-images").doc(docId).delete();
    console.log("Document deleted from Firestore");

    try {
      // Supprimer l'image du Storage
      const bucket = adminStorage.bucket(process.env.FIREBASE_STORAGE_BUCKET);
      const file = bucket.file(imagePath);
      console.log(imagePath);
      console.log("Checking file path in storage:", imagePath);
      const [exists] = await file.exists();
      console.log("File exists in storage:", exists);

      if (exists) {
        await file.delete();
        console.log("Image deleted from Storage");
      } else {
        console.log("Image not found in Storage");
      }
    } catch (storageError) {
      console.error("Storage deletion error:", storageError);
      // Continue même si la suppression du storage échoue
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in delete route:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete image",
      },
      { status: 500 }
    );
  }
}
