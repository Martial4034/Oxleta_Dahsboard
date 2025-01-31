import { adminDb } from "@/lib/firebase-admin";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const weekNumber = parseInt(searchParams.get("weekNumber") || "0", 10);

    console.log("Fetching stats for week:", weekNumber);

    if (!weekNumber) {
      return NextResponse.json(
        { error: "Week number is required" },
        { status: 400 }
      );
    }

    const imagesRef = adminDb.collection("game-images");
    const snapshot = await imagesRef
      .where("weekNumber", "==", weekNumber)
      .get();

    console.log("Found documents:", snapshot.size);

    const offerCounts: Record<string, { count: number; clients: string[] }> =
      {};

    snapshot.forEach((doc) => {
      const data = doc.data();
      console.log("Document data:", data);
      if (data.offerType) {
        if (!offerCounts[data.offerType]) {
          offerCounts[data.offerType] = { count: 0, clients: [] };
        }
        offerCounts[data.offerType].count += 1;
        offerCounts[data.offerType].clients.push(data.company_name);
      }
    });

    console.log("Final counts:", offerCounts);

    // Initialiser toutes les offres à 0 si elles n'existent pas
    const allOfferTypes = [
      "Premium 1",
      "Gold 1",
      "Gold 2",
      "Silver 1",
      "Silver 2",
      "Silver 3",
    ];
    allOfferTypes.forEach((type) => {
      if (!offerCounts[type]) {
        offerCounts[type] = { count: 0, clients: [] };
      }
    });

    return NextResponse.json(offerCounts);
  } catch (error) {
    console.error("Error fetching offer stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch offer statistics" },
      { status: 500 }
    );
  }
}
