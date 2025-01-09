"use client";

import { SignOutButton } from "@/app/components/sign-out-button";
import { auth } from "@/app/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";

export default function PageSettings() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserEmail(user?.email ?? null);
    });

    return () => unsubscribe();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-primary-light dark:bg-primary-dark">
      <div className="w-full max-w-2xl p-8 rounded-lg shadow-md bg-secondary-light dark:bg-secondary-dark">
        <h1 className="mb-6 text-3xl font-bold text-center text-primary-dark dark:text-primary-light">
          Settings
        </h1>
        <div className="mb-6 text-center">
          <p className="text-xl text-secondary-dark dark:text-secondary-light">
            Email: {userEmail || "Loading..."}
          </p>
        </div>
        <div className="flex justify-center">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
