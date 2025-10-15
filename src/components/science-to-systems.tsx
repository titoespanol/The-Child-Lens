
"use client";

import { cn } from "@/lib/utils";
import { useState, useEffect, useRef } from "react";
import { AnimatedText } from "./animated-text";

type ScienceToSystemsProps = {
    colorClasses: {
        text: string;
        we1: string;
        we2: string;
        we3: string;
        we4: string;
    };
};

const Highlight = ({ children, className }: { children: React.ReactNode, className: string }) => (
    <span className={cn("font-extrabold text-lg", className)}>{children}</span>
);

const CircledNumber = ({ number }: { number: number }) => (
    <div className="inline-flex items-center justify-center w-6 h-6 border-2 border-current rounded-full mr-3">
        <span className="text-sm font-bold">{number}</span>
    </div>
);

const getSections = ({ colorClasses }: ScienceToSystemsProps) => [
  {
    smallTitle: (
        <span className={cn("flex items-center", colorClasses.we1)}>
            <CircledNumber number={1} /> The Builder
        </span>
    ),
    content: (progress: number) => (
        <div>
            <p className="mb-4">
              <AnimatedText progress={progress}>
                  <Highlight className={colorClasses.we1}>We</Highlight> <span className={cn(colorClasses.we1)}>sit</span> next to you and turn your science into a paediatric venture, step by step.
              </AnimatedText>
            </p>
            <p>
                <AnimatedText progress={progress}>
                    Together, <Highlight className={colorClasses.we2}>we</Highlight> <span className={cn(colorClasses.we2)}>define</span> the value proposition, map risks — clinical, regulatory, and science-related — check your IP position, and agree on go/no-go criteria that feel fair and doable. <Highlight className={colorClasses.we3}>We</Highlight> <span className={cn(colorClasses.we3)}>help</span> you shape endpoints that matter to children and clinicians, design with ethics and privacy, and outline a realistic path to first-in-child data. <Highlight className={colorClasses.we4}>We</Highlight> <span className={cn(colorClasses.we4)}>craft</span> the essentials — one-pager, deck, pilot brief, budget, and a clear, fundable story. <Highlight className={colorClasses.we1}>We</Highlight> <span className={cn(colorClasses.we1)}>open</span> doors to investors, hospitals and partners — while you keep the steering wheel.
                </AnimatedText>
            </p>
        </div>
    ),
  },
  {
    smallTitle: (
        <span className={cn("flex items-center", colorClasses.we2)}>
            <CircledNumber number={2} /> The Right Hand
        </span>
    ),
    content: (progress: number) => (
        <p>
            <AnimatedText progress={progress}>
                <Highlight className={colorClasses.we1}>We</Highlight> <span className={cn(colorClasses.we1)}>act</span> as your right hand in paediatric innovation, sitting beside your team to make the path clear and doable. With deep experience across biotech, medtech and digital health — from boardrooms to hands-on execution — <Highlight className={colorClasses.we2}>we</Highlight> <span className={cn(colorClasses.we2)}>bring</span> clarity on what matters next, focus on the few moves that truly move the needle, and momentum to keep things moving. <Highlight className={colorClasses.we3}>We</Highlight> <span className={cn(colorClasses.we3)}>don’t</span> just advise from afar — <Highlight className={colorClasses.we4}>we</Highlight> <span className={cn(colorClasses.we4)}>roll up</span> our sleeves and help make progress real.
            </AnimatedText>
        </p>
    ),
  },
  {
    smallTitle: (
        <span className={cn("flex items-center", colorClasses.we3)}>
            <CircledNumber number={3} /> The Voice
        </span>
    ),
    content: (progress: number) => (
        <p>
            <AnimatedText progress={progress}>
                <Highlight className={colorClasses.we1}>We</Highlight> <span className={cn(colorClasses.we1)}>work</span> to make children’s health impossible to ignore. With clarity and courage, <Highlight className={colorClasses.we2}>we</Highlight> <span className={cn(colorClasses.we2)}>engage</span> directly with policymakers, hospital leaders, funders and other system actors to shift how decisions are made and whose needs are prioritised. <Highlight className={colorClasses.we3}>We</Highlight> <span className={cn(colorClasses.we3)}>speak</span> the language of science, but also of policy, equity and long-term impact. Because transforming children’s health requires more than great ventures — it demands structural change, bold voices, and a collective willingness to rethink the rules.
            </AnimatedText>
        </p>
    ),
  }
];


export function ScienceToSystems({ colorClasses }: ScienceToSystemsProps) {
  const sections = getSections({ colorClasses });
  const [activeSection, setActiveSection] = useState(0);
  const [sectionProgress, setSectionProgress] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current) return;

      const { top, height } = containerRef.current.getBoundingClientRect();
      const scrollableHeight = height - window.innerHeight;
      
      let currentScroll = -top;
      if (currentScroll < 0) currentScroll = 0;
      if (currentScroll > scrollableHeight) currentScroll = scrollableHeight;
      
      const overallProgress = scrollableHeight > 0 ? currentScroll / scrollableHeight : 1;
      
      const numSections = sections.length;
      let currentSectionIndex = Math.floor(overallProgress * numSections);
      currentSectionIndex = Math.min(numSections - 1, currentSectionIndex);

      setActiveSection(currentSectionIndex);

      const sectionScrollLength = scrollableHeight / numSections;
      const scrollInSection = currentScroll - (sectionScrollLength * currentSectionIndex);
      
      const startPadding = 0.2;
      const endPadding = 0.8;
      let progress = (scrollInSection / sectionScrollLength - startPadding) / (endPadding - startPadding);
      progress = Math.max(0, Math.min(1, progress));

      setSectionProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [sections.length]);


  return (
    <section id="science-to-systems-section" ref={containerRef} className="bg-background text-foreground relative" style={{ height: `${sections.length * 300}vh` }}>
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center">
        <div className="container mx-auto px-4 text-center flex flex-col items-center justify-center h-full">
            <div className="w-full max-w-3xl">
                <div className="mb-12">
                    <h3 className={cn("text-xl font-bold flex items-center justify-center")}>
                        {sections[activeSection] && sections[activeSection].smallTitle}
                    </h3>
                    <h1 className="text-6xl font-bold font-headline tracking-tighter">
                        From Science to Systems
                    </h1>
                </div>
                <div className="relative h-48 md:h-56 font-body text-base md:text-lg leading-relaxed">
                    {sections.map((section, index) => (
                        <div
                            key={index}
                            className={cn(
                                "absolute inset-0 transition-opacity duration-300 ease-in-out",
                                activeSection === index ? "opacity-100" : "opacity-0"
                            )}
                        >
                          {activeSection === index ? section.content(sectionProgress) : section.content(0)}
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </div>
    </section>
  );
}
