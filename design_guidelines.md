# Design Guidelines for Next.js + Firebase Application Migration

## Design System Foundation

**System Selection**: Shadcn UI (Radix UI Primitives)
This application uses the established Shadcn UI design system built on Radix UI primitives, which provides accessible, customizable components with consistent patterns.

## Core Design Elements

### A. Color Palette

**Light Mode:**
- Background: 0 0% 100%
- Foreground: 222 47% 11%
- Primary: 222 47% 11%
- Secondary: 210 40% 96%
- Muted: 210 40% 96%
- Border: 214 32% 91%
- Accent: 210 40% 96%

**Dark Mode:**
- Background: 222 47% 11%
- Foreground: 213 31% 91%
- Primary: 213 31% 91%
- Secondary: 217 33% 17%
- Muted: 217 33% 17%
- Border: 217 33% 17%
- Accent: 217 33% 17%

**Interactive States:**
- Primary destructive: 0 84% 60%
- Accent highlights: 200 100% 50%
- Success states: 142 71% 45%

### B. Typography

**Font Stack:**
- System font: Inter or system-ui fallback
- Headings: 600-700 weight
- Body: 400-500 weight
- Code/Mono: JetBrains Mono or monospace fallback

**Scale:**
- H1: text-4xl to text-6xl (36-60px)
- H2: text-3xl to text-5xl (30-48px)
- H3: text-2xl to text-3xl (24-30px)
- Body: text-sm to text-base (14-16px)
- Small: text-xs (12px)

### C. Layout System

**Spacing Primitives:**
- Primary scale: 2, 4, 6, 8, 12, 16, 20, 24 (Tailwind units)
- Container max-width: max-w-7xl (1280px)
- Section padding: py-12 to py-24
- Card padding: p-6 to p-8
- Consistent gap spacing: gap-4 to gap-8

**Grid System:**
- Desktop: grid-cols-12 for complex layouts
- Cards/Features: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Forms: Single column with max-w-md to max-w-2xl

### D. Component Library

**Existing Components (Preserve):**
- Accordion, Alert Dialog, Avatar, Checkbox
- Dialog, Dropdown Menu, Label, Menubar
- Popover, Progress, Radio Group, Scroll Area
- Select, Separator, Slider, Switch
- Tabs, Toast, Tooltip
- Form components with React Hook Form + Zod validation
- Data visualization with Recharts
- Carousel with Embla

**Component Patterns:**
- Border radius: rounded-md (6px) to rounded-lg (8px)
- Shadows: Subtle elevation with shadow-sm and shadow-md
- Transitions: transition-colors duration-200
- Focus states: ring-2 ring-offset-2

**Interactive Elements:**
- Buttons: Multiple variants (default, destructive, outline, ghost, link)
- Input fields: Consistent height (h-10), border styling
- Cards: Elevated with hover states where appropriate
- Navigation: Clean, accessible patterns

### E. Visual Patterns

**Card Design:**
- Background: bg-card with border-border
- Padding: p-6 standard
- Rounded corners: rounded-lg
- Subtle shadow on hover for interactive cards

**Forms:**
- Label positioning: Above inputs with proper spacing (space-y-2)
- Input styling: Consistent border, focus rings
- Error states: Red destructive color with clear messaging
- Loading states: Disabled appearance with spinner/progress

**Data Display:**
- Tables: Striped rows, hover states, responsive scrolling
- Charts: Recharts with consistent color palette
- Lists: Clear hierarchy with proper spacing
- Empty states: Centered with descriptive messaging

**Navigation:**
- Top bar: Fixed or sticky positioning
- Mobile: Hamburger menu with slide-in drawer
- Active states: Border or background highlight
- Breadcrumbs: When needed for deep navigation

### F. Responsive Behavior

**Breakpoints:**
- Mobile: < 640px (sm)
- Tablet: 640px - 1024px (md/lg)
- Desktop: > 1024px (xl)

**Patterns:**
- Stack columns on mobile (flex-col md:flex-row)
- Reduce padding on smaller screens (px-4 md:px-8 lg:px-12)
- Hide secondary content on mobile, show on desktop
- Touch-friendly targets: min-h-11 for interactive elements

### G. Accessibility

- ARIA labels on all interactive elements
- Keyboard navigation fully supported (Radix UI built-in)
- Focus indicators visible and clear
- Color contrast meets WCAG AA standards
- Screen reader friendly component structure

## Firebase Integration Styling

**Authentication UI:**
- Clean form layouts with proper validation feedback
- Loading states during auth operations
- Success/error toast notifications

**Data Loading:**
- Skeleton screens matching content structure
- Spinner for quick operations
- Progress bars for file uploads
- Optimistic UI updates where appropriate

**Real-time Updates:**
- Subtle animations for new data
- Toast notifications for background updates
- Badge indicators for unread/new items

## Animation Guidelines

Use sparingly and purposefully:
- Page transitions: Fade or slide (duration-200)
- Modals: Scale + fade entrance
- Toasts: Slide from top or bottom
- Loading: Pulse or spin
- Microinteractions: Subtle scale on button press

## Consistency Notes

- Maintain existing Shadcn UI patterns throughout
- All new components should use Radix UI primitives
- Follow established spacing and color conventions
- Preserve dark mode implementations
- Keep accessibility as priority