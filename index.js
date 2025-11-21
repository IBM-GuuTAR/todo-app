const express = require("express");
const bodyParser = require("body-parser");

const databasePool = require("./database");

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// GET all todos
app.get("/todos", async (req, res) => {
  let conn;
  try {
    conn = await databasePool.getConnection();
    const rows = await conn.query("SELECT * FROM todos ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// GET todo by id
app.get("/todos/:id", async (req, res) => {
  let conn;
  try {
    conn = await databasePool.getConnection();
    const rows = await conn.query("SELECT * FROM todos WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Todo not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// POST create todo
app.post("/todos", async (req, res) => {
  let conn;
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    conn = await databasePool.getConnection();
    const result = await conn.query("INSERT INTO todos (title) VALUES (?)", [
      title,
    ]);

    res.status(201).json({
      id: Number(result.insertId),
      title,
      done: false,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// PUT update todo
app.put("/todos/:id", async (req, res) => {
  let conn;
  try {
    const { title, done } = req.body;

    conn = await databasePool.getConnection();

    const result = await conn.query(
      "UPDATE todos SET title = ?, done = ? WHERE id = ?",
      [title, done, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Todo not found" });
    }

    res.json({ message: "Todo updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

// DELETE todo
app.delete("/todos/:id", async (req, res) => {
  let conn;
  try {
    conn = await databasePool.getConnection();
    const result = await conn.query("DELETE FROM todos WHERE id = ?", [
      req.params.id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Todo not found" });
    }

    res.json({ message: "Todo deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (conn) conn.release();
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
