
"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { RadialPulse } from "./radial-pulse";

type RevealingTextProps = {
  colorClasses: {
    text: string;
    systems: string;
    buildSolutions: string;
    lens: string;
  };
};

const ParallaxText = ({ children, className, movement = 10 }: { children: ReactNode; className?: string; movement?: number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const [style, setStyle] = useState({});

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (ref.current) {
        const { clientX, clientY } = event;
        const { innerWidth, innerHeight } = window;

        const xPos = (clientX / innerWidth - 0.5) * 2; // -1 to 1
        const yPos = (clientY / innerHeight - 0.5) * 2; // -1 to 1

        const transform = `translate(${xPos * movement}px, ${yPos * movement}px)`;

        setStyle({ transform, transition: 'transform 0.1s ease-out' });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [movement]);

  return (
    <span ref={ref} style={style} className={cn("inline-block", className)}>
      {children}
    </span>
  );
};


const HighlightedText = ({ children, className }: { children: ReactNode, className: string }) => (
    <ParallaxText movement={5}>
        <span className={cn("font-bold", className)}>{children}</span>
    </ParallaxText>
);

const getParagraphs = ({ colorClasses }: RevealingTextProps): ReactNode[][] => [
  [
    "We don’t just fix problems.",
    <>We strengthen the <HighlightedText className={colorClasses.systems}>systems</HighlightedText> that shape children’s lives.</>,
    "That’s why, when someone brings us a challenge,",
    "we look at it from different angles",
    <>and <HighlightedText className={colorClasses.buildSolutions}>build solutions</HighlightedText> that last.</>,
  ],
  [
    <>This is the <HighlightedText className={colorClasses.lens}>lens</HighlightedText> we bring.</>,
    <span className="flex items-center gap-3">
        <>And it lives through <ParallaxText movement={1}><span className={cn("font-bold", colorClasses.text)}>3</span></ParallaxText> ways of working:</>
    </span>,
  ],
];

export function RevealingText({ colorClasses }: RevealingTextProps) {
  const paragraphs = getParagraphs({ colorClasses });
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeParagraph, setActiveParagraph] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const { top, height } = containerRef.current.getBoundingClientRect();
      const scrollableHeight = height - window.innerHeight;
      
      let currentScroll = -top;
      if (currentScroll < 0) currentScroll = 0;
      if (currentScroll > scrollableHeight) currentScroll = scrollableHeight;

      const progress = scrollableHeight > 0 ? currentScroll / scrollableHeight : 1;
      const currentParagraph = Math.min(paragraphs.length - 1, Math.floor(progress * paragraphs.length));

      setActiveParagraph(currentParagraph);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [paragraphs.length]);

  return (
    <section id="revealing-text-section" ref={containerRef} className="bg-background text-foreground" style={{ height: `${paragraphs.length * 100}vh` }}>
      <div className="sticky top-0 h-screen w-full flex items-end justify-start pb-24">
        <div className="relative w-full md:w-3/5 lg:w-2/5 md:ml-20 lg:ml-40 px-4 font-body text-base md:text-xl font-medium leading-relaxed">
          <ParallaxText movement={2}>
            <div className="absolute -top-2 left-0 md:-left-6">
              <RadialPulse color={colorClasses.text} className="w-3 h-3" />
            </div>
          </ParallaxText>
          <div className="relative h-48">
            {paragraphs.map((p, index) => (
              <div
                key={index}
                className={cn(
                  "absolute inset-0 transition-opacity duration-700 ease-in-out",
                  activeParagraph === index ? "opacity-100" : "opacity-0"
                )}
              >
                {p.map((line, lineIndex) => (
                  <p key={lineIndex}>{line}</p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
