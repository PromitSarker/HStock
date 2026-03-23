const express = require("express");
const cors = require("cors");
const path = require("path"); // Import path module
const db = require("./database");

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
// Serve static files from the project root
app.use(express.static(path.join(__dirname, "..")));

// Explicitly serve the app shell
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

// Fallback for client-side routes (non-API)
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

// --- Inventory Endpoints ---

app.get("/api/inventory", (req, res) => {
  db.all("SELECT * FROM inventory ORDER BY name", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/inventory", (req, res) => {
  const { name, category, potency, batch, stock, uom, minAlert, expiry } =
    req.body;
  const sql = `INSERT INTO inventory (name, category, potency, batch, stock, uom, minAlert, expiry) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  db.run(
    sql,
    [name, category, potency, batch, stock, uom, minAlert, expiry],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, ...req.body });
    },
  );
});

app.put("/api/inventory/:id", (req, res) => {
  const { name, category, potency, batch, stock, uom, minAlert, expiry } =
    req.body;
  const sql = `UPDATE inventory SET name=?, category=?, potency=?, batch=?, stock=?, uom=?, minAlert=?, expiry=? WHERE id=?`;
  db.run(
    sql,
    [
      name,
      category,
      potency,
      batch,
      stock,
      uom,
      minAlert,
      expiry,
      req.params.id,
    ],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: req.params.id, ...req.body });
    },
  );
});

app.delete("/api/inventory/:id", (req, res) => {
  db.run("DELETE FROM inventory WHERE id = ?", req.params.id, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// --- Procurement Endpoints (Atomic Stock Support) ---

app.get("/api/procurements", (req, res) => {
  db.all("SELECT * FROM procurements ORDER BY date DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/procurements", (req, res) => {
  const { productId, date, quantity, unitCost, supplier } = req.body;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    const sqlProc = `INSERT INTO procurements (productId, date, quantity, unitCost, supplier) VALUES (?, ?, ?, ?, ?)`;
    db.run(
      sqlProc,
      [productId, date, quantity, unitCost, supplier],
      function (err) {
        if (err) {
          db.run("ROLLBACK");
          return res.status(500).json({ error: err.message });
        }

        // Increment inventory stock
        db.run(
          "UPDATE inventory SET stock = stock + ? WHERE id = ?",
          [quantity, productId],
          function (err) {
            if (err) {
              db.run("ROLLBACK");
              return res.status(500).json({ error: err.message });
            }
            db.run("COMMIT");
            res.json({ id: this.lastID, ...req.body });
          },
        );
      },
    );
  });
});

// --- Delivery Endpoints (Atomic Stock Support) ---

app.get("/api/deliveries", (req, res) => {
  // Join with delivery_items
  db.all(
    `
        SELECT d.*, 
        JSON_GROUP_ARRAY(
            JSON_OBJECT(
                'id', di.id, 
                'productId', di.productId, 
                'quantity', di.quantity, 
                'distributionPrice', di.distributionPrice
            )
        ) as items
        FROM deliveries d
        LEFT JOIN delivery_items di ON d.id = di.deliveryId
        GROUP BY d.id
        ORDER BY d.date DESC
    `,
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      const results = rows.map((r) => ({
        ...r,
        items: JSON.parse(r.items).filter((i) => i.id !== null),
      }));
      res.json(results);
    },
  );
});

app.post("/api/deliveries", (req, res) => {
  const { date, recipient, items } = req.body;

  db.serialize(() => {
    db.run("BEGIN TRANSACTION");

    const sqlDel = `INSERT INTO deliveries (date, recipient) VALUES (?, ?)`;
    db.run(sqlDel, [date, recipient], function (err) {
      if (err) {
        db.run("ROLLBACK");
        return res.status(500).json({ error: err.message });
      }

      const deliveryId = this.lastID;
      let completed = 0;
      let hasError = false;

      if (!items || items.length === 0) {
        db.run("COMMIT");
        return res.json({ id: deliveryId, ...req.body });
      }

      items.forEach((item) => {
        const sqlItem = `INSERT INTO delivery_items (deliveryId, productId, quantity, distributionPrice) VALUES (?, ?, ?, ?)`;
        db.run(
          sqlItem,
          [deliveryId, item.productId, item.quantity, item.distributionPrice],
          function (err) {
            if (err && !hasError) {
              hasError = true;
              db.run("ROLLBACK");
              return res.status(500).json({ error: err.message });
            }

            // Decrement inventory stock
            db.run(
              "UPDATE inventory SET stock = stock - ? WHERE id = ?",
              [item.quantity, item.productId],
              function (err) {
                if (err && !hasError) {
                  hasError = true;
                  db.run("ROLLBACK");
                  return res.status(500).json({ error: err.message });
                }

                completed++;
                if (completed === items.length && !hasError) {
                  db.run("COMMIT");
                  res.json({ id: deliveryId, ...req.body });
                }
              },
            );
          },
        );
      });
    });
  });
});

// --- Employee & Salary Endpoints ---

app.get("/api/employees", (req, res) => {
  db.all("SELECT * FROM employees ORDER BY name", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/employees", (req, res) => {
  const { name, role, contact, salary, status, joinedDate } = req.body;
  const sql = `INSERT INTO employees (name, role, contact, salary, status, joinedDate) VALUES (?, ?, ?, ?, ?, ?)`;
  db.run(
    sql,
    [name, role, contact, salary, status, joinedDate],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, ...req.body });
    },
  );
});

app.put("/api/employees/:id", (req, res) => {
  const { name, role, contact, salary, status, joinedDate } = req.body;
  const sql = `UPDATE employees SET name=?, role=?, contact=?, salary=?, status=?, joinedDate=? WHERE id=?`;
  db.run(
    sql,
    [name, role, contact, salary, status, joinedDate, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: req.params.id, ...req.body });
    },
  );
});

app.get("/api/salaries", (req, res) => {
  db.all("SELECT * FROM salaries ORDER BY date DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post("/api/salaries", (req, res) => {
  const { employeeId, amount, date, status } = req.body;
  const sql = `INSERT INTO salaries (employeeId, amount, date, status) VALUES (?, ?, ?, ?)`;
  db.run(sql, [employeeId, amount, date, status], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, ...req.body });
  });
});

// --- Audit Logs ---

app.get("/api/audit-logs", (req, res) => {
  db.all(
    "SELECT * FROM audit_logs ORDER BY date DESC LIMIT 100",
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    },
  );
});

app.post("/api/audit-logs", (req, res) => {
  const { date, action, details, user } = req.body;
  const sql = `INSERT INTO audit_logs (date, action, details, user) VALUES (?, ?, ?, ?)`;
  db.run(sql, [date, action, details, user], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, ...req.body });
  });
});

app.listen(port, () => {
  console.log(`HomeoStock Server running at http://localhost:${port}`);
});
