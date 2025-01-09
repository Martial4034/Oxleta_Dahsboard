"use client";

import { useAuth } from "@/app/hooks/useAuth";
import { redirect } from "next/navigation";
import { ReactNode } from "react";

export const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    redirect("/");
  }

  return <>{children}</>;
};
