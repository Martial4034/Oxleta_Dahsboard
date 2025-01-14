"use client";

import { useAuth } from "@/app/hooks/useAuth";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-gray-100">
        <div className="flex flex-col items-center">
          <div className="w-32 h-32 mb-4 ease-linear border-8 border-t-8 border-gray-200 rounded-full loader"></div>
          <p className="text-xl font-semibold text-gray-700">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    redirect("/");
  }

  return <>{children}</>;
};
