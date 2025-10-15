
"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

type RadialPulseProps = {
  className?: string;
  color: string;
};

const hexToRgb = (hex: string) => {
    let sanitizedHex = hex.startsWith("#") ? hex.slice(1) : hex;
    if (sanitizedHex.length === 3) {
        sanitizedHex = sanitizedHex.split('').map(char => char + char).join('');
    }
    const bigint = parseInt(sanitizedHex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `${r}, ${g}, ${b}`;
};

const colorPaletteMap: { [key: string]: string } = {
    "text-[#d45324]": "#d45324",
    "text-[#ffb53a]": "#ffb53a",
    "text-[#f291bc]": "#f291bc",
    "text-[#419ebf]": "#419ebf",
    "text-[#f27236]": "#f27236",
    "text-[#9c4a79]": "#9c4a79",
};

export function RadialPulse({ className, color }: RadialPulseProps) {
  const [pulseStyle, setPulseStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    const hexColor = colorPaletteMap[color] || '#000000';
    const rgbColor = hexToRgb(hexColor);
    setPulseStyle({
      backgroundColor: hexColor,
      '--pulse-color': rgbColor,
    });
  }, [color]);

  return (
    <div
      className={cn("pulse w-3 h-3 rounded-full", className)}
      style={pulseStyle}
    />
  );
}
