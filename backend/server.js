const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://todo-fullstack-pi-one.vercel.app"
  ]
}));
//app.use(cors());
app.use(express.json());

// DB (SQLite file)
const dbFile = path.join(__dirname, "todo.db");
const db = new sqlite3.Database(dbFile);

// Create table if missing
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      text TEXT NOT NULL,
      done INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
});

// API: health
app.get("/api/health", (req, res) => res.json({ ok: true }));

// API: list todos
app.get("/api/todos", (req, res) => {
  db.all("SELECT * FROM todos ORDER BY id DESC", [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.map(r => ({ ...r, done: !!r.done })));
  });
});

// API: create todo
app.post("/api/todos", (req, res) => {
  const text = (req.body?.text || "").trim();
  if (!text) return res.status(400).json({ error: "text is required" });

  db.run("INSERT INTO todos (text) VALUES (?)", [text], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    db.get("SELECT * FROM todos WHERE id = ?", [this.lastID], (err2, row) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.status(201).json({ ...row, done: !!row.done });
    });
  });
});

// API: toggle done
app.patch("/api/todos/:id/toggle", (req, res) => {
  const id = Number(req.params.id);
  db.run(
    "UPDATE todos SET done = CASE done WHEN 0 THEN 1 ELSE 0 END WHERE id = ?",
    [id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: "not found" });
      db.get("SELECT * FROM todos WHERE id = ?", [id], (err2, row) => {
        if (err2) return res.status(500).json({ error: err2.message });
        res.json({ ...row, done: !!row.done });
      });
    }
  );
});

// API: delete
app.delete("/api/todos/:id", (req, res) => {
  const id = Number(req.params.id);
  db.run("DELETE FROM todos WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(404).json({ error: "not found" });
    res.status(204).send();
  });
});

// Serve frontend (static)
//app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.send("Backend is running. Try /api/health or /api/todos");
});

app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
});
