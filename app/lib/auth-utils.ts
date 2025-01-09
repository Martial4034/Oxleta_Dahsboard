import { jwtVerify } from "jose";

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

export async function verifyAuth(token: string) {
  if (!FIREBASE_PROJECT_ID) {
    console.error("Firebase Project ID is not defined");
    return null;
  }

  try {
    console.log("Fetching Firebase public keys...");
    const response = await fetch(
      "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com",
      {
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch public keys");
    }

    const publicKeys = await response.json();
    let payload = null;

    // Try each public key until one works
    for (const keyId in publicKeys) {
      try {
        const publicKey = publicKeys[keyId];
        const result = await jwtVerify(
          token,
          new TextEncoder().encode(publicKey),
          {
            issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
            audience: FIREBASE_PROJECT_ID,
            algorithms: ["RS256"],
          }
        );

        console.log("Token verified with key:", keyId);
        payload = result.payload;
        break;
      } catch (e) {
        console.log("Failed with key:", keyId, "trying next key...");
        continue;
      }
    }

    if (!payload) {
      console.error("No valid key found for token verification");
    }

    return payload;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}
