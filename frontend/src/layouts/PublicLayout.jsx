import React from "react";
import { Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <main className="flex items-center justify-center min-h-screen p-6 bg-neutral-lightBg dark:bg-neutral-darkBg transition-colors duration-300">
      <Outlet /> {/* Renders Login, Signup, etc */}
    </main>
  );
}
