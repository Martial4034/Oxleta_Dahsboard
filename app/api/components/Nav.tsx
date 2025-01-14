"use client";

import { auth } from "@/app/firebase/config"; // Ensure this is correctly imported
import { Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth"; // Ensure this hook is installed and imported
import { SignOutButton } from "./sign-out-button";

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user] = useAuthState(auth);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  return (
    <nav className="max-w-[2000px] w-full mx-auto h-[80px] flex items-center justify-between p-5 border-b border-gray-300">
      <Link href="/">
        <h1 className="text-3xl font-bold">Oxelta</h1>
      </Link>
      <div className="relative">
        <button onClick={toggleMenu} className="p-2">
          <Menu className="w-6 h-6" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 w-64 mt-2 bg-white border rounded-lg shadow-lg">
            <div className="p-4">
              {user ? (
                <>
                  <div className="flex flex-col items-center">
                    <p className="text-sm text-gray-700">{user.email}</p>
                    <SignOutButton className="mt-2" />
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-700">Please log in</p>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
