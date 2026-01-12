"use client";

import { usePepeMode } from "@/lib/pepe-context";

export function PepeModeToggle() {
  const { isPepeMode, togglePepeMode } = usePepeMode();

  return (
    <button
      onClick={togglePepeMode}
      className={`relative p-2 rounded-lg transition-all duration-300 ${
        isPepeMode
          ? "bg-gradient-to-r from-green-500 to-purple-500 text-white shadow-lg shadow-green-500/30"
          : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-400"
      }`}
      title={isPepeMode ? "Disable Pepe Mode" : "Enable Pepe Mode"}
    >
      <span className="text-lg">{isPepeMode ? "🌿" : "🍃"}</span>
      {isPepeMode && (
        <>
          <span className="absolute -top-1 -right-1 text-xs animate-bounce">💨</span>
          <span className="absolute top-0 left-0 w-full h-full rounded-lg bg-gradient-to-r from-green-500/20 to-purple-500/20 animate-pulse" />
        </>
      )}
    </button>
  );
}
