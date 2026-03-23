const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "homeostock.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database", err.message);
  } else {
    console.log("Connected to the SQLite database.");
    db.run("PRAGMA foreign_keys = ON");
    db.run("PRAGMA journal_mode = WAL");
    db.run("PRAGMA busy_timeout = 3000");
    initDb();
  }
});

function initDb() {
  db.serialize(() => {
    // --- Table Creations ---

    db.run(`CREATE TABLE IF NOT EXISTS inventory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            category TEXT,
            potency TEXT,
            batch TEXT,
            stock INTEGER DEFAULT 0,
            uom TEXT DEFAULT 'pcs',
            minAlert INTEGER DEFAULT 5,
            expiry TEXT
        )`);

    db.run(`CREATE TABLE IF NOT EXISTS procurements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            productId INTEGER,
            date TEXT,
            quantity INTEGER,
            unitCost REAL,
            supplier TEXT,
            FOREIGN KEY(productId) REFERENCES inventory(id)
        )`);

    db.run(`CREATE TABLE IF NOT EXISTS deliveries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT,
            recipient TEXT,
            status TEXT DEFAULT 'Completed'
        )`);

    db.run(`CREATE TABLE IF NOT EXISTS delivery_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            deliveryId INTEGER,
            productId INTEGER,
            quantity INTEGER,
            distributionPrice REAL,
            FOREIGN KEY(deliveryId) REFERENCES deliveries(id),
            FOREIGN KEY(productId) REFERENCES inventory(id)
        )`);

    db.run(`CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            role TEXT,
            contact TEXT,
            salary REAL,
            status TEXT DEFAULT 'Active',
            joinedDate TEXT
        )`);

    db.run(`CREATE TABLE IF NOT EXISTS salaries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            employeeId INTEGER,
            amount REAL,
            date TEXT,
            status TEXT DEFAULT 'Paid',
            FOREIGN KEY(employeeId) REFERENCES employees(id)
        )`);

    db.run(`CREATE TABLE IF NOT EXISTS audit_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT,
            action TEXT,
            details TEXT,
            user TEXT DEFAULT 'Admin'
        )`);

    // --- Seed Initial Data if empty ---
    db.get("SELECT COUNT(*) as count FROM inventory", (err, row) => {
      if (!err && row.count === 0) {
        console.log("Seeding initial inventory...");
        const stmt = db.prepare(
          "INSERT INTO inventory (name, category, potency, batch, stock, uom, minAlert, expiry) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        );
        [
          [
            "Arnica Montana",
            "Dilution",
            "30C",
            "B-1001",
            15,
            "bottle",
            5,
            "2026-12-31",
          ],
          [
            "Nux Vomica",
            "Mother Tincture",
            "Q",
            "B-1002",
            8,
            "bottle",
            5,
            "2025-08-15",
          ],
          [
            "Belladonna",
            "Dilution",
            "200C",
            "B-1003",
            20,
            "bottle",
            5,
            "2027-01-10",
          ],
          [
            "Calcarea Carb",
            "Trituration",
            "6X",
            "B-1004",
            12,
            "bottle",
            3,
            "2026-06-20",
          ],
          [
            "Lycopodium",
            "Dilution",
            "30C",
            "B-1005",
            25,
            "bottle",
            8,
            "2028-02-14",
          ],
          [
            "Rhus Tox",
            "Dilution",
            "200C",
            "B-1006",
            5,
            "bottle",
            5,
            "2025-11-30",
          ],
          [
            "Sulphur",
            "Dilution",
            "30C",
            "B-1007",
            30,
            "bottle",
            10,
            "2026-09-12",
          ],
          [
            "Aconite",
            "Dilution",
            "30C",
            "B-1008",
            18,
            "bottle",
            5,
            "2027-04-05",
          ],
          [
            "Bryonia",
            "Dilution",
            "200C",
            "B-1009",
            10,
            "bottle",
            5,
            "2026-10-25",
          ],
          [
            "Pulsatilla",
            "Dilution",
            "30C",
            "B-1010",
            22,
            "bottle",
            5,
            "2027-08-18",
          ],
          [
            "Gelsemium",
            "Dilution",
            "200C",
            "B-1011",
            7,
            "bottle",
            4,
            "2026-03-30",
          ],
          [
            "Apis Mel",
            "Dilution",
            "30C",
            "B-1012",
            14,
            "bottle",
            5,
            "2027-11-15",
          ],
        ].forEach((item) => stmt.run(...item));
        stmt.finalize();
      }
    });

    db.get("SELECT COUNT(*) as count FROM employees", (err, row) => {
      if (!err && row.count === 0) {
        console.log("Seeding initial employees...");
        const stmt = db.prepare(
          "INSERT INTO employees (name, role, contact, salary, status, joinedDate) VALUES (?, ?, ?, ?, ?, ?)",
        );
        [
          [
            "John Doe",
            "Manager",
            "+1 234 567 8900",
            4500.0,
            "Active",
            "2023-01-15",
          ],
          [
            "Jane Smith",
            "Pharmacist",
            "+1 234 567 8901",
            3800.0,
            "Active",
            "2023-03-22",
          ],
          [
            "Mike Johnson",
            "Delivery Driver",
            "+1 234 567 8902",
            2800.0,
            "Active",
            "2024-05-10",
          ],
          [
            "Sarah Williams",
            "Sales Associate",
            "+1 234 567 8903",
            2500.0,
            "Active",
            "2024-07-01",
          ],
          [
            "Robert Chen",
            "Inventory Clerk",
            "+1 234 567 8904",
            2600.0,
            "Active",
            "2024-08-15",
          ],
        ].forEach((emp) => stmt.run(...emp));
        stmt.finalize((err) => {
          if (!err) {
            // Seed some audit logs
            db.run(`INSERT INTO audit_logs (date, action, details, user) VALUES 
                            ('${new Date().toISOString()}', 'System Initialization', 'Mock data populated successfully', 'System'),
                            ('${new Date().toISOString()}', 'Stock Update', 'Initial stock verified for items', 'Admin')`);
          }
        });
      }
    });
  });
}

module.exports = db;
