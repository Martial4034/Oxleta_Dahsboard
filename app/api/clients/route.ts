import { adminDb } from "@/lib/firebase-admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { name } = await request.json();

    // Créer un ID à partir du nom du client (en minuscules et sans espaces)
    const docId = name.toLowerCase().replace(/\s+/g, "-");

    // Vérifier si le client existe déjà en utilisant l'ID
    const existingDoc = await adminDb.collection("clients").doc(docId).get();

    if (existingDoc.exists) {
      return NextResponse.json(
        {
          success: false,
          error: "A client with this name already exists",
        },
        { status: 400 }
      );
    }

    const clientDoc = {
      name,
      createdAt: new Date(),
      formats: {
        "1:1": false,
        "16:9": false,
        "9:16": false,
        "3:9": false,
        "9:3": false,
      },
    };

    // Utiliser le docId comme identifiant du document
    await adminDb.collection("clients").doc(docId).set(clientDoc);

    return NextResponse.json({
      success: true,
      id: docId,
    });
  } catch (error) {
    console.error("Error creating client:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create client" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const snapshot = await adminDb.collection("clients").get();
    const clients = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ clients });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}
