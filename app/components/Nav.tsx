"use client";

import Link from "next/link";
import React from "react";
import { ThemeToggle } from "./ThemeToggle";

export default function Nav() {
  return (
    <nav className="max-w-[2000px] w-full mx-auto h-[80px] flex items-center justify-between p-5 border-b  border-gray-300">
      <Link href="/">
        <h1 className="text-3xl font-bold">Oxelta</h1>
      </Link>
      {/* <div className="flex gap-4 item-center"><ThemeToggle/> </div> */}
    </nav>
  );
}
