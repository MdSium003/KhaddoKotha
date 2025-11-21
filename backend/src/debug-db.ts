import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import jwt from "jsonwebtoken";

async function main() {
    const databaseUrl = process.env.DATABASE_URL;
    const jwtSecret = process.env.JWT_SECRET || "your-secret-key-change-in-production";

    console.log("JWT Secret:", jwtSecret);

    if (!databaseUrl) {
        console.error("DATABASE_URL is not set");
        return;
    }

    console.log("Connecting to DB...");
    const sql = neon(databaseUrl);

    try {
        console.log("Checking connection...");
        const [version] = await sql`SELECT version()`;
        console.log("DB Version:", version ? version.version : "Unknown");

        console.log("Checking user_inventory table...");
        const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_inventory'
      );
    `;
        console.log("Table 'user_inventory' exists:", tableExists[0].exists);

        if (tableExists[0].exists) {
            console.log("Checking columns...");
            const columns = await sql`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'user_inventory';
      `;
            console.log("Columns:", columns.map(c => c.column_name).join(", "));

            // Try to select from the table with a dummy user_id
            console.log("Trying SELECT query...");
            try {
                const items = await sql`
          SELECT id, item_name, quantity, category, purchase_date, expiration_date, notes, image_url, created_at, updated_at
          FROM user_inventory
          WHERE user_id = 1
          ORDER BY expiration_date ASC NULLS LAST, item_name ASC
        `;
                console.log("SELECT query success. Items found:", items.length);
            } catch (err) {
                console.error("SELECT query failed:", err);
            }
        }

        // Check Auth
        console.log("Checking Auth...");
        const token = jwt.sign({ userId: 1, email: "test@example.com" }, jwtSecret, { expiresIn: "7d" });
        console.log("Generated token:", token);
        try {
            const decoded = jwt.verify(token, jwtSecret);
            console.log("Token verified:", decoded);
        } catch (err) {
            console.error("Token verification failed:", err);
        }

    } catch (error) {
        console.error("General Error:", error);
    }
}

main();
