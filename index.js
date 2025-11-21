const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const PORT = 3000;

// middleware
app.use(bodyParser.json());

// mock database (in-memory)
let todos = [
  { id: 1, title: "Learn Express.js", done: false },
  { id: 2, title: "Build Todo App", done: false },
];

app.get("/todos", (req, res) => {
  res.json(todos);
});

app.get("/todos/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const todo = todos.find((t) => t.id === id);
  if (!todo) return res.status(404).json({ message: "Todo not found" });
  res.json(todo);
});

app.post("/todos", (req, res) => {
  const { title } = req.body;
  if (!title) return res.status(400).json({ message: "Title is required" });

  const newTodo = {
    id: todos.length + 1,
    title,
    done: false,
  };

  todos.push(newTodo);
  res.status(201).json(newTodo);
});

app.put("/todos/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { title, done } = req.body;

  const todo = todos.find((t) => t.id === id);
  if (!todo) return res.status(404).json({ message: "Todo not found" });

  if (title !== undefined) todo.title = title;
  if (done !== undefined) todo.done = done;

  res.json(todo);
});

app.delete("/todos/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = todos.findIndex((t) => t.id === id);

  if (index === -1) return res.status(404).json({ message: "Todo not found" });

  todos.splice(index, 1);
  res.json({ message: "Todo deleted" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
