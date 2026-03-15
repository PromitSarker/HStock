const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'homeostock.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database', err.message);
    } else {
        console.log('Connected to the SQLite database.');
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
                console.log('Seeding initial inventory...');
                const stmt = db.prepare("INSERT INTO inventory (name, category, potency, batch, stock, uom, minAlert, expiry) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                stmt.run("Arnica Montana", "Dilution", "30C", "B-1001", 15, "bottle", 5, "2026-12-31");
                stmt.run("Nux Vomica", "Mother Tincture", "Q", "B-1002", 3, "bottle", 5, "2025-08-15");
                stmt.run("Belladonna", "Dilution", "200C", "B-1003", 20, "bottle", 5, "2027-01-10");
                stmt.finalize();
            }
        });

        db.get("SELECT COUNT(*) as count FROM employees", (err, row) => {
            if (!err && row.count === 0) {
                console.log('Seeding initial employees...');
                const stmt = db.prepare("INSERT INTO employees (name, role, contact, salary, status, joinedDate) VALUES (?, ?, ?, ?, ?, ?)");
                stmt.run("John Doe", "Manager", "+1 234 567 8900", 4500.00, "Active", "2023-01-15");
                stmt.run("Jane Smith", "Pharmacist", "+1 234 567 8901", 3800.00, "Active", "2023-03-22");
                stmt.run("Mike Johnson", "Delivery Driver", "+1 234 567 8902", 2800.00, "On Leave", "2024-05-10");
                stmt.finalize();
            }
        });
    });
}

module.exports = db;
