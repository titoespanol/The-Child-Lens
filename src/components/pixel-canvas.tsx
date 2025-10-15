
"use client";

import { useRef, useEffect, useState } from 'react';

const rand = (min: number, max: number) => {
  return Math.random() * (max - min) + min;
};

const colorPalette = [
  "#d45324",
  "#ffb53a",
  "#f291bc",
  "#419ebf",
  "#f27236",
  "#9c4a79",
];

class Pixel {
    x: number;
    y: number;
    color: string;
    speed: number;
    size: number;
    sizeStep: number;
    minSize: number;
    maxSizeAvailable: number;
    maxSize: number;
    sizeDirection: number;
    delay: number;
    delayHide: number;
    counter: number;
    counterHide: number;
    counterStep: number;
    isHidden: boolean;
    isFlicking: boolean;

    constructor(x: number, y: number, color: string, speed: number, delay: number, delayHide: number, step: number, boundSize: number) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.speed = rand(0.1, 0.9) * speed;
        this.size = 0;
        this.sizeStep = rand(0, 0.5);
        this.minSize = 0.5;
        this.maxSizeAvailable = boundSize || 2;
        this.maxSize = rand(this.minSize, this.maxSizeAvailable);
        this.sizeDirection = 1;
        this.delay = delay;
        this.delayHide = delayHide;
        this.counter = 0;
        this.counterHide = 0;
        this.counterStep = step;
        this.isHidden = false;
        this.isFlicking = false;
    }

    draw(ctx: CanvasRenderingContext2D) {
        const centerOffset = this.maxSizeAvailable * 0.5 - this.size * 0.5;
        ctx.fillStyle = this.color;
        ctx.fillRect(
            this.x + centerOffset,
            this.y + centerOffset,
            this.size,
            this.size
        );
    }

    show() {
        this.isHidden = false;
        this.counterHide = 0;

        if (this.counter <= this.delay) {
            this.counter += this.counterStep;
            return;
        }

        if (this.size >= this.maxSize) {
            this.isFlicking = true;
        }

        if (this.isFlicking) {
            this.flicking();
        } else {
            this.size += this.sizeStep;
        }
    }

    hide() {
        this.counter = 0;

        if (this.counterHide <= this.delayHide) {
            this.counterHide += this.counterStep;
            if (this.isFlicking) {
                this.flicking();
            }
            return;
        }

        this.isFlicking = false;

        if (this.size <= 0) {
            this.size = 0;
            this.isHidden = true;
            return;
        } else {
            this.size -= 0.05;
        }
    }

    flicking() {
        if (this.size >= this.maxSize) {
            this.sizeDirection = -1;
        } else if (this.size <= this.minSize) {
            this.sizeDirection = 1;
        }
        this.size += this.sizeDirection * this.speed;
    }
}

export function PixelCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted) return;

    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width: number;
    let height: number;
    let pixels: Pixel[];
    let request: number;
    let lastTime: number;
    let ticker = 0;
    const maxTicker = 360;
    let animationDirection = 1;
    const interval = 1000 / 60;

    const getDelay = (x: number, y: number) => {
        const dx = x - width * 0.5;
        const dy = y - height;
        return Math.sqrt(dx ** 2 + dy ** 2);
    };

    const initPixels = () => {
        const colors = [...colorPalette].sort(() => 0.5 - Math.random());
        const gap = 6;
        const step = (width + height) * 0.005;
        const speed = rand(0.008, 0.25);
        const maxSize = Math.floor(gap * 0.5);

        pixels = [];

        for (let x = 0; x < width; x += gap) {
            for (let y = 0; y < height; y += gap) {
                if (x + maxSize > width || y + maxSize > height) {
                    continue;
                }

                const color = colors[Math.floor(Math.random() * colors.length)];
                const delay = getDelay(x, y);
                const delayHide = getDelay(x, y);

                pixels.push(new Pixel(x, y, color, speed, delay, delayHide, step, maxSize));
            }
        }
    };

    const animate = () => {
        request = requestAnimationFrame(animate);
        const now = performance.now();
        const diff = now - (lastTime || 0);

        if (diff < interval) {
            return;
        }

        lastTime = now - (diff % interval);

        ctx.clearRect(0, 0, width, height);

        if (ticker >= maxTicker) {
            animationDirection = -1;
        } else if (ticker <= 0) {
            animationDirection = 1;
        }

        let allHidden = true;

        pixels.forEach((pixel) => {
            if (animationDirection > 0) {
                pixel.show();
            } else {
                pixel.hide();
                allHidden = allHidden && pixel.isHidden;
            }
            pixel.draw(ctx);
        });

        ticker += animationDirection;

        if (animationDirection < 0 && allHidden) {
            ticker = 0;
            animationDirection = 1; // Restart animation
        }
    };

    const resize = () => {
        cancelAnimationFrame(request);
        const rect = container.getBoundingClientRect();
        width = Math.floor(rect.width);
        height = Math.floor(rect.height);
        canvas.width = width;
        canvas.height = height;
        initPixels();
        ticker = 0;
        lastTime = performance.now();
        animate();
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    let clickHandler = () => {
        if (animationDirection < 0 && pixels.every(p => p.isHidden)) {
            resize();
        }
    };

    container.addEventListener('click', clickHandler);

    return () => {
        cancelAnimationFrame(request);
        resizeObserver.disconnect();
        container.removeEventListener('click', clickHandler);
    };
  }, [hasMounted]);

  if (!hasMounted) {
    return null;
  }

  return (
    <div ref={containerRef} className="w-full h-full">
      <canvas ref={canvasRef} />
    </div>
  );
}
