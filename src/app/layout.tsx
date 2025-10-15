import type { Metadata } from 'next';
import { Sniglet } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ScrollProgressBar } from '@/components/scroll-progress-bar';
import { cn } from '@/lib/utils';

const sniglet = Sniglet({
  subsets: ['latin'],
  weight: ['400', '800'],
  variable: '--font-sniglet',
});

export const metadata: Metadata = {
  title: 'Child Lens Landing',
  description: 'A platform for systemic change in children’s health.',
};

const colorPalette = [
  "#d45324",
  "#ffb53a",
  "#f291bc",
  "#419ebf",
  "#f27236",
  "#9c4a79",
];

const sections = [
  'hero-section',
  'features-section',
  'revealing-text-section',
  'science-to-systems-section',
  'who-we-are',
  'mandela-section',
  'contact'
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn("font-body antialiased", sniglet.variable)}>
        <ScrollProgressBar colors={colorPalette} sections={sections} />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
