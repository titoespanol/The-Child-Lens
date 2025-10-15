
"use client";

import { PixelCanvas } from "./pixel-canvas";
import { useEffect, useState } from "react";

export function PixelFooter() {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  return (
    <footer className="w-full h-40">
      {hasMounted && <PixelCanvas />}
    </footer>
  );
}
