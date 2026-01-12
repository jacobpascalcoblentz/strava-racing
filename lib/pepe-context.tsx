"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface PepeContextType {
  isPepeMode: boolean;
  togglePepeMode: () => void;
}

const PepeContext = createContext<PepeContextType | undefined>(undefined);

export function PepeProvider({ children }: { children: ReactNode }) {
  const [isPepeMode, setIsPepeMode] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("pepe-mode");
    if (saved === "true") {
      setIsPepeMode(true);
      document.documentElement.classList.add("pepe-mode");
    }
  }, []);

  const togglePepeMode = () => {
    setIsPepeMode((prev) => {
      const next = !prev;
      localStorage.setItem("pepe-mode", String(next));
      if (next) {
        document.documentElement.classList.add("pepe-mode");
      } else {
        document.documentElement.classList.remove("pepe-mode");
      }
      return next;
    });
  };

  return (
    <PepeContext.Provider value={{ isPepeMode, togglePepeMode }}>
      {children}
    </PepeContext.Provider>
  );
}

export function usePepeMode() {
  const context = useContext(PepeContext);
  if (!context) {
    throw new Error("usePepeMode must be used within a PepeProvider");
  }
  return context;
}
