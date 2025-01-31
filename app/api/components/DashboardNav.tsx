"use client";

import { BookCheck, Menu, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function DashboardNav() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuDashboard = [
    { name: "Home", icon: BookCheck, path: "/dashboard/home" },
    { name: "Gestion des Clients", icon: BookCheck, path: "/dashboard/client" },
    { name: "Ajout de Pub", icon: BookCheck, path: "/dashboard/pub" },
    { name: "Suivi des Pubs", icon: BookCheck, path: "/dashboard/suivi" },
    { name: "Settings", icon: Settings, path: "/dashboard/Settings" },
  ];

  return (
    <nav className="w-full md:w-16 lg:w-60">
      <div className="flex items-center justify-between p-3 md:hidden">
        <span className="text-lg font-bold">Dashboard</span>
        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="">
          <Menu className="w-6 h-6" />
        </button>
      </div>
      <div
        className={`${
          isMenuOpen ? "block" : "hidden"
        } md:flex md:flex-col md:h-full`}
      >
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
                <span>{link.name}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
