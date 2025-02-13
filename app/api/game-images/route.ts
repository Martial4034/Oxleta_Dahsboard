import { DocumentData, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { NextResponse } from "next/server";
import { adminDb } from "../../lib/firebase-admin";

// Define an interface for the image data
interface ImageData {
  id?: string;
  imageUrl: string;
  format: "PNG" | "JPEG";
  height: number;
  width: number;
  weekNumber: number;
  dimensions: { width: number; height: number };
  createdAt?: Date;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const weekNumber = searchParams.get("weekNumber");
    const docId = searchParams.get("docId");

    if (docId) {
      const doc = await adminDb.collection("game-images").doc(docId).get();
      console.log("Checking document:", docId, "Exists:", doc.exists);
      if (!doc.exists) {
        // Liste tous les documents pour debug
        const snapshot = await adminDb.collection("game-images").get();
        const allDocs = snapshot.docs.map((d) => d.id);
        console.log("All document IDs:", allDocs);
      }
      return NextResponse.json({ exists: doc.exists });
    }

    if (!weekNumber) {
      console.error("Week number is missing");
      return NextResponse.json(
        {
          success: false,
          error: "Week number is required",
        },
        { status: 400 }
      );
    }

    const imagesRef = adminDb.collection("game-images");
    const query = imagesRef.where("weekNumber", "==", parseInt(weekNumber, 10));

    const snapshot = await query.get();

    if (snapshot.empty) {
      console.log("No images found for week number:", weekNumber);
      return NextResponse.json({
        success: true,
        images: [],
      });
    }

    const images = snapshot.docs.map(
      (doc: QueryDocumentSnapshot<DocumentData>) => {
        const data = doc.data() as ImageData;
        return {
          id: doc.id,
          ...data,
          createdAt:
            data.createdAt instanceof Date
              ? data.createdAt
              : data.createdAt
              ? new Date(data.createdAt)
              : new Date(),
        };
      }
    );

    console.log("Fetched images:", images);

    return NextResponse.json({
      success: true,
      images,
    });
  } catch (error) {
    console.error("Error in GET route:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch images",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { customDocId, imageData } = await request.json();

    const docRef = adminDb.collection("game-images").doc(customDocId);
    await docRef.set({
      ...imageData,
      createdAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      id: customDocId,
    });
  } catch (error) {
    console.error("Error saving game image:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to save image",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { docId, updates } = await request.json();

    const docRef = adminDb.collection("game-images").doc(docId);
    await docRef.update(updates);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error("Error updating game image:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update image",
      },
      { status: 500 }
    );
  }
}
