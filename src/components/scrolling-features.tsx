
"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { AnimatedText } from "./animated-text";
import Image from "next/image";

type ScrollingFeaturesProps = {
  isChildLensActive?: boolean;
  colorClasses: {
    pieceOfCake: string;
    we1: string;
    we2: string;
    we3: string;
  };
};

const getParagraphs = ({ colorClasses, isChildLensActive }: ScrollingFeaturesProps) => [
  'You can advance a therapy, change a policy, or raise a fund. If the parts don’t speak, change doesn’t travel.',
  'At The Child Lens, we don’t just treat the symptoms. We dig deep into the tangled roots — where funding gaps, power dynamics and cultural blind spots quietly shape outcomes.',
  <>
    Real impact in children’s health takes more than a brilliant idea. It takes{' '}
    <span className={cn("font-bold", colorClasses.we1)}>The Builder</span>,{' '}
    <span className={cn("font-bold", colorClasses.we2)}>The Right Hand</span>, and{' '}
    <span className={cn("font-bold", colorClasses.we3)}>The Voice</span>.
  </>,
];


export function ScrollingFeatures({ isChildLensActive, colorClasses }: ScrollingFeaturesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const textContainerRef = useRef<HTMLDivElement>(null);
  const paragraphs = getParagraphs({ isChildLensActive, colorClasses });
  
  const [activeParagraph, setActiveParagraph] = useState(0);
  const [paragraphProgress, setParagraphProgress] = useState(new Array(paragraphs.length).fill(0));
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!textContainerRef.current) return;
      
      const { top, height } = textContainerRef.current.getBoundingClientRect();
      const scrollableHeight = height - window.innerHeight;

      let currentScroll = -top;
      if (currentScroll < 0) currentScroll = 0;
      if (currentScroll > scrollableHeight) currentScroll = scrollableHeight;
      
      const overallProgress = scrollableHeight > 0 ? currentScroll / scrollableHeight : 0;
      setScrollProgress(overallProgress);

      const paragraphScrollLength = scrollableHeight / paragraphs.length;
      const currentParagraphIndex = Math.min(paragraphs.length - 1, Math.floor(currentScroll / paragraphScrollLength));
      setActiveParagraph(currentParagraphIndex);

      const newParagraphProgress = paragraphs.map((_, index) => {
        const paragraphStart = paragraphScrollLength * index;
        const progressInParagraph = (currentScroll - paragraphStart) / paragraphScrollLength;
        return Math.max(0, Math.min(1, progressInParagraph));
      });
      setParagraphProgress(newParagraphProgress);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [paragraphs.length]);

  const maxBlur = 16;
  const blurAmount = maxBlur * (1 - scrollProgress);
  const darknessAmount = 0.5 * (1 - scrollProgress);
  
  const titleText = isChildLensActive ? "All for one and one for all." : "When systems speak, change travels.";
  const titleColorClass = isChildLensActive ? colorClasses?.pieceOfCake : "text-[#f2efe8]";

  const sectionHeight = `${paragraphs.length * 175}vh`;

  return (
    <section id="features-section" ref={containerRef} className="relative w-full py-20 bg-background" style={{ height: sectionHeight }}>
      <div className="sticky top-0 h-screen w-full">
        <div 
          className="absolute inset-0 z-0" 
          style={{ filter: `blur(${blurAmount}px)` }}
        >
          <Image
            src="https://firebasestorage.googleapis.com/v0/b/child-lens-landing.firebasestorage.app/o/ulls%20nena%20tallada%20tiny.jpg?alt=media&token=3dc30680-3b54-4148-b3e6-8c46ace3d478"
            alt="A child's face with dotted light patterns"
            fill
            className="object-cover"
            data-ai-hint="child face"
          />
        </div>
        <div 
            className="absolute inset-0 z-0 bg-black"
            style={{ opacity: darknessAmount }}
        ></div>
      </div>
      <div ref={textContainerRef} className="absolute top-0 left-0 w-full" style={{ height: sectionHeight }}>
        <div className="sticky top-0 max-w-6xl mx-auto px-4 h-screen flex items-center z-10 text-[#f2efe8]">
          <div className="md:w-3/5">
              <div className="flex flex-col justify-center h-full space-y-8 pt-12">
                  <h2 className={cn("text-5xl font-bold font-headline", titleColorClass)}>
                    {titleText}
                  </h2>
                  <div className="relative font-body font-normal text-xl h-48">
                    {paragraphs.map((p, index) => (
                       <div
                         key={index}
                         className={cn(
                           "absolute top-0 left-0 transition-opacity duration-500 ease-in-out",
                           activeParagraph === index ? "opacity-100" : "opacity-0"
                         )}
                       >
                         <AnimatedText progress={paragraphProgress[index]}>{p}</AnimatedText>
                       </div>
                    ))}
                  </div>
              </div>
          </div>
        </div>
      </div>
    </section>
  );
}
