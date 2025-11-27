# Executive CRM Dashboard

## Overview

This is an Executive CRM Dashboard application built to provide high-level visibility into client relationships, deal pipeline management, and sales tracking. The application follows Material Design principles adapted for enterprise data applications, offering a clean, professional interface for managing client information across different stages of the sales funnel.

The system allows users to track clients from initial lead through to won deals, with comprehensive activity history, follow-up scheduling, and priority management. It provides executive-level metrics and a detailed table view for pipeline management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript, using Vite as the build tool and development server.

**UI Component Library**: Shadcn/ui (Radix UI primitives) with the "new-york" style variant, providing a comprehensive set of accessible, customizable components.

**Styling**: Tailwind CSS with custom design tokens for colors, spacing, and typography. The design system uses CSS variables for theming with support for light/dark modes. Material Design principles guide the visual hierarchy with Inter as the primary font family.

**State Management**: TanStack Query (React Query) for server state management, providing caching, background refetching, and optimistic updates. Local component state managed with React hooks.

**Routing**: Wouter for lightweight client-side routing.

**Form Handling**: React Hook Form with Zod for schema validation, ensuring type-safe form handling with comprehensive validation rules.

### Backend Architecture

**Server Framework**: Express.js running on Node.js, configured as an ESM module.

**API Design**: RESTful API with endpoints for CRUD operations on client data:
- GET /api/clients - List all clients
- GET /api/clients/:id - Get single client
- POST /api/clients - Create new client
- PUT /api/clients/:id - Update existing client
- DELETE /api/clients/:id - Delete client

**Data Validation**: Zod schemas shared between client and server for consistent validation.

**Development Setup**: Custom Vite middleware integration for HMR (Hot Module Replacement) in development, with separate production build process.

### Data Storage

**ORM**: Drizzle ORM configured for PostgreSQL dialect.

**Database Schema**: Single `clients` table with the following structure:
- Client identification (id, company name, contact person, email, phone)
- Sales pipeline tracking (stage, status, value)
- Follow-up management (last follow-up, next follow-up dates)
- Priority classification (High, Medium, Low)
- Activity history stored as JSONB array
- Notes field for additional context

**Migration Strategy**: Drizzle Kit for schema migrations with push-based deployment.

**Development Mode**: In-memory storage implementation (`MemStorage`) with seed data for development and testing, allowing the application to run without database connectivity.

### Design System

**Typography**: Inter font from Google Fonts with weight variations (400, 500, 600, 700) used throughout the interface.

**Spacing System**: Tailwind's spacing scale with specific units (2, 4, 6, 8, 12, 16, 20) for consistent spacing patterns.

**Component Patterns**:
- Metric cards for KPI display with icon support and variant-based styling
- Data tables with sorting, filtering, and responsive design
- Badge components for stage, status, and priority visualization
- Dialog modals for create/edit/detail views
- Toast notifications for user feedback

**Responsive Design**: Mobile-first approach with breakpoint-based layouts, horizontal scrolling tables on mobile devices.

### External Dependencies

**UI Components**: 
- Radix UI primitives (@radix-ui/*) for accessible, unstyled component foundations
- Lucide React for iconography
- CMDK for command palette functionality
- Embla Carousel for carousel components
- Vaul for drawer components

**Database**:
- Neon serverless PostgreSQL (@neondatabase/serverless)
- Drizzle ORM for type-safe database operations
- Connect-pg-simple for PostgreSQL session storage (configured but not actively used in current implementation)

**Utilities**:
- date-fns for date formatting and manipulation
- class-variance-authority (CVA) for component variant management
- clsx and tailwind-merge for conditional className composition
- Zod for runtime type validation
- Nanoid for unique ID generation

**Development Tools**:
- Replit-specific plugins for development experience (cartographer, dev-banner, runtime-error-modal)
- TSX for TypeScript execution in development
- ESBuild for production bundling

**Query Management**:
- TanStack Query for data fetching, caching, and synchronization with configurable retry logic and stale time management

## Recent Changes

### November 27, 2025

- **Service Tracking System**: Implemented comprehensive service tracking feature
  - New `services` table in database to store available services
  - Default services: Product Development, CRM, ERP, Mobile Development, Website Creation, Digital Marketing, ITSM
  - ServiceSelect component with searchable dropdown and ability to add new services dynamically
  - Service field added to Add/Edit Client form
  - Service column added to Reports table (sortable)
  - Service field displayed in Client Details dialog
  - Excel import/export template updated to include Service column
  - API endpoints: GET /api/services, POST /api/services
  - Custom services can be added on-the-fly from the dropdown

- **Country-based Currency System**: Implemented comprehensive currency handling
  - Added searchable country dropdown with 50+ countries and their currencies
  - Auto-selects currency based on country (e.g., United States → USD, India → INR)
  - Value displays use country-specific currency symbols ($, £, €, ¥, etc.)
  - Exchange rates stored in `client/src/lib/country-currency-data.ts`

- **Value (in INR) Column in Reports**: Added INR conversion column
  - Displays all deal values converted to Indian Rupees for standardized reporting
  - Sortable column for comparing deals across different currencies
  - Conversion uses stored exchange rates from country-currency data

- **Days in Pipeline Calculation**: Updated to use `pipelineStartDate` field
  - For Excel imports: Uses the "Last Follow-up" date as the pipeline start date
  - For manual "Add Client": Uses the creation date (today's date)
  - This allows imported clients to show accurate pipeline duration based on when they actually entered the pipeline, not when they were imported into the system

- **Excel Template Updates**: Enhanced instructions for currency handling
  - Country field must match supported country names exactly
  - Value stored in local currency (currency auto-detected from country)
  - Service field added with default options and ability to add custom services

- **Analytics Dashboard**: New comprehensive analytics page with 5 views
  - **Overview**: KPI cards (Active Pipeline, Win Rate, Avg Won Deal, Avg Cycle Time), Pipeline by Stage chart, Cycle Time Distribution, Priority Distribution pie chart, Action Items (high priority follow-ups, stalled negotiations, conversion opportunities)
  - **Pipeline**: Sales Funnel visualization (active pipeline stages only), Deal Health scatter plot (days in pipeline vs deal value)
  - **Performance**: Team performance bar chart, individual team member cards with deals, pipeline value, won deals, and avg deal size
  - **Geographic**: Country-wise distribution charts, individual country cards with deal counts and values
  - **Services**: Comprehensive service analytics view with:
    - Service Line Insights: Highlight cards showing Highest Revenue service, Best Win Rate service, and Largest Average Deal size service
    - Service Line Revenue Comparison: Horizontal bar chart comparing pipeline values across all services (color-coded)
    - Service Portfolio Mix: Two pie charts showing distribution by pipeline value and by deal count
    - Service Overview Cards: Individual cards for each service showing active deals, pipeline value, avg deal size, avg cycle time, won deals, and win rate
    - Service Performance Metrics Table: Comprehensive sortable table with all service KPIs (deals, pipeline value, avg deal size, won, win rate, avg cycle)
  - All values displayed in INR using the country-currency conversion system
  - Navigation: Create Client → Reports → Analytics → Glossary
  - **Metrics Separation**: Active pipeline metrics (stage charts, funnel, cycle time) only include non-Won/Lost deals; Win rate and Avg Won Deal calculated from closed deals (Won + Lost)

- **Service Badge in Client Details**: Service now displays as a cyan-colored badge next to stage, status, and priority badges in client details view