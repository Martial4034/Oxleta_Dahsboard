import { ProtectedRoute } from "@/app/api/components/auth/protected-route";
import DashboardNav from "@/app/api/components/DashboardNav";
import { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute>
      <section className="max-w-[2000px] mx-auto flex flex-col md:flex-row h-screen w-full p-2">
        <div className="md:w-64 md:min-h-screen">
          <DashboardNav />
        </div>
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </section>
    </ProtectedRoute>
  );
}
