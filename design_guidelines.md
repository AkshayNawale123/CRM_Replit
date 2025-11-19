# CRM Executive Dashboard - Design Guidelines

## Design Approach

**System:** Material Design principles adapted for enterprise data applications, inspired by modern CRM leaders like HubSpot and Salesforce Lightning for clean, professional aesthetics with exceptional data readability.

## Typography System

**Primary Font:** Inter (Google Fonts)
- Dashboard Metrics: 2.5rem, font-weight 700 (numbers), 0.875rem font-weight 500 (labels)
- Page Headings: 1.875rem, font-weight 600
- Section Titles: 1.25rem, font-weight 600
- Table Headers: 0.875rem, font-weight 600, uppercase, letter-spacing 0.05em
- Table Content: 0.9375rem, font-weight 400
- Badges/Status: 0.8125rem, font-weight 500

## Layout & Spacing System

**Spacing Units:** Tailwind units of 2, 4, 6, 8, 12, 16, 20
- Page padding: p-6 (mobile), p-8 (desktop)
- Card padding: p-6
- Section gaps: gap-6 between major sections
- Table cell padding: px-6 py-4
- Metric card spacing: gap-4 between cards

**Grid System:**
- Dashboard metrics: 5-column grid (lg:grid-cols-5) for desktop, 2-column (sm:grid-cols-2) for mobile, stacking single column on smallest screens
- Content max-width: max-w-7xl mx-auto

## Component Library

### Executive Metrics Cards
- Elevated cards with subtle shadow (shadow-sm)
- Rounded corners: rounded-lg
- Each card contains: Large numeric value (top), descriptive label (bottom)
- Minimum height: consistent across all metric cards
- Hover state: subtle elevation increase (shadow-md transition)

### Data Table
- Full-width responsive table with horizontal scroll on mobile
- Alternating row background for readability
- Fixed header on scroll
- Column structure: Client Name (20%), Stage (12%), Status (12%), Deal Value (12%), Last Follow-up (12%), Next Follow-up (12%), Priority (10%), Actions (10%)
- Row height: py-4 for comfortable scanning
- Cell alignment: Left for text, right for numbers

### Stage Badges
- Pill-shaped badges: rounded-full, px-3 py-1
- Four distinct visual treatments for: Lead, Qualified, Proposal Sent, Won
- Inline with text baseline alignment

### Status Indicators
- Rounded badges: rounded-md, px-2.5 py-1
- Three variants: In Negotiation, Proposal Rejected, On Hold
- Medium font-weight for emphasis

### Priority Badges
- Small circular or square badges: rounded, px-2 py-0.5
- Three levels: High, Medium, Low
- High priority uses bold weight

### Action Buttons
- Primary action: "Details" button with solid background, rounded-md, px-4 py-2
- Icon buttons for edit/delete: w-8 h-8, rounded hover states
- Button group spacing: gap-2

### Date Display
- Overdue dates: Bold weight with visual emphasis
- Standard format: MMM DD, YYYY
- Overdue indicator: Inline warning icon from Heroicons

## Page Structure

### Dashboard Layout
1. **Header Section** (sticky top-0)
   - Page title: "CRM Dashboard"
   - Add Client button (top-right): Primary button style, "+ Add Client" text

2. **Metrics Bar** (mt-6)
   - 5 metric cards in responsive grid
   - Each card shows icon (Heroicons: UserGroupIcon, CheckCircleIcon, ClockIcon, XCircleIcon, CurrencyDollarIcon), value, and label

3. **Client Management Section** (mt-8)
   - Section header: "All Clients" with filter/sort controls (right-aligned)
   - Search bar: w-full max-w-md, rounded-lg with search icon
   - Table container: rounded-lg border overflow-hidden

### Modal/Drawer for Client Details
- Full-height drawer sliding from right (w-96)
- Header with close button
- Content sections with spacing between: Contact Info (pb-6), Deal Details (pb-6), Follow-up Schedule (pb-6), Notes
- Action buttons at bottom: Save (primary), Cancel (secondary)

## Icons
**Library:** Heroicons (via CDN)
- Metrics: UserGroupIcon, CheckCircleIcon, ClockIcon, XCircleIcon, CurrencyDollarIcon
- Actions: PencilIcon, TrashIcon, EyeIcon
- Interface: MagnifyingGlassIcon, FunnelIcon, ChevronDownIcon
- Status: ExclamationTriangleIcon (overdue)

## Responsive Behavior

**Breakpoints:**
- Mobile (<640px): Stacked metrics (2-col), horizontal scroll table
- Tablet (640-1024px): 3-col metrics, full table with adjusted columns
- Desktop (>1024px): 5-col metrics, full table layout

**Table Responsiveness:**
- Mobile: Card-based layout stacking each row as a card
- Tablet+: Traditional table with all columns visible

## Animations
Minimal, performance-focused:
- Hover elevation on metric cards: transition-shadow duration-200
- Button hover states: transition-colors duration-150
- Modal/drawer entry: slide-in animation duration-300

## Images
**No hero images required.** This is a data-focused dashboard application. All visual interest comes from well-structured data presentation, clear metrics, and functional design elements.