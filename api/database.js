const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  const msg = "DATABASE_URL is missing. Please set it in Vercel Environment Variables.";
  console.error(msg);
  // Fail fast with a clear message
  throw new Error(msg);
}

// Use environment variable for the connection string
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

async function initDb() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // --- Table Creations (Postgres Syntax) ---

    await client.query(`CREATE TABLE IF NOT EXISTS inventory (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            category TEXT,
            potency TEXT,
            batch TEXT,
            stock INTEGER DEFAULT 0,
            uom TEXT DEFAULT 'pcs',
            min_alert INTEGER DEFAULT 5,
            expiry TEXT
        )`);

    await client.query(`CREATE TABLE IF NOT EXISTS procurements (
            id SERIAL PRIMARY KEY,
            product_id INTEGER REFERENCES inventory(id),
            date TEXT,
            quantity INTEGER,
            unit_cost REAL,
            supplier TEXT
        )`);

    await client.query(`CREATE TABLE IF NOT EXISTS deliveries (
            id SERIAL PRIMARY KEY,
            date TEXT,
            recipient TEXT,
            status TEXT DEFAULT 'Completed'
        )`);

    await client.query(`CREATE TABLE IF NOT EXISTS delivery_items (
            id SERIAL PRIMARY KEY,
            delivery_id INTEGER REFERENCES deliveries(id),
            product_id INTEGER REFERENCES inventory(id),
            quantity INTEGER,
            distribution_price REAL
        )`);

    await client.query(`CREATE TABLE IF NOT EXISTS employees (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            role TEXT,
            contact TEXT,
            salary REAL,
            status TEXT DEFAULT 'Active',
            joined_date TEXT
        )`);

    await client.query(`CREATE TABLE IF NOT EXISTS salaries (
            id SERIAL PRIMARY KEY,
            employee_id INTEGER REFERENCES employees(id),
            amount REAL,
            date TEXT,
            status TEXT DEFAULT 'Paid'
        )`);

    await client.query(`CREATE TABLE IF NOT EXISTS audit_logs (
            id SERIAL PRIMARY KEY,
            date TEXT,
            action TEXT,
            details TEXT,
            "user" TEXT DEFAULT 'Admin'
        )`);

    // --- Seed Initial Data if empty ---
    const { rows } = await client.query("SELECT COUNT(*) as count FROM inventory");
    if (parseInt(rows[0].count) === 0) {
      console.log("Seeding initial inventory...");
      const inventoryData = [
        ["Arnica Montana", "Dilution", "30C", "B-1001", 15, "bottle", 5, "2026-12-31"],
        ["Nux Vomica", "Mother Tincture", "Q", "B-1002", 8, "bottle", 5, "2025-08-15"],
        ["Belladonna", "Dilution", "200C", "B-1003", 20, "bottle", 5, "2027-01-10"],
        ["Calcarea Carb", "Trituration", "6X", "B-1004", 12, "bottle", 3, "2026-06-20"],
        ["Lycopodium", "Dilution", "30C", "B-1005", 25, "bottle", 8, "2028-02-14"],
        ["Rhus Tox", "Dilution", "200C", "B-1006", 5, "bottle", 5, "2025-11-30"],
        ["Sulphur", "Dilution", "30C", "B-1007", 30, "bottle", 10, "2026-09-12"],
        ["Aconite", "Dilution", "30C", "B-1008", 18, "bottle", 5, "2027-04-05"],
        ["Bryonia", "Dilution", "200C", "B-1009", 10, "bottle", 5, "2026-10-25"],
        ["Pulsatilla", "Dilution", "30C", "B-1010", 22, "bottle", 5, "2027-08-18"],
        ["Gelsemium", "Dilution", "200C", "B-1011", 7, "bottle", 4, "2026-03-30"],
        ["Apis Mel", "Dilution", "30C", "B-1012", 14, "bottle", 5, "2027-11-15"]
      ];

      for (const item of inventoryData) {
        await client.query(
          "INSERT INTO inventory (name, category, potency, batch, stock, uom, min_alert, expiry) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)",
          item
        );
      }

      // Seed employees
      console.log("Seeding initial employees...");
      const employeeData = [
        ["John Doe", "Manager", "+1 234 567 8900", 4500.0, "Active", "2023-01-15"],
        ["Jane Smith", "Pharmacist", "+1 234 567 8901", 3800.0, "Active", "2023-03-22"],
        ["Mike Johnson", "Delivery Driver", "+1 234 567 8902", 2800.0, "Active", "2024-05-10"],
        ["Sarah Williams", "Sales Associate", "+1 234 567 8903", 2500.0, "Active", "2024-07-01"],
        ["Robert Chen", "Inventory Clerk", "+1 234 567 8904", 2600.0, "Active", "2024-08-15"]
      ];

      for (const emp of employeeData) {
        await client.query(
          "INSERT INTO employees (name, role, contact, salary, status, joined_date) VALUES ($1, $2, $3, $4, $5, $6)",
          emp
        );
      }

      // Seed audit logs
      await client.query(`INSERT INTO audit_logs (date, action, details, "user") VALUES 
                ($1, 'System Initialization', 'Mock data populated successfully', 'System'),
                ($2, 'Stock Update', 'Initial stock verified for items', 'Admin')`, 
                [new Date().toISOString(), new Date().toISOString()]);
    }

    await client.query('COMMIT');
    console.log("PostgreSQL initialized successfully.");
  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Error initializing PostgreSQL", err.message);
  } finally {
    client.release();
  }
}

// In serverless, we don't necessarily call initDb on every load, 
// but we need the database to exist.
// This is a bit tricky on Vercel. Usually, migrations are done outside.
// For this simple app, we can run it once or check on first request.

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  initDb
};
