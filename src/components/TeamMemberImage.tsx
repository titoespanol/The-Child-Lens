
"use client";

import Image from 'next/image';
import { cn } from '@/lib/utils';
import { PixelCanvas } from './pixel-canvas';
import { useState, useEffect } from 'react';

type TeamMemberImageProps = {
    imageUrl: string;
    name: string;
    dataAiHint: string;
    isChildLensActive?: boolean;
    borderColorClass: string;
}

export function TeamMemberImage({ imageUrl, name, dataAiHint, isChildLensActive, borderColorClass }: TeamMemberImageProps) {
    const [hasMounted, setHasMounted] = useState(false);

    useEffect(() => {
        setHasMounted(true);
    }, []);

    const finalBorderColorClass = isChildLensActive ? borderColorClass : "border-primary";

    return (
        <div className="relative w-40 h-40 md:w-48 md:h-48">
            <div className="absolute -inset-2 rounded-full overflow-hidden transition-transform duration-300 ease-in-out group-hover:scale-105">
                {hasMounted && <PixelCanvas />}
            </div>
            <div className={cn("relative w-full h-full rounded-full p-1 border-2 border-dotted z-10 bg-background/80 transition-transform duration-300 ease-in-out group-hover:scale-110", finalBorderColorClass)}>
                <div className="relative w-full h-full rounded-full overflow-hidden shadow-lg">
                    <Image
                        src={imageUrl}
                        alt={`Portrait of ${name}`}
                        fill
                        className="object-cover"
                        data-ai-hint={dataAiHint}
                    />
                </div>
            </div>
        </div>
    )
}
