
"use client";

import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { useState, useEffect } from 'react';

type LayeredButtonProps = {
  isActive: boolean;
  onClick: () => void;
  colorClasses: {
    text: string;
    bg: string;
    border: string;
    layer1?: string;
    layer2?: string;
  };
  isFlashing: boolean;
  forceWhite?: boolean;
};

const colorPalette = [
  { text: "text-[#d45324]", bg: "bg-[#d45324]", border: "border-[#d45324]" },
  { text: "text-[#ffb53a]", bg: "bg-[#ffb53a]", border: "border-[#ffb53a]" },
  { text: "text-[#f291bc]", bg: "bg-[#f291bc]", border: "border-[#f291bc]" },
  { text: "text-[#419ebf]", bg: "bg-[#419ebf]", border: "border-[#419ebf]" },
  { text: "text-[#f27236]", bg: "bg-[#f27236]", border: "border-[#f27236]" },
  { text: "text-[#9c4a79]", bg: "bg-[#9c4a79]", border: "border-[#9c4a79]" },
];

export function LayeredButton({ isActive, onClick, colorClasses, isFlashing, forceWhite }: LayeredButtonProps) {
    const buttonText = isActive ? 'ADULT LENS' : 'CHILD LENS';
    const [layerColors, setLayerColors] = useState<string[]>([]);

    useEffect(() => {
        const getTwoOtherColors = (baseColor: string) => {
            const availableColors = colorPalette.filter(c => c.bg !== baseColor);
            const shuffled = [...availableColors].sort(() => 0.5 - Math.random());
            return [shuffled[0].bg, shuffled[1].bg];
        }
        if (isActive) {
            setLayerColors(getTwoOtherColors(colorClasses.bg));
        }
    }, [isActive, colorClasses.bg]);

    if (!isActive) {
        return (
            <Button
              onClick={onClick}
              variant="outline"
              size="sm"
              className={cn(
                "font-body font-bold text-xs border rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 h-8 px-4 py-2",
                forceWhite 
                    ? "border-white bg-transparent text-white hover:bg-white hover:text-black" 
                    : "border-primary bg-transparent text-primary hover:bg-primary hover:text-white",
                isFlashing && "pointer-events-none"
              )}
            >
              {buttonText}
            </Button>
        )
    }

  const [layer1Color, layer2Color] = layerColors;

  if (!layer1Color || !layer2Color) {
    return null; // Don't render the layered button until colors are ready
  }

  return (
    <button
      onClick={onClick}
      disabled={isFlashing}
      className={cn(
        "relative font-body font-bold text-xs transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none",
        isFlashing && "pointer-events-none"
      )}
      style={{ width: '110px', height: '40px' }}
    >
      {/* Layer 2 (Bottom) */}
      <div className={cn(
          "absolute w-full h-full rounded-full border-2 border-black",
          layer2Color
      )} style={{ top: '8px', left: '8px' }} />
      
      {/* Layer 1 (Middle) */}
      <div className={cn(
          "absolute w-full h-full rounded-full border-2 border-black",
          layer1Color
      )} style={{ top: '4px', left: '4px' }} />

      {/* Top Layer (Button itself) */}
      <div className={cn(
        "absolute w-full h-full flex items-center justify-center rounded-full border-2 border-black text-white",
        colorClasses.bg
      )} style={{ top: '0', left: '0' }}>
        {buttonText}
      </div>
    </button>
  );
}
