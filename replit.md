# Child Lens Landing Page

## Project Overview
A stunning Next.js 15 landing page for Child Lens - a platform dedicated to systemic change in children's health. The site features beautiful animations, custom components, and an engaging user experience.

## Tech Stack
- **Framework**: Next.js 15.3.3
- **Language**: TypeScript
- **Styling**: Tailwind CSS 3.4 + Shadcn UI
- **UI Components**: Radix UI primitives
- **Fonts**: Sniglet (Google Fonts), Helvetica Neue
- **Animations**: Custom CSS animations + Framer Motion
- **Backend**: Firebase (optional - configured but not actively used)

## Project Structure
```
├── src/
│   ├── app/              # Next.js app directory
│   │   ├── layout.tsx    # Root layout with fonts
│   │   ├── page.tsx      # Home page with all sections
│   │   ├── globals.css   # Global styles & animations
│   │   └── lib/          # Utility functions & data
│   ├── components/       # React components
│   │   ├── ui/          # Shadcn UI components
│   │   └── ...          # Custom animated components
│   ├── hooks/           # Custom React hooks
│   └── lib/             # Shared utilities
├── public/              # Static assets (images, videos)
├── next.config.js       # Next.js configuration
├── tailwind.config.ts   # Tailwind configuration
└── tsconfig.json        # TypeScript configuration

## Key Features

### Landing Page Sections
1. **Hero Section**: Animated text reveal with "Child Lens" branding
2. **Scrolling Words**: Dynamic word animation on scroll
3. **Features Section**: Scrolling feature highlights
4. **Revealing Text**: Progressive text reveal on scroll
5. **Science to Systems**: Methodology explanation
6. **Who We Are**: Team introduction
7. **Mandela Quote**: Video background section with quote
8. **Contact**: Contact form section
9. **Footer**: Pixel-art styled footer

### Interactive Elements
- Child Lens toggle with color-changing animation
- Smooth scroll indicators
- Progress bar tracking page sections
- Boho pattern background overlay
- Custom animations and transitions

### Design System
- **Colors**: Custom palette with 6 vibrant colors (#d45324, #ffb53a, #f291bc, #419ebf, #f27236, #9c4a79)
- **Fonts**: Sniglet for branding, Helvetica Neue for body
- **Background**: #f2efe8 (warm beige)
- **Dark Mode**: Supported via Tailwind

## Development

### Running Locally
```bash
npm run dev
```
Server runs on port 5000

### Building for Production
```bash
npm run build
npm run start
```

### Static Export
The site is configured for static export (output: 'export' in next.config.js) for easy deployment to static hosting services.

## Firebase Configuration
Firebase is included but not actively used in the current implementation. To enable Firebase features:
1. Add Firebase config to environment variables
2. Initialize Firebase in a client-side component
3. Use Firebase services (Auth, Firestore, Storage) as needed

## Recent Changes
- Migrated from Firebase Studio to Replit
- Configured Next.js 15 with TypeScript
- Set up all dependencies and build configuration
- Preserved all custom components and animations

## Deployment

### Replit Deployments (Recommended)
The app is configured to run on Replit:
1. The workflow "Start application" runs `npm run dev -p 5000`
2. Server binds to port 5000 as required by Replit
3. For production deployment, use Replit's Deploy button
4. The static export feature (`output: 'export'`) makes it compatible with static hosting

### Alternative Deployments
- **Vercel**: Connect GitHub repo for automatic deployments
- **Netlify**: Deploy with static export
- **Any static hosting**: Run `npm run build` to generate static files

## Current Status
✅ **Migration Complete**
- Successfully imported from GitHub repository
- All dependencies installed and configured
- Next.js 15 running on port 5000
- All components rendering correctly
- Animations and interactions working

## Notes
- Images are set to unoptimized for static export compatibility
- TypeScript and ESLint errors are ignored during build for flexibility
- All animations use CSS and scroll-timeline API for performance
- Assets (images/videos) are hosted on Firebase Storage and load correctly
