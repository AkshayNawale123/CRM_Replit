# CRM Database Documentation

**Version:** 1.1  
**Last Updated:** November 27, 2025  
**Owner:** Development Team  
**Status:** Active Development

---

## Table of Contents

1. [Introduction](#introduction)
2. [Technology Stack](#technology-stack)
3. [Database Architecture](#database-architecture)
4. [Schema Overview](#schema-overview)
5. [Table Definitions](#table-definitions)
6. [Enumerations (ENUMs)](#enumerations-enums)
7. [Relationships](#relationships)
8. [Indexes](#indexes)
9. [Data Types & Constraints](#data-types--constraints)
10. [Storage Implementation](#storage-implementation)
11. [Setup & Deployment](#setup--deployment)
12. [Naming Conventions](#naming-conventions)
13. [Version History](#version-history)

---

## Introduction

### Purpose
This document provides comprehensive technical documentation for the CRM (Customer Relationship Management) database schema. It serves as the single source of truth for database structure, relationships, and implementation details.

### Scope
The database schema supports a full-featured CRM system with:
- Client portfolio tracking across sales stages
- Deal pipeline management with status tracking
- Activity history and audit trails
- User management and assignment
- Sales analytics and reporting

### Audience
- Backend developers implementing API endpoints
- Frontend developers integrating with the data model
- Database administrators managing deployments
- QA engineers writing tests
- Product managers understanding data capabilities

---

## Technology Stack

### Database Management System
- **Primary DBMS:** PostgreSQL 14+
- **Cloud Provider:** Neon Serverless PostgreSQL
- **Driver:** `@neondatabase/serverless` (v0.9.x)

### ORM & Schema Management
- **ORM:** Drizzle ORM (v0.33.x)
- **Schema Language:** TypeScript with Drizzle's PostgreSQL dialect
- **Migration Tool:** Drizzle Kit
- **Schema Validation:** Zod (v3.23.x) with drizzle-zod integration

### Development Environment
- **Storage:** PostgreSQL via Neon (database-only, no in-memory fallback)
- **TypeScript:** v5.x
- **Runtime:** Node.js v20+

---

## Database Architecture

### Architecture Pattern
The database follows a **normalized relational design** with:
- Third Normal Form (3NF) compliance
- Foreign key constraints for referential integrity
- Composite indexes for query optimization
- Enum types for controlled vocabularies

### Entity Relationship Overview

```
┌─────────────┐
│   users     │
│             │
│ - id (PK)   │
│ - name      │
│ - email     │
│ - role      │
└─────────────┘
       │
       │ 1:N (responsible person)
       │
       ▼
┌─────────────┐       1:N        ┌──────────────┐
│  clients    │◄─────────────────│ activities   │
│             │                  │              │
│ - id (PK)   │                  │ - id (PK)    │
│ - stage     │                  │ - clientId   │
│ - status    │                  │ - action     │
│ - value     │                  │ - userId     │
│ - priority  │                  │ - createdAt  │
└─────────────┘                  └──────────────┘
       │
       │ 1:N (activities)
       ▼
```

### Data Flow
1. **Users** are created with specific roles (Sales Rep, Manager, Admin)
2. **Clients** are assigned to users as responsible persons
3. **Activities** track all interactions with clients
4. Stage progression flows: Lead → Qualified → ... → Won/Lost
5. Status provides granular state within each stage

---

## Schema Overview

### File Location
**Primary Schema:** `shared/schema.ts`

### Tables Summary
| Table Name | Rows (Est.) | Purpose | Growth Rate |
|------------|-------------|---------|-------------|
| `users` | ~50 | Sales team members and managers | ~5/month |
| `clients` | ~5,000 | Client companies and contacts | ~200/month |
| `activities` | ~50,000 | Interaction history | ~2,000/month |

### Schema Definition Language
All schemas are defined using Drizzle ORM's TypeScript API with PostgreSQL-specific types:

```typescript
// Example from shared/schema.ts
import { pgTable, text, varchar, numeric, timestamp, pgEnum } from "drizzle-orm/pg-core";
```

---

## Table Definitions

### Table: `users`

**Description:** Represents sales team members, managers, and administrators who manage client relationships.

**Purpose:** 
- Track who is responsible for each client
- Associate activities with specific users
- Control access and permissions through role-based assignments

**Business Rules:**
- Name must be unique across the organization
- Email is optional (for system-only accounts)
- Default role is "Sales Rep" unless specified

**Common Queries:**
- Find all clients assigned to a user
- Get activity history for a specific user
- List all active sales representatives

**Related Tables:** `clients` (1:N), `activities` (1:N)

#### Columns

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier (UUID v4) |
| `name` | TEXT | NOT NULL, UNIQUE | User's full name (unique across system) |
| `email` | TEXT | NULLABLE | User's email address |
| `role` | ENUM(role) | DEFAULT 'Sales Rep' | User role (Sales Rep, Manager, Admin) |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Record creation timestamp (UTC) |

#### Indexes
- Primary key on `id` (automatic)
- Unique constraint on `name` (automatic)

#### Sample Data
```sql
INSERT INTO users (name, email, role) VALUES
  ('John Smith', 'john.smith@company.com', 'Sales Rep'),
  ('Sarah Johnson', 'sarah.johnson@company.com', 'Manager'),
  ('Admin User', NULL, 'Admin');
```

---

### Table: `clients`

**Description:** Represents client companies and their primary contacts within the sales pipeline.

**Purpose:**
- Track client companies through the sales funnel
- Store contact information and deal details
- Monitor sales progress with stages and statuses
- Assign ownership to responsible sales representatives

**Business Rules:**
- Each client must have a valid stage (10 possible values)
- Status is optional and provides additional context within a stage
- Value must be non-negative (represents deal size in currency)
- Both lastFollowUp and nextFollowUp are required for pipeline management
- Priority must be set (High, Medium, or Low)
- Clients are assigned to a responsible person (user)

**Mutability:**
- All fields are mutable except `id` and `createdAt`
- `updatedAt` automatically updates on any modification
- Stage progression is tracked through activities

**Performance Notes:**
- Indexed on `stage`, `priority`, and `responsiblePersonId` for fast filtering
- Expected to handle ~5,000 active clients with ~200 new clients/month

**Common Queries:**
- Filter clients by stage and priority
- Get all clients for a specific sales rep
- Find clients with upcoming follow-ups
- Calculate pipeline value by stage

**Related Tables:** `users` (N:1), `activities` (1:N)

#### Columns

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier (UUID v4) |
| `company_name` | TEXT | NOT NULL | Client company legal name |
| `contact_person` | TEXT | NOT NULL | Primary contact person at company |
| `email` | TEXT | NOT NULL | Contact email address (validated) |
| `phone` | TEXT | NOT NULL | Contact phone number |
| `stage` | ENUM(stage) | NOT NULL | Current sales pipeline stage (required) |
| `status` | ENUM(status) | NULLABLE | Negotiation/proposal status (optional) |
| `value` | NUMERIC(10,2) | NOT NULL | Deal value in currency (2 decimal precision) |
| `last_follow_up` | TIMESTAMP WITH TIME ZONE | NOT NULL | Date of most recent follow-up (UTC) |
| `next_follow_up` | TIMESTAMP WITH TIME ZONE | NOT NULL | Scheduled date for next follow-up (UTC) |
| `priority` | ENUM(priority) | NOT NULL | Deal priority (High, Medium, Low) |
| `responsible_person_id` | VARCHAR | FOREIGN KEY → users.id | Assigned sales representative |
| `country` | TEXT | NOT NULL | Client company country/region |
| `linkedin` | TEXT | DEFAULT '' | LinkedIn profile URL (optional) |
| `notes` | TEXT | DEFAULT '' | Free-form notes about the client |
| `source` | ENUM(source) | DEFAULT 'Other' | Lead source (Referral, Website, Event, etc.) |
| `industry` | TEXT | NULLABLE | Client industry/vertical |
| `estimated_close_date` | TIMESTAMP WITH TIME ZONE | NULLABLE | Expected deal close date |
| `win_probability` | INTEGER | NULLABLE | Percentage likelihood of winning (0-100) |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Record creation timestamp (UTC) |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Last modification timestamp (UTC) |

#### Indexes
- `clients_stage_idx` on `stage` - Fast filtering by pipeline stage
- `clients_priority_idx` on `priority` - Quick priority-based queries
- `clients_responsible_person_idx` on `responsible_person_id` - Efficient assignment lookups

#### Foreign Keys
- `responsible_person_id` REFERENCES `users(id)` - Ensures valid user assignment

#### Sample Data
```sql
INSERT INTO clients (
  company_name, contact_person, email, phone, stage, status, value,
  last_follow_up, next_follow_up, priority, country
) VALUES (
  'Acme Corporation',
  'Jane Doe',
  'jane.doe@acme.com',
  '+1-555-0123',
  'Proposal Sent',
  'In Negotiation',
  75000.00,
  '2025-11-15 10:00:00+00',
  '2025-11-22 14:00:00+00',
  'High',
  'United States'
);
```

---

### Table: `activities`

**Description:** Normalized activity log tracking all interactions with clients.

**Purpose:**
- Maintain complete audit trail of client interactions
- Track who performed actions and when
- Support activity history display in UI
- Enable reporting on engagement frequency

**Business Rules:**
- Each activity must reference a valid client
- Activities cascade delete when client is deleted
- User association is optional (for system-generated activities)
- Action text is free-form description of the interaction

**Performance Notes:**
- Indexed on `clientId` for fast activity history retrieval
- Expected high write volume (~2,000 new activities/month)
- Read-heavy for displaying client histories

**Common Queries:**
- Get all activities for a specific client (ordered by date)
- Find recent activities across all clients
- Calculate activity frequency per sales rep

**Related Tables:** `clients` (N:1), `users` (N:1)

#### Columns

| Column | Data Type | Constraints | Description |
|--------|-----------|-------------|-------------|
| `id` | VARCHAR | PRIMARY KEY, DEFAULT gen_random_uuid() | Unique identifier (UUID v4) |
| `client_id` | VARCHAR | NOT NULL, FOREIGN KEY → clients.id, ON DELETE CASCADE | Associated client |
| `action` | TEXT | NOT NULL | Description of the activity/interaction |
| `user_id` | VARCHAR | FOREIGN KEY → users.id | User who performed the action (optional) |
| `created_at` | TIMESTAMP WITH TIME ZONE | NOT NULL, DEFAULT NOW() | Activity timestamp (UTC) |

#### Indexes
- `activities_client_idx` on `client_id` - Fast client activity lookups

#### Foreign Keys
- `client_id` REFERENCES `clients(id)` ON DELETE CASCADE - Auto-delete activities when client removed
- `user_id` REFERENCES `users(id)` - Optional user association

#### Sample Data
```sql
INSERT INTO activities (client_id, action, user_id) VALUES
  ('uuid-of-client', 'Initial outreach call - discussed project requirements', 'uuid-of-user'),
  ('uuid-of-client', 'Sent proposal document via email', 'uuid-of-user'),
  ('uuid-of-client', 'Follow-up meeting scheduled for next week', 'uuid-of-user');
```

---

## Enumerations (ENUMs)

### Overview
PostgreSQL ENUMs provide type-safe, controlled vocabularies for specific fields. All enums are defined in `shared/schema.ts`.

---

### ENUM: `stage`

**Purpose:** Defines the 10 stages in the sales pipeline progression.

**Values:**
1. `Lead` - Initial contact or inquiry
2. `Qualified` - Lead has been vetted and meets criteria
3. `Meeting Scheduled` - First meeting booked
4. `Demo Completed` - Product demonstration finished
5. `Proof of Concept (POC)` - Trial/POC phase
6. `Proposal Sent` - Formal proposal submitted
7. `Verbal Commitment` - Verbal agreement received
8. `Contract Review` - Legal review in progress
9. `Won` - Deal closed successfully
10. `Lost` - Deal did not close

**Used In:** `clients.stage`

**Business Logic:**
- Stages generally progress sequentially from Lead → Won/Lost
- Stages can move backward (e.g., Won back to Proposal Sent)
- Won and Lost are terminal stages

---

### ENUM: `status`

**Purpose:** Provides granular negotiation state within a sales stage.

**Values:**
1. `In Negotiation` - Active pricing/terms discussion
2. `Proposal Rejected` - Proposal declined by client
3. `On Hold` - Temporarily paused
4. `Pending Review` - Awaiting internal approval
5. `Awaiting Response` - Waiting for client feedback
6. `Under Evaluation` - Client evaluating proposal
7. `Budget Approval Pending` - Awaiting budget confirmation

**Used In:** `clients.status`

**Business Logic:**
- Status is **optional** (nullable)
- Status provides context within a stage (e.g., "Proposal Sent" + "In Negotiation")
- Multiple statuses can apply to the same stage
- Status values are independent of stage progression

**Example Combinations:**
- Stage: "Proposal Sent" + Status: "In Negotiation"
- Stage: "Proposal Sent" + Status: "On Hold"
- Stage: "Verbal Commitment" + Status: "Pending Review"

---

### ENUM: `priority`

**Purpose:** Indicates deal priority level for resource allocation.

**Values:**
1. `High` - Critical priority, immediate attention required
2. `Medium` - Normal priority, standard workflow
3. `Low` - Lower priority, can be delayed

**Used In:** `clients.priority`

**Business Logic:**
- All clients must have a priority (NOT NULL)
- Priority guides sales rep workload allocation
- High-priority deals should have more frequent follow-ups

---

### ENUM: `source`

**Purpose:** Tracks lead acquisition channel.

**Values:**
1. `Referral` - Referred by existing client or partner
2. `Website` - Inbound from company website
3. `Event` - Met at conference/trade show
4. `Cold Outreach` - Proactive outbound contact
5. `Partner` - Through partnership channel
6. `Other` - Other sources

**Used In:** `clients.source`

**Business Logic:**
- Default value is "Other"
- Used for marketing ROI analysis
- Helps identify most effective channels

---

### ENUM: `role`

**Purpose:** Defines user permission levels.

**Values:**
1. `Sales Rep` - Standard sales representative
2. `Manager` - Sales manager with team oversight
3. `Admin` - System administrator with full access

**Used In:** `users.role`

**Business Logic:**
- Default role is "Sales Rep"
- Used for access control in application layer
- Managers can view all team members' clients
- Admins have unrestricted access

---

## Relationships

### Diagram

```
users (1) ──────────┬────────> clients (N)
                    │            │
                    │            │
                    │            └────────> activities (N)
                    │
                    └─────────────────────> activities (N)
```

### Relationship Details

#### `users` → `clients` (One-to-Many)

**Type:** One-to-Many (1:N)  
**Foreign Key:** `clients.responsible_person_id` → `users.id`  
**Cardinality:** One user can be responsible for many clients

**Business Rules:**
- Each client must have exactly one responsible person
- A user can be assigned to unlimited clients
- Deleting a user does not cascade (must reassign clients first)

**Query Example:**
```sql
-- Get all clients for a specific user
SELECT c.* 
FROM clients c
WHERE c.responsible_person_id = 'user-uuid';
```

---

#### `clients` → `activities` (One-to-Many)

**Type:** One-to-Many (1:N)  
**Foreign Key:** `activities.client_id` → `clients.id`  
**Cardinality:** One client can have many activities  
**Cascade:** ON DELETE CASCADE

**Business Rules:**
- Each activity must belong to exactly one client
- A client can have unlimited activities
- Deleting a client automatically deletes all its activities

**Query Example:**
```sql
-- Get activity history for a client
SELECT a.* 
FROM activities a
WHERE a.client_id = 'client-uuid'
ORDER BY a.created_at DESC;
```

---

#### `users` → `activities` (One-to-Many)

**Type:** One-to-Many (1:N)  
**Foreign Key:** `activities.user_id` → `users.id`  
**Cardinality:** One user can perform many activities  
**Nullable:** Yes (system-generated activities have NULL user)

**Business Rules:**
- Most activities should be associated with a user
- System-generated activities can have NULL user_id
- Deleting a user does not cascade (activities remain)

**Query Example:**
```sql
-- Get all activities by a specific user
SELECT a.*, c.company_name
FROM activities a
JOIN clients c ON a.client_id = c.id
WHERE a.user_id = 'user-uuid'
ORDER BY a.created_at DESC;
```

---

## Indexes

### Index Strategy
Indexes are created on columns frequently used in:
- WHERE clauses (filtering)
- JOIN conditions (relationships)
- ORDER BY clauses (sorting)

### Index Definitions

#### `clients` Table Indexes

**1. clients_stage_idx**
```sql
CREATE INDEX clients_stage_idx ON clients(stage);
```
- **Purpose:** Fast filtering by pipeline stage
- **Use Case:** Dashboard metrics, stage-specific reports
- **Query Example:** `WHERE stage = 'Proposal Sent'`

**2. clients_priority_idx**
```sql
CREATE INDEX clients_priority_idx ON clients(priority);
```
- **Purpose:** Quick priority-based sorting and filtering
- **Use Case:** High-priority deal lists, workload prioritization
- **Query Example:** `WHERE priority = 'High' ORDER BY next_follow_up`

**3. clients_responsible_person_idx**
```sql
CREATE INDEX clients_responsible_person_idx ON clients(responsible_person_id);
```
- **Purpose:** Efficient lookup of clients by assigned user
- **Use Case:** Sales rep dashboards, team reports
- **Query Example:** `WHERE responsible_person_id = 'user-uuid'`

---

#### `activities` Table Indexes

**4. activities_client_idx**
```sql
CREATE INDEX activities_client_idx ON activities(client_id);
```
- **Purpose:** Fast retrieval of activity history for a client
- **Use Case:** Client detail view, activity timelines
- **Query Example:** `WHERE client_id = 'client-uuid' ORDER BY created_at DESC`

---

### Composite Index Opportunities
Consider adding composite indexes for common query patterns:

```sql
-- For date-range queries with priority filtering
CREATE INDEX clients_priority_next_followup_idx 
ON clients(priority, next_follow_up);

-- For user-stage reporting
CREATE INDEX clients_user_stage_idx 
ON clients(responsible_person_id, stage);
```

---

## Data Types & Constraints

### Primary Keys
- **Type:** VARCHAR (UUID v4)
- **Generation:** `gen_random_uuid()` (PostgreSQL built-in)
- **Format:** `550e8400-e29b-41d4-a716-446655440000`
- **Rationale:** UUIDs prevent ID collision in distributed systems and provide better security than sequential integers

### Numeric Precision
- **Currency Values:** `NUMERIC(10, 2)`
  - 10 total digits, 2 decimal places
  - Max value: 99,999,999.99
  - Exact decimal precision (no floating-point errors)

### Text Fields
- **VARCHAR vs TEXT:**
  - `VARCHAR` used only for UUIDs (known max length)
  - `TEXT` used for all user-entered strings (unlimited length)
  - PostgreSQL internally handles both efficiently

### Timestamps
- **Type:** `TIMESTAMP WITH TIME ZONE`
- **Storage:** UTC timezone
- **Display:** Convert to user's local timezone in application layer
- **Automatic Timestamps:**
  - `created_at`: Set once on INSERT
  - `updated_at`: Updated on every modification

### NULL Handling
- **Required Fields:** Use `NOT NULL` constraint
- **Optional Fields:** Allow NULL
- **Default Values:** Specified where appropriate (e.g., `role` defaults to 'Sales Rep')

---

## Storage Implementation

### Database-Only Storage (Current)

**Implementation:** PostgreSQL via Neon Serverless (DbStorage)  
**Location:** `server/storage.ts`  
**Purpose:** All data persistence - development and production use the same storage layer

**Characteristics:**
- All data stored directly in PostgreSQL database
- Data persists across server restarts
- No in-memory fallback or seed data
- DATABASE_URL environment variable is **required** for the application to run
- Real-time data fetching with TanStack Query cache invalidation

**Storage Interface:**
```typescript
interface IStorage {
  getClients(): Promise<Client[]>;
  getClientById(id: string): Promise<Client | undefined>;
  createClient(client: InsertClient): Promise<Client>;
  updateClient(id: string, client: Partial<InsertClient>): Promise<Client>;
  deleteClient(id: string): Promise<void>;
  getServices(): Promise<Service[]>;
  createService(service: InsertService): Promise<Service>;
  // ... additional methods
}
```

**Data Refresh Mechanism:**
- Frontend uses TanStack Query with `queryKey: ["/api/clients"]`
- Cache invalidation occurs after create, update, delete, and Excel import operations
- All views (Dashboard, Reports, Analytics) automatically refresh when data changes

**When to Use:**
- Local development (requires DATABASE_URL)
- Production deployments
- Staging environments
- All environments require database connectivity

---

### PostgreSQL Configuration

**Implementation:** PostgreSQL via Neon  
**Location:** `server/db.ts`  
**Connection:** Serverless PostgreSQL driver

**Characteristics:**
- Persistent storage in cloud-hosted PostgreSQL
- ACID compliance for data integrity
- Support for concurrent connections
- Automatic backups and point-in-time recovery
- Scalable with serverless architecture

**Connection Configuration:**
```typescript
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);
```

**Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string
- Format: `postgresql://user:password@host:port/database`

**When to Use:**
- Production deployments
- Staging environments
- Load testing
- Data persistence requirements

---

### Data Import

**Importing Data via Excel:**

The application supports bulk data import via Excel files:
1. Download the Excel template from the Reports page
2. Fill in client data following the template format
3. Upload the completed Excel file
4. Data is validated and imported directly to PostgreSQL
5. All views automatically refresh after import

**Manual Data Entry:**
- Use the "Add Client" form in the Dashboard
- Data is immediately saved to the database
- No server restart required

---

## Setup & Deployment

### Local Development Setup

**1. Install Dependencies:**
```bash
npm install
```

**2. Configure Environment:**
Create `.env` file (**required** - no fallback storage):
```env
# Required: PostgreSQL connection (Neon)
DATABASE_URL=postgresql://user:password@hostname.neon.tech/neondb?sslmode=require
```

**Important:** The application will **not start** without a valid DATABASE_URL.

**3. Apply Schema to Database:**
```bash
npm run db:push      # Apply schema to database
```

**4. Start Development Server:**
```bash
npm run dev
```

---

### Production Deployment

**1. Database Provisioning:**
- Create Neon PostgreSQL instance
- Note connection string

**2. Environment Configuration:**
```bash
# Set on Replit or hosting platform
DATABASE_URL=postgresql://user:password@hostname.neon.tech/neondb?sslmode=require
```

**3. Schema Migration:**
```bash
npm run db:push  # Apply latest schema
```

**4. Verification:**
```sql
-- Verify tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check enum types
SELECT typname FROM pg_type 
WHERE typtype = 'e';
```

**5. Deploy Application:**
```bash
npm run build   # Build for production
npm start       # Start production server
```

---

### Database Commands

**Schema Management:**
```bash
npm run db:generate  # Generate migration from schema changes
npm run db:push      # Push schema to database (dev)
npm run db:migrate   # Run migrations (prod)
npm run db:studio    # Launch Drizzle Studio GUI
```

**Backup & Restore:**
```bash
# Backup
pg_dump $DATABASE_URL > backup.sql

# Restore
psql $DATABASE_URL < backup.sql
```

---

## Naming Conventions

### Tables
- **Format:** Lowercase, plural nouns
- **Examples:** `users`, `clients`, `activities`
- **Rationale:** Plural indicates collection of records

### Columns
- **Format:** snake_case
- **Examples:** `company_name`, `next_follow_up`, `created_at`
- **Rationale:** PostgreSQL convention, case-insensitive

### Primary Keys
- **Format:** `id`
- **Type:** VARCHAR (UUID)
- **Consistent:** Same name across all tables

### Foreign Keys
- **Format:** `{referenced_table_singular}_id`
- **Examples:** `client_id`, `user_id`, `responsible_person_id`
- **Rationale:** Clear indication of relationship

### Indexes
- **Format:** `{table}_{column(s)}_{type}`
- **Examples:** `clients_stage_idx`, `activities_client_idx`
- **Types:** `idx` (standard), `unique` (unique constraint)

### Enums
- **Format:** Lowercase type name
- **Examples:** `stage`, `status`, `priority`, `role`
- **Values:** Title Case or sentence case
- **Examples:** `'High'`, `'Proposal Sent'`, `'In Negotiation'`

---

## Version History

### Version 1.1 (November 27, 2025)
**Status:** Active Development

**Changes:**
- **Removed in-memory storage (MemStorage)** - Application now uses database-only storage
- Removed ~600 lines of MemStorage class code from `server/storage.ts`
- Removed all Map-based data storage and seed data
- Made `DATABASE_URL` environment variable **required** (no fallback)
- Added `services` table for tracking client service interests
- Added `pipelineStartDate` field to clients for accurate pipeline duration tracking
- Implemented real-time data refresh using TanStack Query cache invalidation
- All views (Dashboard, Reports, Analytics) automatically refresh when data changes
- Added Excel import/export functionality with direct database persistence

**Breaking Changes:**
- Application will not start without a valid `DATABASE_URL`
- No in-memory fallback for development/testing

**Schema Statistics:**
- 4 tables (users, clients, activities, services)
- 5 enum types
- 4+ indexes
- 3 foreign key relationships
- ~35 total columns

---

### Version 1.0 (November 19, 2025)
**Status:** Superseded by v1.1

**Changes:**
- Initial schema design
- Created `users`, `clients`, `activities` tables
- Defined 5 enum types (stage, status, priority, source, role)
- Established foreign key relationships
- Added performance indexes on clients and activities
- Implemented dual storage (MemStorage + PostgreSQL)
- Integrated Drizzle ORM with Zod validation

**Schema Statistics:**
- 3 tables
- 5 enum types
- 4 indexes
- 3 foreign key relationships
- ~30 total columns

**Known Limitations:**
- No soft delete implementation
- No audit logging at database level
- No full-text search indexes
- No database-level triggers

**Future Enhancements:**
- Add full-text search on company names and notes
- Implement soft delete with `deleted_at` column
- Add database triggers for audit logging
- Create materialized views for reporting
- Add compound indexes for complex queries

---

## Appendix

### Related Documentation
- **Schema Definition:** `shared/schema.ts`
- **Storage Implementation:** `server/storage.ts`
- **Database Connection:** `server/db.ts`
- **API Routes:** `server/routes.ts`
- **Drizzle Config:** `drizzle.config.ts`

### Additional Resources
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Neon Documentation](https://neon.tech/docs)
- [Zod Validation](https://zod.dev/)

### Contact
For questions or clarifications about this database schema, contact the development team.

---

**Document Status:** ✅ Complete  
**Review Date:** November 27, 2025  
**Next Review:** Upon schema changes or quarterly
