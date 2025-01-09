"use client";

import { auth } from "@/app/firebase/config";
import { signOut } from "firebase/auth";
import { Loader2, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  className?: string;
};

export const SignOutButton = ({ className = "" }: Props) => {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      await signOut(auth);
      setTimeout(() => {
        router.replace("/");
      }, 100);
    } catch (error) {
      console.error("Error signing out:", error);
      setIsSigningOut(false);
    }
  };

  return (
    <button
      onClick={handleSignOut}
      disabled={isSigningOut}
      className={`
        inline-flex items-center justify-center gap-2
        bg-red-500/10 hover:bg-red-500/20 
        text-red-600 dark:text-red-400
        px-4 py-2 rounded-lg
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        font-medium
        ${className}
      `}
    >
      {isSigningOut ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Signing out...</span>
        </>
      ) : (
        <>
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </>
      )}
    </button>
  );
};
