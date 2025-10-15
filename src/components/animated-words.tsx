
"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

type AnimatedWordsProps = {
  phrases: { text: string; weight: string; className: string; colorClass?: string }[];
  onComplete: () => void;
};

export function AnimatedWords({ phrases, onComplete }: AnimatedWordsProps) {
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isAnimating, setIsAnimating] = useState(true);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted || !isAnimating) return;

    if (currentPhraseIndex < phrases.length) {
      const currentPhrase = phrases[currentPhraseIndex].text;
      let i = 0;
      const intervalId = setInterval(() => {
        setDisplayedText(currentPhrase.substring(0, i + 1));
        i++;
        if (i > currentPhrase.length) { // Use > to ensure it runs one last time
          clearInterval(intervalId);
          setTimeout(() => {
            setCurrentPhraseIndex(prevIndex => prevIndex + 1);
          }, 500); // Wait before starting next phrase
        }
      }, 100); // Typing speed

      return () => clearInterval(intervalId);
    } else {
        setIsAnimating(false);
        onComplete();
    }
  }, [currentPhraseIndex, phrases, onComplete, isAnimating, hasMounted]);

  if (!hasMounted) {
    return null;
  }

  return (
    <div className="flex flex-col items-start font-headline tracking-tight">
      {phrases.map((phrase, index) => (
        <div key={index} className={cn("h-[40px] md:h-[50px]", phrase.className)}>
            <span className={cn(phrase.weight, phrase.colorClass)}>
            {currentPhraseIndex > index ? phrase.text : (currentPhraseIndex === index ? displayedText : "")}
            </span>
        </div>
      ))}
    </div>
  );
}
