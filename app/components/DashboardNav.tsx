"use client";

import { BookCheck, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardNav() {
  const pathname = usePathname();

  const menuDashboard = [
    { name: "Home", icon: BookCheck, path: "/dashboard/home" },
    { name: "Pub", icon: BookCheck, path: "/dashboard/pub" },
    { name: "Settings", icon: Settings, path: "/dashboard/Settings" },
  ];

  return (
    <nav className="flex flex-wrap w-full gap-2 md:flex-col md:h-full md:w-16 lg:w-60">
      {menuDashboard.map((link, index) => {
        const isActive = pathname.startsWith(link.path);
        return (
          <Link href={link.path} key={index} passHref>
            <div
              className={`flex items-center justify-center lg:justify-start gap-2 cursor-pointer lg:p-3 p-3 text-sm font-bold rounded-md ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "hover:bg-blue-600 hover:bg-opacity-50 hover:text-white"
              }`}
            >
              <link.icon className="w-4" />
              <span className="hidden lg:block">{link.name}</span>
            </div>
          </Link>
        );
      })}
    </nav>
  );
}
