const express = require("express");
const bodyParser = require("body-parser");
const amqp = require("amqplib");

const databasePool = require("./database");
const fakeDatabasePool = require("./fakeDatabase");

const app = express();
const PORT = 8080;

app.use(bodyParser.json());

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let channel;

async function connectRabbitMQ() {
  const connection = await amqp.connect({ hostname: "localhost", port: 5672 });
  channel = await connection.createChannel();
  await channel.assertQueue("todo_queue1", { durable: true });
  await channel.assertQueue("todo_queue2", { durable: true });
}

connectRabbitMQ();

// GET all todos
app.get("/todos", async (req, res) => {
  try {
    const [rows] = await databasePool.query(
      "SELECT * FROM todos ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fake database query
app.get("/todos-fake", async (req, res) => {
  try {
    const [rows] = await fakeDatabasePool.query(
      "SELECT * FROM todos ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET todo by id
app.get("/todos/:id", async (req, res) => {
  try {
    const [rows] = await databasePool.query(
      "SELECT * FROM todos WHERE id = ?",
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "Todo not found" });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET poor all todos
app.get("/todos-poor", async (req, res) => {
  try {
    await sleep(10_000);

    const [rows] = await databasePool.query(
      "SELECT * FROM todos ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create todo
app.post("/todos", async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const [result] = await databasePool.query(
      "INSERT INTO todos (title) VALUES (?)",
      [title]
    );

    res.status(201).json({
      id: Number(result.insertId),
      title,
      done: false,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update todo
app.put("/todos/:id", async (req, res) => {
  try {
    const { title, done } = req.body;

    const [result] = await databasePool.query(
      "UPDATE todos SET title = ?, done = ? WHERE id = ?",
      [title, done, req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Todo not found" });
    }

    res.json({ message: "Todo updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE todo
app.delete("/todos/:id", async (req, res) => {
  try {
    const [result] = await databasePool.query(
      "DELETE FROM todos WHERE id = ?",
      [req.params.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Todo not found" });
    }

    res.json({ message: "Todo deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/todo-mq1", (req, res) => {
  try {
    const { title, queue_ } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    channel.sendToQueue("todo_queue1", Buffer.from(title), {
      persistent: true,
    });

    res.status(201).json({
      title,
      done: false,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/todo-mq2", (req, res) => {
  try {
    const { title, queue_ } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    channel.sendToQueue("todo_queue2", Buffer.from(title), {
      persistent: true,
    });

    res.status(201).json({
      title,
      done: false,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
