# Executive CRM Dashboard

## Overview
The Executive CRM Dashboard is a React-based application providing high-level visibility into client relationships, deal pipeline management, and sales tracking. It enables users to track clients from lead to won deals, offering comprehensive activity history, follow-up scheduling, and priority management. The system delivers executive metrics and a detailed table view for pipeline management, designed with Material Design principles for an enterprise data application.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built with React and TypeScript, using Vite for development and bundling. It leverages Shadcn/ui (Radix UI primitives) with the "new-york" style variant for UI components and Tailwind CSS for styling, adhering to Material Design principles with support for light/dark modes. State management is handled by TanStack Query for server state and React hooks for local state. Wouter is used for lightweight client-side routing, and React Hook Form with Zod provides type-safe form handling and validation.

### Backend Architecture
The backend is an Express.js application running on Node.js, providing a RESTful API for CRUD operations on client data. Zod schemas are shared between client and server for consistent data validation. Development utilizes custom Vite middleware for HMR.

### Data Storage
The application uses PostgreSQL as its primary data store, managed with Drizzle ORM. The database schema includes `clients`, `users`, `activities`, and `services` tables. Drizzle Kit is used for schema migrations, and all data is persisted directly to PostgreSQL (DbStorage), requiring a `DATABASE_URL`.

### Design System
Typography utilizes the Inter font. Spacing is based on Tailwind's scale. Component patterns include metric cards, sortable/filterable data tables, badges, dialog modals, and toast notifications. The design is mobile-first with responsive layouts.

### Technical Implementations
- **Pipeline Tracker**: Comprehensive visual pipeline tracker with client selection, two view modes (Compact, Detailed Cards), progress bar, stage circles with wait times, outcome indicators, and responsive design with dark mode support.
- **Stage Timeline Tracking**: Automatic tracking of stage entry/exit times via `client_stage_history` table. Records when clients move between pipeline stages (not status changes), calculates duration in each stage, and provides analytics on sales velocity and bottlenecks. API endpoints: `/api/analytics/stages` for aggregate metrics, `/api/clients/:id/stage-history` for client-specific timeline.
- **Service Tracking**: Includes a `services` table, a `ServiceSelect` component for adding/selecting services, and service integration into client forms, reports, and details.
- **Country-based Currency System**: Provides a searchable country dropdown that auto-selects currency, displays values with country-specific symbols, and supports country aliases.
- **Analytics Dashboard**: Features 5 views (Overview, Pipeline, Performance, Geographic, Services) with various charts, KPIs, and metrics, all displaying values in INR using the currency conversion system. Includes service line insights, revenue comparison, and portfolio mix.
- **User and Activity Logging**: Incorporates a `users` table for team members and an `activities` table for normalized, user-attributed activity logging.
- **Client Portfolio UI Redesign**: Features a compact two-panel layout with a `ClientListPanel` for client cards with filtering/search, and a `ClientManagementPanel` for viewing/editing client details, notes, and activities.
- **Excel Import/Export**: Functionality for importing client data via Excel (with template downloads and validation) and exporting is integrated, with buttons relocated to the navigation header.

## External Dependencies

- **UI Components**: Radix UI primitives, Lucide React, CMDK, Embla Carousel, Vaul.
- **Database**: Neon serverless PostgreSQL, Drizzle ORM, connect-pg-simple.
- **Utilities**: date-fns, class-variance-authority (CVA), clsx, tailwind-merge, Zod, Nanoid.
- **Development Tools**: Replit-specific plugins, TSX, ESBuild.
- **Query Management**: TanStack Query.