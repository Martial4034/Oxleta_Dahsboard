"use client";

import { auth } from "@/app/firebase/config"; // Ensure this is correctly imported
import { Menu } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth"; // Ensure this hook is installed and imported
import { SignOutButton } from "./sign-out-button";

export default function Nav() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user] = useAuthState(auth);
  const menuRef = useRef<HTMLDivElement | null>(null); // Create a ref for the menu

  const toggleMenu = () => setMenuOpen(!menuOpen);

  // Close the menu when clicking outside of it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuOpen &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
      <div className="max-w-[2000px] w-full mx-auto h-16 flex items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <h1 className="text-2xl font-bold text-primary">Oxelta</h1>
        </Link>
        <div className="relative" ref={menuRef}>
          <button
            onClick={toggleMenu}
            className="p-2 transition-colors rounded-md hover:bg-gray-100"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 w-64 mt-2 overflow-hidden bg-white border rounded-lg shadow-lg animate-in slide-in-from-top-2">
              <div className="p-4">
                {user ? (
                  <>
                    <div className="flex flex-col items-center space-y-3">
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <SignOutButton className="w-full" />
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-600">Please log in</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
