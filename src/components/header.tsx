
"use client";

import { useState, useEffect } from "react";
import { Logo } from "./logo";
import { cn } from "@/lib/utils";
import { LayeredButton } from "./layered-button";

type HeaderProps = {
  isFlashing?: boolean;
  flashColor?: string;
  isChildLensActive: boolean;
  onToggleLens: () => void;
  colorClasses: {
    text: string;
    bg: string;
    border: string;
    logo1: string;
    logo2: string;
    logo3: string;
  };
  isToggleFlashing: boolean;
  heroAnimationFinished: boolean;
};

export function Header({ 
  isFlashing, 
  flashColor,
  isChildLensActive,
  onToggleLens,
  colorClasses,
  isToggleFlashing,
  heroAnimationFinished
}: HeaderProps) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [overFeaturesSection, setOverFeaturesSection] = useState(false);
  const [overMandelaSection, setOverMandelaSection] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10); // Small delay to ensure transition triggers
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    const featuresSection = document.querySelector("#features-section");
    const mandelaSection = document.querySelector("#mandela-section");

    const observerCallback = (setter: React.Dispatch<React.SetStateAction<boolean>>) => (entries: IntersectionObserverEntry[]) => {
        entries.forEach((entry) => {
            setter(entry.isIntersecting);
        });
    };

    const featuresObserver = new IntersectionObserver(observerCallback(setOverFeaturesSection), { threshold: 0.2 });
    const mandelaObserver = new IntersectionObserver(observerCallback(setOverMandelaSection), { threshold: 0.2 });

    if (featuresSection) featuresObserver.observe(featuresSection);
    if (mandelaSection) mandelaObserver.observe(mandelaSection);

    window.addEventListener("scroll", handleScroll);
    handleScroll(); 

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (featuresSection) featuresObserver.unobserve(featuresSection);
      if (mandelaSection) mandelaObserver.unobserve(mandelaSection);
    };
  }, []);

  const shouldInvertElements = (overFeaturesSection || overMandelaSection) && !isChildLensActive;

  return (
    <header className={cn(
        "fixed top-0 left-0 right-0 z-50 flex justify-between items-center py-4 px-4 md:px-8 transition-all duration-300",
        isVisible ? "opacity-100" : "opacity-0"
    )}>
      <div className="flex-1"></div>
      <div className="flex-1 flex justify-center">
        <div
          className={cn(
            "transition-all duration-300 ease-in-out",
            isScrolled ? "scale-75" : "scale-100",
            shouldInvertElements && "invert"
          )}
        >
          <Logo />
        </div>
      </div>
      <div className={cn(
        "flex-1 flex justify-end transition-opacity duration-1000 ease-in",
        heroAnimationFinished ? "opacity-100" : "opacity-0"
      )}>
        <LayeredButton
          isActive={isChildLensActive}
          onClick={onToggleLens}
          colorClasses={colorClasses}
          isFlashing={isToggleFlashing}
          forceWhite={shouldInvertElements}
        />
      </div>
    </header>
  );
}
