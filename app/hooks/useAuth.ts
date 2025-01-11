"use client";

import { auth } from "@/app/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";

export const useAuth = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(auth.currentUser);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, isLoading };
};
