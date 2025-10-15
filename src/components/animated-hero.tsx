
"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { AnimatedWords } from "./animated-words";
import { Button } from "./ui/button";
import { ArrowDown } from "lucide-react";

type AnimatedHeroProps = {
  onAnimationComplete: () => void;
  isFlashActive: boolean;
  colorClasses: {
    jupiter: string;
  }
};

export function AnimatedHero({ onAnimationComplete, isFlashActive, colorClasses }: AnimatedHeroProps) {
  const [step, setStep] = useState(0); // 0: initial, 1: h1 visible, 2: h1 faded, 3: words visible
  const [wordsAnimationFinished, setWordsAnimationFinished] = useState(false);

  const phrases = [
    { text: "Farther.", weight: "font-light", className: "text-4xl md:text-5xl" },
    { text: "Faster.", weight: "font-normal", className: "text-4xl md:text-5xl" },
    { 
      text: isFlashActive ? "Jupiter." : "Forward.", 
      weight: "font-bold", 
      className: "text-4xl md:text-5xl",
      colorClass: isFlashActive ? colorClasses.jupiter : undefined,
    },
  ];

  useEffect(() => {
    const sequence = [
      () => setStep(1), // Show h1
      () => setStep(2), // Fade out h1
      () => setStep(3), // Show words
    ];
    
    let delay = 500;
    if (step === 1) { // h1 visible
        delay = 875; // Was 1750
    } else if (step === 2) { // h1 faded
        delay = 175; // Was 350
    }

    if (step < sequence.length) {
      const timer = setTimeout(sequence[step], delay);
      return () => clearTimeout(timer);
    }
  }, [step]);

  useEffect(() => {
    if(wordsAnimationFinished) {
        onAnimationComplete();
    }
  }, [wordsAnimationFinished, onAnimationComplete]);

  return (
    <div className="flex items-center justify-center w-full h-full">
        {step < 3 ? (
            <h1
                className={cn(
                "text-6xl md:text-7xl font-headline font-bold tracking-tight transition-opacity duration-500 text-center",
                step >= 1 && step < 2 ? "opacity-100" : "opacity-0"
                )}
            >
                Children's Health.
            </h1>
        ) : (
            <div
                className={cn(
                "transition-opacity duration-500 text-left w-full",
                step === 3 ? "opacity-100" : "opacity-0"
                )}
            >
              <AnimatedWords phrases={phrases} onComplete={() => setWordsAnimationFinished(true)} />
              <p 
                className={cn(
                  "text-base md:text-lg max-w-3xl mt-6 leading-relaxed font-normal transition-opacity duration-1000 ease-in md:mr-32",
                  wordsAnimationFinished ? "opacity-100" : "opacity-0"
                )}
                style={{ transitionDelay: '500ms' }}
              >
                The Child Lens is a platform for systemic change in children’s health.
                <br/>
                We build ventures from scratch, walk hand-in-hand with startups, and shift the perspectives of those in power — all to unearth the deep roots of systems that fail children’s health.
              </p>
              <div 
                className={cn(
                  "mt-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 transition-opacity duration-1000 ease-in",
                  wordsAnimationFinished ? "opacity-100" : "opacity-0"
                )}
                style={{ transitionDelay: '700ms' }}
              >
                <p className="text-xs font-medium mr-2">Go directly to:</p>
                <div className="flex flex-col sm:flex-row gap-2">
                    <a href="#who-we-are">
                      <Button variant="outline" size="sm" className="text-black border-black h-8 px-3 text-xs w-full">
                        Who We Are <ArrowDown className="ml-2 h-3 w-3" />
                      </Button>
                    </a>
                    <a href="#contact">
                      <Button variant="outline" size="sm" className="text-black border-black h-8 px-3 text-xs w-full">
                        Contact Us <ArrowDown className="ml-2 h-3 w-3" />
                      </Button>
                    </a>
                </div>
              </div>
            </div>
        )}
    </div>
  );
}
