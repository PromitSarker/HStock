const express = require("express");
const cors = require("cors");
const path = require("path");
const db = require("./database");

const app = express();

app.use(cors());
app.use(express.json());

// Helper to handle async errors
const asyncHandler = fn => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

// Initialize DB once on the first request if needed
let dbInitialized = false;
async function ensureDb() {
    if (!dbInitialized) {
        await db.initDb();
        dbInitialized = true;
    }
}

// --- Inventory Endpoints ---

app.get("/api/inventory", asyncHandler(async (req, res) => {
    await ensureDb();
    const { rows } = await db.query(`
        SELECT id, name, category, potency, batch, stock, uom, 
               min_alert AS "minAlert", expiry 
        FROM inventory ORDER BY name
    `);
    res.json(rows);
}));

app.post("/api/inventory", asyncHandler(async (req, res) => {
    await ensureDb();
    const { name, category, potency, batch, stock, uom, minAlert, expiry } = req.body;
    const sql = `INSERT INTO inventory (name, category, potency, batch, stock, uom, min_alert, expiry) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
                 RETURNING id, name, category, potency, batch, stock, uom, min_alert AS "minAlert", expiry`;
    const { rows } = await db.query(sql, [name, category, potency, batch, stock, uom, minAlert || 5, expiry]);
    res.json(rows[0]);
}));

app.put("/api/inventory/:id", asyncHandler(async (req, res) => {
    await ensureDb();
    const { name, category, potency, batch, stock, uom, minAlert, expiry } = req.body;
    const sql = `UPDATE inventory SET name=$1, category=$2, potency=$3, batch=$4, stock=$5, uom=$6, min_alert=$7, expiry=$8 
                 WHERE id=$9 
                 RETURNING id, name, category, potency, batch, stock, uom, min_alert AS "minAlert", expiry`;
    const { rows } = await db.query(sql, [name, category, potency, batch, stock, uom, minAlert, expiry, req.params.id]);
    res.json(rows[0]);
}));

app.delete("/api/inventory/:id", asyncHandler(async (req, res) => {
    await ensureDb();
    const { rowCount } = await db.query("DELETE FROM inventory WHERE id = $1", [req.params.id]);
    res.json({ deleted: rowCount });
}));

// --- Procurement Endpoints ---

app.get("/api/procurements", asyncHandler(async (req, res) => {
    await ensureDb();
    const { rows } = await db.query("SELECT * FROM procurements ORDER BY date DESC");
    res.json(rows);
}));

app.post("/api/procurements", asyncHandler(async (req, res) => {
    await ensureDb();
    const { productId, date, quantity, unitCost, supplier } = req.body;
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const sqlProc = `INSERT INTO procurements (product_id, date, quantity, unit_cost, supplier) 
                         VALUES ($1, $2, $3, $4, $5) 
                         RETURNING id, product_id AS "productId", date, quantity, unit_cost AS "unitCost", supplier`;
        const resProc = await client.query(sqlProc, [productId, date, quantity, unitCost, supplier]);
        
        await client.query("UPDATE inventory SET stock = stock + $1 WHERE id = $2", [quantity, productId]);
        
        await client.query('COMMIT');
        res.json(resProc.rows[0]);
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}));

// --- Delivery Endpoints ---

app.get("/api/deliveries", asyncHandler(async (req, res) => {
    await ensureDb();
    const sql = `
        SELECT d.*, 
        COALESCE(
            (SELECT json_agg(json_build_object(
                'id', di.id, 
                'productId', di.product_id, 
                'quantity', di.quantity, 
                'distributionPrice', di.distribution_price
            )) FROM delivery_items di WHERE di.delivery_id = d.id),
            '[]'
        ) as items
        FROM deliveries d
        ORDER BY d.date DESC
    `;
    const { rows } = await db.query(sql);
    res.json(rows);
}));

app.post("/api/deliveries", asyncHandler(async (req, res) => {
    await ensureDb();
    const { date, recipient, items } = req.body;
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const sqlDel = `INSERT INTO deliveries (date, recipient) VALUES ($1, $2) RETURNING id`;
        const resDel = await client.query(sqlDel, [date, recipient]);
        const deliveryId = resDel.rows[0].id;

        if (items && items.length > 0) {
            for (const item of items) {
                await client.query(
                    `INSERT INTO delivery_items (delivery_id, product_id, quantity, distribution_price) VALUES ($1, $2, $3, $4)`,
                    [deliveryId, item.productId, item.quantity, item.distributionPrice]
                );
                await client.query("UPDATE inventory SET stock = stock - $1 WHERE id = $2", [item.quantity, item.productId]);
            }
        }

        await client.query('COMMIT');
        res.json({ id: deliveryId, ...req.body });
    } catch (e) {
        await client.query('ROLLBACK');
        throw e;
    } finally {
        client.release();
    }
}));

// --- Employee & Salary Endpoints ---

app.get("/api/employees", asyncHandler(async (req, res) => {
    await ensureDb();
    const { rows } = await db.query(`
        SELECT id, name, role, contact, salary, status, 
               joined_date AS "joinedDate" 
        FROM employees ORDER BY name
    `);
    res.json(rows);
}));

app.post("/api/employees", asyncHandler(async (req, res) => {
    await ensureDb();
    const { name, role, contact, salary, status, joinedDate } = req.body;
    const sql = `INSERT INTO employees (name, role, contact, salary, status, joined_date) 
                 VALUES ($1, $2, $3, $4, $5, $6) 
                 RETURNING id, name, role, contact, salary, status, joined_date AS "joinedDate"`;
    const { rows } = await db.query(sql, [name, role, contact, salary, status, joinedDate]);
    res.json(rows[0]);
}));

app.put("/api/employees/:id", asyncHandler(async (req, res) => {
    await ensureDb();
    const { name, role, contact, salary, status, joinedDate } = req.body;
    const sql = `UPDATE employees SET name=$1, role=$2, contact=$3, salary=$4, status=$5, joined_date=$6 
                 WHERE id=$7 
                 RETURNING id, name, role, contact, salary, status, joined_date AS "joinedDate"`;
    const { rows } = await db.query(sql, [name, role, contact, salary, status, joinedDate, req.params.id]);
    res.json(rows[0]);
}));

app.get("/api/salaries", asyncHandler(async (req, res) => {
    await ensureDb();
    const { rows } = await db.query("SELECT * FROM salaries ORDER BY date DESC");
    res.json(rows.map(r => ({ ...r, employeeId: r.employee_id }))); // Map back for frontend
}));

app.post("/api/salaries", asyncHandler(async (req, res) => {
    await ensureDb();
    const { employeeId, amount, date, status } = req.body;
    const sql = `INSERT INTO salaries (employee_id, amount, date, status) VALUES ($1, $2, $3, $4) RETURNING *`;
    const { rows } = await db.query(sql, [employeeId, amount, date, status]);
    res.json(rows[0]);
}));

// --- Audit Logs ---

app.get("/api/audit-logs", asyncHandler(async (req, res) => {
    await ensureDb();
    const { rows } = await db.query(`
        SELECT id, date, action, details, "user" 
        FROM audit_logs ORDER BY date DESC LIMIT 100
    `);
    res.json(rows);
}));

app.post("/api/audit-logs", asyncHandler(async (req, res) => {
    await ensureDb();
    const { date, action, details, user } = req.body;
    const sql = `INSERT INTO audit_logs (date, action, details, "user") VALUES ($1, $2, $3, $4) RETURNING *`;
    const { rows } = await db.query(sql, [date, action, details, user]);
    res.json(rows[0]);
}));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: err.message });
});

module.exports = app;
