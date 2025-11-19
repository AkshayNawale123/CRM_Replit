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

async function fixActivities() {
  console.log("Fixing activity user associations...");
  
  // Update activities with correct user IDs based on original activity data
  // The activities were created in order, so we need to map them back
  
  const activities = await db.execute(sql`
    SELECT id, action, created_at::date as date_only
    FROM activities
    ORDER BY created_at;
  `);
  
  console.log(`Found ${activities.rows.length} activities to fix`);
  
  // Map of activity actions to user names based on the original seed data
  const activityUserMap: Record<string, string> = {
    "Follow-up call completed": "Sarah",
    "Proposal sent": "Mike",
    "Initial meeting": "Sarah",
    "Pricing discussion": "Tom",
    "Proposal submitted": "Sarah",
    "Contract signed": "Mike",
    "Final negotiations": "Sarah",
    "Discovery call": "Tom",
    "Technical review meeting": "Sarah",
  };
  
  for (const activity of activities.rows) {
    const userName = activityUserMap[activity.action as string];
    if (userName) {
      const user = await db.execute(sql`
        SELECT id FROM users WHERE name = ${userName} LIMIT 1;
      `);
      
      if (user.rows[0]) {
        await db.execute(sql`
          UPDATE activities 
          SET user_id = ${user.rows[0].id}
          WHERE id = ${activity.id};
        `);
        console.log(`✓ Updated activity "${activity.action}" with user "${userName}"`);
      }
    }
  }
  
  console.log("✅ All activities updated successfully!");
  process.exit(0);
}

fixActivities().catch((error) => {
  console.error("❌ Error fixing activities:", error);
  process.exit(1);
});
