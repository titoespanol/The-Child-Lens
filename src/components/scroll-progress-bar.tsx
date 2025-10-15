
"use client";

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

type ScrollProgressBarProps = {
  colors: string[];
  sections: string[];
};

export function ScrollProgressBar({ colors, sections }: ScrollProgressBarProps) {
  const [progress, setProgress] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const [sectionPoints, setSectionPoints] = useState<number[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPosition = window.scrollY;
      setProgress(totalHeight > 0 ? (scrollPosition / totalHeight) * 100 : 0);

      const sectionPositions = sections.map(id => {
          const el = document.getElementById(id);
          return el ? el.offsetTop : 0;
      });
      
      const scrollCenter = scrollPosition + window.innerHeight / 2;
      let currentSection = 0;
      for (let i = sectionPositions.length - 1; i >= 0; i--) {
          if (scrollCenter >= sectionPositions[i]) {
              currentSection = i;
              break;
          }
      }
      setActiveSection(currentSection);
    };

    const calculateSectionPoints = () => {
        const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (totalHeight <= 0) return;

        const points = sections.map((id) => {
            const el = document.getElementById(id);
            if (!el) return 0;
            const pointPosition = ((el.offsetTop + el.offsetHeight / 2) / totalHeight) * 100;
            return Math.min(100, pointPosition);
        });
        setSectionPoints(points);
    }

    const timeoutId = setTimeout(() => {
      if (typeof window !== 'undefined') {
        handleScroll();
        calculateSectionPoints();
      }
    }, 100);
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', calculateSectionPoints);
    
    return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('resize', calculateSectionPoints);
        clearTimeout(timeoutId);
    }
  }, [sections]);

  const activeColor = colors[activeSection % colors.length];

  return (
    <div className="fixed top-0 left-0 right-0 z-50 w-full">
      <div className="relative w-full h-0.5 bg-transparent">
        <div 
          className="h-full transition-colors duration-200" 
          style={{ 
              width: `${progress}%`,
              backgroundColor: activeColor,
          }} 
        />
        <div className="absolute top-1/2 -translate-y-1/2 w-full flex items-center">
            {sectionPoints.map((point, index) => {
                const isPassed = index <= activeSection;
                const pointColor = isPassed ? activeColor : '#e5e7eb';

                return (
                    <div
                        key={index}
                        className="absolute -translate-x-1/2"
                        style={{ left: `${point}%`}}
                    >
                        <div
                          className={cn(
                              "w-1.5 h-1.5 rounded-full transition-all duration-300",
                              index === activeSection ? 'scale-125' : 'scale-100'
                          )}
                          style={{
                            backgroundColor: pointColor
                          }}
                        />
                    </div>
                )
            })}
        </div>
      </div>
    </div>
  );
}

