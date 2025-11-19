import { drizzle } from "drizzle-orm/neon-serverless";
import { sql } from "drizzle-orm";
import ws from "ws";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required");
}

const db = drizzle({
  connection: process.env.DATABASE_URL,
  ws: ws,
});

async function migrate() {
  console.log("Starting database migration...");
  console.log("This will preserve all your existing data while upgrading the schema.");
  
  try {
    // Step 1: Create ENUMs
    console.log("\n[1/8] Creating PostgreSQL ENUMs...");
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE stage AS ENUM ('Lead', 'Qualified', 'Proposal Sent', 'Won');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE status AS ENUM ('In Negotiation', 'Proposal Rejected', 'On Hold');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE priority AS ENUM ('High', 'Medium', 'Low');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log("✓ ENUMs created successfully");
    
    // Step 2: Create users table
    console.log("\n[2/8] Creating users table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL UNIQUE,
        email TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("✓ Users table created");
    
    // Step 3: Extract unique responsible persons and activity authors
    console.log("\n[3/8] Migrating users (responsible persons and activity authors)...");
    
    // First, insert responsible persons
    await db.execute(sql`
      INSERT INTO users (name)
      SELECT DISTINCT responsible_person
      FROM clients
      WHERE responsible_person IS NOT NULL
      ON CONFLICT (name) DO NOTHING;
    `);
    
    // Then, extract and insert unique activity authors from JSONB
    await db.execute(sql`
      INSERT INTO users (name)
      SELECT DISTINCT jsonb_array_elements(activity_history)->>'user' as user_name
      FROM clients
      WHERE activity_history IS NOT NULL 
        AND jsonb_array_length(activity_history) > 0
        AND jsonb_array_elements(activity_history)->>'user' IS NOT NULL
        AND jsonb_array_elements(activity_history)->>'user' != ''
      ON CONFLICT (name) DO NOTHING;
    `);
    
    const usersResult = await db.execute(sql`SELECT COUNT(*) as count FROM users;`);
    console.log(`✓ Migrated ${usersResult.rows[0]?.count || 0} unique users (responsible persons + activity authors)`);
    
    // Step 4: Add new columns to clients table
    console.log("\n[4/8] Adding new columns to clients table...");
    await db.execute(sql`
      ALTER TABLE clients 
      ADD COLUMN IF NOT EXISTS stage_new stage,
      ADD COLUMN IF NOT EXISTS status_new status,
      ADD COLUMN IF NOT EXISTS priority_new priority,
      ADD COLUMN IF NOT EXISTS value_new NUMERIC(10, 2),
      ADD COLUMN IF NOT EXISTS responsible_person_id VARCHAR,
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
    `);
    
    // Convert timestamps to timestamptz
    await db.execute(sql`
      ALTER TABLE clients 
      ALTER COLUMN last_follow_up TYPE TIMESTAMPTZ,
      ALTER COLUMN next_follow_up TYPE TIMESTAMPTZ,
      ALTER COLUMN created_at TYPE TIMESTAMPTZ;
    `);
    console.log("✓ New columns added");
    
    // Step 5: Migrate data to new columns
    console.log("\n[5/8] Migrating data to new column formats...");
    await db.execute(sql`
      UPDATE clients 
      SET 
        stage_new = stage::stage,
        status_new = CASE WHEN status = '' OR status IS NULL THEN NULL ELSE status::status END,
        priority_new = priority::priority,
        value_new = value::NUMERIC(10, 2),
        responsible_person_id = (SELECT id FROM users WHERE name = clients.responsible_person LIMIT 1);
    `);
    console.log("✓ Data migrated to new columns");
    
    // Step 6: Create activities table
    console.log("\n[6/8] Creating activities table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS activities (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        client_id VARCHAR NOT NULL,
        action TEXT NOT NULL,
        user_id VARCHAR,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("✓ Activities table created");
    
    // Step 7: Migrate activity history from JSONB to activities table
    console.log("\n[7/8] Migrating activity history to activities table...");
    const clientsWithActivities = await db.execute(sql`
      SELECT id, activity_history 
      FROM clients 
      WHERE activity_history IS NOT NULL 
      AND jsonb_array_length(activity_history) > 0;
    `);
    
    let totalActivities = 0;
    for (const client of clientsWithActivities.rows) {
      // activity_history is already a JavaScript object/array, not a JSON string
      const activities = Array.isArray(client.activity_history) 
        ? client.activity_history 
        : (typeof client.activity_history === 'string' ? JSON.parse(client.activity_history) : []);
      
      for (const activity of activities) {
        const userId = await db.execute(sql`
          SELECT id FROM users WHERE name = ${activity.user} LIMIT 1;
        `);
        
        // Parse date if it's a string, otherwise use current time
        const activityDate = activity.date ? new Date(activity.date).toISOString() : new Date().toISOString();
        
        await db.execute(sql`
          INSERT INTO activities (client_id, action, user_id, created_at)
          VALUES (
            ${client.id},
            ${activity.action},
            ${userId.rows[0]?.id || null},
            ${activityDate}::TIMESTAMPTZ
          );
        `);
        totalActivities++;
      }
    }
    console.log(`✓ Migrated ${totalActivities} activities from ${clientsWithActivities.rows.length} clients`);
    
    // Step 8: Drop old columns and rename new ones
    console.log("\n[8/8] Finalizing schema changes...");
    await db.execute(sql`
      ALTER TABLE clients 
      DROP COLUMN IF EXISTS stage CASCADE,
      DROP COLUMN IF EXISTS status CASCADE,
      DROP COLUMN IF EXISTS priority CASCADE,
      DROP COLUMN IF EXISTS value CASCADE,
      DROP COLUMN IF EXISTS responsible_person CASCADE,
      DROP COLUMN IF EXISTS activity_history CASCADE;
    `);
    
    await db.execute(sql`
      ALTER TABLE clients 
      RENAME COLUMN stage_new TO stage;
      
      ALTER TABLE clients 
      RENAME COLUMN status_new TO status;
      
      ALTER TABLE clients 
      RENAME COLUMN priority_new TO priority;
      
      ALTER TABLE clients 
      RENAME COLUMN value_new TO value;
    `);
    
    // Add NOT NULL constraints and foreign keys
    await db.execute(sql`
      ALTER TABLE clients 
      ALTER COLUMN stage SET NOT NULL,
      ALTER COLUMN priority SET NOT NULL,
      ALTER COLUMN value SET NOT NULL;
    `);
    
    await db.execute(sql`
      ALTER TABLE clients 
      ADD CONSTRAINT fk_responsible_person 
      FOREIGN KEY (responsible_person_id) REFERENCES users(id);
      
      ALTER TABLE activities 
      ADD CONSTRAINT fk_client 
      FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE;
      
      ALTER TABLE activities 
      ADD CONSTRAINT fk_user 
      FOREIGN KEY (user_id) REFERENCES users(id);
    `);
    
    // Add indexes for performance
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_clients_stage ON clients(stage);
      CREATE INDEX IF NOT EXISTS idx_clients_priority ON clients(priority);
      CREATE INDEX IF NOT EXISTS idx_clients_responsible_person ON clients(responsible_person_id);
      CREATE INDEX IF NOT EXISTS idx_clients_next_follow_up ON clients(next_follow_up);
      CREATE INDEX IF NOT EXISTS idx_activities_client ON activities(client_id);
      CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);
    `);
    
    console.log("✓ Schema finalized with constraints and indexes");
    
    console.log("\n✅ Migration completed successfully!");
    console.log("All your data has been preserved and migrated to the new normalized structure.");
    
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    console.error("\nThe database is in an inconsistent state. Please check the error above.");
    process.exit(1);
  }
}

migrate();
